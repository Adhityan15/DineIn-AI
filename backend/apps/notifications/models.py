import uuid
import base64
from django.db import models
from django.conf import settings
from apps.core.models import BaseModel, Branch

def encrypt_value(value: str) -> str:
    if not value:
        return ""
    key = settings.SECRET_KEY
    xor_bytes = bytearray(value.encode('utf-8'))
    key_bytes = key.encode('utf-8')
    for i in range(len(xor_bytes)):
        xor_bytes[i] ^= key_bytes[i % len(key_bytes)]
    return base64.urlsafe_b64encode(xor_bytes).decode('utf-8')

def decrypt_value(value: str) -> str:
    if not value:
        return ""
    try:
        key = settings.SECRET_KEY
        xor_bytes = bytearray(base64.urlsafe_b64decode(value.encode('utf-8')))
        key_bytes = key.encode('utf-8')
        for i in range(len(xor_bytes)):
            xor_bytes[i] ^= key_bytes[i % len(key_bytes)]
        return xor_bytes.decode('utf-8')
    except Exception:
        return value

class NotificationChannelSettings(BaseModel):
    """
    Branch-specific or global credentials for communications providers (SMTP, SMS, WhatsApp, Push).
    """
    branch = models.OneToOneField(Branch, on_delete=models.CASCADE, related_name='communication_settings', null=True, blank=True)
    
    # SMTP Configuration
    smtp_host = models.CharField(max_length=255, default='localhost')
    smtp_port = models.IntegerField(default=1025)
    smtp_username = models.CharField(max_length=255, blank=True, null=True)
    smtp_password = models.CharField(max_length=255, blank=True, null=True)
    smtp_use_tls = models.BooleanField(default=False)
    smtp_use_ssl = models.BooleanField(default=False)
    smtp_sender_name = models.CharField(max_length=255, default='DineIn AI')
    smtp_reply_email = models.EmailField(default='no-reply@dinein.com')

    # SMS Configuration (Demo, Android Gateway, Disabled, and backward compatible choices)
    SMS_PROVIDERS = [
        ('demo', 'Demo'),
        ('android_gateway', 'Android SMS Gateway'),
        ('disabled', 'Disabled'),
        ('twilio', 'Twilio'),
        ('messagebird', 'MessageBird'),
        ('vonage', 'Vonage'),
        ('fast2sms', 'Fast2SMS'),
        ('msg91', 'MSG91')
    ]
    sms_provider = models.CharField(max_length=50, choices=SMS_PROVIDERS, default='demo')
    sms_api_key = models.CharField(max_length=255, blank=True, null=True)
    sms_api_secret = models.CharField(max_length=255, blank=True, null=True)
    sms_sender_id = models.CharField(max_length=50, blank=True, null=True)

    # Android SMS Gateway settings
    gateway_url = models.URLField(max_length=500, blank=True, null=True)
    gateway_api_key = models.CharField(max_length=255, blank=True, null=True)
    gateway_timeout = models.IntegerField(default=5)
    gateway_retries = models.IntegerField(default=3)
    gateway_enabled = models.BooleanField(default=True)
    
    # Telemetry and Health Status Tracking
    gateway_last_connected_at = models.DateTimeField(null=True, blank=True)
    gateway_last_tested_at = models.DateTimeField(null=True, blank=True)
    gateway_last_status = models.CharField(max_length=20, default='online')  # 'online', 'degraded', 'offline'
    
    created_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True, related_name='created_comm_settings')
    updated_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True, related_name='updated_comm_settings')

    # WhatsApp Configuration
    whatsapp_meta_token = models.CharField(max_length=500, blank=True, null=True)
    whatsapp_phone_number_id = models.CharField(max_length=100, blank=True, null=True)
    whatsapp_business_account_id = models.CharField(max_length=100, blank=True, null=True)
    whatsapp_recipient_number = models.CharField(max_length=100, blank=True, null=True)

    # Firebase Cloud Messaging
    firebase_credentials_json = models.TextField(blank=True, null=True)

    def save(self, *args, **kwargs):
        # Prevent overwriting with masked placeholder
        if self.smtp_password == "************":
            if self.pk:
                old_instance = NotificationChannelSettings.objects.filter(pk=self.pk).first()
                if old_instance:
                    self.smtp_password = old_instance.smtp_password
            else:
                self.smtp_password = ""

        if self.gateway_api_key == "************":
            if self.pk:
                old_instance = NotificationChannelSettings.objects.filter(pk=self.pk).first()
                if old_instance:
                    self.gateway_api_key = old_instance.gateway_api_key
            else:
                self.gateway_api_key = ""

        if self.whatsapp_meta_token == "************":
            if self.pk:
                old_instance = NotificationChannelSettings.objects.filter(pk=self.pk).first()
                if old_instance:
                    self.whatsapp_meta_token = old_instance.whatsapp_meta_token
            else:
                self.whatsapp_meta_token = ""

        # Auto encrypt password field
        if self.smtp_password and not self.smtp_password.startswith("enc_") and self.smtp_password != "************":
            self.smtp_password = "enc_" + encrypt_value(self.smtp_password)
            
        # Auto encrypt gateway_api_key field
        if self.gateway_api_key and not self.gateway_api_key.startswith("enc_") and self.gateway_api_key != "************":
            self.gateway_api_key = "enc_" + encrypt_value(self.gateway_api_key)

        # Auto encrypt whatsapp_meta_token field
        if self.whatsapp_meta_token and not self.whatsapp_meta_token.startswith("enc_") and self.whatsapp_meta_token != "************":
            self.whatsapp_meta_token = "enc_" + encrypt_value(self.whatsapp_meta_token)
            
        super().save(*args, **kwargs)

    def get_decrypted_password(self):
        if self.smtp_password and self.smtp_password.startswith("enc_"):
            return decrypt_value(self.smtp_password[4:])
        return self.smtp_password

    def get_decrypted_gateway_api_key(self):
        if self.gateway_api_key and self.gateway_api_key.startswith("enc_"):
            return decrypt_value(self.gateway_api_key[4:])
        return self.gateway_api_key

    def get_decrypted_whatsapp_meta_token(self):
        if self.whatsapp_meta_token and self.whatsapp_meta_token.startswith("enc_"):
            return decrypt_value(self.whatsapp_meta_token[4:])
        return self.whatsapp_meta_token

    def __str__(self):
        return f"Comm Settings - {self.branch.name if self.branch else 'Global'}"


