import pytest
from decimal import Decimal
from django.urls import reverse
from rest_framework import status
from apps.core.models import Branch, Invoice
from apps.reservation.models import Reservation
from apps.inventory.models import Order
from django.contrib.auth import get_user_model
from apps.authentication.models import Role

User = get_user_model()

@pytest.mark.django_db
def test_customer_portal_data_isolation(api_client):
    # Setup roles
    customer_role, _ = Role.objects.get_or_create(code="customer", name="Customer")
    
    # Setup customers
    customer_a = User.objects.create_user(
        username="cust_a", email="cust_a@test.com", password="Password123!", phone="9111111111", role=customer_role
    )
    customer_b = User.objects.create_user(
        username="cust_b", email="cust_b@test.com", password="Password123!", phone="9222222222", role=customer_role
    )
    
    # Setup Branch
    from apps.core.models import Restaurant
    restaurant = Restaurant.objects.create(name="Isolation Test Rest")
    branch = Branch.objects.create(restaurant=restaurant, name="Isolation Branch", branch_code="iso-branch")
    
    # Setup Reservations
    res_a = Reservation.objects.create(
        branch=branch,
        customer=customer_a,
        guest_name="Customer A",
        guest_phone="9111111111",
        guest_email="cust_a@test.com",
        party_size=2,
        start_time="2026-07-12 18:00:00+00:00",
        end_time="2026-07-12 20:00:00+00:00",
        status="confirmed"
    )
    res_b = Reservation.objects.create(
        branch=branch,
        customer=customer_b,
        guest_name="Customer B",
        guest_phone="9222222222",
        guest_email="cust_b@test.com",
        party_size=4,
        start_time="2026-07-12 19:00:00+00:00",
        end_time="2026-07-12 21:00:00+00:00",
        status="confirmed"
    )

    # Setup Orders
    order_a = Order.objects.create(
        branch=branch,
        reservation=res_a,
        customer_name="Customer A",
        customer_phone="9111111111",
        total_amount=Decimal("45.00"),
        status="completed"
    )
    order_b = Order.objects.create(
        branch=branch,
        reservation=res_b,
        customer_name="Customer B",
        customer_phone="9222222222",
        total_amount=Decimal("90.00"),
        status="completed"
    )

    # Setup Invoices
    inv_a = Invoice.objects.create(
        branch=branch,
        reservation=res_a,
        order=order_a,
        subtotal=Decimal("45.00"),
        total=Decimal("51.75"),
        status="paid"
    )
    inv_b = Invoice.objects.create(
        branch=branch,
        reservation=res_b,
        order=order_b,
        subtotal=Decimal("90.00"),
        total=Decimal("103.50"),
        status="paid"
    )

    # 1. Authenticate as Customer A
    api_client.force_authenticate(user=customer_a)
    
    # A. Verify Reservations listing
    res_url = reverse("booking-list")
    res_response = api_client.get(res_url)
    assert res_response.status_code == status.HTTP_200_OK
    res_data = res_response.data.get("results") if isinstance(res_response.data, dict) else res_response.data
    res_ids = [str(r["id"]) for r in res_data]
    assert str(res_a.id) in res_ids
    assert str(res_b.id) not in res_ids
    
    # B. Verify Orders listing
    order_url = reverse("order-list")
    order_response = api_client.get(order_url)
    assert order_response.status_code == status.HTTP_200_OK
    order_data = order_response.data.get("results") if isinstance(order_response.data, dict) else order_response.data
    order_ids = [str(o["id"]) for o in order_data]
    assert str(order_a.id) in order_ids
    assert str(order_b.id) not in order_ids
    
    # C. Verify Invoices listing
    invoice_url = reverse("invoice-list")
    invoice_response = api_client.get(invoice_url)
    assert invoice_response.status_code == status.HTTP_200_OK
    invoice_data = invoice_response.data.get("results") if isinstance(invoice_response.data, dict) else invoice_response.data
    invoice_ids = [str(i["id"]) for i in invoice_data]
    assert str(inv_a.id) in invoice_ids
    assert str(inv_b.id) not in invoice_ids
