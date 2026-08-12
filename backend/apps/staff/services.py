import math
from decimal import Decimal
from django.db import transaction
from django.utils import timezone
from django.core.exceptions import ValidationError
from django.db.models import Sum, Avg, Q
from apps.staff.models import (
    Department, Designation, Employee, Shift, Schedule, Attendance, LeaveType, Leave, PerformanceReview
)
from apps.core.models import Branch

class AttendanceService:
    @staticmethod
    def calculate_distance(lat1, lon1, lat2, lon2):
        """
        Calculate distance between two GPS coordinates in meters using the Haversine formula.
        """
        if not lat1 or not lon1 or not lat2 or not lon2:
            return 0.0
        
        R = 6371000.0  # Earth radius in meters
        phi1 = math.radians(float(lat1))
        phi2 = math.radians(float(lat2))
        delta_phi = math.radians(float(lat2) - float(lat1))
        delta_lambda = math.radians(float(lon2) - float(lon1))

        a = (math.sin(delta_phi / 2.0) ** 2 +
             math.cos(phi1) * math.cos(phi2) *
             math.sin(delta_lambda / 2.0) ** 2)
        c = 2.0 * math.atan2(math.sqrt(a), math.sqrt(1.0 - a))
        
        return R * c

    @staticmethod
    @transaction.atomic
    def clock_in(employee, date, clock_in_time, latitude=None, longitude=None, qr_code_scanned=False):
        """
        Log employee clock-in, calculate distance validation (geofencing), and check lateness.
        """
        # 1. Fetch branch coordinates & radius
        # Default to Bangalore Main Branch
        branch = Branch.objects.filter(branch_code='bangalore-main').first()
        is_anomaly = False
        
        if branch and latitude and longitude:
            distance = AttendanceService.calculate_distance(
                latitude, longitude, branch.latitude, branch.longitude
            )
            if distance > branch.geofence_radius:
                is_anomaly = True

        # 2. Check Scheduled Shift time to verify lateness
        is_late = False
        att_status = 'present'
        
        # Check active schedules for today
        schedule = Schedule.objects.filter(employee=employee, date=date).first()
        if schedule:
            shift = schedule.shift
            # Parse shift start time relative to current day
            shift_start_dt = timezone.make_aware(timezone.datetime.combine(date, shift.start_time))
            grace_period = shift_start_dt + timezone.timedelta(minutes=15)
            
            if clock_in_time > grace_period:
                is_late = True
                att_status = 'late'

        attendance, created = Attendance.objects.get_or_create(
            employee=employee,
            date=date,
            defaults={
                'clock_in': clock_in_time,
                'clock_in_latitude': latitude,
                'clock_in_longitude': longitude,
                'is_late': is_late,
                'is_anomaly': is_anomaly,
                'qr_code_scanned': qr_code_scanned,
                'status': att_status
            }
        )
        if not created:
            raise ValidationError("Employee already clocked in for today.")
        
        return attendance

    @staticmethod
    @transaction.atomic
    def clock_out(employee, date, clock_out_time):
        """
        Log clock-out timestamp and compute worked duration and overtime delta.
        """
        attendance = Attendance.objects.filter(employee=employee, date=date).first()
        if not attendance:
            raise ValidationError("No active clock-in session found for today.")
        if attendance.clock_out:
            raise ValidationError("Employee already clocked out for today.")

        attendance.clock_out = clock_out_time
        
        # Calculate overtime hours
        schedule = Schedule.objects.filter(employee=employee, date=date).first()
        if schedule:
            shift = schedule.shift
            # Compute scheduled duration in hours
            shift_start = timezone.make_aware(timezone.datetime.combine(date, shift.start_time))
            shift_end = timezone.make_aware(timezone.datetime.combine(date, shift.end_time))
            scheduled_duration = (shift_end - shift_start).total_seconds() / 3600.0

            actual_duration = (clock_out_time - attendance.clock_in).total_seconds() / 3600.0
            
            if actual_duration > scheduled_duration:
                # Max overtime clamp is 6 hours per day
                overtime = Decimal(str(actual_duration - scheduled_duration))
                attendance.overtime_hours = min(Decimal('6.00'), max(Decimal('0.00'), overtime))

        attendance.save()
        return attendance


