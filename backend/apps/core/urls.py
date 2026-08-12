from django.urls import path, include
from rest_framework.routers import DefaultRouter
from apps.core.views import BranchViewSet, InvoiceViewSet, AuditLogViewSet
from apps.core.realtime_views import RealTimeDashboardView, OwnerDashboardView, SalesPerformanceView

router = DefaultRouter()
router.register('invoices', InvoiceViewSet, basename='invoice')
router.register('audit-logs', AuditLogViewSet, basename='audit-log')
router.register('', BranchViewSet, basename='branch')

urlpatterns = [
    path('realtime-dashboard/', RealTimeDashboardView.as_view(), name='realtime-dashboard'),
    path('owner-dashboard/', OwnerDashboardView.as_view(), name='owner-dashboard'),
    path('sales-performance/', SalesPerformanceView.as_view(), name='sales-performance'),
    path('', include(router.urls)),
]
