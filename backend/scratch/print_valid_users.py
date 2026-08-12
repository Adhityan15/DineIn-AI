import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'dinein_project.settings.development')
django.setup()

from django.contrib.auth import get_user_model
User = get_user_model()

print("User accounts:")
for u in User.objects.all():
    print(f"ID: {u.id} | Email: {u.email} | Username: {u.username} | Role: {u.role.code if u.role else 'None'}")
