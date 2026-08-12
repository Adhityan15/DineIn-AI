import logging
from celery import shared_task
from django.utils import timezone
from apps.inventory.services import InventoryService
from apps.inventory.models import InventoryBatch, ReorderAlert
from apps.core.models import Branch

logger = logging.getLogger(__name__)

@shared_task
def check_low_stock_thresholds():
    """
    Nightly Celery task scanning active stock levels and triggering reorder alerts.
    """
    logger.info("Starting low-stock evaluation task...")
    try:
        # Evaluate for all branches
        branches = Branch.objects.filter(is_active=True)
        if not branches.exists():
            # Fallback mapping if database has no active branches records (e.g. initial dev run)
            logger.warning("No active branches found during low-stock check.")
            return

        for branch in branches:
            alerts = InventoryService.evaluate_reorder_alerts(branch)
            logger.info(f"Generated {len(alerts)} alerts for branch: {branch.name}")
            
    except Exception as e:
        logger.error(f"Error executing check_low_stock_thresholds: {str(e)}")


@shared_task
def check_expiring_batches():
    """
    Celery task monitoring batches expiring within the next 7 days.
    """
    logger.info("Evaluating inventory batches for upcoming expirations...")
    try:
        now_date = timezone.now().date()
        warning_window = now_date + timezone.timedelta(days=7)

        # Select active batches expiring soon
        expiring_batches = InventoryBatch.objects.filter(
            status='active',
            quantity__gt=0,
            expiry_date__lte=warning_window
        )

        for batch in expiring_batches:
            # Determine if critical expiry (elapsed or less than 2 days)
            days_left = (batch.expiry_date - now_date).days
            
            alert_type = 'critical_stock' if days_left <= 2 else 'warning'
            message = f"EXPIRY ALERT: Batch {batch.batch_number} of {batch.ingredient.name} is expiring in {days_left} days ({batch.expiry_date}). Qty: {batch.quantity} {batch.ingredient.unit}."
            
            alert, created = ReorderAlert.objects.get_or_create(
                branch=batch.branch,
                ingredient=batch.ingredient,
                status='active',
                defaults={'alert_type': alert_type, 'message': message}
            )
            if not created:
                alert.alert_type = alert_type
                alert.message = message
                alert.save()

            logger.warning(f"Batch {batch.batch_number} expiring in {days_left} days. Logged alert.")
            
    except Exception as e:
        logger.error(f"Error checking expiring batches: {str(e)}")