class EmailTemplate(BaseModel):
    """
    Email HTML & text templates with variables placeholders.
    """
    name = models.CharField(max_length=255)
    template_type = models.CharField(max_length=50, unique=True, null=True, blank=True)
    subject = models.CharField(max_length=255)
    body_html = models.TextField()
    body_text = models.TextField(blank=True, null=True)

    def __str__(self):
        return self.name


class SMSTemplate(BaseModel):
    """
    Database model housing customizable SMS templates with placeholder variable interpolation.
    """
    branch = models.ForeignKey(Branch, on_delete=models.CASCADE, related_name='sms_templates', null=True, blank=True)
    name = models.CharField(max_length=150)
    code = models.CharField(max_length=100, unique=True)
    body_template = models.TextField()
    placeholders_list = models.JSONField(default=list)
    is_active = models.BooleanField(default=True)

    def __str__(self):
        return f"SMS Template: {self.name} ({self.code})"


class WhatsAppTemplate(BaseModel):
    """
    Database model housing customizable WhatsApp templates with placeholder variable interpolation.
    """
    branch = models.ForeignKey(Branch, on_delete=models.CASCADE, related_name='whatsapp_templates', null=True, blank=True)
    name = models.CharField(max_length=150)
    code = models.CharField(max_length=100, unique=True)
    body_template = models.TextField()
    placeholders_list = models.JSONField(default=list)
    is_active = models.BooleanField(default=True)

    def __str__(self):
        return f"WhatsApp Template: {self.name} ({self.code})"


