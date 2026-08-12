import logging
from celery import shared_task
from django.utils import timezone
from datetime import timedelta
from apps.reservation.models import Reservation, Waitlist
from apps.reservation.services import ReservationService, WaitlistService, NotificationService

logger = logging.getLogger('dinein.reservation')

@shared_task(name='apps.reservation.tasks.check_no_show_bookings')
def check_no_show_bookings():
    """
    Background job runs periodically (e.g. every 5 minutes) to cancel 
    confirmed reservations where arrival grace period (15 mins) has expired.
    """
    now = timezone.now()
    threshold = now - timedelta(minutes=15)
    
    # Query confirmed bookings whose start time is past the 15-minute grace threshold
    no_shows = Reservation.objects.filter(
        status='confirmed',
        start_time__lte=threshold
    )
    
    count = 0
    for res in no_shows:
        try:
            ReservationService.cancel_reservation(res.id)
            res.status = 'no_show'
            res.save()
            count += 1
            logger.info(f"Reservation {res.id} auto-cancelled to no_show.")
        except Exception as e:
            logger.error(f"Failed to auto-cancel reservation {res.id}: {str(e)}")
            
    return f"Processed {count} no-show bookings."


@shared_task(name='apps.reservation.tasks.send_booking_reminders')
def send_booking_reminders():
    """
    Background job runs periodically to dispatch email reminders
    to guests with reservations starting in:
    - 24 hours (24h window)
    - 2 hours (2h window)
    - 30 minutes (30m window)
    """
    now = timezone.now()
    
    # 1. 24 Hours reminder (starts in 23h 45m to 24h 15m)
    win_24_start = now + timedelta(hours=23, minutes=45)
    win_24_end = now + timedelta(hours=24, minutes=15)
    upcoming_24h = Reservation.objects.filter(
        status='confirmed',
        start_time__range=(win_24_start, win_24_end)
    )
    count_24h = 0
    for res in upcoming_24h:
        # Check if already sent in history
        if not res.history.filter(status='reminder_sent', reason__contains='24-hour').exists():
            NotificationService.send_reservation_reminder(res, hours_before=24)
            ReservationService.log_history(res, 'reminder_sent', reason="Sent 24-hour reminder email.")
            count_24h += 1

    # 2. 2 Hours reminder
    win_2h_start = now + timedelta(hours=1, minutes=45)
    win_2h_end = now + timedelta(hours=2, minutes=15)
    upcoming_2h = Reservation.objects.filter(
        status='confirmed',
        start_time__range=(win_2h_start, win_2h_end)
    )
    count_2h = 0
    for res in upcoming_2h:
        if not res.history.filter(status='reminder_sent', reason__contains='2-hour').exists():
            NotificationService.send_reservation_reminder(res, hours_before=2)
            ReservationService.log_history(res, 'reminder_sent', reason="Sent 2-hour reminder email.")
            count_2h += 1

    # 3. 30 Minutes reminder
    win_30m_start = now + timedelta(minutes=15)
    win_30m_end = now + timedelta(minutes=45)
    upcoming_30m = Reservation.objects.filter(
        status='confirmed',
        start_time__range=(win_30m_start, win_30m_end)
    )
    count_30m = 0
    for res in upcoming_30m:
        if not res.history.filter(status='reminder_sent', reason__contains='30-minute').exists():
            NotificationService.send_reservation_reminder(res, hours_before=0.5)
            ReservationService.log_history(res, 'reminder_sent', reason="Sent 30-minute reminder email.")
            count_30m += 1

    return f"Reminders sent: 24h: {count_24h}, 2h: {count_2h}, 30m: {count_30m}"


@shared_task(name='apps.reservation.tasks.auto_expire_waitlist_notifications')
def auto_expire_waitlist_notifications():
    """
    Background job runs periodically (e.g. every minute) to expire waitlist entries
    notified but failed to claim their table within 15 minutes.
    """
    now = timezone.now()
    threshold = now - timedelta(minutes=15)
    
    expired_entries = Waitlist.objects.filter(
        status='notified',
        notified_at__lte=threshold
    )
    
    count = 0
    for entry in expired_entries:
        try:
            WaitlistService.expire_waitlist_entry(entry.id)
            count += 1
            logger.info(f"Waitlist entry {entry.id} auto-expired due to check-in timeout.")
        except Exception as e:
            logger.error(f"Failed to auto-expire waitlist {entry.id}: {str(e)}")
            
    return f"Expired {count} waitlist entries."


@shared_task(name='apps.reservation.tasks.complete_table_cleaning')
def complete_table_cleaning(table_id):
    """
    Timer completion task transitioning table status from 'cleaning' to 'available'.
    """
    from apps.reservation.models import Table
    try:
        table = Table.objects.get(id=table_id)
        if table.status == 'cleaning':
            table.status = 'available'
            table.save()
            logger.info(f"[CLEANING TASK] Table T-{table.number} cleaning completed. Status: Available.")
    except Exception as e:
        logger.error(f"[CLEANING TASK] Error restoring table status: {e}")
    return f"Table {table_id} reset to available."


@shared_task(name='apps.reservation.tasks.send_reservation_notifications_task')
def send_reservation_notifications_task(reservation_id, event_type, reminder_type='2h'):
    from apps.reservation.models import Reservation
    from apps.reservation.services import NotificationService
    try:
        reservation = Reservation.objects.get(id=reservation_id)
        NotificationService.send_reservation_notifications(reservation, event_type, reminder_type)
    except Reservation.DoesNotExist:
        logger.error(f"[CELERY] Reservation {reservation_id} not found for async notifications.")
    except Exception as e:
        logger.error(f"[CELERY] Error running send_reservation_notifications_task: {e}")

