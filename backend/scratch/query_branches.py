import os, django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'dinein_project.settings.development')
django.setup()

from apps.core.models import Branch
branches = Branch.objects.all()
for b in branches:
    print(f"ID: {b.id} | Name: {b.name} | Default: {b.is_default}")
