import uuid
from django.db import models
from django.conf import settings

class BaseModel(models.Model):
    """
    Abstract base model providing UUID primary keys and timestamps.
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        abstract = True


class Restaurant(BaseModel):
    """
    Represents a restaurant entity (supports future multi-tenant layouts).
    """
    name = models.CharField(max_length=255)
    code = models.SlugField(max_length=50, unique=True)
    contact_email = models.EmailField()
    contact_phone = models.CharField(max_length=20)
    address = models.TextField()
    is_active = models.BooleanField(default=True)

    def __str__(self):
        return self.name


class Branch(BaseModel):
    """
    Represents a specific physical branch of a restaurant.
    """
    restaurant = models.ForeignKey(Restaurant, on_delete=models.CASCADE, related_name='branches')
    name = models.CharField(max_length=255)
    branch_code = models.SlugField(max_length=50, unique=True)
    latitude = models.DecimalField(max_digits=9, decimal_places=6, null=True, blank=True)
    longitude = models.DecimalField(max_digits=9, decimal_places=6, null=True, blank=True)
    geofence_radius = models.IntegerField(default=100)  # Default 100 meters
    address = models.TextField()
    is_active = models.BooleanField(default=True)
    is_default = models.BooleanField(default=False)
    is_cloud_kitchen = models.BooleanField(default=False)
    branch_manager = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True, related_name='managed_branches')
    gst_number = models.CharField(max_length=50, blank=True, null=True)
    status = models.CharField(
        max_length=20,
        default='open',
        choices=(
            ('open', 'Open'),
            ('closed', 'Closed'),
            ('busy', 'Busy'),
            ('maintenance', 'Maintenance')
        )
    )
    tax_percentage = models.DecimalField(max_digits=5, decimal_places=2, default=5.00)
    contact_number = models.CharField(max_length=20, blank=True, null=True)
    business_hours = models.CharField(max_length=255, blank=True, null=True, default="09:00 AM - 11:00 PM")
    kitchen_type = models.CharField(max_length=100, default="Dine-in & Takeaway")
    delivery_radius = models.IntegerField(default=5)  # in km
    service_charge_percentage = models.DecimalField(max_digits=5, decimal_places=2, default=10.00)
    logo_url = models.URLField(blank=True, null=True)
    receipt_footer = models.TextField(blank=True, null=True, default="Thank you for dining with us! Please scan the QR code to review your experience.")
    invoice_prefix = models.CharField(max_length=20, default="INV")
    invoice_sequence = models.IntegerField(default=1000)
    currency = models.CharField(max_length=10, default="INR")
    tax_rules = models.CharField(max_length=255, default="inclusive")

    def save(self, *args, **kwargs):
        if self.is_default:
            Branch.objects.filter(restaurant=self.restaurant).exclude(id=self.id).update(is_default=False)
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.restaurant.name} - {self.name}"


class AuditLog(models.Model):
    """
    Entity tracking system changes and actions.
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True, related_name='audit_logs')
    action = models.CharField(max_length=255)
    model_name = models.CharField(max_length=100, null=True, blank=True)
    record_id = models.CharField(max_length=255, null=True, blank=True)
    old_value = models.JSONField(null=True, blank=True)
    new_value = models.JSONField(null=True, blank=True)
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    timestamp = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-timestamp']

    def __str__(self):
        user_str = self.user.email if self.user else "System"
        return f"{user_str} - {self.action} at {self.timestamp}"


class Notification(BaseModel):
    """
    System and transactional notification tracking model.
    """
    NOTIFICATION_TYPES = (
        ('email', 'Email'),
        ('sms', 'SMS'),
        ('whatsapp', 'WhatsApp'),
        ('system', 'System Dashboard'),
    )
    
    STATUS_CHOICES = (
        ('pending', 'Pending'),
        ('sent', 'Sent'),
        ('failed', 'Failed'),
    )

    recipient_email = models.EmailField(null=True, blank=True)
    recipient_phone = models.CharField(max_length=20, null=True, blank=True)
    notification_type = models.CharField(max_length=20, choices=NOTIFICATION_TYPES)
    title = models.CharField(max_length=255)
    message = models.TextField()
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    sent_at = models.DateTimeField(null=True, blank=True)
    error_message = models.TextField(null=True, blank=True)
    retry_count = models.IntegerField(default=0)

    def __str__(self):
        return f"{self.notification_type} - {self.title} to {self.recipient_email or self.recipient_phone} ({self.status})"


class Invoice(BaseModel):
    """
    Database model representing client billing receipts and payments.
    """
    PAYMENT_METHOD_CHOICES = (
        ('cash', 'Cash'),
        ('card', 'Card'),
        ('upi', 'UPI'),
        ('wallet', 'Wallet'),
        ('gift_card', 'Gift Card'),
        ('mixed', 'Mixed Split'),
    )
    STATUS_CHOICES = (
        ('paid', 'Paid'),
        ('pending', 'Pending'),
        ('partially_paid', 'Partially Paid'),
        ('refunded', 'Refunded'),
    )

    branch = models.ForeignKey(Branch, on_delete=models.CASCADE, related_name='invoices')
    reservation = models.ForeignKey('reservation.Reservation', on_delete=models.SET_NULL, null=True, blank=True, related_name='invoices')
    order = models.ForeignKey('inventory.Order', on_delete=models.SET_NULL, null=True, blank=True, related_name='invoices')
    subtotal = models.DecimalField(max_digits=10, decimal_places=2)
    gst = models.DecimalField(max_digits=5, decimal_places=2, default=5.00)  # GST percentage (5%)
    service_charge = models.DecimalField(max_digits=5, decimal_places=2, default=10.00)  # Service Charge percentage (10%)
    discount = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)  # Absolute discount amount
    total = models.DecimalField(max_digits=10, decimal_places=2)
    payment_method = models.CharField(max_length=20, choices=PAYMENT_METHOD_CHOICES, default='cash')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='paid')
    transaction_id = models.CharField(max_length=100, blank=True, null=True)
    waiter = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True, related_name='waiter_invoices')
    waiter_name = models.CharField(max_length=150, blank=True, null=True)
    cashier = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True, related_name='cashier_invoices')
    payment_details = models.JSONField(blank=True, null=True)
    pdf_file_path = models.CharField(max_length=255, blank=True, null=True)
    pdf_generated_at = models.DateTimeField(blank=True, null=True)

    def __str__(self):
        return f"Invoice {self.id} - Branch: {self.branch.name} - Total: ${self.total}"


