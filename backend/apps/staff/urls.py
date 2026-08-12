from django.urls import path, include
from rest_framework.routers import DefaultRouter
from apps.staff.views import (
    DepartmentViewSet, DesignationViewSet, EmployeeViewSet, ShiftViewSet,
    ScheduleViewSet, AttendanceViewSet, LeaveTypeViewSet, LeaveViewSet,
    PerformanceReviewViewSet, WorkforceAnalyticsView, EmployeeAssetViewSet,
    HolidayCalendarViewSet, EmployeeAvailabilityViewSet, PayrollSummaryViewSet
)

router = DefaultRouter()
router.register(r'departments', DepartmentViewSet, basename='department')
router.register(r'designations', DesignationViewSet, basename='designation')
router.register(r'employees', EmployeeViewSet, basename='employee')
router.register(r'shifts', ShiftViewSet, basename='shift')
router.register(r'schedules', ScheduleViewSet, basename='schedule')
router.register(r'attendance', AttendanceViewSet, basename='attendance')
router.register(r'leave-types', LeaveTypeViewSet, basename='leave-type')
router.register(r'leaves', LeaveViewSet, basename='leave')
router.register(r'reviews', PerformanceReviewViewSet, basename='review')
router.register(r'assets', EmployeeAssetViewSet, basename='asset')
router.register(r'holidays', HolidayCalendarViewSet, basename='holiday')
router.register(r'availabilities', EmployeeAvailabilityViewSet, basename='availability')
router.register(r'payroll-summaries', PayrollSummaryViewSet, basename='payroll-summary')

urlpatterns = [
    path('analytics/', WorkforceAnalyticsView.as_view(), name='workforce-analytics'),
    path('', include(router.urls)),
]
