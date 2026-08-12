import pytest
from django.contrib.auth import get_user_model
from apps.core.models import Branch, Restaurant
from apps.reservation.models import Reservation
from apps.inventory.models import Ingredient
from apps.staff.models import Employee, Department, Designation

User = get_user_model()

@pytest.fixture
def multi_branch_setup(db):
    restaurant = Restaurant.objects.create(
        name="Enterprise DineIn Group",
        code="enterprise-dinein",
        contact_email="hq@dinein.ai",
        contact_phone="+12345678",
        address="HQ Boulevard"
    )
    
    branch_a = Branch.objects.create(
        restaurant=restaurant,
        name="Branch Downtown",
        branch_code="branch-downtown",
        address="100 Main St",
        is_active=True,
        gst_number="GST-A123",
        tax_percentage=18.00
    )
    
    branch_b = Branch.objects.create(
        restaurant=restaurant,
        name="Branch Uptown",
        branch_code="branch-uptown",
        address="200 High St",
        is_active=True,
        gst_number="GST-B456",
        tax_percentage=12.00
    )
    
    # Create managers for both branches
    mgr_user_a = User.objects.create_user(
        username="mgr_a", email="mgr_a@dinein.ai", password="password", branch=branch_a
    )
    mgr_user_b = User.objects.create_user(
        username="mgr_b", email="mgr_b@dinein.ai", password="password", branch=branch_b
    )
    
    branch_a.branch_manager = mgr_user_a
    branch_a.save()
    branch_b.branch_manager = mgr_user_b
    branch_b.save()
    
    return {
        "restaurant": restaurant,
        "branch_a": branch_a,
        "branch_b": branch_b,
        "mgr_a": mgr_user_a,
        "mgr_b": mgr_user_b
    }

@pytest.mark.django_db
def test_branch_data_isolation_queries(multi_branch_setup):
    ba = multi_branch_setup["branch_a"]
    bb = multi_branch_setup["branch_b"]
    
    # 1. Create reservations linked to different branches
    res_a = Reservation.objects.create(
        branch=ba,
        guest_name="Guest A",
        guest_phone="111",
        guest_email="a@test.com",
        party_size=2,
        start_time="2026-07-12T19:00:00Z",
        end_time="2026-07-12T21:00:00Z",
        status="confirmed"
    )
    
    res_b = Reservation.objects.create(
        branch=bb,
        guest_name="Guest B",
        guest_phone="222",
        guest_email="b@test.com",
        party_size=4,
        start_time="2026-07-12T20:00:00Z",
        end_time="2026-07-12T22:00:00Z",
        status="confirmed"
    )
    
    # Assert querysets retrieve isolated counts
    assert Reservation.objects.filter(branch=ba).count() == 1
    assert Reservation.objects.filter(branch=ba).first().guest_name == "Guest A"
    assert Reservation.objects.filter(branch=bb).count() == 1
    assert Reservation.objects.filter(branch=bb).first().guest_name == "Guest B"
    
    # 2. Create staff employees linked to different branches
    dept = Department.objects.create(name="Operations", code="operations-test")
    desig = Designation.objects.create(name="Chef", department=dept)
    
    emp_user_a = User.objects.create_user(
        username="emp_a", email="emp_a@test.com", password="password", branch=ba
    )
    emp_user_b = User.objects.create_user(
        username="emp_b", email="emp_b@test.com", password="password", branch=bb
    )
    
    Employee.objects.create(user=emp_user_a, employee_id="EMP-A", designation=desig, hire_date="2026-07-12", hourly_rate=15.00)
    Employee.objects.create(user=emp_user_b, employee_id="EMP-B", designation=desig, hire_date="2026-07-12", hourly_rate=15.00)
    
    # Assert employees are isolated per branch user
    assert Employee.objects.filter(user__branch=ba).count() == 1
    assert Employee.objects.filter(user__branch=bb).count() == 1


@pytest.mark.django_db
def test_invoice_pdf_download(multi_branch_setup):
    from rest_framework.test import APIClient
    from apps.core.models import Invoice
    ba = multi_branch_setup["branch_a"]
    mgr = multi_branch_setup["mgr_a"]
    
    invoice = Invoice.objects.create(
        branch=ba,
        subtotal=100.00,
        gst=18.00,
        service_charge=10.00,
        discount=10.00,
        total=118.00,
        payment_method="card",
        status="paid",
        transaction_id="TXN-999-TEST"
    )
    
    client = APIClient()
    client.force_authenticate(user=mgr)
    
    url = f"/api/v1/branches/invoices/{invoice.id}/pdf/"
    res = client.get(url)
    assert res.status_code == 200
    assert res["Content-Type"] == "application/pdf"
    assert len(res.content) > 0
