import os
import sys
import django

sys.path.append("c:/Users/adhit/Downloads/Ai_DineIn_Management/backend")
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'dinein_project.settings.development')
django.setup()

from django.contrib.auth import get_user_model
User = get_user_model()
u = User.objects.filter(username='admin@dinein.com').first()
if u:
    u.set_password('admin123')
    u.is_superuser = True
    u.is_staff = True
    u.save()
    print("Reset password of 'admin@dinein.com' to 'admin123'")
else:
    print("User admin@dinein.com not found!")
