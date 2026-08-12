from rest_framework import status, generics, viewsets
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.exceptions import TokenError
from django.contrib.auth import get_user_model
from django.utils import timezone
from django.db.models import Q
from django.conf import settings
from django.core.cache import cache
import uuid
import logging
from apps.core.models import AuditLog
from apps.authentication.models import Role
from apps.core.permissions import IsAdminOrOwner

from .serializers import (
    RegisterSerializer, 
    UserSerializer, 
    CustomTokenObtainPairSerializer, 
    LogoutSerializer,
    ForgotPasswordSerializer,
    ResetPasswordSerializer,
    ChangePasswordSerializer,
    ProfileUpdateSerializer
)

User = get_user_model()
logger = logging.getLogger('dinein.auth')

class RegisterView(generics.CreateAPIView):
    """
    Register a new customer or employee user.
    """
    queryset = User.objects.all()
    serializer_class = RegisterSerializer
    permission_classes = [AllowAny]

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        user_data = UserSerializer(user).data
        
        # Log successful registration
        AuditLog.objects.create(
            user=user,
            action="User Account Registered",
            model_name="User",
            record_id=str(user.id),
            ip_address=request.META.get('REMOTE_ADDR')
        )
        logger.info(f"New user registered: {user.email} as {user.role.code if user.role else 'no-role'}")
        
        return Response(
            {
                "_message": "Registration successful.",
                "user": user_data
            },
            status=status.HTTP_201_CREATED
        )


class CustomTokenObtainPairView(TokenObtainPairView):
    """
    Perform login using Email or Username. Returns Access & Refresh JWTs.
    Throttled to max 5 requests per minute.
    """
    serializer_class = CustomTokenObtainPairSerializer
    throttle_scope = 'auth'
    
    def post(self, request, *args, **kwargs):
        # Authenticate triggers CustomTokenObtainPairSerializer.validate()
        # and EmailOrUsernameModelBackend.
        return super().post(request, *args, **kwargs)


class CustomTokenRefreshView(TokenRefreshView):
    """
    Refresh access token using valid refresh token.
    """
    def post(self, request, *args, **kwargs):
        response = super().post(request, *args, **kwargs)
        if response.status_code == status.HTTP_200_OK:
            response.data['_message'] = "Token refreshed successfully."
        return response


class LogoutView(APIView):
    """
    Logout user by blacklisting the provided JWT Refresh token.
    """
    permission_classes = [IsAuthenticated]

    def post(self, request, *args, **kwargs):
        serializer = LogoutSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        try:
            token = RefreshToken(serializer.validated_data['refresh'])
            token.blacklist()
            
            # Log audit event
            AuditLog.objects.create(
                user=request.user,
                action="User Logged Out",
                model_name="User",
                record_id=str(request.user.id),
                ip_address=request.META.get('REMOTE_ADDR')
            )
            logger.info(f"User logged out successfully: {request.user.email}")
            
            return Response(
                {"_message": "Logout successful."},
                status=status.HTTP_200_OK
            )
        except TokenError:
            return Response(
                {
                    "success": False,
                    "message": "Invalid or blacklisted token.",
                    "data": None
                },
                status=status.HTTP_400_BAD_REQUEST
            )


class ForgotPasswordView(APIView):
    """
    Generates a secure password reset token and writes it to logs/response for local dev verification.
    """
    permission_classes = [AllowAny]

    def post(self, request, *args, **kwargs):
        serializer = ForgotPasswordSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        identifier = serializer.validated_data['email'].strip()
        
        dev_token = None
        dev_reset_url = None

        user = User.objects.filter(Q(email__iexact=identifier) | Q(username__iexact=identifier)).first()
        
        if user:
            reset_token = str(uuid.uuid4())
            # Save token in cache against both email & username for 15 minutes
            cache.set(f"password_reset_{user.email.lower()}", reset_token, timeout=900)
            cache.set(f"password_reset_{user.username.lower()}", reset_token, timeout=900)
            
            logger.info(f"Password reset request generated for: {user.email}")
            
            dev_token = reset_token
            dev_reset_url = f"http://localhost:5173/reset-password?token={reset_token}&email={user.email}"
            
            print(f"==========================================")
            print(f"MOCK PASSWORD RESET SENT")
            print(f"User: {user.username} ({user.email})")
            print(f"Token: {reset_token}")
            print(f"Dev URL: {dev_reset_url}")
            print(f"==========================================")
            
            AuditLog.objects.create(
                user=user,
                action="Password Reset Token Requested",
                model_name="User",
                record_id=str(user.id),
                ip_address=request.META.get('REMOTE_ADDR')
            )
        else:
            logger.warning(f"Password reset requested for unregistered identifier: {identifier}")

        resp_data = {
            "_message": "If an account exists for the input, password reset instructions have been generated."
        }

        if settings.DEBUG and dev_token:
            resp_data["dev_reset_token"] = dev_token
            resp_data["dev_reset_url"] = dev_reset_url
            resp_data["email"] = user.email

        return Response(resp_data, status=status.HTTP_200_OK)