class CommunicationLog(BaseModel):
    """
    Transactional log detailing every email/SMS/WhatsApp/Push dispatched.
    """
    MESSAGE_TYPES = [
        ('email', 'Email'),
        ('sms', 'SMS'),
        ('whatsapp', 'WhatsApp'),
        ('push', 'Push Notification'),
        ('in_app', 'In-App Message')
    ]
    STATUS_CHOICES = [
        ('queued', 'Queued'),
        ('pending', 'Pending'),
        ('sent', 'Sent'),
        ('delivered', 'Delivered'),
        ('failed', 'Failed')
    ]
    branch = models.ForeignKey(Branch, on_delete=models.SET_NULL, null=True, blank=True, related_name='communication_logs')
    customer = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True, related_name='communication_logs')
    recipient = models.CharField(max_length=255) # email or phone number
    message_type = models.CharField(max_length=20, choices=MESSAGE_TYPES)
    subject = models.CharField(max_length=255, blank=True, null=True)
    body = models.TextField()
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='queued')
    error_message = models.TextField(blank=True, null=True)
    smtp_response = models.TextField(blank=True, null=True)
    provider = models.CharField(max_length=50, default='android_gateway')
    template_code = models.CharField(max_length=100, blank=True, null=True)
    reservation_id = models.CharField(max_length=255, blank=True, null=True)
    
    # WhatsApp specific fields requested in compliance task
    whatsapp_message_id = models.CharField(max_length=255, blank=True, null=True)
    template_name = models.CharField(max_length=255, blank=True, null=True)
    
    # Exact requested field names for WhatsApp API integration
    message_id = models.CharField(max_length=255, blank=True, null=True)
    delivery_status = models.CharField(max_length=50, blank=True, null=True)
    api_response = models.TextField(blank=True, null=True)
    sent_at = models.DateTimeField(null=True, blank=True)
    
    gateway_response_code = models.IntegerField(null=True, blank=True)
    gateway_response_body = models.TextField(blank=True, null=True)
    response_time_ms = models.IntegerField(default=0)
    opened = models.BooleanField(default=False)
    clicked = models.BooleanField(default=False)
    retry_count = models.IntegerField(default=0)
    sent_time = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.message_type.upper()} to {self.recipient} - {self.status}"


class Campaign(BaseModel):
    """
    Promotional, seasonal, or custom scheduled broadcast marketing campaigns.
    """
    STATUS_CHOICES = [
        ('draft', 'Draft'),
        ('scheduled', 'Scheduled'),
        ('processing', 'Processing'),
        ('completed', 'Completed'),
        ('failed', 'Failed')
    ]
    AUDIENCE_CHOICES = [
        ('all', 'All Customers'),
        ('vip', 'VIP Guests Only'),
        ('frequent', 'Frequent Diners (3+ visits)'),
        ('inactive', 'Inactive (No visit in 30 days)')
    ]
    name = models.CharField(max_length=255)
    subject = models.CharField(max_length=255)
    content_html = models.TextField()
    audience_type = models.CharField(max_length=50, choices=AUDIENCE_CHOICES, default='all')
    scheduled_time = models.DateTimeField(null=True, blank=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='draft')
    coupon_code = models.CharField(max_length=50, blank=True, null=True)
    sent_count = models.IntegerField(default=0)
    open_count = models.IntegerField(default=0)
    click_count = models.IntegerField(default=0)

    def __str__(self):
        return self.name


