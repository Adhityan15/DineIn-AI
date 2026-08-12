from django.contrib.auth.backends import ModelBackend
from django.contrib.auth import get_user_model
from django.db.models import Q
from django.utils import timezone
from apps.core.models import AuditLog

User = get_user_model()

class EmailOrUsernameModelBackend(ModelBackend):
    """
    Custom authentication backend allowing login via either Email or Username,
    with built-in account lockout security logic and failed attempt auditing.
    """
    def authenticate(self, request, username=None, password=None, **kwargs):
        if username is None:
            username = kwargs.get(User.USERNAME_FIELD)
            
        try:
            # Query by email OR username
            users = User.objects.filter(Q(email__iexact=username) | Q(username__iexact=username))
            if not users.exists():
                # Run password hasher dummy check to mitigate timing side-channel attacks
                User().set_password(password)
                return None
                
            # If multiple users are found, select the one matching the password
            user = None
            for u in users:
                if u.check_password(password):
                    user = u
                    break
            if not user:
                user = users.first()
        except Exception:
            User().set_password(password)
            return None

        # Check account lockout state
        if user.check_lockout():
            # Account is locked, log and reject
            AuditLog.objects.create(
                user=user,
                action=f"Failed login attempt: Account is locked until {user.locked_until}",
                model_name="User",
                record_id=str(user.id),
                ip_address=request.META.get('REMOTE_ADDR') if request else None
            )
            raise PermissionError(f"Account is locked. Please try again after {user.locked_until.strftime('%H:%M:%S UTC')}.")

        # Check password correctness
        if user.check_password(password):
            if self.user_can_authenticate(user):
                user.reset_failed_attempts()
                # Create AuditLog for successful login
                AuditLog.objects.create(
                    user=user,
                    action="User Login Successful",
                    model_name="User",
                    record_id=str(user.id),
                    ip_address=request.META.get('REMOTE_ADDR') if request else None
                )
                return user
        else:
            # Incorrect password, increment failure counter
            user.increment_failed_attempts()
            # Create AuditLog for failed login attempt
            AuditLog.objects.create(
                user=user,
                action="Failed login attempt: Incorrect password",
                model_name="User",
                record_id=str(user.id),
                ip_address=request.META.get('REMOTE_ADDR') if request else None
            )
            
        return None
