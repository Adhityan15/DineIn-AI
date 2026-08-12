from django.db import models
from apps.core.models import BaseModel, Branch
from django.contrib.auth import get_user_model
from apps.core.validators import validate_phone_number

User = get_user_model()

class Table(BaseModel):
    """
    Database model representing physical restaurant dining tables.
    """
    STATUS_CHOICES = (
        ('available', 'Available'),
        ('reserved', 'Reserved'),
        ('occupied', 'Occupied'),
        ('cleaning', 'Cleaning'),
        ('out_of_service', 'Out of Service'),
    )
    SHAPE_CHOICES = (
        ('round', 'Round'),
        ('square', 'Square'),
        ('rectangle', 'Rectangle'),
    )

    branch = models.ForeignKey(Branch, on_delete=models.CASCADE, related_name='tables')
    number = models.CharField(max_length=20)
    capacity = models.PositiveIntegerField()
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='available')
    shape = models.CharField(max_length=20, choices=SHAPE_CHOICES, default='square')
    x_coord = models.IntegerField(default=0)
    y_coord = models.IntegerField(default=0)

    class Meta:
        unique_together = ('branch', 'number')
        indexes = [
            models.Index(fields=['branch', 'status']),
            models.Index(fields=['capacity']),
        ]

    def __str__(self):
        return f"{self.number} (Cap: {self.capacity}) - {self.branch.name}"


class Reservation(BaseModel):
    """
    Database model representing table bookings and walk-ins.
    """
    STATUS_CHOICES = (
        ('pending', 'Pending'),
        ('confirmed', 'Confirmed'),
        ('reminder_sent', 'Reminder Sent'),
        ('checked_in', 'Checked In'),
        ('arrived', 'Arrived'),
        ('seated', 'Seated'),
        ('dining', 'Dining'),
        ('checkout_requested', 'Checkout Requested'),
        ('completed', 'Completed'),
        ('cancelled', 'Cancelled'),
        ('rejected', 'Rejected'),
        ('no_show', 'No Show'),
    )

    branch = models.ForeignKey(Branch, on_delete=models.CASCADE, related_name='reservations')
    customer = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='reservations')
    guest_name = models.CharField(max_length=150)
    guest_phone = models.CharField(max_length=20, validators=[validate_phone_number])
    guest_email = models.EmailField(blank=True, null=True)
    party_size = models.PositiveIntegerField()
    start_time = models.DateTimeField()
    end_time = models.DateTimeField()
    status = models.CharField(max_length=25, choices=STATUS_CHOICES, default='pending')
    notes = models.TextField(blank=True, null=True)
    is_walk_in = models.BooleanField(default=False)

    # Optional Reservation attributes requested in SRS improvements
    is_birthday = models.BooleanField(default=False)
    is_anniversary = models.BooleanField(default=False)
    is_vip = models.BooleanField(default=False)
    needs_wheelchair = models.BooleanField(default=False)
    needs_baby_chair = models.BooleanField(default=False)
    allergy_notes = models.TextField(blank=True, null=True)
    special_requests = models.TextField(blank=True, null=True)
    waiter = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='waiter_reservations')

    # New lifecycle & audit tracking fields
    cancelled_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='cancelled_reservations')
    cancelled_at = models.DateTimeField(null=True, blank=True)
    cancellation_reason = models.TextField(blank=True, null=True)
    rejected_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='rejected_reservations')
    rejected_at = models.DateTimeField(null=True, blank=True)
    rejection_reason = models.TextField(blank=True, null=True)
    internal_notes = models.TextField(blank=True, null=True)

    class Meta:
        constraints = [
            models.CheckConstraint(check=models.Q(end_time__gt=models.F('start_time')), name='check_end_time_gt_start_time'),
            models.CheckConstraint(check=models.Q(party_size__gt=0), name='check_party_size_gt_zero'),
        ]
        indexes = [
            models.Index(fields=['branch', 'start_time', 'status']),
            models.Index(fields=['guest_phone']),
            models.Index(fields=['guest_name']),
            models.Index(fields=['status']),
        ]

    def __str__(self):
        return f"Reservation {self.guest_name} ({self.party_size} pax) - {self.status}"


class ReservationHistory(BaseModel):
    """
    Audit log of all status transitions for a reservation.
    """
    reservation = models.ForeignKey(Reservation, on_delete=models.CASCADE, related_name='history')
    status = models.CharField(max_length=25)
    changed_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True)
    timestamp = models.DateTimeField(auto_now_add=True)
    reason = models.TextField(blank=True, null=True)

    def __str__(self):
        return f"History for {self.reservation.id} - {self.status} by {self.changed_by} at {self.timestamp}"


class ReservationTable(BaseModel):
    """
    Junction model mapping reservations to assigned tables.
    """
    reservation = models.ForeignKey(Reservation, on_delete=models.CASCADE, related_name='reservation_tables')
    table = models.ForeignKey(Table, on_delete=models.CASCADE, related_name='reservation_tables')

    class Meta:
        unique_together = ('reservation', 'table')

    def __str__(self):
        return f"{self.reservation.guest_name} ➔ {self.table.number}"


class Waitlist(BaseModel):
    """
    Database model representing guest waitlist queues.
    """
    STATUS_CHOICES = (
        ('waiting', 'Waiting'),
        ('notified', 'Notified'),
        ('expired', 'Expired'),
        ('checked_in', 'Checked In'),
        ('cancelled', 'Cancelled'),
    )

    branch = models.ForeignKey(Branch, on_delete=models.CASCADE, related_name='waitlists')
    guest_name = models.CharField(max_length=150)
    guest_phone = models.CharField(max_length=20, validators=[validate_phone_number])
    guest_email = models.EmailField(blank=True, null=True)
    party_size = models.PositiveIntegerField()
    position = models.IntegerField(default=0)
    status = models.CharField(max_length=25, choices=STATUS_CHOICES, default='waiting')
    joined_at = models.DateTimeField(auto_now_add=True)
    notified_at = models.DateTimeField(blank=True, null=True)
    estimated_wait_minutes = models.IntegerField(default=0)

    class Meta:
        indexes = [
            models.Index(fields=['branch', 'status', 'joined_at']),
        ]

    def __str__(self):
        return f"{self.guest_name} (Position: {self.position}) - {self.status}"


from django.db.models.signals import post_save
from django.dispatch import receiver

@receiver(post_save, sender=Reservation)
def sync_reservation_table_and_history(sender, instance, created, **kwargs):
    # 1. Log History
    try:
        ReservationHistory.objects.create(
            reservation=instance,
            status=instance.status,
            reason=f"Status synchronized to {instance.status}"
        )
    except Exception:
        pass

    # 2. Update Table Statuses
    if instance.status in ['seated', 'dining', 'checked_in', 'arrived']:
        target_table_status = 'occupied'
    elif instance.status in ['cancelled', 'rejected', 'no_show', 'completed']:
        target_table_status = 'available'
    elif instance.status in ['pending', 'confirmed', 'reminder_sent']:
        target_table_status = 'reserved'
    else:
        target_table_status = None

    if target_table_status:
        for rt in instance.reservation_tables.all():
            if rt.table.status != target_table_status:
                rt.table.status = target_table_status
                rt.table.save()