class InAppNotification(BaseModel):
    """
    Real-time in-app notification center logs for users.
    """
    PRIORITY_CHOICES = [
        ('low', 'Low'),
        ('medium', 'Medium'),
        ('high', 'High')
    ]
    DELIVERY_STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('delivered', 'Delivered'),
        ('failed', 'Failed')
    ]
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='in_app_notifications', null=True, blank=True)
    title = models.CharField(max_length=255)
    message = models.TextField()
    link = models.CharField(max_length=255, blank=True, null=True)
    is_read = models.BooleanField(default=False)
    is_archived = models.BooleanField(default=False)
    
    # New data-driven fields matching user requirements:
    notification_type = models.CharField(max_length=50, default='system') # reservation, order, inventory, workforce, system, auth
    priority = models.CharField(max_length=20, choices=PRIORITY_CHOICES, default='medium')
    sender = models.CharField(max_length=100, default='system')
    recipient = models.CharField(max_length=255, blank=True, null=True)
    module = models.CharField(max_length=50, default='core') # reservation, inventory, workforce, billing, system
    status = models.CharField(max_length=20, default='unread') # unread, read, archived
    read_time = models.DateTimeField(null=True, blank=True)
    delivery_status = models.CharField(max_length=20, choices=DELIVERY_STATUS_CHOICES, default='delivered')
    branch = models.ForeignKey('core.Branch', on_delete=models.SET_NULL, null=True, blank=True, related_name='in_app_notifications')

    def __str__(self):
        recipient_name = self.user.username if self.user else self.recipient
        return f"In-App Alert for {recipient_name} - {self.title}"


class Announcement(BaseModel):
    """
    Corporate announcements issued by owners to branch managers or all employees.
    """
    STATUS_CHOICES = [
        ('draft', 'Draft'),
        ('scheduled', 'Scheduled'),
        ('immediate', 'Immediate'),
        ('expired', 'Expired')
    ]
    TARGET_AUDIENCE_CHOICES = [
        ('all', 'All Employees'),
        ('managers', 'Branch Managers Only'),
        ('employees', 'Staff / Employees Only')
    ]
    title = models.CharField(max_length=255)
    content = models.TextField()
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='immediate')
    sender = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='sent_announcements')
    branch = models.ForeignKey('core.Branch', on_delete=models.SET_NULL, null=True, blank=True, related_name='announcements')
    target_audience = models.CharField(max_length=30, choices=TARGET_AUDIENCE_CHOICES, default='all')
    scheduled_time = models.DateTimeField(null=True, blank=True)

    def __str__(self):
        return f"Announcement: {self.title} ({self.status})"


class AnnouncementAcknowledgment(BaseModel):
    """
    Read acknowledgment audit records for announcements.
    """
    announcement = models.ForeignKey(Announcement, on_delete=models.CASCADE, related_name='acknowledgments')
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='announcement_acknowledgments')
    read_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('announcement', 'user')

    def __str__(self):
        return f"{self.user.username} acknowledged {self.announcement.title}"


from django.db.models.signals import post_save
from django.dispatch import receiver
from apps.reservation.models import Reservation
from apps.inventory.models import Order

@receiver(post_save, sender=Reservation)
def dispatch_reservation_notification(sender, instance, created, **kwargs):
    from apps.notifications.services import SystemNotificationService
    
    title = ""
    message = ""
    priority = "medium"
    notification_type = "reservation"
    
    if created:
        if getattr(instance, 'is_walk_in', False):
            title = "Walk-In Created"
            message = f"Walk-In seated at {instance.branch.name} for {instance.party_size} guests."
            priority = "low"
        else:
            title = "Reservation Requested"
            message = f"Reservation requested for {instance.party_size} guests at {instance.branch.name}."
    else:
        status_map = {
            'confirmed': ("Reservation Approved", f"Reservation for {instance.party_size} guests at {instance.branch.name} is confirmed.", "medium"),
            'checked_in': ("Customer Checked In", f"Guest {instance.guest_name} has checked in at {instance.branch.name}.", "low"),
            'completed': ("Customer Checked Out", f"Guest {instance.guest_name} has checked out. Dining session completed.", "low"),
            'cancelled': ("Reservation Cancelled", f"Reservation for {instance.guest_name} at {instance.branch.name} has been cancelled.", "medium"),
            'rejected': ("Reservation Declined", f"Reservation request for {instance.guest_name} at {instance.branch.name} was declined.", "medium")
        }
        if instance.status in status_map:
            title, message, priority = status_map[instance.status]
            
    if title and message:
        # Create notifications for customer:
        if instance.customer:
            SystemNotificationService.create_notification(
                title=title,
                message=message,
                notification_type=notification_type,
                priority=priority,
                sender="reservation_system",
                module="reservation",
                branch=instance.branch,
                user=instance.customer
            )
        # Create system-wide alert for managers:
        SystemNotificationService.create_notification(
            title=f"[{instance.branch.name}] {title}",
            message=message,
            notification_type=notification_type,
            priority=priority,
            sender="reservation_system",
            module="reservation",
            branch=instance.branch,
            user=None
        )