class ScheduleService:
    @staticmethod
    @transaction.atomic
    def create_schedule(employee, shift, date):
        """
        Create a shift schedule with conflict checking.
        """
        # 1. Conflict detection: Check approved leaves
        on_leave = Leave.objects.filter(
            employee=employee,
            status='approved',
            start_date__lte=date,
            end_date__gte=date
        ).exists()
        if on_leave:
            raise ValidationError(f"Employee {employee.employee_id} is on approved leave on {date}.")

        # 2. Conflict detection: Check overlapping schedules on same day
        existing_schedules = Schedule.objects.filter(employee=employee, date=date)
        for esc in existing_schedules:
            # Overlap checking: Shift A start_time < Shift B end_time AND Shift B start_time < Shift A end_time
            if (shift.start_time < esc.shift.end_time and esc.shift.start_time < shift.end_time):
                raise ValidationError(f"Employee {employee.employee_id} is already scheduled on an overlapping shift ({esc.shift.name}) on {date}.")

        schedule = Schedule.objects.create(
            employee=employee,
            shift=shift,
            date=date
        )
        return schedule

    @staticmethod
    @transaction.atomic
    def request_swap(schedule, target_employee):
        """
        Step 1: Employee A requests a shift swap.
        """
        if schedule.employee == target_employee:
            raise ValidationError("Cannot swap shift with yourself.")
        
        # Verify target is scheduled on that date (mutual swap check)
        target_schedule = Schedule.objects.filter(employee=target_employee, date=schedule.date).exists()
        
        schedule.is_swap_requested = True
        schedule.swap_target = target_employee
        schedule.swap_status = 'requested'
        schedule.save()
        return schedule

    @staticmethod
    @transaction.atomic
    def accept_swap(schedule, employee):
        """
        Step 2: Employee B accepts the swap.
        """
        if schedule.swap_target != employee:
            raise ValidationError("You are not the designated recipient of this swap request.")
        if schedule.swap_status != 'requested':
            raise ValidationError("No active swap request found for this schedule.")

        schedule.swap_status = 'accepted'
        schedule.save()
        return schedule

    @staticmethod
    @transaction.atomic
    def approve_swap(schedule, manager, approve=True):
        """
        Step 3: Manager approves or rejects the swap.
        """
        if schedule.swap_status != 'accepted':
            raise ValidationError("Swap request must be accepted by target employee before approval.")

        if approve:
            employee_a = schedule.employee
            employee_b = schedule.swap_target
            
            # Perform mutual schedule swap:
            # Employee A scheduled shift goes to Employee B
            schedule.employee = employee_b
            schedule.is_swap_requested = False
            schedule.swap_target = None
            schedule.swap_status = 'approved'
            schedule.save()

            # If Employee B had a schedule on that day, it gets swapped back to Employee A
            b_schedule = Schedule.objects.filter(employee=employee_b, date=schedule.date).exclude(id=schedule.id).first()
            if b_schedule:
                b_schedule.employee = employee_a
                b_schedule.save()
        else:
            schedule.is_swap_requested = False
            schedule.swap_target = None
            schedule.swap_status = 'rejected'
            schedule.save()

        return schedule


class LeaveService:
    @staticmethod
    @transaction.atomic
    def approve_leave(leave, manager, approve=True):
        """
        Approve or reject employee leave and release scheduled shifts.
        """
        if leave.status != 'pending':
            raise ValidationError("Only pending leave requests can be processed.")

        if approve:
            leave.status = 'approved'
            leave.approved_by = manager
            leave.save()

            # Set employee status
            employee = leave.employee
            employee.status = 'on_leave'
            employee.save()

            # Release and cancel any scheduled shifts during leave date range
            Schedule.objects.filter(
                employee=employee,
                date__gte=leave.start_date,
                date__lte=leave.end_date
            ).delete()
        else:
            leave.status = 'rejected'
            leave.approved_by = manager
            leave.save()

        return leave


