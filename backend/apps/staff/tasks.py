from celery import shared_task
from django.utils import timezone
from apps.staff.models import Employee, Attendance, Schedule, PerformanceReview
from apps.staff.services import PerformanceService
from apps.reservation.models import Reservation
from decimal import Decimal

@shared_task
def evaluate_workforce_burnout():
    """
    Weekly background task to calculate burnout risk indices for all active employees.
    """
    employees = Employee.objects.filter(status='active')
    results = []
    for emp in employees:
        risk = PerformanceService.calculate_burnout_risk(emp)
        
        # Save a periodic review placeholder or flag dashboard notifications
        # Let's save a placeholder performance review with the burnout calculation
        review = PerformanceReview.objects.create(
            employee=emp,
            reviewer=emp,  # self-evaluated background reference
            review_date=timezone.now().date(),
            score=5,
            feedback=f"System generated weekly burnout risk evaluation: {round(risk, 2)}%",
            burnout_risk=Decimal(str(risk))
        )
        results.append({
            "employee_id": emp.employee_id,
            "burnout_risk": float(risk)
        })
    return results


@shared_task
def evaluate_staffing_shortages():
    """
    Daily background task to forecast if upcoming days have high reservation volume with low staff scheduling.
    """
    today = timezone.now().date()
    alerts = []
    for i in range(1, 4):
        check_date = today + timezone.timedelta(days=i)
        res_count = Reservation.objects.filter(date=check_date).count()
        staff_count = Schedule.objects.filter(date=check_date).count()

        if res_count > 0 and staff_count == 0:
            alerts.append(f"CRITICAL: {res_count} reservations scheduled on {check_date} but no employees are rostered.")
        elif staff_count > 0 and (res_count / staff_count) > 8:
            alerts.append(f"WARNING: Understaffed day on {check_date}. Customer-to-staff ratio is high: {round(res_count / staff_count, 1)}")
            
    return alerts
