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
from django.http import JsonResponse
import traceback

def test_email_view(request):
    from django.core.mail import send_mail
    from django.conf import settings
    try:
        send_mail(
            'DineIn SMTP Test',
            'This is a test email from DineIn AI.',
            settings.DEFAULT_FROM_EMAIL or 'dineinplatform@gmail.com',
            ['dineinplatform@gmail.com'],
            fail_silently=False,
        )
        return JsonResponse({"status": "success", "message": "Email sent successfully!"})
    except Exception as e:
        return JsonResponse({
            "status": "error",
            "error_message": str(e),
            "traceback": traceback.format_exc(),
            "settings": {
                "EMAIL_HOST": settings.EMAIL_HOST,
                "EMAIL_PORT": settings.EMAIL_PORT,
                "EMAIL_USE_TLS": settings.EMAIL_USE_TLS,
                "EMAIL_USE_SSL": settings.EMAIL_USE_SSL,
                "EMAIL_HOST_USER": settings.EMAIL_HOST_USER,
            }
        })

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

