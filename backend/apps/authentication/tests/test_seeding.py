import pytest
from django.core.management import call_command
from apps.authentication.models import Role, Permission

@pytest.mark.django_db
def test_seed_roles_permissions_command():
    """
    Verifies that the seed_roles_permissions management command executes successfully
    and creates the expected roles and permissions in the database.
    """
    # Delete existing roles to test command logic from clean slate
    Role.objects.all().delete()
    Permission.objects.all().delete()

    # Verify starting state is empty
    assert Role.objects.count() == 0
    assert Permission.objects.count() == 0
    
    # Execute the management command
    call_command('seed_roles_permissions')
    
    # Verify permissions are created
    assert Permission.objects.count() > 0
    assert Permission.objects.filter(code='view_reservation').exists()
    assert Permission.objects.filter(code='view_inventory').exists()
    
    # Verify roles are created
    assert Role.objects.count() == 7
    role_codes = ['admin', 'owner', 'manager', 'receptionist', 'inventory_manager', 'kitchen_staff', 'customer']
    for code in role_codes:
        assert Role.objects.filter(code=code).exists()
        
    # Verify role permissions assignments
    admin_role = Role.objects.get(code='admin')
    assert admin_role.permissions.count() == Permission.objects.count()
    
    receptionist_role = Role.objects.get(code='receptionist')
    assert receptionist_role.permissions.count() == 3
    assert receptionist_role.permissions.filter(code='view_reservation').exists()
    assert not receptionist_role.permissions.filter(code='view_inventory').exists()
