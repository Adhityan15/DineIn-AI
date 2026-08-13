import re
from rest_framework import serializers
from django.contrib.auth import get_user_model
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from apps.core.constants import ROLE_CHOICES
from apps.authentication.models import Role, UserProfile
from apps.core.validators import validate_phone_number

User = get_user_model()

def validate_password_strength(value):
    """
    Validates password strength: 8+ chars, uppercase, lowercase, number, special char.
    """
    if len(value) < 8:
        raise serializers.ValidationError("Password must be at least 8 characters long.")
    if not any(char.isupper() for char in value):
        raise serializers.ValidationError("Password must contain at least one uppercase letter.")
    if not any(char.islower() for char in value):
        raise serializers.ValidationError("Password must contain at least one lowercase letter.")
    if not any(char.isdigit() for char in value):
        raise serializers.ValidationError("Password must contain at least one number.")
    if not any(char in "!@#$%^&*()_+-=[]{}|;':\",./<>?" for char in value):
        raise serializers.ValidationError("Password must contain at least one special character.")
    return value


class UserSerializer(serializers.ModelSerializer):
    role = serializers.CharField(source='role.code', read_only=True)
    branch_name = serializers.CharField(source='branch.name', read_only=True)
    bio = serializers.CharField(source='profile.bio', read_only=True)
    address = serializers.CharField(source='profile.address', read_only=True)
    date_of_birth = serializers.DateField(source='profile.date_of_birth', read_only=True)
    gender = serializers.CharField(source='profile.gender', read_only=True)
    loyalty_tier = serializers.CharField(source='loyalty.tier', read_only=True)
    loyalty_points = serializers.IntegerField(source='loyalty.points', read_only=True)

    class Meta:
        model = User
        fields = (
            'id', 'email', 'username', 'first_name', 'last_name', 'phone', 
            'role', 'branch', 'branch_name', 'profile_image', 'bio', 'address', 'date_of_birth', 'gender',
            'loyalty_tier', 'loyalty_points'
        )
        read_only_fields = ('id', 'role', 'branch', 'branch_name', 'loyalty_tier', 'loyalty_points')



class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, validators=[validate_password_strength])
    password_confirm = serializers.CharField(write_only=True)
    role = serializers.CharField(required=False, default='customer')

    class Meta:
        model = User
        fields = ('email', 'username', 'password', 'password_confirm', 'first_name', 'last_name', 'phone', 'role', 'branch')

    def validate(self, attrs):
        if attrs['password'] != attrs['password_confirm']:
            raise serializers.ValidationError({"password_confirm": "Passwords do not match."})
        return attrs

    def create(self, validated_data):
        validated_data.pop('password_confirm')
        role_code = validated_data.pop('role', 'customer')
        try:
            role_obj = Role.objects.get(code=role_code)
        except Role.DoesNotExist:
            role_obj, _ = Role.objects.get_or_create(
                code=role_code,
                defaults={'name': role_code.replace('_', ' ').capitalize()}
            )
            
        user = User.objects.create_user(
            email=validated_data['email'],
            username=validated_data['username'],
            password=validated_data['password'],
            first_name=validated_data['first_name'],
            last_name=validated_data['last_name'],
            phone=validated_data['phone'],
            role=role_obj,
            branch=validated_data.get('branch', None)
        )
        
        # Create user profile record automatically
        UserProfile.objects.get_or_create(user=user)
        return user


class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    """
    SimpleJWT custom authentication mapping to email/username login.
    Accepts both 'email' and 'username' keys in incoming request payloads.
    """
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.fields['username'] = serializers.CharField(required=False, write_only=True)
        self.fields['email'] = serializers.CharField(required=False, write_only=True)

    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)
        token['email'] = user.email
        token['role'] = user.role.code if user.role else 'no-role'
        token['name'] = f"{user.first_name} {user.last_name}"
        if user.branch:
            token['branch_id'] = str(user.branch.id)
        return token

    def validate(self, attrs):
        identifier = attrs.get('email') or attrs.get('username')
        if not identifier:
            raise serializers.ValidationError({'email': ['Email or Username is required.']})
        attrs['email'] = identifier
        attrs['username'] = identifier

        # The parent simplejwt validate() method authenticates the user using Django auth backends.
        # This will invoke our EmailOrUsernameModelBackend.
        try:
            data = super().validate(attrs)
        except PermissionError as pe:
            # Handle account locked message specifically
            raise serializers.ValidationError({"detail": str(pe)})
            
        from apps.authentication.models import LoyaltyProfile
        loyalty, _ = LoyaltyProfile.objects.get_or_create(user=self.user)

        role_code = self.user.role.code if self.user.role else 'no-role'
        data['user'] = {
            'id': str(self.user.id),
            'email': self.user.email,
            'role': role_code,
            'name': f"{self.user.first_name} {self.user.last_name}",
            'branch': str(self.user.branch.id) if self.user.branch else None,
            'branch_name': self.user.branch.name if self.user.branch else None,
            'loyalty_points': loyalty.points,
            'loyalty_tier': loyalty.tier,
            'referral_code': loyalty.referral_code,
        }
        data['_message'] = "Login successful."
        return data


class LogoutSerializer(serializers.Serializer):
    refresh = serializers.CharField()

    def validate(self, attrs):
        self.token = attrs['refresh']
        return attrs


class ForgotPasswordSerializer(serializers.Serializer):
    email = serializers.CharField(required=True, help_text="Email address or Username")


class ResetPasswordSerializer(serializers.Serializer):
    email = serializers.CharField(required=True, help_text="Email address or Username")
    token = serializers.CharField()
    new_password = serializers.CharField(write_only=True, validators=[validate_password_strength])
    confirm_password = serializers.CharField(write_only=True)

    def validate(self, attrs):
        if attrs['new_password'] != attrs['confirm_password']:
            raise serializers.ValidationError({"confirm_password": "Passwords do not match."})
        return attrs


class ChangePasswordSerializer(serializers.Serializer):
    old_password = serializers.CharField(write_only=True)
    new_password = serializers.CharField(write_only=True, validators=[validate_password_strength])
    confirm_password = serializers.CharField(write_only=True)

    def validate(self, attrs):
        if attrs['new_password'] != attrs['confirm_password']:
            raise serializers.ValidationError({"confirm_password": "Passwords do not match."})
        return attrs


class ProfileUpdateSerializer(serializers.ModelSerializer):
    bio = serializers.CharField(required=False, allow_blank=True)
    address = serializers.CharField(required=False, allow_blank=True)
    date_of_birth = serializers.DateField(required=False, allow_null=True)
    gender = serializers.ChoiceField(choices=UserProfile.GENDER_CHOICES, required=False)

    class Meta:
        model = User
        fields = ('first_name', 'last_name', 'phone', 'profile_image', 'bio', 'address', 'date_of_birth', 'gender')

    def update(self, instance, validated_data):
        # Extract profile fields
        profile_data = {}
        for field in ['bio', 'address', 'date_of_birth', 'gender']:
            if field in validated_data:
                profile_data[field] = validated_data.pop(field)
                
        # Update user fields
        for field, value in validated_data.items():
            setattr(instance, field, value)
        instance.save()
        
        # Update profile fields
        profile, _ = UserProfile.objects.get_or_create(user=instance)
        for field, value in profile_data.items():
            setattr(profile, field, value)
        profile.save()
        
        return instance
