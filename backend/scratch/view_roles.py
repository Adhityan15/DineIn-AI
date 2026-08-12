import os
import django
import sys
sys.path.append("c:/Users/adhit/Downloads/Ai_DineIn_Management/backend")
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "dinein_project.settings.development")
django.setup()

from apps.authentication.models import Role
for r in Role.objects.all():
    print(f"Role: {r.id} | Code: {r.code} | Name: {r.name}")
