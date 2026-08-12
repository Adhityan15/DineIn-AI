import pytest
from decimal import Decimal
from django.db import models
from django.utils import timezone
from django.core.exceptions import ValidationError
from apps.core.models import Branch, Restaurant
from apps.inventory.models import (
    Ingredient, MenuItem, Recipe, RecipeIngredient, Vendor,
    InventoryBatch, StockMovement, Purchase, PurchaseItem, Wastage, Consumption, ReorderAlert
)
from apps.inventory.services import (
    InventoryService, PurchaseService, WastageService, RecipeService
)

@pytest.fixture
def db_setup(db):
    restaurant, _ = Restaurant.objects.get_or_create(
        code="test-dine",
        defaults={"name": "Test Dine", "contact_phone": "123", "contact_email": "test@dine.com"}
    )
    branch, _ = Branch.objects.get_or_create(
        branch_code="bangalore-main",
        defaults={"restaurant": restaurant, "name": "Test Branch East"}
    )
    ingredient, _ = Ingredient.objects.get_or_create(
        name="Basmati Rice",
        defaults={"category": "dry_goods", "unit": "kg", "min_stock": Decimal('20.00'), "max_stock": Decimal('100.00'), "abc_class": 'A'}
    )
    vendor, _ = Vendor.objects.get_or_create(
        name="Global Rice Suppliers",
        defaults={"phone": "555-1234", "email": "sales@rice.com", "address": "Rice Street 1"}
    )
    return {
        'branch': branch,
        'ingredient': ingredient,
        'vendor': vendor
    }


def test_add_stock_batch(db_setup):
    branch = db_setup['branch']
    ing = db_setup['ingredient']

    batch = InventoryService.add_stock(
        branch=branch,
        ingredient=ing,
        quantity=Decimal('50.00'),
        batch_number="BATCH-001",
        purchase_price=Decimal('2.50'),
        expiry_date=timezone.now().date() + timezone.timedelta(days=30)
    )

    assert batch.quantity == Decimal('50.00')
    assert batch.status == 'active'
    
    # Verify stock movement ledger record
    movement = StockMovement.objects.get(batch=batch)
    assert movement.quantity == Decimal('50.00')
    assert movement.movement_type == 'purchase'


def test_fefo_stock_rotation(db_setup):
    branch = db_setup['branch']
    ing = db_setup['ingredient']

    # Batch A: Expires in 5 days
    batch_a = InventoryService.add_stock(
        branch=branch,
        ingredient=ing,
        quantity=Decimal('30.00'),
        batch_number="BATCH-A",
        purchase_price=Decimal('2.00'),
        expiry_date=timezone.now().date() + timezone.timedelta(days=5)
    )

    # Batch B: Expires in 15 days
    batch_b = InventoryService.add_stock(
        branch=branch,
        ingredient=ing,
        quantity=Decimal('40.00'),
        batch_number="BATCH-B",
        purchase_price=Decimal('2.20'),
        expiry_date=timezone.now().date() + timezone.timedelta(days=15)
    )

    # Deduct 40kg. Should deplete Batch A (30kg) and take 10kg from Batch B.
    InventoryService.deduct_stock(
        branch=branch,
        ingredient=ing,
        quantity=Decimal('40.00'),
        movement_type='consumption_manual',
        description="Daily Pilaf preparation"
    )

    batch_a.refresh_from_db()
    batch_b.refresh_from_db()

    assert batch_a.quantity == Decimal('0.00')
    assert batch_a.status == 'depleted'
    assert batch_b.quantity == Decimal('30.00')
    assert batch_b.status == 'active'


def test_insufficient_stock_raises_validation_error(db_setup):
    branch = db_setup['branch']
    ing = db_setup['ingredient']

    InventoryService.add_stock(
        branch=branch,
        ingredient=ing,
        quantity=Decimal('10.00'),
        batch_number="BATCH-C",
        purchase_price=Decimal('1.50')
    )

    with pytest.raises(ValidationError) as excinfo:
        InventoryService.deduct_stock(
            branch=branch,
            ingredient=ing,
            quantity=Decimal('15.00'),
            movement_type='consumption_manual',
            description="Exceeding allocation request"
        )
    assert "Insufficient stock" in str(excinfo.value)


