from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    NotificationChannelSettingsViewSet,
    EmailTemplateViewSet,
    CommunicationLogViewSet,
    CampaignViewSet,
    InAppNotificationViewSet,
    AnnouncementViewSet,
    WhatsAppTemplateViewSet,
    SMTPDebugView
)

router = DefaultRouter()
router.register(r'settings', NotificationChannelSettingsViewSet, basename='comm-settings')
router.register(r'templates', EmailTemplateViewSet, basename='comm-templates')
router.register(r'whatsapp-templates', WhatsAppTemplateViewSet, basename='comm-whatsapp-templates')
router.register(r'logs', CommunicationLogViewSet, basename='comm-logs')
router.register(r'campaigns', CampaignViewSet, basename='comm-campaigns')
router.register(r'notifications', InAppNotificationViewSet, basename='comm-notifications')
router.register(r'announcements', AnnouncementViewSet, basename='comm-announcements')

urlpatterns = [
    path('debug/smtp', SMTPDebugView.as_view(), name='smtp-debug'),
    path('', include(router.urls)),
]
