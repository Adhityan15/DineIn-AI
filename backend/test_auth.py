import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'dinein_project.settings.development')
django.setup()

from django.contrib.auth import get_user_model, authenticate
from apps.authentication.models import Role

def test():
    User = get_user_model()
    role_obj, _ = Role.objects.get_or_create(code='customer', defaults={'name': 'Customer'})
    
    # Try to delete if existing
    User.objects.filter(username='testuser123').delete()
    
    print("Creating test user testuser123...")
    user = User.objects.create_user(
        email='testuser123@example.com',
        username='testuser123',
        password='Password@123',
        first_name='Test',
        last_name='User',
        phone='+919876543210',
        role=role_obj
    )
    print("User created. is_active:", user.is_active)
    print("Checking check_password locally on created user:", user.check_password('Password@123'))
    
    # Now try to authenticate using email
    print("Authenticating with email...")
    auth_user_email = authenticate(username='testuser123@example.com', password='Password@123')
    print("Email authentication result:", auth_user_email)
    
    # Try to authenticate using username
    print("Authenticating with username...")
    auth_user_username = authenticate(username='testuser123', password='Password@123')
    print("Username authentication result:", auth_user_username)

if __name__ == '__main__':
    test()
