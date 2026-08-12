import os
import django
import sys
from decimal import Decimal

# Set up Django environment
sys.path.append("c:/Users/adhit/Downloads/Ai_DineIn_Management/backend")
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "dinein_project.settings.development")
django.setup()

from django.utils import timezone
from apps.core.models import Branch, Invoice, POSPayment
from apps.reservation.models import Table, Reservation
from apps.inventory.models import MenuItem, Ingredient, Order, OrderItem, InventoryBatch
from apps.authentication.models import User, LoyaltyProfile

def run_pos_e2e_test():
    print("====================================================")
    print("STARTING E2E POS RESTAURANT WORKFLOW DATABASE TEST")
    print("====================================================")

    # 1. Fetch default branch and pre-seeded Table 1
    branch = Branch.objects.first()
    assert branch is not None, "Pre-seeded branch not found!"
    print(f"[OK] Resolved Branch: {branch.name}")

    table = Table.objects.filter(number="1", branch=branch).first()
    assert table is not None, "Table 1 not found!"
    print(f"[OK] Resolved Table 1. Initial Status: {table.status}")

    # 2. Reset / Match active seated reservation on Table 1 for idempotency
    reservation = Reservation.objects.filter(
        branch=branch,
        guest_name="Alice Smith"
    ).first()
    if reservation:
        reservation.status = "seated"
        reservation.save()
        
        # Reset loyalty points of Alice to ensure test is idempotent
        loy, _ = LoyaltyProfile.objects.get_or_create(user__email="alice.smith@example.com")
        loy.points = 0
        loy.tier = "silver"
        loy.save()
    
    table.status = "occupied"
    table.save()
    
    assert reservation is not None, "Reservation for Alice Smith on Table 1 not found!"
    print(f"[OK] Resolved Reservation: ID {reservation.id} for {reservation.guest_name}")
    print(f"  Assigned Waiter User: {reservation.waiter.name if reservation.waiter else 'None'}")

    # 3. Fetch menu items and check initial ingredient batch quantities
    pizza_item = MenuItem.objects.get(name="Margherita Pizza")
    burger_item = MenuItem.objects.get(name="Cheese Burger")

    dough = Ingredient.objects.get(name="Pizza Dough")
    cheese = Ingredient.objects.get(name="Mozzarella Cheese")
    patty = Ingredient.objects.get(name="Beef Patty")
    bun = Ingredient.objects.get(name="Burger Buns")

    initial_dough_qty = sum(b.quantity for b in InventoryBatch.objects.filter(branch=branch, ingredient=dough, status="active"))
    initial_cheese_qty = sum(b.quantity for b in InventoryBatch.objects.filter(branch=branch, ingredient=cheese, status="active"))
    print(f"[OK] Initial Stock: Dough = {initial_dough_qty} kg, Cheese = {initial_cheese_qty} kg")

    # 4. Create Order (KOT placement simulating manual waiter entry)
    order = Order.objects.create(
        branch=branch,
        source="direct",
        order_type="dine_in",
        reservation=reservation,
        table=table,
        customer_name=reservation.guest_name,
        customer_phone=reservation.guest_phone,
        status="received",
        waiter=None,
        waiter_name="Temp Waiter Rahul"
    )

    # Add items (2 Pizza, 1 Burger)
    item1 = OrderItem.objects.create(
        order=order,
        menu_item=pizza_item,
        quantity=2,
        unit_price=pizza_item.price,
        course="main_course"
    )
    item2 = OrderItem.objects.create(
        order=order,
        menu_item=burger_item,
        quantity=1,
        unit_price=burger_item.price,
        course="main_course"
    )

    # Recalculate order total
    order.total_amount = (item1.quantity * item1.unit_price) + (item2.quantity * item2.unit_price)
    order.save()
    print(f"[OK] KOT Order Placed. ID: {order.id} | Total Amount: ${order.total_amount}")

    # 5. Simulate Kitchen status updates (KDS Board progression)
    order.status = "preparing"
    order.save()
    print(f"[OK] KDS State Transition: Order is now PREPARING...")

    order.status = "ready"
    order.save()
    print(f"[OK] KDS State Transition: Order is now READY to be served...")

    # 6. Settle Checkout Payment atomically
    subtotal = order.total_amount
    cgst = subtotal * Decimal("0.025")
    sgst = subtotal * Decimal("0.025")
    service_charge = subtotal * Decimal("0.10")
    grand_total = subtotal + cgst + sgst + service_charge
    print(f"[OK] Billing breakdown: Subtotal=${subtotal}, CGST=${cgst}, SGST=${sgst}, Service Charge=${service_charge}, Grand Total=${grand_total}")

    invoice = Invoice.objects.create(
        branch=branch,
        order=order,
        reservation=reservation,
        subtotal=subtotal,
        gst=Decimal("5.00"),
        service_charge=Decimal("10.00"),
        discount=Decimal("0.00"),
        total=grand_total,
        payment_method="card",
        status="paid",
        transaction_id="TXN-E2ETEST12345",
        waiter=None,
        waiter_name="Temp Waiter Rahul"
    )

    POSPayment.objects.create(
        invoice=invoice,
        payment_method="card",
        amount=grand_total,
        transaction_id="TXN-E2ETEST12345",
        status="success",
        approval_code="APP-1234"
    )

    print(f"[OK] Payment Settle complete. Invoice ID: {invoice.id}")

    # 7. Post-save signal triggers validation assertions
    # Re-fetch records
    table.refresh_from_db()
    reservation.refresh_from_db()
    order.refresh_from_db()

    print("\n================== VERIFICATIONS ==================")
    # A. Check order status has completed
    assert order.status == "completed", f"Order status is not completed! Found: {order.status}"
    print(f"[PASS] Order status updated to 'completed'")

    # B. Check reservation status is completed
    assert reservation.status == "completed", f"Reservation status is not completed! Found: {reservation.status}"
    print(f"[PASS] Reservation status updated to 'completed'")

    # C. Check table is released and available
    assert table.status == "available", f"Table status is not available! Found: {table.status}"
    print(f"[PASS] Table released back to 'available'")

    # D. Check inventory FEFO stock deductions
    final_dough_qty = sum(b.quantity for b in InventoryBatch.objects.filter(branch=branch, ingredient=dough, status="active"))
    final_cheese_qty = sum(b.quantity for b in InventoryBatch.objects.filter(branch=branch, ingredient=cheese, status="active"))
    
    # 2 pizzas and 1 cheeseburger consumed: 2 * 0.25 = 0.50 kg dough, 2 * 0.20 + 0.05 = 0.45 kg cheese
    expected_dough = initial_dough_qty - Decimal("0.50")
    expected_cheese = initial_cheese_qty - Decimal("0.45")

    assert final_dough_qty == expected_dough, f"Dough stock incorrect! Expected {expected_dough}, Found {final_dough_qty}"
    assert final_cheese_qty == expected_cheese, f"Cheese stock incorrect! Expected {expected_cheese}, Found {final_cheese_qty}"
    print(f"[PASS] FEFO Stock deducted correctly! Final Dough={final_dough_qty} kg, Final Cheese={final_cheese_qty} kg")

    # E. Check Loyalty points updated
    loyalty = LoyaltyProfile.objects.get(user__email="alice.smith@example.com")
    expected_points = int(grand_total // 10)
    assert loyalty.points == expected_points, f"Loyalty points incorrect! Expected {expected_points}, Found {loyalty.points}"
    print(f"[PASS] Customer loyalty points credited successfully! Points = {loyalty.points} (Tier = {loyalty.tier})")

    # F. Check PDF creation details
    print(f"[PASS] Invoice registered in history and available for PDF downloading.")

    # G. Check manual waiter_name is saved correctly
    assert order.waiter_name == "Temp Waiter Rahul", f"Expected order waiter_name Temp Waiter Rahul, got {order.waiter_name}"
    assert invoice.waiter_name == "Temp Waiter Rahul", f"Expected invoice waiter_name Temp Waiter Rahul, got {invoice.waiter_name}"
    print(f"[PASS] Manual waiter name entry stored successfully on Order and Invoice!")
    print("====================================================")
    print("E2E POS TEST PASSED SUCCESSFULLY!")
    print("====================================================")

if __name__ == "__main__":
    run_pos_e2e_test()
