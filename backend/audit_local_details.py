import os
import sys
import django

backend_dir = os.path.dirname(os.path.abspath(__file__))
apps_dir = os.path.join(backend_dir, 'apps')
if apps_dir not in sys.path:
    sys.path.insert(0, apps_dir)
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "dinein_project.settings.development")
django.setup()

from apps.core.models import Branch
from apps.authentication.models import User
from apps.reservation.models import Reservation, Table, Waitlist
from apps.inventory.models import MenuItem, InventoryBatch, Order

print("=== BRANCHES & RESERVATIONS ===")
for b in Branch.objects.all():
    res_count = Reservation.objects.filter(branch=b).count()
    tables_count = Table.objects.filter(branch=b).count()
    orders_count = Order.objects.filter(branch=b).count()
    inv_count = InventoryBatch.objects.filter(branch=b).count()
    wait_count = Waitlist.objects.filter(branch=b).count()
    print(f"Branch: {b.name} | ID: {b.id} | Tables: {tables_count} | Reservations: {res_count} | Orders: {orders_count} | InventoryBatch: {inv_count} | Waitlist: {wait_count}")

print("\n=== IS WALK-IN FIELD ===")
# Let's inspect the fields on Reservation
from django.db.models import F
print("Reservation fields:")
for field in Reservation._meta.get_fields():
    print(f"  {field.name}: {type(field).__name__}")

# Let's see if we can find if there is walk-ins count using `is_walk_in` field
try:
    walkins_count = Reservation.objects.filter(is_walk_in=True).count()
    print(f"Total Walk-ins (is_walk_in=True): {walkins_count}")
except Exception as e:
    print(f"Walk-ins check failed: {e}")

# Let's check Table positions
try:
    from apps.reservation.models import TablePosition
    print(f"TablePosition count: {TablePosition.objects.count()}")
except Exception as e:
    print(f"No TablePosition model: {e}")

# Let's see if there is any other model related to floor layout or positions
from django.apps import apps
res_app = apps.get_app_config('reservation')
print("\nModels in reservation app:")
for m in res_app.get_models():
    print(f"  {m.__name__}")

# Check staff/Employee branch count
from apps.staff.models import Employee
print("\n=== EMPLOYEES PER BRANCH ===")
for b in Branch.objects.all():
    emp_count = Employee.objects.filter(user__branch=b).count()
    print(f"Branch: {b.name} | Employees: {emp_count}")

