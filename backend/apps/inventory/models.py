import uuid
from django.db import models
from django.conf import settings
from apps.core.models import BaseModel, Branch

class Ingredient(BaseModel):
    CATEGORY_CHOICES = (
        ('vegetables', 'Vegetables'),
        ('meat', 'Meat'),
        ('dairy', 'Dairy'),
        ('seafood', 'Seafood'),
        ('dry_goods', 'Dry Goods'),
        ('beverages', 'Beverages'),
        ('spices', 'Spices'),
        ('others', 'Others'),
    )
    ABC_CHOICES = (
        ('A', 'A - High Value'),
        ('B', 'B - Medium Value'),
        ('C', 'C - Low Value'),
    )

    name = models.CharField(max_length=150, unique=True)
    category = models.CharField(max_length=50, choices=CATEGORY_CHOICES)
    unit = models.CharField(max_length=20)  # Standard base unit (kg, g, L, ml, pcs)
    min_stock = models.DecimalField(max_digits=10, decimal_places=2)
    max_stock = models.DecimalField(max_digits=10, decimal_places=2)
    abc_class = models.CharField(max_length=1, choices=ABC_CHOICES, default='C')

    def __str__(self):
        return self.name


class MenuItem(BaseModel):
    name = models.CharField(max_length=150, unique=True)
    price = models.DecimalField(max_digits=10, decimal_places=2)
    is_active = models.BooleanField(default=True)
    description = models.TextField(blank=True, null=True)
    category = models.CharField(max_length=100, default='Main Course')
    image_url = models.URLField(blank=True, null=True)
    prep_time = models.IntegerField(default=15)  # in minutes
    calories = models.IntegerField(default=350)
    veg_nonveg = models.CharField(max_length=20, default='non-veg')
    is_bestseller = models.BooleanField(default=False)
    is_chef_special = models.BooleanField(default=False)
    is_featured = models.BooleanField(default=False)
    spice_level = models.CharField(max_length=20, default='medium')
    discount = models.DecimalField(max_digits=5, decimal_places=2, default=0.00)  # percentage
    gst = models.DecimalField(max_digits=5, decimal_places=2, default=5.00)  # percentage
    sku = models.CharField(max_length=50, blank=True, null=True, unique=True)
    barcode = models.CharField(max_length=100, blank=True, null=True, unique=True)
    kitchen_station = models.CharField(max_length=100, default='Main Kitchen')
    is_available = models.BooleanField(default=True)

    def __str__(self):
        return self.name


class Recipe(BaseModel):
    menu_item = models.ForeignKey(MenuItem, on_delete=models.CASCADE, related_name='recipes')
    name = models.CharField(max_length=100, default='Standard Recipe')
    description = models.TextField(blank=True)

    def __str__(self):
        return f"Recipe for {self.menu_item.name}"


class RecipeIngredient(BaseModel):
    recipe = models.ForeignKey(Recipe, on_delete=models.CASCADE, related_name='ingredients')
    ingredient = models.ForeignKey(Ingredient, on_delete=models.CASCADE)
    quantity = models.DecimalField(max_digits=10, decimal_places=2)  # In base units

    def __str__(self):
        return f"{self.quantity} {self.ingredient.unit} of {self.ingredient.name} in {self.recipe}"


class Vendor(BaseModel):
    name = models.CharField(max_length=255)
    contact_name = models.CharField(max_length=150, blank=True)
    phone = models.CharField(max_length=20)
    email = models.EmailField()
    address = models.TextField()
    performance_score = models.DecimalField(max_digits=5, decimal_places=2, default=100.00)

    def __str__(self):
        return self.name


class InventoryBatch(BaseModel):
    STATUS_CHOICES = (
        ('active', 'Active'),
        ('depleted', 'Depleted'),
        ('expired', 'Expired'),
        ('recalled', 'Recalled'),
    )

    branch = models.ForeignKey(Branch, on_delete=models.CASCADE, related_name='inventory_batches')
    ingredient = models.ForeignKey(Ingredient, on_delete=models.CASCADE, related_name='batches')
    quantity = models.DecimalField(max_digits=10, decimal_places=2)  # Remaining base unit quantity
    batch_number = models.CharField(max_length=50)
    purchase_price = models.DecimalField(max_digits=10, decimal_places=2)  # Price paid per base unit
    expiry_date = models.DateField(null=True, blank=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='active')

    class Meta:
        ordering = ['expiry_date', 'created_at']

    def __str__(self):
        return f"{self.ingredient.name} ({self.batch_number}) - Qty: {self.quantity}"


class StockMovement(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    branch = models.ForeignKey(Branch, on_delete=models.CASCADE, related_name='stock_movements')
    ingredient = models.ForeignKey(Ingredient, on_delete=models.CASCADE, related_name='movements')
    batch = models.ForeignKey(InventoryBatch, on_delete=models.SET_NULL, null=True, blank=True)
    quantity = models.DecimalField(max_digits=10, decimal_places=2)  # Positive or negative
    movement_type = models.CharField(max_length=30)  # e.g., purchase, consumption_manual, consumption_sales, wastage, adjustment, rollback
    description = models.TextField()
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.ingredient.name} movement: {self.quantity} ({self.movement_type})"


