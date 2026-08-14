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
import os
from django.http import JsonResponse, HttpResponse
from django.conf import settings
from django.db import connections
from django.apps import apps
from django.contrib.auth import get_user_model
from django.core.management import call_command
from io import StringIO

def backup_db_view(request):
    out = StringIO()
    try:
        call_command('dumpdata', '--natural-foreign', '--natural-primary', exclude=['contenttypes', 'auth.Permission', 'admin.LogEntry'], stdout=out)
        data = out.getvalue()
        response = HttpResponse(data, content_type='application/json')
        response['Content-Disposition'] = 'attachment; filename="render_backup.json"'
        return response
    except Exception as e:
        return JsonResponse({"error": str(e)}, status=500)

def audit_db_view(request):
    def mask_credential(val):
        if not val:
            return ""
        val = str(val)
        if len(val) <= 4:
            return "****"
        return val[:2] + "****" + val[-2:]

    settings_module = os.environ.get("DJANGO_SETTINGS_MODULE", "Unknown")
    db_config = settings.DATABASES.get('default', {})
    masked_config = {}
    for k, v in db_config.items():
        if k in ['PASSWORD', 'USER', 'HOST']:
            masked_config[k] = mask_credential(v)
        else:
            masked_config[k] = str(v)
            
    conn_status = "FAILED"
    conn_error = None
    try:
        connections['default'].cursor()
        conn_status = "SUCCESS"
    except Exception as e:
        conn_error = str(e)
        
    model_counts = {}
    admin_info = {}
    branch_info = {}
    adambakkam_exists = False
    
    if conn_status == "SUCCESS":
        for model in apps.get_models():
            model_name = f"{model._meta.app_label}.{model.__name__}"
            try:
                model_counts[model_name] = model.objects.count()
            except Exception as e:
                model_counts[model_name] = f"ERROR: {e}"
                
        User = get_user_model()
        admin1 = User.objects.filter(username='admin1').first() or User.objects.filter(email='adhityanmclaren@gmail.com').first()
        if admin1:
            admin_info = {
                "username": admin1.username,
                "email": admin1.email,
                "role": admin1.role.name if admin1.role else None,
                "branch": admin1.branch.name if admin1.branch else None,
                "branch_id": str(admin1.branch.id) if admin1.branch else None,
                "is_active": admin1.is_active,
                "is_staff": admin1.is_staff,
                "is_superuser": admin1.is_superuser,
                "password_algo": admin1.password.split('$')[0] if hasattr(admin1, 'password') else 'Unknown',
                "check_password_works": admin1.check_password('Admin@123'),
            }
            
            branch = admin1.branch
            if branch:
                branch_info["branch_name"] = branch.name
                branch_info["branch_id"] = str(branch.id)
                
                try:
                    branch_info["tables_count"] = apps.get_model('reservation', 'Table').objects.filter(branch=branch).count()
                except Exception as e:
                    branch_info["tables_count"] = f"ERROR: {e}"
                    
                branch_info["floor_layout_count"] = 0
                
                try:
                    branch_info["reservations_count"] = apps.get_model('reservation', 'Reservation').objects.filter(branch=branch).count()
                except Exception as e:
                    branch_info["reservations_count"] = f"ERROR: {e}"
                    
                try:
                    branch_info["waitlist_count"] = apps.get_model('reservation', 'Waitlist').objects.filter(branch=branch).count()
                except Exception as e:
                    branch_info["waitlist_count"] = f"ERROR: {e}"
                    
                try:
                    branch_info["walkins_count"] = apps.get_model('reservation', 'Reservation').objects.filter(branch=branch, is_walk_in=True).count()
                except Exception as e:
                    branch_info["walkins_count"] = f"ERROR: {e}"
                    
                try:
                    branch_info["customers_count"] = User.objects.filter(branch=branch, role__code='customer').count()
                except Exception as e:
                    branch_info["customers_count"] = f"ERROR: {e}"
                    
                try:
                    branch_info["staff_count"] = apps.get_model('staff', 'Employee').objects.filter(user__branch=branch).count()
                except Exception as e:
                    branch_info["staff_count"] = f"ERROR: {e}"
                    
                try:
                    branch_info["menu_count"] = apps.get_model('inventory', 'MenuItem').objects.count()
                except Exception as e:
                    branch_info["menu_count"] = f"ERROR: {e}"
                    
                try:
                    branch_info["orders_count"] = apps.get_model('inventory', 'Order').objects.filter(branch=branch).count()
                except Exception as e:
                    branch_info["orders_count"] = f"ERROR: {e}"
                    
                try:
                    branch_info["inventory_count"] = apps.get_model('inventory', 'InventoryBatch').objects.filter(branch=branch).count()
                except Exception as e:
                    branch_info["inventory_count"] = f"ERROR: {e}"
                    
        try:
            Branch = apps.get_model('core', 'Branch')
            adambakkam_exists = Branch.objects.filter(name='ADAMBAKKAM-CHENNAI').exists()
        except Exception:
            pass

    # Debug paths
    base_dir_str = str(settings.BASE_DIR)
    path1 = os.path.join(base_dir_str, 'local_dump.json')
    path2 = os.path.join(base_dir_str, 'backend', 'local_dump.json')
    exists1 = os.path.exists(path1)
    exists2 = os.path.exists(path2)
    files_in_base = os.listdir(base_dir_str) if os.path.exists(base_dir_str) else []

    return JsonResponse({
        "settings_module": settings_module,
        "database_engine": db_config.get('ENGINE'),
        "database_host_masked": masked_config.get('HOST'),
        "database_name_masked": masked_config.get('NAME'),
        "connection_successful": conn_status == "SUCCESS",
        "connection_error": conn_error,
        "model_counts": model_counts,
        "admin1_info": admin_info,
        "branch_info": branch_info,
        "adambakkam_chennai_branch_exists": adambakkam_exists,
        "debug_paths": {
            "BASE_DIR": base_dir_str,
            "path1": path1,
            "exists1": exists1,
            "path2": path2,
            "exists2": exists2,
            "files_in_base": files_in_base[:15]
        }
    })

urlpatterns = [
    path("api/v1/audit-db/", audit_db_view, name="audit_db"),
    path("api/v1/backup-db/", backup_db_view, name="backup_db"),
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

