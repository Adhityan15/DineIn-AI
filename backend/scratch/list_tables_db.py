import os
import django

# Let's set default settings module dynamically
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'dinein_project.settings.development')
django.setup()

from apps.reservation.models import Table
from apps.core.models import Branch

print("All branches:")
for b in Branch.objects.all():
    print(f"Branch: {b.name} (id: {b.id}, code: {b.branch_code})")
    tables = Table.objects.filter(branch=b)
    print(f"  Tables count: {tables.count()}")
    for t in tables:
        print(f"    Table {t.number} (id: {t.id}): x={t.x_coord}, y={t.y_coord}, capacity={t.capacity}, shape={t.shape}, status={t.status}")
