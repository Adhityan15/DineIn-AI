import pytest
from decimal import Decimal
from django.urls import reverse
from rest_framework import status
from apps.core.models import Branch
from apps.reservation.models import Table
from apps.inventory.models import MenuItem, Order
from django.contrib.auth import get_user_model

User = get_user_model()

@pytest.mark.django_db
def test_public_qr_menu_ordering_workflow(api_client):
    # Setup Branch
    from apps.core.models import Restaurant
    restaurant = Restaurant.objects.create(name="QR Rest")
    branch = Branch.objects.create(restaurant=restaurant, name="QR Branch", branch_code="qr-branch")
    
    # Setup Table
    table = Table.objects.create(branch=branch, number="101", capacity=4)
    
    # Setup Menu Items
    item_a = MenuItem.objects.create(
        name="Burger", description="Juicy burger", price=Decimal("10.00"), prep_time=12, category="mains"
    )
    item_b = MenuItem.objects.create(
        name="Soda", description="Cold drink", price=Decimal("2.50"), prep_time=3, category="drinks"
    )

    # 1. Verify Unauthenticated public menu-items list access
    menu_url = reverse("menuitem-list")
    res_menu = api_client.get(menu_url)
    assert res_menu.status_code == status.HTTP_200_OK
    menu_data = res_menu.data.get("results") if isinstance(res_menu.data, dict) else res_menu.data
    menu_names = [m["name"] for m in menu_data]
    assert "Burger" in menu_names
    assert "Soda" in menu_names

    # 2. Verify Unauthenticated public order creation
    order_url = reverse("order-list")
    order_payload = {
        "branch": str(branch.id),
        "source": "direct",
        "order_type": "dine_in",
        "table": str(table.id),
        "customer_name": "QR Table Diner",
        "customer_phone": "9999999999",
        "items": [
            {"menu_item": str(item_a.id), "quantity": 2, "unit_price": 10.00},
            {"menu_item": str(item_b.id), "quantity": 1, "unit_price": 2.50}
        ]
      }
    
    res_order = api_client.post(order_url, order_payload, format="json")
    assert res_order.status_code == status.HTTP_201_CREATED
    assert res_order.data["status"] == "received"
    assert res_order.data["order_type"] == "dine_in"
    assert res_order.data["estimated_prep_time"] == 12  # max(12, 3)

    # 3. Verify public retrieval of placed order status by ID
    order_detail_url = reverse("order-detail", kwargs={"pk": res_order.data["id"]})
    res_detail = api_client.get(order_detail_url)
    assert res_detail.status_code == status.HTTP_200_OK
    assert res_detail.data["status"] == "received"
    assert res_detail.data["estimated_prep_time"] == 12