from django.db.models.signals import post_save
from django.dispatch import receiver

@receiver(post_save, sender=Invoice)
def process_paid_invoice_billing_and_inventory(sender, instance, created, **kwargs):
    if instance.status == 'paid':
        # 1. Update Order Status and Deduct Ingredients
        if instance.order:
            order = instance.order
            if order.status != 'completed':
                order.status = 'completed'
                order.save()
                
                from apps.inventory.services import InventoryService
                InventoryService.deduct_ingredients_for_order(order)

            # 2. Award Loyalty Points
            if order.customer_phone:
                from apps.authentication.models import LoyaltyProfile, User
                from django.db.models import Q
                user = User.objects.filter(Q(phone=order.customer_phone) | Q(email=order.customer_phone) | Q(username=order.customer_phone)).first()
                if user:
                    loyalty, _ = LoyaltyProfile.objects.get_or_create(user=user)
                    points_to_add = int(instance.total // 10)
                    loyalty.points += points_to_add
                    if loyalty.points > 1000:
                        loyalty.tier = 'platinum'
                    elif loyalty.points > 500:
                        loyalty.tier = 'gold'
                    loyalty.save()

            # 3. Release Seated Table if associated reservation or order table is checked out
            if order.table:
                order.table.status = 'available'
                order.table.save()

            if order.reservation:
                res = order.reservation
                if res.status != 'completed':
                    res.status = 'completed'
                    res.save()
                    for rt in res.reservation_tables.all():
                        rt.table.status = 'available'
                        rt.table.save()

            # 4. Dispatch Thank You Customer Notification
            if order.customer_phone:
                try:
                    from apps.notifications.services import CommunicationDispatchService
                    msg = f"Thank you for dining at {instance.branch.name}! Invoice total ${instance.total} settled successfully."
                    CommunicationDispatchService.send_whatsapp(order.customer_phone, msg, branch_id=instance.branch.id)
                except Exception:
                    pass


class POSPayment(BaseModel):
    """
    Model representing detailed transaction records for each POS checkout payment.
    """
    invoice = models.ForeignKey(Invoice, on_delete=models.CASCADE, related_name='payments')
    payment_method = models.CharField(max_length=20, default='cash')
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    payment_id = models.CharField(max_length=100, blank=True, null=True)
    transaction_id = models.CharField(max_length=100, blank=True, null=True)
    reference_number = models.CharField(max_length=100, blank=True, null=True)  # RRN
    gateway = models.CharField(max_length=50, blank=True, null=True)
    cashier = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True, related_name='cashier_pos_payments')
    branch = models.ForeignKey(Branch, on_delete=models.SET_NULL, null=True, blank=True)
    device = models.CharField(max_length=100, blank=True, null=True)
    timestamp = models.DateTimeField(auto_now_add=True)
    status = models.CharField(max_length=20, default='success')
    approval_code = models.CharField(max_length=50, blank=True, null=True)
    card_type = models.CharField(max_length=50, blank=True, null=True)
    card_last4 = models.CharField(max_length=4, blank=True, null=True)
    terminal_id = models.CharField(max_length=50, blank=True, null=True)
    upi_id = models.CharField(max_length=100, blank=True, null=True)
    gift_card_number = models.CharField(max_length=50, blank=True, null=True)
    wallet_name = models.CharField(max_length=50, blank=True, null=True)

    def __str__(self):
        return f"Payment {self.id} for Invoice {self.invoice.id} - {self.payment_method} - {self.amount}"


class CashDrawerSession(BaseModel):
    """
    Tracks POS opening, cash sales, and closing drawer count balances.
    """
    branch = models.ForeignKey(Branch, on_delete=models.CASCADE, related_name='cash_drawer_sessions')
    cashier = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    opening_time = models.DateTimeField(auto_now_add=True)
    closing_time = models.DateTimeField(null=True, blank=True)
    opening_balance = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)
    closing_balance = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)
    expected_balance = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)
    difference = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)
    status = models.CharField(max_length=20, choices=(('open', 'Open'), ('closed', 'Closed')), default='open')
    notes = models.TextField(blank=True, null=True)

    def __str__(self):
        return f"Drawer {self.id} ({self.status}) - Opened: {self.opening_balance} - Expected: {self.expected_balance}"


class POSAuditLog(BaseModel):
    """
    Tracks and audits security-sensitive POS cashier actions.
    """
    branch = models.ForeignKey(Branch, on_delete=models.SET_NULL, null=True, blank=True)
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True)
    action = models.CharField(max_length=255)
    details = models.TextField(blank=True, null=True)
    device = models.CharField(max_length=255, blank=True, null=True)
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    timestamp = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"POSAudit {self.action} by {self.user} at {self.timestamp}"
