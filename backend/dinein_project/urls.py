"""
URL configuration for dinein_project project.

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/5.2/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  path('', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  path('', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.urls import include, path
    2. Add a URL to urlpatterns:  path('blog/', include('blog.urls'))
"""

from django.contrib import admin
from django.urls import path, include
from apps.core.views import HealthCheckView
from drf_spectacular.views import SpectacularAPIView, SpectacularRedocView, SpectacularSwaggerView
from django.http import JsonResponse, HttpResponse
from django.conf import settings
import traceback
import os

def test_email_view(request):
    from django.core.mail import send_mail
    import traceback
    
    output = "SMTP TEST START\n"
    output += f"Config: HOST={settings.EMAIL_HOST}, PORT={settings.EMAIL_PORT}, USER={settings.EMAIL_HOST_USER}, TLS={settings.EMAIL_USE_TLS}, SSL={settings.EMAIL_USE_SSL}\n"
    
    try:
        send_mail(
            'DineIn SMTP Test from Render',
            'This is a test email sent from the Render server container.',
            settings.DEFAULT_FROM_EMAIL or 'dineinplatform@gmail.com',
            ['dineinplatform@gmail.com'],
            fail_silently=False,
        )
        output += "SUCCESS: Email sent successfully!\n"
    except Exception as e:
        output += f"FAILED: {e}\n"
        output += traceback.format_exc()
        
    return HttpResponse(output, content_type='text/plain')

urlpatterns = [
    path("api/v1/test-email/", test_email_view, name="test_email"),
    path("admin/", admin.site.urls),
    
    # API Schema and Documentation
    path("api/schema/", SpectacularAPIView.as_view(), name="schema"),
    path("api/schema/swagger/", SpectacularSwaggerView.as_view(url_name="schema"), name="swagger_ui"),
    path("api/schema/redoc/", SpectacularRedocView.as_view(url_name="schema"), name="redoc_ui"),
    
    # API Version 1 Namespace
    path("api/v1/health/", HealthCheckView.as_view(), name="health_check"),
    path("api/v1/auth/", include("apps.authentication.urls")),
    path("api/v1/users/", include("apps.authentication.admin_urls")),
    path("api/v1/reservation/", include("apps.reservation.urls")),
    path("api/v1/inventory/", include("apps.inventory.urls")),
    path("api/v1/workforce/", include("apps.staff.urls")),
    path("api/v1/feedback/", include("apps.feedback.urls")),
    path("api/v1/branches/", include("apps.core.urls")),
    path("api/v1/communication/", include("apps.notifications.urls")),
    path("api/v1/analytics/", include("apps.analytics.urls")),
]

