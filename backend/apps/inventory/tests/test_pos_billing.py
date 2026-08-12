import pytest
from decimal import Decimal
from django.urls import reverse
from rest_framework import status
from apps.core.models import Branch, Invoice
from apps.inventory.models import Ingredient, MenuItem, Recipe, RecipeIngredient, InventoryBatch, Order, OrderItem

@pytest.mark.django_db
def test_pos_billing_deducts_inventory_and_completes_order(api_client, admin_user):
    api_client.force_authenticate(user=admin_user)

    # 1. Setup Branch
    from apps.core.models import Restaurant
    restaurant = Restaurant.objects.create(name="Test Restaurant")
    branch = Branch.objects.create(restaurant=restaurant, name="POS Test Branch", branch_code="pos-test")
    admin_user.branch = branch
    admin_user.save()

    # 2. Setup Ingredients & Menu Item
    cheese = Ingredient.objects.create(name="Cheddar Cheese", unit="kg", min_stock=1.00, max_stock=10.00)
    burger = MenuItem.objects.create(name="Cheese Burger", price=Decimal("15.00"), is_active=True)

    # 3. Setup Recipe (Burger needs 0.2 kg Cheddar Cheese)
    recipe = Recipe.objects.create(menu_item=burger, description="Melt cheese on patty.")
    RecipeIngredient.objects.create(recipe=recipe, ingredient=cheese, quantity=Decimal("0.20"))

    # 4. Seed Inventory Batch (Add 1.0 kg cheese at $5.00 purchase price)
    batch = InventoryBatch.objects.create(
        branch=branch,
        ingredient=cheese,
        quantity=Decimal("1.00"),
        batch_number="BCH-99",
        purchase_price=Decimal("5.00"),
        status="active"
    )

    # 5. Create Order via POS payload
    order_data = {
        "branch": str(branch.id),
        "source": "direct",
        "order_type": "dine_in",
        "customer_name": "John Doe",
        "customer_phone": "9876543210",
        "items": [
            {
                "menu_item": str(burger.id),
                "quantity": 2,
                "unit_price": 15.00
            }
        ]
    }

    url = reverse("order-list")
    res = api_client.post(url, order_data, format="json")
    assert res.status_code == status.HTTP_201_CREATED
    order_id = res.data["id"]

    order = Order.objects.get(id=order_id)
    assert order.total_amount == Decimal("30.00")
    assert order.status == "received"

    # 6. Settle/Pay Order via pay action
    pay_url = reverse("order-pay", kwargs={"pk": order_id})
    pay_res = api_client.post(pay_url, {"payment_method": "upi", "discount": 2.00}, format="json")
    assert pay_res.status_code == status.HTTP_200_OK

    # 7. Verifications
    # A. Order must be completed
    order.refresh_from_db()
    assert order.status == "completed"

    # B. Ingredients must be deducted (2 Burgers * 0.2 kg = 0.4 kg deducted from 1.0 kg -> 0.6 kg remaining)
    batch.refresh_from_db()
    assert batch.quantity == Decimal("0.60")

    # C. Paid Invoice must exist
    invoice = Invoice.objects.get(order=order)
    assert invoice.status == "paid"
    assert invoice.payment_method == "upi"
    assert invoice.subtotal == Decimal("30.00")
    # subtotal (30) + gst (5% = 1.5) + service (10% = 3.0) - discount (2) = 32.50
    assert invoice.total == Decimal("32.50")


@pytest.mark.django_db
def test_pos_billing_comprehensive_settlement(api_client, admin_user):
    from apps.reservation.models import Table, Reservation, ReservationTable
    from django.utils import timezone
    api_client.force_authenticate(user=admin_user)
    
    # 1. Setup Branch
    from apps.core.models import Restaurant
    restaurant = Restaurant.objects.create(name="Test Restaurant 2")
    branch = Branch.objects.create(restaurant=restaurant, name="POS Test Branch 2", branch_code="pos-test-2")
    admin_user.branch = branch
    admin_user.save()
    
    # Create a table
    table = Table.objects.create(branch=branch, number="25", capacity=4, status="occupied")
    
    # Create active reservation
    res_time = timezone.now()
    reservation = Reservation.objects.create(
        branch=branch,
        guest_name="Jane Doe",
        guest_phone="9876543211",
        party_size=4,
        start_time=res_time,
        end_time=res_time + timezone.timedelta(hours=2),
        status="seated"
    )
    ReservationTable.objects.create(reservation=reservation, table=table)
    
    burger = MenuItem.objects.create(name="Veggie Burger", price=Decimal("10.00"), is_active=True)
    
    order_data = {
        "branch": str(branch.id),
        "source": "direct",
        "order_type": "dine_in",
        "reservation": str(reservation.id),
        "table": str(table.id),
        "customer_name": "Jane Doe",
        "customer_phone": "9876543211",
        "waiter": str(admin_user.id),
        "items": [
            {
                "menu_item": str(burger.id),
                "quantity": 3,
                "unit_price": 10.00
            }
        ]
    }
    
    url = reverse("order-list")
    res = api_client.post(url, order_data, format="json")
    assert res.status_code == status.HTTP_201_CREATED
    order_id = res.data["id"]
    
    # Settle
    pay_url = reverse("order-pay", kwargs={"pk": order_id})
    pay_payload = {
        "payment_method": "mixed",
        "discount": 5.00,
        "transaction_id": "TXN-MIXED-888",
        "cashier": str(admin_user.id),
        "waiter": str(admin_user.id),
        "payment_details": {"cash": 15.00, "card": 14.50}
    }
    pay_res = api_client.post(pay_url, pay_payload, format="json")
    assert pay_res.status_code == status.HTTP_200_OK
    
    # Validate Invoice & Reservation Table Release
    order = Order.objects.get(id=order_id)
    assert order.status == "completed"
    
    table.refresh_from_db()
    assert table.status == "available"
    
    reservation.refresh_from_db()
    assert reservation.status == "completed"
    
    invoice = Invoice.objects.get(order=order)
    assert invoice.status == "paid"
    assert invoice.payment_method == "mixed"
    assert invoice.transaction_id == "TXN-MIXED-888"
    assert invoice.cashier == admin_user
    assert invoice.waiter == admin_user
    assert invoice.payment_details == {"cash": 15.00, "card": 14.50}

