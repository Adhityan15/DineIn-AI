import os
import sys
import django

sys.path.append("c:/Users/adhit/Downloads/Ai_DineIn_Management/backend")
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'dinein_project.settings.development')
django.setup()

from django.contrib.auth import get_user_model
User = get_user_model()
users = User.objects.all()
for u in users:
    print(f"User: id={u.id}, username={u.username}, email={u.email}, is_superuser={u.is_superuser}")