class Purchase(BaseModel):
    STATUS_CHOICES = (
        ('draft', 'Draft'),
        ('ordered', 'Ordered'),
        ('delivered', 'Delivered'),
        ('cancelled', 'Cancelled'),
    )

    branch = models.ForeignKey(Branch, on_delete=models.CASCADE, related_name='purchases')
    vendor = models.ForeignKey(Vendor, on_delete=models.CASCADE, related_name='purchases')
    invoice_no = models.CharField(max_length=50, unique=True)
    purchase_date = models.DateField()
    total_amount = models.DecimalField(max_digits=12, decimal_places=2, default=0.00)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='draft')

    def __str__(self):
        return f"Invoice {self.invoice_no} ({self.vendor.name})"


class PurchaseItem(BaseModel):
    purchase = models.ForeignKey(Purchase, on_delete=models.CASCADE, related_name='items')
    ingredient = models.ForeignKey(Ingredient, on_delete=models.CASCADE)
    quantity = models.DecimalField(max_digits=10, decimal_places=2)  # Purchase unit quantity
    purchase_unit = models.CharField(max_length=20)  # e.g., crate, box, sack, base unit
    conversion_factor = models.DecimalField(max_digits=10, decimal_places=2, default=1.00)  # Quantity = Purchase Qty * Conversion Factor
    unit_price = models.DecimalField(max_digits=10, decimal_places=2)  # Price per purchase unit
    batch_number = models.CharField(max_length=50)
    expiry_date = models.DateField(null=True, blank=True)

    def __str__(self):
        return f"{self.quantity} {self.purchase_unit} of {self.ingredient.name}"


class Wastage(BaseModel):
    REASON_CHOICES = (
        ('spoilage', 'Spoilage'),
        ('expiry', 'Expiry'),
        ('damaged', 'Damaged'),
        ('customer_return', 'Customer Return'),
        ('kitchen_waste', 'Kitchen Waste'),
    )

    branch = models.ForeignKey(Branch, on_delete=models.CASCADE, related_name='wastages')
    batch = models.ForeignKey(InventoryBatch, on_delete=models.SET_NULL, null=True, blank=True)
    ingredient = models.ForeignKey(Ingredient, on_delete=models.CASCADE)
    quantity = models.DecimalField(max_digits=10, decimal_places=2)  # In base units
    reason = models.CharField(max_length=50, choices=REASON_CHOICES)
    description = models.TextField(blank=True)
    cost_impact = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)
    recorded_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    recorded_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Wastage: {self.quantity} {self.ingredient.unit} of {self.ingredient.name} due to {self.reason}"


class Consumption(BaseModel):
    SOURCE_CHOICES = (
        ('manual', 'Manual Log'),
        ('pos_sales', 'POS Sales Deduction'),
    )

    branch = models.ForeignKey(Branch, on_delete=models.CASCADE, related_name='consumptions')
    ingredient = models.ForeignKey(Ingredient, on_delete=models.CASCADE)
    quantity = models.DecimalField(max_digits=10, decimal_places=2)  # In base units
    logged_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True)
    logged_at = models.DateTimeField(auto_now_add=True)
    source = models.CharField(max_length=20, choices=SOURCE_CHOICES, default='manual')
    recipe = models.ForeignKey(Recipe, on_delete=models.SET_NULL, null=True, blank=True)

    def __str__(self):
        return f"Consumption: {self.quantity} {self.ingredient.unit} of {self.ingredient.name} via {self.source}"


class ReorderAlert(BaseModel):
    SEVERITY_CHOICES = (
        ('warning', 'Warning (Dashboard Only)'),
        ('low_stock', 'Low Stock (Daily Summary)'),
        ('critical_stock', 'Critical Stock (Immediate SMS/Email)'),
    )
    STATUS_CHOICES = (
        ('active', 'Active'),
        ('resolved', 'Resolved'),
        ('ignored', 'Ignored'),
    )

    branch = models.ForeignKey(Branch, on_delete=models.CASCADE, related_name='reorder_alerts')
    ingredient = models.ForeignKey(Ingredient, on_delete=models.CASCADE)
    alert_type = models.CharField(max_length=20, choices=SEVERITY_CHOICES)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='active')
    message = models.TextField()
    resolved_at = models.DateTimeField(null=True, blank=True)

    def __str__(self):
        return f"Alert: {self.ingredient.name} - {self.alert_type} ({self.status})"


