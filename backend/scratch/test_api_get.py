import json
from django.contrib.auth import get_user_model
from rest_framework.test import APIRequestFactory, force_authenticate
from apps.reservation.views import TableViewSet
from apps.inventory.views import MenuItemViewSet
from apps.reservation.views import ReservationViewSet
from apps.core.models import Branch

# Initialize Django test factory
factory = APIRequestFactory()
User = get_user_model()
admin_user = User.objects.filter(is_superuser=True).first() or User.objects.first()

print("Authenticating with user:", admin_user.username if admin_user else "None")

# Fetch branches
print("\n--- BRANCHES ---")
for b in Branch.objects.all():
    print(f"Branch ID: {b.id} | Name: {b.name} | Slug: {b.branch_code}")

# Get tables for each branch
print("\n--- TABLES BY BRANCH ---")
table_view = TableViewSet.as_view({'get': 'list'})
for b in Branch.objects.all():
    request = factory.get(f'/api/v1/reservation/tables/?branch={b.id}')
    force_authenticate(request, user=admin_user)
    response = table_view(request)
    data = response.data
    tables_list = data.get('results', data) if isinstance(data, dict) else data
    print(f"Branch: {b.name} | Tables Count: {len(tables_list)}")
    if len(tables_list) > 0:
        print(f"  First 3 Tables: {[{'id': str(t['id']), 'number': t['number'], 'status': t['status']} for t in tables_list[:3]]}")

# Get menu items
print("\n--- MENU ITEMS ---")
menu_view = MenuItemViewSet.as_view({'get': 'list'})
request = factory.get('/api/v1/inventory/menu-items/')
force_authenticate(request, user=admin_user)
response = menu_view(request)
data = response.data
menu_list = data.get('results', data) if isinstance(data, dict) else data
print(f"Total Menu Items: {len(menu_list)}")
if len(menu_list) > 0:
    print(f"  First 3 Menu Items: {[{'id': str(m['id']), 'name': m['name'], 'price': m['price'], 'sku': m.get('sku')} for m in menu_list[:3]]}")

# Get active bookings/reservations
print("\n--- RESERVATIONS ---")
res_view = ReservationViewSet.as_view({'get': 'list'})
request = factory.get('/api/v1/reservation/bookings/')
force_authenticate(request, user=admin_user)
response = res_view(request)
data = response.data
res_list = data.get('results', data) if isinstance(data, dict) else data
print(f"Total Reservations: {len(res_list)}")
if len(res_list) > 0:
    print(f"  First 3 Reservations: {[{'id': str(r['id']), 'guest_name': r['guest_name'], 'status': r['status']} for r in res_list[:3]]}")
