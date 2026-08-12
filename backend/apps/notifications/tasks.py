import logging
from celery import shared_task
from django.utils import timezone

logger = logging.getLogger('dinein.notifications')

@shared_task(name='apps.notifications.tasks.send_delayed_feedback_request')
def send_delayed_feedback_request(reservation_id):
    """
    Asynchronous task scheduled to run 30 minutes after guest checkout
    to request dining experience feedback.
    """
    try:
        from apps.reservation.models import Reservation
        from apps.notifications.services import EmailService
        
        reservation = Reservation.objects.get(id=reservation_id)
        if reservation.status == 'completed':
            logger.info(f"[CELERY] Sending feedback request email for reservation {reservation_id}")
            EmailService.send_feedback_request(reservation)
        else:
            logger.info(f"[CELERY] Skip feedback request. Reservation status is {reservation.status} (expected completed)")
    except Exception as e:
        logger.error(f"[CELERY] Error running send_delayed_feedback_request: {e}", exc_info=True)


@shared_task(name='apps.notifications.tasks.dispatch_campaign_broadcast')
def dispatch_campaign_broadcast(campaign_id):
    """
    Asynchronously sends campaign emails to target audience lists in batches.
    """
    try:
        from apps.notifications.models import Campaign
        from apps.notifications.services import EmailService
        from django.contrib.auth import get_user_model
        
        User = get_user_model()
        campaign = Campaign.objects.get(id=campaign_id)
        
        # Determine audience targeting
        if campaign.audience_type == 'vip':
            recipients = User.objects.filter(role__code='customer', reservations__is_vip=True).distinct()
        elif campaign.audience_type == 'frequent':
            # Simplified mock filter: customers with 3+ reservations
            from django.db.models import Count
            recipients = User.objects.filter(role__code='customer').annotate(
                res_count=Count('reservations')
            ).filter(res_count__gte=3)
        else:
            # Fallback to all registered customers
            recipients = User.objects.filter(role__code='customer')
            
        success_count = 0
        for user in recipients:
            if user.email:
                sent = EmailService.send_campaign(campaign, user.email, customer_user=user)
                if sent:
                    success_count += 1
                    
        campaign.status = 'completed'
        campaign.sent_count = success_count
        campaign.save()
        logger.info(f"[CELERY] Campaign broadcast {campaign_id} sent successfully to {success_count} customers.")
    except Exception as e:
        logger.error(f"[CELERY] Error dispatching campaign {campaign_id}: {e}", exc_info=True)
        try:
            campaign = Campaign.objects.get(id=campaign_id)
            campaign.status = 'failed'
            campaign.save()
        except Exception:
            pass

@shared_task(name='apps.notifications.tasks.send_reservation_reminders_task')
def send_reservation_reminders_task():
    """
    Scans for upcoming confirmed reservations in 24h, 2h, and 30m windows
    and dispatches reminder emails if not already sent.
    """
    try:
        from apps.reservation.models import Reservation
        from apps.notifications.models import CommunicationLog
        from apps.notifications.services import EmailService
        
        now = timezone.now()
        
        # 1. 24h reminders (window: start_time between now + 23 hours and now + 25 hours)
        win_24h_start = now + timezone.timedelta(hours=23)
        win_24h_end = now + timezone.timedelta(hours=25)
        res_24h = Reservation.objects.filter(
            status__in=['confirmed', 'reminder_sent'],
            start_time__gte=win_24h_start,
            start_time__lte=win_24h_end
        )
        from apps.reservation.services import NotificationService
        
        for res in res_24h:
            # Check if 24h reminder already sent
            already_sent = CommunicationLog.objects.filter(
                recipient=res.guest_email,
                subject__contains=f"Upcoming Table Reminder (24 Hours) [Ref: {res.id}]"
            ).exists()
            if not already_sent:
                logger.info(f"[CELERY] Sending 24h reminder notification for reservation {res.id}")
                NotificationService.send_reservation_reminder(res, '24h')
                if res.status == 'confirmed':
                    res.status = 'reminder_sent'
                    res.save()

        # 2. 2h reminders (window: start_time between now + 1.5 hours and now + 2.5 hours)
        win_2h_start = now + timezone.timedelta(hours=1, minutes=30)
        win_2h_end = now + timezone.timedelta(hours=2, minutes=30)
        res_2h = Reservation.objects.filter(
            status__in=['confirmed', 'reminder_sent'],
            start_time__gte=win_2h_start,
            start_time__lte=win_2h_end
        )
        for res in res_2h:
            already_sent = CommunicationLog.objects.filter(
                recipient=res.guest_email,
                subject__contains=f"Upcoming Table Reminder (2 Hours) [Ref: {res.id}]"
            ).exists()
            if not already_sent:
                logger.info(f"[CELERY] Sending 2h reminder notification for reservation {res.id}")
                NotificationService.send_reservation_reminder(res, '2h')
                if res.status == 'confirmed':
                    res.status = 'reminder_sent'
                    res.save()

        # 3. 30m reminders (window: start_time between now + 15 minutes and now + 45 minutes)
        win_30m_start = now + timezone.timedelta(minutes=15)
        win_30m_end = now + timezone.timedelta(minutes=45)
        res_30m = Reservation.objects.filter(
            status__in=['confirmed', 'reminder_sent'],
            start_time__gte=win_30m_start,
            start_time__lte=win_30m_end
        )
        for res in res_30m:
            already_sent = CommunicationLog.objects.filter(
                recipient=res.guest_email,
                subject__contains=f"Upcoming Table Reminder (30 Minutes) [Ref: {res.id}]"
            ).exists()
            if not already_sent:
                logger.info(f"[CELERY] Sending 30m reminder notification for reservation {res.id}")
                NotificationService.send_reservation_reminder(res, '30m')
                if res.status == 'confirmed':
                    res.status = 'reminder_sent'
                    res.save()
                    
    except Exception as e:
        logger.error(f"[CELERY] Error running send_reservation_reminders_task: {e}", exc_info=True)