class PerformanceService:
    @staticmethod
    def calculate_burnout_risk(employee):
        """
        Compute employee burnout score based on consecutive shifts and overtime.
        """
        # Count consecutive shifts in the past 14 days
        two_weeks_ago = timezone.now().date() - timezone.timedelta(days=14)
        shifts_worked = Attendance.objects.filter(
            employee=employee,
            date__gte=two_weeks_ago
        ).count()

        # Count total overtime hours in the past 14 days
        total_overtime = Attendance.objects.filter(
            employee=employee,
            date__gte=two_weeks_ago
        ).aggregate(Sum('overtime_hours'))['overtime_hours__sum'] or Decimal('0.00')

        # Burnout risk estimation: shifts count * 5 + overtime * 3
        risk = (shifts_worked * 5) + (float(total_overtime) * 3)
        return min(100.0, max(0.0, risk))


class HRMasterService:
    @staticmethod
    @transaction.atomic
    def transfer_branch(employee, new_branch, acting_user=None):
        old_branch = employee.branch
        employee.branch = new_branch
        employee.save()
        
        from apps.staff.models import EmployeeTimelineEvent
        EmployeeTimelineEvent.objects.create(
            employee=employee,
            event_type='transferred',
            title=f"Transferred to {new_branch.name}",
            description=f"Branch transferred from {old_branch.name if old_branch else 'Unassigned'} to {new_branch.name}.",
            event_date=timezone.now().date()
        )
        return employee

    @staticmethod
    @transaction.atomic
    def promote_employee(employee, new_designation, new_salary=None, new_department=None, acting_user=None):
        old_designation = employee.designation
        old_salary = employee.salary
        
        employee.designation = new_designation
        if new_department:
            employee.department = new_department
        elif new_designation and new_designation.department:
            employee.department = new_designation.department
            
        if new_salary and new_salary != old_salary:
            employee.increment_amount = Decimal(str(new_salary)) - Decimal(str(old_salary))
            employee.salary = new_salary
            
        employee.promotion_date = timezone.now().date()
        employee.save()
        
        from apps.staff.models import EmployeeTimelineEvent
        EmployeeTimelineEvent.objects.create(
            employee=employee,
            event_type='promotion',
            title=f"Promoted to {new_designation.name}",
            description=f"Promoted from {old_designation.name if old_designation else 'Staff'} to {new_designation.name}. New Salary: ${employee.salary}.",
            event_date=timezone.now().date()
        )
        return employee

    @staticmethod
    @transaction.atomic
    def deactivate_employee(employee, exit_reason="Termination / Exit", exit_date=None, acting_user=None):
        employee.status = 'terminated'
        employee.exit_date = exit_date or timezone.now().date()
        employee.exit_reason = exit_reason
        employee.shift = None
        employee.save()
        
        from apps.staff.models import EmployeeTimelineEvent
        EmployeeTimelineEvent.objects.create(
            employee=employee,
            event_type='warning',
            title="Employment Deactivated",
            description=f"Employee deactivated: {exit_reason}",
            event_date=timezone.now().date()
        )
        return employee

    @staticmethod
    def get_organization_chart(branch_id=None):
        queryset = Employee.objects.select_related('user', 'designation', 'department', 'manager', 'branch').filter(status='active')
        if branch_id:
            queryset = queryset.filter(branch_id=branch_id)
            
        employees = list(queryset)
        nodes = {}
        roots = []
        
        for emp in employees:
            nodes[str(emp.id)] = {
                "id": str(emp.id),
                "employee_id": emp.employee_id,
                "name": emp.user.get_full_name() or emp.user.username,
                "email": emp.user.email,
                "designation": emp.designation.name if emp.designation else "Staff",
                "department": emp.department.name if emp.department else "General",
                "branch": emp.branch.name if emp.branch else "HQ",
                "avatar": None,
                "subordinates": []
            }
            
        for emp in employees:
            node = nodes[str(emp.id)]
            if emp.manager and str(emp.manager.id) in nodes:
                nodes[str(emp.manager.id)]["subordinates"].append(node)
            else:
                roots.append(node)
                
        return roots
