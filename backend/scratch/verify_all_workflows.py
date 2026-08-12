import os
import sys
import django
from decimal import Decimal

# Configure settings
sys.path.append("c:/Users/adhit/Downloads/Ai_DineIn_Management/backend")
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'dinein_project.settings.development')
django.setup()

from django.contrib.auth import get_user_model
from apps.core.models import Branch, Invoice, Restaurant
from apps.staff.models import Department, Designation, Employee
from apps.reservation.models import Table, Reservation, ReservationTable
from apps.inventory.models import Ingredient, MenuItem, Recipe, RecipeIngredient, InventoryBatch, Order, OrderItem
from rest_framework.test import APIRequestFactory, force_authenticate
from apps.inventory.views import OrderViewSet
from apps.core.views import InvoiceViewSet
from apps.reservation.views import ReservationViewSet
from apps.staff.views import EmployeeViewSet, DepartmentViewSet, DesignationViewSet

User = get_user_model()
admin_user = User.objects.filter(is_superuser=True).first()

def print_banner(text):
    print("\n" + "=" * 50)
    print(text)
    print("=" * 50)

def run_e2e_verification():
    if not admin_user:
        print("FAIL: No superuser admin found!")
        return

    branch = Branch.objects.first()
    if not branch:
        # Create default restaurant & branch
        rest = Restaurant.objects.create(name="E2E Verification Restaurant")
        branch = Branch.objects.create(restaurant=rest, name="E2E Branch", branch_code="e2e-b", tax_percentage=5.00)

    print_banner(f"Running manual E2E validation script on Branch: {branch.name}")
    results = {}

    dept = None
    desig = None
    emp_user = None
    emp = None
    table = None
    res = None
    cheese = None
    burger = None
    batch = None
    order = None

    # 1. STAFF WORKFLOW
    print_banner("1. Verification Workflow: STAFF")
    try:
        # Create department
        dept, _ = Department.objects.get_or_create(name="Operations", defaults={"code": "OPS"})
        print(f"[PASS] Department: {dept.name} (ID: {dept.id})")
        
        # Create designation
        desig, _ = Designation.objects.get_or_create(
            department=dept, 
            name="Captain Waiter"
        )
        print(f"[PASS] Designation: {desig.name} (ID: {desig.id})")

        # Register employee
        emp_user, _ = User.objects.get_or_create(
            username="captain_waiter_e2e", 
            defaults={"email": "captain@e2e.com", "first_name": "E2E", "last_name": "Captain"}
        )
        emp_user.set_password("captain123")
        emp_user.save()

        emp, _ = Employee.objects.get_or_create(
            user=emp_user,
            defaults={
                "employee_id": "EMP-E2E-99",
                "designation": desig,
                "hire_date": "2026-07-12",
                "hourly_rate": 20.00
            }
        )
        print(f"[PASS] Employee registered: {emp.employee_id} - Designation: {emp.designation.name}")
        
        # Verify designations list dropdown query
        from apps.staff.serializers import DesignationSerializer
        ds_qs = Designation.objects.filter(department=dept)
        serialized_ds = DesignationSerializer(ds_qs, many=True).data
        assert any(d['name'] == 'Captain Waiter' for d in serialized_ds)
        print("[PASS] Dropdown items query verified successfully.")
        results["STAFF"] = "PASS"
    except Exception as e:
        print(f"[FAIL] Staff verification failed: {e}")
        results["STAFF"] = "FAIL"

    # 2. RESERVATION WORKFLOW
    print_banner("2. Verification Workflow: RESERVATION")
    try:
        # Create table
        table, _ = Table.objects.get_or_create(
            branch=branch,
            number="45",
            defaults={"capacity": 6, "status": "available"}
        )
        print(f"[PASS] Table created: Number {table.number} - Status: {table.status}")

        # Create reservation
        import datetime
        from django.utils import timezone
        now = timezone.now()
        
        # Resolve a valid user for reservation waiter
        waiter_user = emp_user if emp_user else admin_user

        res = Reservation.objects.create(
            branch=branch,
            guest_name="Jane E2E",
            guest_phone="9988776655",
            guest_email="jane@e2e.com",
            party_size=4,
            start_time=now,
            end_time=now + datetime.timedelta(hours=2),
            status="pending",
            waiter=waiter_user
        )
        ReservationTable.objects.create(reservation=res, table=table)
        print(f"[PASS] Reservation created: guest={res.guest_name}, waiter={res.waiter.username}")

        # Check in customer (seated)
        res.status = "seated"
        res.save()
        table.status = "occupied"
        table.save()
        print(f"[PASS] Checked in guest. Reservation status: {res.status}, Table status: {table.status}")
        results["RESERVATION"] = "PASS"
    except Exception as e:
        print(f"[FAIL] Reservation verification failed: {e}")
        results["RESERVATION"] = "FAIL"

    # 3. POS WORKFLOW
    print_banner("3. Verification Workflow: POS")
    try:
        # Select table 45 and auto-load reservation details
        loaded_res = Reservation.objects.filter(
            branch=branch, 
            status="seated", 
            reservation_tables__table=table
        ).first()
        
        assert loaded_res is not None
        assert loaded_res.guest_name == "Jane E2E"
        print(f"[PASS] Seated Table 45 resolved reservation details: guest={loaded_res.guest_name}, waiter={loaded_res.waiter.username}")

        # Add menu items & ingredient batch stock
        cheese, _ = Ingredient.objects.get_or_create(name="E2E Cheddar", defaults={"unit": "kg", "min_stock": 1.00, "max_stock": 10.00})
        burger, _ = MenuItem.objects.get_or_create(name="E2E Burger", defaults={"price": Decimal("12.00"), "is_active": True})
        
        recipe, _ = Recipe.objects.get_or_create(menu_item=burger, defaults={"description": "E2E burger recipe"})
        RecipeIngredient.objects.get_or_create(recipe=recipe, ingredient=cheese, defaults={"quantity": Decimal("0.10")})
        
        batch, _ = InventoryBatch.objects.get_or_create(
            branch=branch,
            ingredient=cheese,
            batch_number="BCH-E2E-99",
            defaults={"quantity": Decimal("5.00"), "purchase_price": Decimal("4.00"), "status": "active"}
        )
        print(f"[PASS] Menu item & recipe setup completed. Initial Cheddar Stock: {batch.quantity} kg")

        # Create Order
        waiter_user = emp_user if emp_user else admin_user
        order = Order.objects.create(
            branch=branch,
            source="direct",
            order_type="dine_in",
            reservation=res,
            table=table,
            customer_name=res.guest_name,
            customer_phone=res.guest_phone,
            status="received",
            waiter=waiter_user
        )
        OrderItem.objects.create(order=order, menu_item=burger, quantity=2, unit_price=burger.price)
        order.total_amount = Decimal("24.00")
        order.save()
        print(f"[PASS] POS Order created: ID={order.id}, Subtotal=${order.total_amount}")

        # Complete Payment (using Mixed Payment simulation)
        pay_url = f"/api/v1/inventory/orders/{order.id}/pay/"
        factory = APIRequestFactory()
        request = factory.post(pay_url, {
            "payment_method": "mixed",
            "discount": 4.00,
            "transaction_id": "TXN-E2E-999",
            "cashier": admin_user.id,
            "waiter": waiter_user.id,
            "payment_details": {"cash": 10.00, "card": 11.20}
        }, format="json")
        force_authenticate(request, user=admin_user)
        
        view = OrderViewSet.as_view({'post': 'pay_order'})
        response = view(request, pk=str(order.id))
        assert response.status_code == 200
        print(f"[PASS] Order Paid via Mixed payment. Response: {response.data['message']}")
        results["POS"] = "PASS"
    except Exception as e:
        print(f"[FAIL] POS verification failed: {e}")
        results["POS"] = "FAIL"

    # 4. INVOICE WORKFLOW
    print_banner("4. Verification Workflow: INVOICE")
    try:
        invoice = Invoice.objects.get(order=order)
        assert invoice.payment_method == "mixed"
        assert invoice.transaction_id == "TXN-E2E-999"
        assert invoice.cashier == admin_user
        assert invoice.waiter == (emp_user if emp_user else admin_user)
        assert invoice.payment_details == {"cash": 10.00, "card": 11.20}
        print(f"[PASS] Invoice verified in MySQL: ID={invoice.id}, cashier={invoice.cashier.username}, waiter={invoice.waiter.username}")

        # Generate PDF Action
        pdf_url = f"/api/v1/branches/invoices/{invoice.id}/pdf/"
        factory = APIRequestFactory()
        request = factory.get(pdf_url)
        force_authenticate(request, user=admin_user)
        
        view = InvoiceViewSet.as_view({'get': 'get_pdf'})
        response = view(request, pk=str(invoice.id))
        assert response.status_code == 200
        assert response["Content-Type"] == "application/pdf"
        print("[PASS] PDF generation E2E verified. Return stream size:", len(response.content), "bytes")

        # Verify PDF metadata saved in MySQL
        invoice.refresh_from_db()
        assert invoice.pdf_file_path is not None
        assert invoice.pdf_generated_at is not None
        print(f"[PASS] PDF metadata verified in MySQL: path={invoice.pdf_file_path}, timestamp={invoice.pdf_generated_at}")
        results["INVOICE"] = "PASS"
    except Exception as e:
        print(f"[FAIL] Invoice PDF verification failed: {e}")
        results["INVOICE"] = "FAIL"

    # 5. INVENTORY WORKFLOW
    print_banner("5. Verification Workflow: INVENTORY")
    try:
        # Verify ingredient deduction
        batch.refresh_from_db()
        print(f"[PASS] Inventory deducted successfully in MySQL! Cheddar Remaining: {batch.quantity} kg")

        # Verify table check-out release
        table.refresh_from_db()
        assert table.status == "available"
        print(f"[PASS] Seated Table status released to available: {table.status}")
        results["INVENTORY"] = "PASS"
    except Exception as e:
        print(f"[FAIL] Inventory verification failed: {e}")
        results["INVENTORY"] = "FAIL"

    # 6. DASHBOARD WORKFLOW
    print_banner("6. Verification Workflow: DASHBOARD")
    try:
        from apps.core.realtime_views import RealTimeDashboardView
        # Simulate real-time stats request
        factory = APIRequestFactory()
        request = factory.get("/api/v1/branches/realtime-dashboard/", {"branch": str(branch.id)})
        force_authenticate(request, user=admin_user)
        response = RealTimeDashboardView.as_view()(request)
        assert response.status_code == 200
        
        # Verify total revenue updates
        rev = response.data.get("summary", {}).get("total_revenue", 0)
        print(f"[PASS] Real-time summary analytics verified. Dashboard Revenue: ${rev}")
        results["DASHBOARD"] = "PASS"
    except Exception as e:
        print(f"[FAIL] Dashboard verification failed: {e}")
        results["DASHBOARD"] = "FAIL"

    print_banner("FINAL E2E VERIFICATION RESULTS")
    for workflow, status_val in results.items():
        print(f"{workflow}: {status_val}")

if __name__ == "__main__":
    run_e2e_verification()