class Order(BaseModel):
    """
    Database model representing kitchen/delivery/dine-in orders (SaaS cloud kitchen support).
    """
    SOURCE_CHOICES = (
        ('direct', 'Direct Table/POS'),
        ('swiggy', 'Swiggy'),
        ('zomato', 'Zomato'),
        ('ubereats', 'Uber Eats'),
        ('dunzo', 'Dunzo'),
    )
    STATUS_CHOICES = (
        ('received', 'Received'),
        ('preparing', 'Preparing'),
        ('ready', 'Ready'),
        ('picked_up', 'Picked Up'),
        ('delivered', 'Delivered'),
        ('completed', 'Completed'),
        ('cancelled', 'Cancelled'),
    )
    TYPE_CHOICES = (
        ('dine_in', 'Dine-In'),
        ('takeaway', 'Takeaway'),
        ('delivery', 'Delivery'),
    )

    branch = models.ForeignKey(Branch, on_delete=models.CASCADE, related_name='orders')
    source = models.CharField(max_length=20, choices=SOURCE_CHOICES, default='direct')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='received')
    order_type = models.CharField(max_length=20, choices=TYPE_CHOICES, default='dine_in')
    reservation = models.ForeignKey('reservation.Reservation', on_delete=models.SET_NULL, null=True, blank=True, related_name='orders')
    table = models.ForeignKey('reservation.Table', on_delete=models.SET_NULL, null=True, blank=True, related_name='orders')
    customer_name = models.CharField(max_length=150, blank=True, null=True)
    customer_phone = models.CharField(max_length=20, blank=True, null=True)
    delivery_address = models.TextField(blank=True, null=True)
    total_amount = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)
    waiter = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True, related_name='waiter_orders')
    waiter_name = models.CharField(max_length=150, blank=True, null=True)

    def __str__(self):
        return f"Order {self.id} - Type: {self.order_type} - Status: {self.status}"


class OrderItem(BaseModel):
    """
    Junction model mapping specific menu items to an order.
    """
    order = models.ForeignKey(Order, on_delete=models.CASCADE, related_name='items')
    menu_item = models.ForeignKey(MenuItem, on_delete=models.CASCADE)
    quantity = models.PositiveIntegerField(default=1)
    unit_price = models.DecimalField(max_digits=10, decimal_places=2)
    kitchen_notes = models.TextField(blank=True, null=True)
    waiter_notes = models.TextField(blank=True, null=True)
    special_instructions = models.TextField(blank=True, null=True)
    item_discount = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)
    
    COURSE_CHOICES = (
        ('starter', 'Starter'),
        ('main_course', 'Main Course'),
        ('dessert', 'Dessert'),
        ('beverage', 'Beverage'),
    )
    course = models.CharField(max_length=20, choices=COURSE_CHOICES, default='main_course')
    modifiers = models.JSONField(blank=True, null=True, default=list)

    def __str__(self):
        return f"{self.quantity}x {self.menu_item.name} for Order {self.order.id}"


class DailyStockRecord(BaseModel):
    """
    Model representing opening/closing sheets for daily inventory audit.
    """
    branch = models.ForeignKey(Branch, on_delete=models.CASCADE, related_name='daily_stock_records')
    ingredient = models.ForeignKey(Ingredient, on_delete=models.CASCADE, related_name='daily_records')
    opening_stock = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)
    purchased_stock = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)
    closing_stock = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)
    consumption = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)
    opening_date = models.DateField()
    closing_date = models.DateField(null=True, blank=True)
    manager = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True)

    class Meta:
        ordering = ['-opening_date', 'ingredient__name']
        unique_together = ('branch', 'ingredient', 'opening_date')

    def __str__(self):
        return f"{self.ingredient.name} on {self.opening_date} ({self.branch.name})"


from django.db.models.signals import post_save
from django.dispatch import receiver

@receiver(post_save, sender=StockMovement)
def check_stock_movement_reorder_trigger(sender, instance, created, **kwargs):
    if created and instance.quantity < 0:
        try:
            branch = instance.branch
            ingredient = instance.ingredient
            total_stock = InventoryBatch.objects.filter(
                branch=branch, ingredient=ingredient, status='active'
            ).aggregate(models.Sum('quantity'))['quantity__sum'] or 0

            if total_stock <= ingredient.min_stock:
                alert, alert_created = ReorderAlert.objects.get_or_create(
                    branch=branch,
                    ingredient=ingredient,
                    status='active',
                    defaults={
                        'current_stock': total_stock,
                        'suggested_reorder_qty': max(0, ingredient.max_stock - total_stock),
                        'urgency_level': 'high' if total_stock == 0 else 'medium'
                    }
                )
                if not alert_created:
                    alert.current_stock = total_stock
                    alert.save()

                if branch and branch.branch_manager:
                    from apps.notifications.models import Notification
                    Notification.objects.create(
                        user=branch.branch_manager,
                        title=f"Low Stock Warning: {ingredient.name}",
                        message=f"Stock level for {ingredient.name} at {branch.name} is now {total_stock} {ingredient.unit} (Min: {ingredient.min_stock}).",
                        notification_type='system'
                    )
        except Exception:
            pass