@receiver(post_save, sender=Order)
def dispatch_order_notification(sender, instance, created, **kwargs):
    from apps.notifications.services import SystemNotificationService
    
    title = ""
    message = ""
    priority = "medium"
    notification_type = "order"
    
    customer_user = None
    if instance.reservation and instance.reservation.customer:
        customer_user = instance.reservation.customer
        
    if created:
        title = "Order Received"
        message = f"Your table self-service order has been received by the kitchen."
    else:
        status_map = {
            'preparing': ("Preparing Order", f"Order #{str(instance.id)[:8] if instance.id else ''} status updated to preparing.", "low"),
            'ready': ("Order Ready to Serve", f"Order #{str(instance.id)[:8] if instance.id else ''} is ready to serve.", "medium"),
            'completed': ("Order Completed", f"Order #{str(instance.id)[:8] if instance.id else ''} has been completed.", "medium")
        }
        if instance.status in status_map:
            title, message, priority = status_map[instance.status]
            
    if title and message:
        # Create for customer:
        if customer_user:
            SystemNotificationService.create_notification(
                title=title,
                message=message,
                notification_type=notification_type,
                priority=priority,
                sender="pos_system",
                module="inventory",
                branch=instance.branch,
                user=customer_user
            )
        # Create for managers:
        SystemNotificationService.create_notification(
            title=f"[{instance.branch.name if instance.branch else 'Enterprise'}] {title}",
            message=message,
            notification_type=notification_type,
            priority=priority,
            sender="pos_system",
            module="inventory",
            branch=instance.branch,
            user=None
        )

        # WhatsApp Order Notifications
        phone = instance.customer_phone or (instance.reservation.guest_phone if instance.reservation else None)
        if phone:
            try:
                from apps.notifications.services import WhatsAppService
                if created:
                    WhatsAppService.send_template(
                        phone_number=phone,
                        template_name='order_confirmation',
                        parameters={'order_id': str(instance.id)[:8], 'customer_name': instance.customer_name or 'Valued Customer'},
                        branch_id=instance.branch.id if instance.branch else None,
                        customer_user=customer_user
                    )
                elif instance.status == 'ready':
                    WhatsAppService.send_template(
                        phone_number=phone,
                        template_name='order_ready',
                        parameters={'order_id': str(instance.id)[:8], 'customer_name': instance.customer_name or 'Valued Customer'},
                        branch_id=instance.branch.id if instance.branch else None,
                        customer_user=customer_user
                    )
                elif instance.status in ['completed', 'delivered']:
                    WhatsAppService.send_template(
                        phone_number=phone,
                        template_name='order_delivered',
                        parameters={'order_id': str(instance.id)[:8], 'customer_name': instance.customer_name or 'Valued Customer'},
                        branch_id=instance.branch.id if instance.branch else None,
                        customer_user=customer_user
                    )
            except Exception:
                pass


from apps.reservation.models import Waitlist

