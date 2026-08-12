import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'dinein_project.settings.development')
django.setup()

from apps.core.models import Branch
print("Available branches:")
for b in Branch.objects.all():
    print(f"Name: {b.name}, ID: {b.id}")
