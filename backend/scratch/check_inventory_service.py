import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'dinein_project.settings.development')
django.setup()

from apps.inventory.services import InventoryService
print("InventoryService methods:")
print([m for m in dir(InventoryService) if not m.startswith('__')])
