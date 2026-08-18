import os
import sys
import django

# Setup Django environment
backend_dir = os.path.dirname(os.path.abspath(__file__))
apps_dir = os.path.join(backend_dir, 'apps')
if apps_dir not in sys.path:
    sys.path.insert(0, apps_dir)
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "dinein_project.settings.development")
django.setup()

from django.conf import settings
from django.db import connections
from django.apps import apps
from django.contrib.auth import get_user_model

def mask_credential(val):
    if not val:
        return ""
    if len(val) <= 4:
        return "****"
    return val[:2] + "****" + val[-2:]

def run_audit():
    print("==================================================")
    print("PHASE 1 — AUDIT DATABASE REPORT")
    print("==================================================")
    
    settings_module = os.environ.get("DJANGO_SETTINGS_MODULE")
    print(f"1. Django settings module: {settings_module}")
    
    db_config = settings.DATABASES.get('default', {})
    masked_config = {}
    for k, v in db_config.items():
        if k in ['PASSWORD', 'USER', 'HOST']:
            masked_config[k] = mask_credential(str(v))
        else:
            masked_config[k] = v
            
    print(f"2. DATABASES configuration (masked): {masked_config}")
    print(f"3. Actual database engine: {db_config.get('ENGINE')}")
    print(f"4. Actual database file/path: {db_config.get('NAME')}")
    
    # Connection test
    db_conn = connections['default']
    try:
        db_conn.cursor()
        print("5. Database connection test: SUCCESS")
        conn_ok = True
    except Exception as e:
        print(f"5. Database connection test: FAILED - {e}")
        conn_ok = False
        
    if not conn_ok:
        return
        
    # Get all models
    print("\nMODEL | COUNT | STATUS")
    print("----------------------")
    all_models = apps.get_models()
    for model in all_models:
        model_name = f"{model._meta.app_label}.{model.__name__}"
        try:
            count = model.objects.count()
            status = "OK"
        except Exception as e:
            count = 0
            status = f"ERROR: {e}"
        print(f"{model_name} | {count} | {status}")
        
    # Admin1 verification
    print("\nADMIN1 VERIFICATION")
    print("-------------------")
    User = get_user_model()
    admin1 = User.objects.filter(username='admin1').first()
    if not admin1:
        # Try by email
        admin1 = User.objects.filter(email='adhityanmclaren@gmail.com').first()
        
    if admin1:
        print(f"username: {admin1.username}")
        print(f"email: {admin1.email}")
        print(f"role: {admin1.role.name if admin1.role else 'None'}")
        print(f"branch: {admin1.branch.name if admin1.branch else 'None'}")
        print(f"is_active: {admin1.is_active}")
        print(f"is_staff: {admin1.is_staff}")
        print(f"is_superuser: {admin1.is_superuser}")
        
        # password hash algorithm
        algo = admin1.password.split('$')[0]
        print(f"password hash algorithm: {algo}")
        
        # check_password
        pwd_match = admin1.check_password('Admin@123')
        print(f"whether check_password('Admin@123') works: {pwd_match}")
        
        # Relationships for admin1's branch
        branch = admin1.branch
        if branch:
            print(f"\nRELATIONSHIPS FOR BRANCH: {branch.name} ({branch.id})")
            print("--------------------------------------------------")
            
            # Counts
            # Tables
            tables_count = apps.get_model('reservation', 'Table').objects.filter(branch=branch).count()
            print(f"Tables: {tables_count}")
            
            # Floor layout / Table positions
            # Let's see what model has floor layout. Let's list the fields or model names.
            # We can search the models by name or import them.
            try:
                floor_layout_count = apps.get_model('reservation', 'TablePosition').objects.filter(table__branch=branch).count()
                print(f"Floor layout (TablePosition): {floor_layout_count}")
            except Exception:
                try:
                    floor_layout_count = apps.get_model('reservation', 'FloorLayout').objects.filter(branch=branch).count()
                    print(f"Floor layout: {floor_layout_count}")
                except Exception as e:
                    print(f"Floor layout: ERROR ({e})")
                    
            # Reservations
            reservations_count = apps.get_model('reservation', 'Reservation').objects.filter(branch=branch).count()
            print(f"Reservations: {reservations_count}")
            
            # Waitlist
            waitlist_count = apps.get_model('reservation', 'Waitlist').objects.filter(branch=branch).count()
            print(f"Waitlist: {waitlist_count}")
            
            # Walk-ins (Is there a walk-in model or field on Reservation/Order?)
            try:
                walkins_count = apps.get_model('reservation', 'Reservation').objects.filter(branch=branch, is_walkin=True).count()
                print(f"Walk-ins: {walkins_count}")
            except Exception:
                try:
                    walkins_count = apps.get_model('reservation', 'Reservation').objects.filter(branch=branch, reservation_type='walk_in').count()
                    print(f"Walk-ins: {walkins_count}")
                except Exception as e:
                    print(f"Walk-ins: Not found/Error ({e})")
                    
            # Customers
            try:
                customers_count = apps.get_model('customer', 'CustomerProfile').objects.filter(branch=branch).count()
                print(f"Customers: {customers_count}")
            except Exception:
                try:
                    customers_count = apps.get_model('customer', 'Customer').objects.filter(branch=branch).count()
                    print(f"Customers: {customers_count}")
                except Exception as e:
                    print(f"Customers: Not found/Error ({e})")
                    
            # Staff
            try:
                staff_count = apps.get_model('staff', 'Employee').objects.filter(user__branch=branch).count()
                print(f"Staff (Employee): {staff_count}")
            except Exception as e:
                print(f"Staff: Not found/Error ({e})")
                
            # Menu
            # Is Menu branch-specific? Let's check MenuItem model count or relationship
            try:
                menu_count = apps.get_model('inventory', 'MenuItem').objects.count()
                print(f"Menu (Global/All): {menu_count}")
            except Exception as e:
                print(f"Menu: Not found/Error ({e})")
                
            # Orders
            try:
                orders_count = apps.get_model('inventory', 'Order').objects.filter(branch=branch).count()
                print(f"Orders: {orders_count}")
            except Exception as e:
                print(f"Orders: Not found/Error ({e})")
                
            # Inventory
            try:
                inv_batch_count = apps.get_model('inventory', 'InventoryBatch').objects.filter(branch=branch).count()
                print(f"Inventory (InventoryBatch): {inv_batch_count}")
            except Exception as e:
                print(f"Inventory: Not found/Error ({e})")
        else:
            print("\nAdmin1 user has no branch configured.")
    else:
        print("\nAdmin1 user not found.")

if __name__ == '__main__':
    run_audit()