@receiver(post_save, sender=Waitlist)
def dispatch_waitlist_notification(sender, instance, created, **kwargs):
    from apps.notifications.services import SystemNotificationService
    
    title = ""
    message = ""
    priority = "medium"
    notification_type = "reservation"
    
    if created:
        title = "Waitlist Added"
        message = f"Guest {instance.guest_name} added to virtual waitlist at {instance.branch.name}."
    else:
        if instance.status == 'seated':
            title = "Waitlist Seated"
            message = f"Waitlist guest {instance.guest_name} seated successfully."
            priority = "low"
            
    if title and message:
        SystemNotificationService.create_notification(
            title=f"[{instance.branch.name}] {title}",
            message=message,
            notification_type=notification_type,
            priority=priority,
            sender="waitlist_system",
            module="reservation",
            branch=instance.branch,
            user=None
        )


from apps.core.models import POSPayment, Branch
from apps.inventory.models import ReorderAlert
from apps.staff.models import Attendance, Leave
from django.contrib.auth import get_user_model
from django.db.models.signals import pre_save
from django.core.signals import got_request_exception
from django.conf import settings
import sys

User = get_user_model()

@receiver(post_save, sender=POSPayment)
def dispatch_payment_notification(sender, instance, created, **kwargs):
    if getattr(settings, 'TESTING', False):
        return
    from apps.notifications.services import SystemNotificationService
    
    title = ""
    message = ""
    priority = "medium"
    notification_type = "billing"
    
    if created or instance.status == 'completed':
        title = "Payment Successful"
        message = f"Payment of ${instance.amount} via {instance.payment_method} processed successfully (Ref: {instance.reference_number or instance.transaction_id})."
        priority = "low"
    elif instance.status == 'refunded':
        title = "Refund Issued"
        message = f"Refund of ${instance.amount} processed for payment ref {instance.reference_number or instance.transaction_id}."
        priority = "medium"
        
    if title and message:
        SystemNotificationService.create_notification(
            title=f"[{instance.branch.name if instance.branch else 'Enterprise'}] {title}",
            message=message,
            notification_type=notification_type,
            priority=priority,
            sender="payment_system",
            module="billing",
            branch=instance.branch,
            user=None
        )


@receiver(post_save, sender=ReorderAlert)
def dispatch_reorder_alert_notification(sender, instance, created, **kwargs):
    if getattr(settings, 'TESTING', False):
        return
    from apps.notifications.services import SystemNotificationService
    
    title = ""
    message = ""
    priority = "medium"
    notification_type = "inventory"
    
    if created:
        if instance.alert_type == 'out_of_stock':
            title = "Inventory Out Of Stock"
            priority = "high"
        else:
            title = "Inventory Low Stock"
            priority = "medium"
            
        message = instance.message or f"Ingredient {instance.ingredient.name} stock level has reached safety margins."
        
    if title and message:
        SystemNotificationService.create_notification(
            title=f"[{instance.branch.name if instance.branch else 'Enterprise'}] {title}",
            message=message,
            notification_type=notification_type,
            priority=priority,
            sender="inventory_system",
            module="inventory",
            branch=instance.branch,
            user=None
        )

        # WhatsApp Low Stock Alert to Branch Manager
        if instance.branch and instance.branch.branch_manager:
            manager = instance.branch.branch_manager
            if manager.phone:
                try:
                    from apps.notifications.services import WhatsAppService
                    WhatsAppService.send_template(
                        phone_number=manager.phone,
                        template_name='low_stock_alert',
                        parameters={'ingredient_name': instance.ingredient.name, 'branch_name': instance.branch.name},
                        branch_id=instance.branch.id if instance.branch else None,
                        customer_user=manager
                    )
                except Exception:
                    pass


