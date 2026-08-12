from django.contrib.auth import get_user_model
from rest_framework.test import APIRequestFactory, force_authenticate
from apps.inventory.views import MenuItemViewSet, OrderViewSet
from apps.reservation.views import ReservationViewSet, TableViewSet
from apps.staff.views import EmployeeViewSet
from apps.core.views import InvoiceViewSet
from apps.core.models import Branch

factory = APIRequestFactory()
User = get_user_model()
admin_user = User.objects.filter(is_superuser=True).first() or User.objects.first()

branch = Branch.objects.first()
branch_id = 'undefined'

print(f"Testing endpoints with User: {admin_user.username} and Branch: {branch.name if branch else 'None'} ({branch_id})")

endpoints = [
    ('/api/v1/inventory/menu-items/', MenuItemViewSet.as_view({'get': 'list'}), 'menu-items'),
    ('/api/v1/reservation/bookings/', ReservationViewSet.as_view({'get': 'list'}), 'bookings'),
    ('/api/v1/reservation/tables/', TableViewSet.as_view({'get': 'list'}), 'tables'),
    ('/api/v1/workforce/employees/', EmployeeViewSet.as_view({'get': 'list'}), 'employees'),
    ('/api/v1/branches/invoices/', InvoiceViewSet.as_view({'get': 'list'}), 'invoices'),
    ('/api/v1/inventory/orders/', OrderViewSet.as_view({'get': 'list'}), 'orders'),
]

for url, view, name in endpoints:
    try:
        request = factory.get(f"{url}?branch={branch_id}")
        force_authenticate(request, user=admin_user)
        response = view(request)
        print(f"[OK] Endpoint: {name} | Status: {response.status_code} | Count: {len(response.data.get('results', response.data) if isinstance(response.data, dict) else response.data)}")
    except Exception as e:
        print(f"[FAIL] Endpoint: {name} | Error: {e}")
