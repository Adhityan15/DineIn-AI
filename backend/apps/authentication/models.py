from django.db import models
from django.contrib.auth.models import AbstractBaseUser, BaseUserManager, PermissionsMixin
from django.utils import timezone
from apps.core.models import BaseModel, Branch
from apps.core.validators import validate_phone_number

class Permission(BaseModel):
    """
    Database model representing fine-grained system permissions.
    """
    name = models.CharField(max_length=255)
    code = models.CharField(max_length=100, unique=True)
    description = models.TextField(blank=True, null=True)

    def __str__(self):
        return f"{self.name} ({self.code})"


class Role(BaseModel):
    """
    Database model representing system roles, mapping to multiple permissions.
    """
    name = models.CharField(max_length=100)
    code = models.CharField(max_length=50, unique=True)
    description = models.TextField(blank=True, null=True)
    permissions = models.ManyToManyField(Permission, related_name='roles', blank=True)

    def __str__(self):
        return self.name


class CustomUserManager(BaseUserManager):
    """
    Custom user manager supporting email-based authentication and role lookups.
    """
    def create_user(self, email, username, password=None, **extra_fields):
        if not email:
            raise ValueError("The Email field must be set.")
        if not username:
            raise ValueError("The Username field must be set.")
        email = self.normalize_email(email).lower()
        username = username.strip()
        extra_fields.setdefault('is_active', True)
        user = self.model(email=email, username=username, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_superuser(self, email, username, password=None, **extra_fields):
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)
        
        # Look up or create admin role
        admin_role, _ = Role.objects.get_or_create(
            code='admin', 
            defaults={'name': 'Administrator', 'description': 'Full System Administrator'}
        )
        extra_fields.setdefault('role', admin_role)

        if extra_fields.get('is_staff') is not True:
            raise ValueError("Superuser must have is_staff=True.")
        if extra_fields.get('is_superuser') is not True:
            raise ValueError("Superuser must have is_superuser=True.")

        return self.create_user(email, username, password, **extra_fields)


class User(AbstractBaseUser, PermissionsMixin, BaseModel):
    """
    Custom User model supporting database-backed Roles, Branch assignments, and Account Locking.
    """
    email = models.EmailField(unique=True)
    username = models.CharField(max_length=150, unique=True)
    first_name = models.CharField(max_length=150)
    last_name = models.CharField(max_length=150)
    phone = models.CharField(max_length=20, validators=[validate_phone_number])
    role = models.ForeignKey(Role, on_delete=models.SET_NULL, null=True, blank=True, related_name='users')
    branch = models.ForeignKey(Branch, on_delete=models.SET_NULL, null=True, blank=True, related_name='users')
    profile_image = models.ImageField(upload_to='profile_images/', null=True, blank=True)
    whatsapp_enabled = models.BooleanField(default=True)
    
    is_active = models.BooleanField(default=True)
    is_staff = models.BooleanField(default=False)  # Admin panel access

    # Security Lockout Fields
    failed_login_attempts = models.IntegerField(default=0)
    is_locked = models.BooleanField(default=False)
    locked_until = models.DateTimeField(null=True, blank=True)

    objects = CustomUserManager()

    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['username', 'first_name', 'last_name', 'phone']

    @property
    def name(self):
        full_name = f"{self.first_name} {self.last_name}".strip()
        return full_name if full_name else self.username

    def get_full_name(self):
        return self.name

    def get_short_name(self):
        return self.first_name if self.first_name else self.username

    def __str__(self):
        role_code = self.role.code if self.role else "no-role"
        return f"{self.email} ({role_code})"

    def check_lockout(self):
        """
        Verify if lock duration has expired. If so, reset counter and unlock user.
        """
        if self.is_locked:
            if self.locked_until and timezone.now() > self.locked_until:
                self.is_locked = False
                self.failed_login_attempts = 0
                self.locked_until = None
                self.save()
                return False
            return True
        return False

    def increment_failed_attempts(self, max_attempts=5, lock_duration_minutes=15):
        """
        Increment failed count and trigger lock status if threshold is breached.
        """
        self.failed_login_attempts += 1
        if self.failed_login_attempts >= max_attempts:
            self.is_locked = True
            self.locked_until = timezone.now() + timezone.timedelta(minutes=lock_duration_minutes)
        self.save()

    def reset_failed_attempts(self):
        """
        Reset counter upon successful authentication.
        """
        if self.failed_login_attempts > 0 or self.is_locked:
            self.failed_login_attempts = 0
            self.is_locked = False
            self.locked_until = None
            self.save()


class UserProfile(BaseModel):
    """
    Secondary user profile table housing non-authentication metadata.
    """
    GENDER_CHOICES = (
        ('male', 'Male'),
        ('female', 'Female'),
        ('other', 'Other'),
        ('undisclosed', 'Prefer Not to Say'),
    )

    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='profile')
    bio = models.TextField(blank=True, null=True)
    address = models.TextField(blank=True, null=True)
    date_of_birth = models.DateField(blank=True, null=True)
    gender = models.CharField(max_length=20, choices=GENDER_CHOICES, default='undisclosed')

    def __str__(self):
        return f"Profile of {self.user.email}"


class LoyaltyProfile(BaseModel):
    """
    Database model representing customer loyalty points, membership tier, and referrals.
    """
    TIER_CHOICES = (
        ('silver', 'Silver'),
        ('gold', 'Gold'),
        ('platinum', 'Platinum'),
        ('diamond', 'Diamond'),
    )

    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='loyalty')
    points = models.IntegerField(default=0)
    tier = models.CharField(max_length=20, choices=TIER_CHOICES, default='silver')
    referral_code = models.CharField(max_length=50, unique=True, null=True, blank=True)

    def __str__(self):
        return f"Loyalty: {self.user.email} - Tier: {self.tier} - Points: {self.points}"


from django.db.models.signals import post_save
from django.dispatch import receiver

@receiver(post_save, sender=User)
def create_user_loyalty(sender, instance, created, **kwargs):
    if created:
        import random
        import string
        code = ''.join(random.choices(string.ascii_uppercase + string.digits, k=8))
        LoyaltyProfile.objects.create(user=instance, referral_code=code)