@receiver(post_save, sender=Attendance)
def dispatch_attendance_notification(sender, instance, created, **kwargs):
    if getattr(settings, 'TESTING', False):
        return
    from apps.notifications.services import SystemNotificationService
    
    title = ""
    message = ""
    priority = "low"
    notification_type = "workforce"
    
    branch_val = instance.employee.user.branch if instance.employee and instance.employee.user else None
    
    if created:
        title = "Employee Check In"
        message = f"Staff {instance.employee.user.username if instance.employee.user else 'Employee'} clocked in."
    else:
        if instance.clock_out:
            title = "Employee Check Out"
            message = f"Staff {instance.employee.user.username if instance.employee.user else 'Employee'} clocked out."
            
    if title and message:
        SystemNotificationService.create_notification(
            title=f"[{branch_val.name if branch_val else 'Enterprise'}] {title}",
            message=message,
            notification_type=notification_type,
            priority=priority,
            sender="workforce_system",
            module="workforce",
            branch=branch_val,
            user=instance.employee.user if instance.employee else None
        )

        # WhatsApp Attendance Notifications
        if instance.employee and instance.employee.user and instance.employee.user.phone:
            try:
                from apps.notifications.services import WhatsAppService
                if created:
                    WhatsAppService.send_template(
                        phone_number=instance.employee.user.phone,
                        template_name='attendance_clock_in',
                        parameters={'employee_name': instance.employee.user.get_full_name() or instance.employee.user.username, 'time': timezone.now().strftime('%Y-%m-%d %I:%M %p')},
                        branch_id=branch_val.id if branch_val else None,
                        customer_user=instance.employee.user
                    )
                elif instance.clock_out:
                    WhatsAppService.send_template(
                        phone_number=instance.employee.user.phone,
                        template_name='attendance_clock_out',
                        parameters={'employee_name': instance.employee.user.get_full_name() or instance.employee.user.username, 'time': timezone.now().strftime('%Y-%m-%d %I:%M %p')},
                        branch_id=branch_val.id if branch_val else None,
                        customer_user=instance.employee.user
                    )
            except Exception:
                pass


@receiver(post_save, sender=Leave)
def dispatch_leave_notification(sender, instance, created, **kwargs):
    if getattr(settings, 'TESTING', False):
        return
    from apps.notifications.services import SystemNotificationService
    
    title = ""
    message = ""
    priority = "medium"
    notification_type = "workforce"
    
    branch_val = instance.employee.user.branch if instance.employee and instance.employee.user else None
    
    if created:
        title = "Leave Request"
        message = f"Staff {instance.employee.user.username if instance.employee.user else 'Employee'} submitted leave request from {instance.start_date} to {instance.end_date}."
    else:
        status_map = {
            'approved': ("Leave Approved", f"Leave request for {instance.employee.user.username if instance.employee.user else 'Employee'} approved.", "medium"),
            'rejected': ("Leave Rejected", f"Leave request for {instance.employee.user.username if instance.employee.user else 'Employee'} rejected.", "medium")
        }
        if instance.status in status_map:
            title, message, priority = status_map[instance.status]
            
    if title and message:
        if instance.employee and instance.employee.user:
            SystemNotificationService.create_notification(
                title=title,
                message=message,
                notification_type=notification_type,
                priority=priority,
                sender="workforce_system",
                module="workforce",
                branch=branch_val,
                user=instance.employee.user
            )
        SystemNotificationService.create_notification(
            title=f"[{branch_val.name if branch_val else 'Enterprise'}] {title}",
            message=message,
            notification_type=notification_type,
            priority=priority,
            sender="workforce_system",
            module="workforce",
            branch=branch_val,
            user=None
        )

        # WhatsApp Leave Notifications (Approvals/Rejections)
        if not created and instance.status in ['approved', 'rejected'] and instance.employee and instance.employee.user and instance.employee.user.phone:
            try:
                from apps.notifications.services import WhatsAppService
                WhatsAppService.send_template(
                    phone_number=instance.employee.user.phone,
                    template_name='leave_status_update',
                    parameters={
                        'employee_name': instance.employee.user.get_full_name() or instance.employee.user.username,
                        'start_date': str(instance.start_date),
                        'end_date': str(instance.end_date),
                        'status': instance.status
                    },
                    branch_id=branch_val.id if branch_val else None,
                    customer_user=instance.employee.user
                )
            except Exception:
                pass


