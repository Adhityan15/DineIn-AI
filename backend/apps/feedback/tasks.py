import datetime
from celery import shared_task
from django.utils import timezone
from apps.core.models import Branch, Notification
from apps.feedback.models import CustomerReview, ReputationSnapshot
from apps.feedback.services import AIService

@shared_task(name="apps.feedback.tasks.sync_google_reviews_task")
def sync_google_reviews_task():
    """
    Daily sync task for pulling third-party Google Reviews for all active branches.
    """
    branches = Branch.objects.filter(is_active=True)
    results = {}
    for branch in branches:
        count = AIService.sync_external_reviews(branch.id)
        results[branch.name] = count
    return f"Synced external reviews: {results}"


@shared_task(name="apps.feedback.tasks.daily_sentiment_analysis")
def daily_sentiment_analysis():
    """
    Reprocesses any pending, un-analyzed reviews to guarantee robust coverage index updates.
    """
    un_analyzed = CustomerReview.objects.filter(is_analyzed=False)
    count = 0
    for rev in un_analyzed:
        AIService.analyze_review(rev.id)
        count += 1
    return f"Bulk analyzed {count} pending reviews."


@shared_task(name="apps.feedback.tasks.generate_reputation_snapshots")
def generate_reputation_snapshots():
    """
    Compiles daily ReputationSnapshot aggregates for all branches.
    """
    branches = Branch.objects.filter(is_active=True)
    date_str = timezone.now().date()
    count = 0
    for branch in branches:
        snapshot = AIService.calculate_reputation_snapshot(branch.id, date_str)
        if snapshot:
            count += 1
    return f"Generated {count} reputation score snapshots."


@shared_task(name="apps.feedback.tasks.compile_weekly_feedback_digest")
def compile_weekly_feedback_digest():
    """
    Compiles weekly rating metrics and recommendations summary for restaurant owners.
    """
    branches = Branch.objects.filter(is_active=True)
    sent_count = 0
    for branch in branches:
        summary_text = AIService.generate_weekly_summary_text(branch.id)
        
        # Log email notification digest alert
        Notification.objects.create(
            recipient_email=branch.restaurant.contact_email,
            notification_type='email',
            title=f"Weekly Customer Review Analytics Digest: {branch.name}",
            message=summary_text,
            status='pending'
        )
        sent_count += 1
    return f"Dispatched {sent_count} weekly business summaries."
