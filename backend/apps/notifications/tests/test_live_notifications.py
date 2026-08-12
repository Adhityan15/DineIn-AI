import pytest
from decimal import Decimal
from django.urls import reverse
from rest_framework import status
from apps.core.models import Branch
from apps.reservation.models import Table, Reservation
from apps.inventory.models import MenuItem, Order
from apps.notifications.models import InAppNotification
from django.contrib.auth import get_user_model
from apps.authentication.models import Role

User = get_user_model()

@pytest.mark.django_db
def test_live_in_app_notifications_dispatch(api_client):
    # Setup customer
    customer_role, _ = Role.objects.get_or_create(code="customer", name="Customer")
    customer = User.objects.create_user(
        username="cust_notif", email="cust_notif@test.com", password="Password123!", phone="9888888888", role=customer_role
    )
    
    # Setup Branch
    from apps.core.models import Restaurant
    restaurant = Restaurant.objects.create(name="Notification Rest")
    branch = Branch.objects.create(restaurant=restaurant, name="Notification Branch", branch_code="notif-branch")
    
    # Create Reservation -> triggers creation alert
    res = Reservation.objects.create(
        branch=branch,
        customer=customer,
        guest_name="Notif Customer",
        guest_phone="9888888888",
        guest_email="cust_notif@test.com",
        party_size=2,
        start_time="2026-07-12 18:00:00+00:00",
        end_time="2026-07-12 20:00:00+00:00",
        status="pending"
    )
    
    # Verify notification created
    notifs = InAppNotification.objects.filter(user=customer)
    assert notifs.count() == 1
    assert notifs.first().title == "Reservation Requested"

    # Update Reservation status to confirmed -> triggers confirmed alert
    res.status = "confirmed"
    res.save()
    
    assert InAppNotification.objects.filter(user=customer).count() == 2
    assert InAppNotification.objects.filter(user=customer, title="Reservation Approved").exists()

    # Create Order linked to reservation -> triggers order received alert
    order = Order.objects.create(
        branch=branch,
        reservation=res,
        customer_name="Notif Customer",
        customer_phone="9888888888",
        total_amount=Decimal("20.00"),
        status="received"
    )
    
    assert InAppNotification.objects.filter(user=customer, title="Order Received").exists()

    # Update Order status to preparing -> triggers preparing alert
    order.status = "preparing"
    order.save()
    
    assert InAppNotification.objects.filter(user=customer, title="Preparing Order").exists()