@receiver(post_save, sender=Branch)
def dispatch_branch_notification(sender, instance, created, **kwargs):
    if getattr(settings, 'TESTING', False):
        return
    from apps.notifications.services import SystemNotificationService
    
    title = ""
    message = ""
    priority = "medium"
    notification_type = "system"
    
    if created:
        title = "Branch Created"
        message = f"New branch '{instance.name}' has been created with code {instance.branch_code}."
    else:
        title = "Branch Updated"
        message = f"Branch '{instance.name}' configuration details were updated."
        priority = "low"
        
    if title and message:
        SystemNotificationService.create_notification(
            title=title,
            message=message,
            notification_type=notification_type,
            priority=priority,
            sender="core_system",
            module="core",
            branch=instance,
            user=None
        )


@receiver(pre_save, sender=User)
def track_password_change(sender, instance, **kwargs):
    if instance.pk:
        try:
            old_user = User.objects.get(pk=instance.pk)
            if old_user.password != instance.password:
                instance._password_changed = True
        except User.DoesNotExist:
            pass


@receiver(post_save, sender=User)
def dispatch_user_notification(sender, instance, created, **kwargs):
    if getattr(settings, 'TESTING', False):
        return
    from apps.notifications.services import SystemNotificationService
    
    title = ""
    message = ""
    priority = "medium"
    notification_type = "auth"
    
    if created:
        title = "User Created"
        message = f"New user profile for '{instance.username}' with role '{instance.role.name if instance.role else 'no-role'}' created."
        priority = "low"
        SystemNotificationService.create_notification(
            title=title,
            message=message,
            notification_type=notification_type,
            priority=priority,
            sender="auth_system",
            module="auth",
            branch=instance.branch,
            user=instance
        )
    elif getattr(instance, '_password_changed', False):
        title = "Password Changed"
        message = f"Password for user '{instance.username}' has been successfully changed."
        priority = "medium"
        SystemNotificationService.create_notification(
            title=title,
            message=message,
            notification_type=notification_type,
            priority=priority,
            sender="auth_system",
            module="auth",
            branch=instance.branch,
            user=instance
        )


@receiver(got_request_exception)
def dispatch_system_error_notification(sender, request, **kwargs):
    if getattr(settings, 'TESTING', False):
        return
    from apps.notifications.services import SystemNotificationService
    
    exc_info = sys.exc_info()
    err_msg = str(exc_info[1]) if exc_info and exc_info[1] else "Unhandled request exception occurred."
    
    if "api/notifications/inapp" in request.path:
        return
        
    SystemNotificationService.create_notification(
        title="System Errors",
        message=f"Request path '{request.path}' encountered error: {err_msg}",
        notification_type="system",
        priority="high",
        sender="system_monitor",
        module="system"
    )


@receiver(post_save, sender=Announcement)
def dispatch_announcement_whatsapp_notification(sender, instance, created, **kwargs):
    if created and instance.status == 'immediate':
        # Send WhatsApp notifications to target audience of the branch (or globally)
        from django.contrib.auth import get_user_model
        User = get_user_model()
        
        users = User.objects.filter(is_active=True)
        if instance.branch:
            users = users.filter(branch=instance.branch)
            
        if instance.target_audience == 'managers':
            users = users.filter(role__code__in=['manager', 'owner', 'admin'])
        elif instance.target_audience == 'employees':
            users = users.filter(role__code__in=['kitchen_staff', 'receptionist', 'inventory_manager'])
            
        from apps.notifications.services import WhatsAppService
        for u in users:
            if u.phone:
                try:
                    WhatsAppService.send_template(
                        phone_number=u.phone,
                        template_name='new_announcement',
                        parameters={
                            'title': instance.title,
                            'sender': instance.sender.get_full_name() or instance.sender.username
                        },
                        branch_id=instance.branch.id if instance.branch else None,
                        customer_user=u
                    )
                except Exception:
                    pass
