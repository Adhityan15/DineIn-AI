from django.urls import path
from apps.analytics.views import AIAnalyticsPredictiveView

urlpatterns = [
    path('predictive/', AIAnalyticsPredictiveView.as_view(), name='ai-analytics-predictive'),
]
