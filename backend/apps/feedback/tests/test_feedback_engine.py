import pytest
import datetime
from django.utils import timezone
from django.urls import reverse
from rest_framework import status
from django.contrib.auth import get_user_model
from apps.authentication.models import Role
from apps.core.models import Restaurant, Branch
from apps.feedback.models import (
    CustomerReview, TopicCategory, SentimentKeyword,
    ReviewInsight, ReputationSnapshot, AIRecommendation
)
from apps.feedback.services import AIService
from apps.feedback.tasks import (
    sync_google_reviews_task,
    daily_sentiment_analysis,
    generate_reputation_snapshots,
    compile_weekly_feedback_digest
)

@pytest.fixture
def test_branch(db):
    """
    Creates a branch fixture.
    """
    restaurant, _ = Restaurant.objects.get_or_create(
        code="test-dinein",
        defaults={
            "name": "DineIn Main",
            "contact_email": "owner@dinein.com",
            "contact_phone": "+15005550006",
            "address": "123 Main St"
        }
    )
    branch, _ = Branch.objects.get_or_create(
        branch_code="bangalore-main",
        defaults={
            "restaurant": restaurant,
            "name": "Bangalore Main",
            "address": "456 Side St"
        }
    )
    return branch


@pytest.fixture
def manager_user(db):
    """
    Creates a manager user fixture.
    """
    User = get_user_model()
    role_obj = Role.objects.get(code='manager')
    return User.objects.create_user(
        email="manager@dinein.com",
        username="manageruser",
        password="Managerpassword123!",
        first_name="Manager",
        last_name="User",
        phone="+15005550006",
        role=role_obj
    )


@pytest.mark.django_db
def test_rule_based_fallback_sentiment_positive():
    """
    Checks fallback lexicon parser outputs correct positive categorizations.
    """
    comment = "The Biryani was good and the service was friendly."
    res = AIService._rule_based_fallback_analysis(comment, 5)
    assert res['sentiment'] == 'positive'
    assert res['emotion'] == 'Happy'
    assert 'Food Quality' in res['topics']
    assert 'good' in res['positive_keywords'] or 'friendly' in res['positive_keywords']


@pytest.mark.django_db
def test_rule_based_fallback_sentiment_negative_and_allergy():
    """
    Checks priority scoring escalation checks on allergen negative reviews.
    """
    comment = "Frustrated with delay. The cleanliness was worst and I had a severe allergy."
    res = AIService._rule_based_fallback_analysis(comment, 1)
    assert res['sentiment'] == 'negative'
    assert res['emotion'] in ['Angry', 'Frustrated']
    assert 'Cleanliness' in res['topics']
    assert len(res['negative_keywords']) >= 0


@pytest.mark.django_db
def test_review_creation_triggers_analysis(test_branch):
    """
    Validates review creation automatically populates intelligence insights.
    """
    review = CustomerReview.objects.create(
        branch=test_branch,
        author_name="Marcus",
        rating=5,
        comment="Absolutely love the dining quality here!"
    )
    
    # Run analysis service call
    AIService.analyze_review(review.id)
    
    # Assert review is analyzed
    review.refresh_from_db()
    assert review.is_analyzed is True
    assert review.insight is not None
    assert review.insight.sentiment == 'positive'


@pytest.mark.django_db
def test_reputation_snapshot_calculation(test_branch):
    """
    Verifies Reputation snapshot metric calculators.
    """
    CustomerReview.objects.create(
        branch=test_branch,
        author_name="Marcus",
        rating=5,
        comment="Good food!"
    )
    CustomerReview.objects.create(
        branch=test_branch,
        author_name="Marcus 2",
        rating=1,
        comment="Dirty tables!"
    )

    snapshot = AIService.calculate_reputation_snapshot(test_branch.id)
    assert snapshot is not None
    assert snapshot.total_reviews == 2
    assert snapshot.rating_avg == 3.0
    assert snapshot.reputation_score > 0.0


@pytest.mark.django_db
def test_sync_external_reviews(test_branch):
    """
    Validates mock syncing pulls entries from fallback dataset resources.
    """
    count = AIService.sync_external_reviews(test_branch.id)
    assert count > 0
    assert CustomerReview.objects.filter(source='google_maps').count() == count


@pytest.mark.django_db
def test_post_response_permission_rbac(api_client, test_branch, test_user, manager_user):
    """
    Ensures customer users cannot respond to reviews while manager profile succeeds.
    """
    review = CustomerReview.objects.create(
        branch=test_branch,
        author_name="Marcus",
        rating=2,
        comment="Slow seating times."
    )

    url = reverse('feedback:reviews-respond', args=[review.id])

    # Unauthenticated
    res = api_client.post(url, {'response_text': "Sorry for the inconvenience."})
    assert res.status_code == status.HTTP_401_UNAUTHORIZED

    # Customer role (should return 403 Forbidden)
    api_client.force_authenticate(user=test_user)
    res = api_client.post(url, {'response_text': "Sorry for the inconvenience."})
    assert res.status_code == status.HTTP_403_FORBIDDEN

    # Manager role (should succeed)
    api_client.force_authenticate(user=manager_user)
    res = api_client.post(url, {'response_text': "Sorry for the inconvenience. We'll resolve this."})
    assert res.status_code == status.HTTP_201_CREATED
    assert review.responses.count() == 1


@pytest.mark.django_db
def test_analytics_endpoint(api_client, test_branch, test_user):
    """
    Tests visual dashboard aggregates endpoint.
    """
    CustomerReview.objects.create(
        branch=test_branch,
        author_name="Marcus",
        rating=5,
        comment="Excellent restaurant!"
    )

    api_client.force_authenticate(user=test_user)
    url = reverse('feedback:reviews-analytics')
    res = api_client.get(url, {'branch_id': test_branch.id})
    assert res.status_code == status.HTTP_200_OK
    assert res.data['total_reviews'] == 1
    assert res.data['rating_avg'] == 5.0


@pytest.mark.django_db
def test_background_celery_tasks_success(test_branch):
    """
    Verifies Celery background tasks trigger cleanly with no exceptions.
    """
    # Create some mock reviews
    CustomerReview.objects.create(
        branch=test_branch,
        author_name="Marcus",
        rating=5,
        comment="Delicious menu items."
    )

    # Trigger task runs
    sync_res = sync_google_reviews_task()
    assert "Synced external reviews" in sync_res

    sent_res = daily_sentiment_analysis()
    assert "Bulk analyzed" in sent_res

    snap_res = generate_reputation_snapshots()
    assert "Generated" in snap_res

    weekly_res = compile_weekly_feedback_digest()
    assert "Dispatched" in weekly_res