class ResetPasswordView(APIView):
    """
    Reset user password using the token retrieved from logs or query parameters.
    """
    permission_classes = [AllowAny]

    def post(self, request, *args, **kwargs):
        serializer = ResetPasswordSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        identifier = serializer.validated_data['email'].strip()
        token = serializer.validated_data['token'].strip()
        new_password = serializer.validated_data['new_password']
        
        user = User.objects.filter(Q(email__iexact=identifier) | Q(username__iexact=identifier)).first()
        
        if not user:
            return Response(
                {
                    "success": False,
                    "message": "User account does not exist.",
                    "data": None
                },
                status=status.HTTP_404_NOT_FOUND
            )

        cached_token = cache.get(f"password_reset_{user.email.lower()}") or cache.get(f"password_reset_{user.username.lower()}")
        
        if not cached_token or cached_token != token:
            return Response(
                {
                    "success": False,
                    "message": "Invalid or expired password reset token.",
                    "data": None
                },
                status=status.HTTP_400_BAD_REQUEST
            )
            
        user.set_password(new_password)
        user.reset_failed_attempts()
        user.save()
        
        cache.delete(f"password_reset_{user.email.lower()}")
        cache.delete(f"password_reset_{user.username.lower()}")
        
        AuditLog.objects.create(
            user=user,
            action="Password Reset Confirmed",
            model_name="User",
            record_id=str(user.id),
            ip_address=request.META.get('REMOTE_ADDR')
        )
        logger.info(f"Password reset confirmed successfully for: {user.email}")
        
        return Response(
            {"_message": "Password reset completed successfully."},
            status=status.HTTP_200_OK
        )


class ChangePasswordView(APIView):
    """
    Update password for the logged-in user.
    """
    permission_classes = [IsAuthenticated]

    def post(self, request, *args, **kwargs):
        serializer = ChangePasswordSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        user = request.user
        old_password = serializer.validated_data['old_password']
        new_password = serializer.validated_data['new_password']
        
        if not user.check_password(old_password):
            return Response(
                {
                    "success": False,
                    "message": "Incorrect current password.",
                    "data": None
                },
                status=status.HTTP_400_BAD_REQUEST
            )
            
        user.set_password(new_password)
        user.save()
        
        # Log audit log
        AuditLog.objects.create(
            user=user,
            action="Password Changed via Profile settings",
            model_name="User",
            record_id=str(user.id),
            ip_address=request.META.get('REMOTE_ADDR')
        )
        logger.info(f"Password changed successfully for user: {user.email}")
        
        return Response(
            {"_message": "Password updated successfully."},
            status=status.HTTP_200_OK
        )


class UserProfileView(generics.RetrieveUpdateAPIView):
    """
    GET profile details or PUT updates (including bio, address, phone, and profile_image upload).
    """
    serializer_class = UserSerializer
    permission_classes = [IsAuthenticated]

    def get_object(self):
        return self.request.user

    def get(self, request, *args, **kwargs):
        response = super().get(request, *args, **kwargs)
        response.data['_message'] = "Profile retrieved successfully."
        return response

    def put(self, request, *args, **kwargs):
        user = self.get_object()
        serializer = ProfileUpdateSerializer(user, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        updated_user = serializer.save()
        
        # Log Audit Log
        AuditLog.objects.create(
            user=updated_user,
            action="User Profile Updated",
            model_name="User",
            record_id=str(updated_user.id),
            ip_address=request.META.get('REMOTE_ADDR')
        )
        
        user_data = UserSerializer(updated_user).data
        return Response(
            {
                "_message": "Profile updated successfully.",
                "user": user_data
            },
            status=status.HTTP_200_OK
        )


class UserViewSet(viewsets.ModelViewSet):
    """
    Administrative User CRUD management. Available only to Owner and Admin roles.
    """
    queryset = User.objects.all().order_by('-created_at')
    serializer_class = UserSerializer
    permission_classes = [IsAuthenticated, IsAdminOrOwner]

    def get_queryset(self):
        qs = super().get_queryset()
        
        # Support filtering by role code
        role_code = self.request.query_params.get('role')
        if role_code:
            qs = qs.filter(role__code=role_code)
            
        # Support search by name, username, email, phone
        search = self.request.query_params.get('search')
        if search:
            from django.db.models import Q
            qs = qs.filter(
                Q(username__icontains=search) |
                Q(email__icontains=search) |
                Q(first_name__icontains=search) |
                Q(last_name__icontains=search) |
                Q(phone__icontains=search)
            )
            
        # Support filtering by branch
        branch_id = self.request.query_params.get('branch')
        if branch_id:
            qs = qs.filter(branch_id=branch_id)
            
        return qs

    def get_serializer_class(self):
        if self.action == 'create':
            return RegisterSerializer
        return UserSerializer


    def perform_create(self, serializer):
        user = serializer.save()
        AuditLog.objects.create(
            user=self.request.user,
            action=f"Created administrative user: {user.email}",
            model_name="User",
            record_id=str(user.id),
            ip_address=self.request.META.get('REMOTE_ADDR')
        )

    def perform_update(self, serializer):
        user = serializer.save()
        AuditLog.objects.create(
            user=self.request.user,
            action=f"Updated administrative user: {user.email}",
            model_name="User",
            record_id=str(user.id),
            ip_address=self.request.META.get('REMOTE_ADDR')
        )

    def perform_destroy(self, instance):
        AuditLog.objects.create(
            user=self.request.user,
            action=f"Deleted user: {instance.email}",
            model_name="User",
            record_id=str(instance.id),
            ip_address=self.request.META.get('REMOTE_ADDR')
        )
        instance.delete()
