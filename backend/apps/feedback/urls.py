from django.urls import path, include
from rest_framework.routers import DefaultRouter
from apps.feedback.views import (
    TopicCategoryViewSet,
    SentimentKeywordViewSet,
    CustomerReviewViewSet,
    ReputationSnapshotViewSet,
    AIRecommendationViewSet,
    WeeklyFeedbackSummaryViewSet,
    CopilotViewSet
)

router = DefaultRouter()
router.register(r'topics', TopicCategoryViewSet, basename='topics')
router.register(r'keywords', SentimentKeywordViewSet, basename='keywords')
router.register(r'reviews', CustomerReviewViewSet, basename='reviews')
router.register(r'snapshots', ReputationSnapshotViewSet, basename='snapshots')
router.register(r'recommendations', AIRecommendationViewSet, basename='recommendations')
router.register(r'weekly-summaries', WeeklyFeedbackSummaryViewSet, basename='weekly-summaries')
router.register(r'copilot', CopilotViewSet, basename='copilot')

app_name = 'feedback'

urlpatterns = [
    path('', include(router.urls)),
]
