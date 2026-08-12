import os, django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'dinein_project.settings.development')
django.setup()

from apps.authentication.models import User
users = User.objects.all()
for u in users:
    print(f"Username: {u.username} | Email: {u.email} | Role: {u.role} | Active: {u.is_active}")