def test_purchase_unit_conversions(db_setup):
    branch = db_setup['branch']
    vendor = db_setup['vendor']
    ing = db_setup['ingredient'] # Base unit is kg

    # Purchase 5 sacks of Rice. Each sack contains 25 kg. Unit price is 50.00 per sack.
    items_data = [{
        'ingredient': ing,
        'quantity': Decimal('5.00'),
        'purchase_unit': 'sack',
        'conversion_factor': Decimal('25.00'),
        'unit_price': Decimal('50.00'),
        'batch_number': 'SACK-RICE-10',
        'expiry_date': timezone.now().date() + timezone.timedelta(days=180)
    }]

    purchase = PurchaseService.receive_purchase(branch, vendor, "INV-1002", timezone.now().date(), items_data)

    assert purchase.total_amount == Decimal('250.00')
    assert purchase.status == 'delivered'

    # Check that base inventory has been incremented by 125 kg (5 * 25)
    batch = InventoryBatch.objects.get(batch_number='SACK-RICE-10')
    assert batch.quantity == Decimal('125.00')
    # Price per base kg should be 2.00 (50 / 25)
    assert batch.purchase_price == Decimal('2.00')


def test_recipe_sales_deductions(db_setup):
    branch = db_setup['branch']
    ing = db_setup['ingredient']

    # Initial stock: 100 kg
    InventoryService.add_stock(branch, ing, Decimal('100.00'), "BATCH-INITIAL", Decimal('2.00'))

    # Configure MenuItem & Recipe
    menu_item = MenuItem.objects.create(name="Veg Biryani Portion", price=Decimal('12.50'))
    recipe = Recipe.objects.create(menu_item=menu_item, name="Veg Biryani Recipe")
    RecipeIngredient.objects.create(recipe=recipe, ingredient=ing, quantity=Decimal('0.40')) # requires 400g = 0.40 kg

    # Sell 5 portions of Veg Biryani
    RecipeService.deduct_recipe_consumption(branch, recipe, multiplier=5)

    # Total deduction should be 2.00 kg (0.40 * 5)
    total_stock = InventoryBatch.objects.filter(branch=branch, ingredient=ing, status='active').aggregate(models_sum=models.Sum('quantity'))['models_sum']
    if not total_stock:
        # Resolve import Sum
        from django.db.models import Sum
        total_stock = InventoryBatch.objects.filter(branch=branch, ingredient=ing, status='active').aggregate(sum_qty=Sum('quantity'))['sum_qty']

    assert total_stock == Decimal('98.00')


def test_three_level_reorder_alerts(db_setup):
    branch = db_setup['branch']
    ing = db_setup['ingredient'] # min_stock is 20kg

    # 1. Stock = 30kg (> min_stock). No alerts.
    InventoryService.add_stock(branch, ing, Decimal('30.00'), "BATCH-REORDER-1", Decimal('2.00'))
    InventoryService.evaluate_reorder_alerts(branch)
    assert not ReorderAlert.objects.filter(branch=branch, ingredient=ing, status='active').exists()

    # 2. Deduct 11kg. Stock becomes 19kg (below min_stock but > 60% limit = 12kg). Alert -> warning
    InventoryService.deduct_stock(branch, ing, Decimal('11.00'), 'consumption_manual', 'testing warning alert')
    InventoryService.evaluate_reorder_alerts(branch)
    alert = ReorderAlert.objects.get(branch=branch, ingredient=ing, status='active')
    assert alert.alert_type == 'warning'

    # 3. Deduct another 8kg. Stock becomes 11kg (below 60% limit but > 25% critical = 5kg). Alert -> low_stock
    InventoryService.deduct_stock(branch, ing, Decimal('8.00'), 'consumption_manual', 'testing low stock alert')
    InventoryService.evaluate_reorder_alerts(branch)
    alert.refresh_from_db()
    assert alert.alert_type == 'low_stock'

    # 4. Deduct another 8kg. Stock becomes 3kg (< 25% threshold = 5kg). Alert -> critical_stock
    InventoryService.deduct_stock(branch, ing, Decimal('8.00'), 'consumption_manual', 'testing critical stock alert')
    InventoryService.evaluate_reorder_alerts(branch)
    alert.refresh_from_db()
    assert alert.alert_type == 'critical_stock'

