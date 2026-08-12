import pytest
from decimal import Decimal
from django.utils import timezone
from django.contrib.auth import get_user_model
from django.core.exceptions import ValidationError
from apps.core.models import Branch, Restaurant
from apps.staff.models import (
    Department, Designation, Employee, Shift, Schedule, Attendance, LeaveType, Leave, PerformanceReview
)
from apps.staff.services import AttendanceService, ScheduleService, LeaveService, PerformanceService

User = get_user_model()

@pytest.fixture
def workforce_setup(db):
    restaurant, _ = Restaurant.objects.get_or_create(
        code="test-workforce-diner",
        defaults={"name": "Workforce Diner", "contact_phone": "111", "contact_email": "wf@diner.com"}
    )
    branch, _ = Branch.objects.get_or_create(
        branch_code="bangalore-main",
        defaults={
            "restaurant": restaurant,
            "name": "Bangalore Main Branch",
            "latitude": Decimal("12.9715987"),
            "longitude": Decimal("77.5945627"),
            "geofence_radius": 100
        }
    )
    
    dept = Department.objects.create(name="Kitchen", code="kitchen")
    desig = Designation.objects.create(name="Chef", department=dept)
    
    # Create User A & Employee A
    user_a = User.objects.create_user(
        email="chef.a@dinein.com", password="password", first_name="Chef", last_name="A", username="chef_a"
    )
    emp_a = Employee.objects.create(
        user=user_a, employee_id="EMP-00A", designation=desig,
        hire_date=timezone.now().date(), hourly_rate=Decimal("15.50"), skills="kitchen, inventory"
    )
    
    # Create User B & Employee B
    user_b = User.objects.create_user(
        email="chef.b@dinein.com", password="password", first_name="Chef", last_name="B", username="chef_b"
    )
    emp_b = Employee.objects.create(
        user=user_b, employee_id="EMP-00B", designation=desig,
        hire_date=timezone.now().date(), hourly_rate=Decimal("15.50"), skills="kitchen"
    )
    
    # Create Manager User & Employee
    user_mgr = User.objects.create_user(
        email="mgr@dinein.com", password="password", first_name="Manager", last_name="Chef", username="chef_mgr"
    )
    # Assign manager role in DB if roles exist
    emp_mgr = Employee.objects.create(
        user=user_mgr, employee_id="EMP-MGR", designation=desig,
        hire_date=timezone.now().date(), hourly_rate=Decimal("25.00"), skills="reception, cashier"
    )
    
    # Shifts
    shift_morning = Shift.objects.create(
        name="Morning Cook Shift",
        start_time=timezone.datetime.strptime("08:00:00", "%H:%M:%S").time(),
        end_time=timezone.datetime.strptime("16:00:00", "%H:%M:%S").time()
    )
    shift_evening = Shift.objects.create(
        name="Evening Cook Shift",
        start_time=timezone.datetime.strptime("16:00:00", "%H:%M:%S").time(),
        end_time=timezone.datetime.strptime("23:59:00", "%H:%M:%S").time()
    )

    return {
        "branch": branch,
        "emp_a": emp_a,
        "emp_b": emp_b,
        "emp_mgr": emp_mgr,
        "shift_morning": shift_morning,
        "shift_evening": shift_evening,
    }


@pytest.mark.django_db
def test_gps_geofence_clock_in(workforce_setup):
    emp_a = workforce_setup["emp_a"]
    date_today = timezone.now().date()
    
    # 1. Clock in within geofence radius ( Bangalore main coordinates: 12.9715987, 77.5945627 )
    att_ok = AttendanceService.clock_in(
        employee=emp_a,
        date=date_today,
        clock_in_time=timezone.now(),
        latitude=Decimal("12.9715"),
        longitude=Decimal("77.5945"),
        qr_code_scanned=True
    )
    assert att_ok.is_anomaly is False
    assert att_ok.qr_code_scanned is True
    
    # 2. Clock in outside radius (e.g. coordinates in Mumbai 19.0760, 72.8777)
    emp_b = workforce_setup["emp_b"]
    att_anomaly = AttendanceService.clock_in(
        employee=emp_b,
        date=date_today,
        clock_in_time=timezone.now(),
        latitude=Decimal("19.0760"),
        longitude=Decimal("72.8777")
    )
    assert att_anomaly.is_anomaly is True


@pytest.mark.django_db
def test_shift_conflict_and_leaves(workforce_setup):
    emp_a = workforce_setup["emp_a"]
    emp_mgr = workforce_setup["emp_mgr"]
    shift_m = workforce_setup["shift_morning"]
    shift_e = workforce_setup["shift_evening"]
    date_tomorrow = timezone.now().date() + timezone.timedelta(days=1)
    
    # 1. Roster employee A morning shift - succeeds
    sc1 = ScheduleService.create_schedule(emp_a, shift_m, date_tomorrow)
    assert sc1 is not None
    
    # 2. Attempt to roster employee A on overlapping shift same day - fails
    with pytest.raises(ValidationError):
        ScheduleService.create_schedule(emp_a, shift_m, date_tomorrow)

    # 3. Create approved leave for employee A
    lt = LeaveType.objects.create(name="Sick Leave", code="SL")
    leave = Leave.objects.create(
        employee=emp_a,
        leave_type=lt,
        start_date=date_tomorrow,
        end_date=date_tomorrow,
        reason="Fever"
    )
    # Roster check before approval still valid, but once approved:
    LeaveService.approve_leave(leave, emp_mgr, approve=True)
    emp_a.refresh_from_db()
    assert emp_a.status == 'on_leave'
    
    # The active schedule should have been deleted automatically
    assert not Schedule.objects.filter(employee=emp_a, date=date_tomorrow).exists()

    # Roster on leave date should fail
    with pytest.raises(ValidationError):
        ScheduleService.create_schedule(emp_a, shift_e, date_tomorrow)


@pytest.mark.django_db
def test_three_step_shift_swapping(workforce_setup):
    emp_a = workforce_setup["emp_a"]
    emp_b = workforce_setup["emp_b"]
    emp_mgr = workforce_setup["emp_mgr"]
    shift_m = workforce_setup["shift_morning"]
    date_tomorrow = timezone.now().date() + timezone.timedelta(days=1)

    # Roster Employee A
    sc = ScheduleService.create_schedule(emp_a, shift_m, date_tomorrow)
    
    # Step 1: Employee A requests swap
    ScheduleService.request_swap(sc, emp_b)
    sc.refresh_from_db()
    assert sc.is_swap_requested is True
    assert sc.swap_target == emp_b
    assert sc.swap_status == 'requested'

    # Step 2: Employee B accepts swap
    ScheduleService.accept_swap(sc, emp_b)
    sc.refresh_from_db()
    assert sc.swap_status == 'accepted'

    # Step 3: Manager approves swap
    ScheduleService.approve_swap(sc, emp_mgr, approve=True)
    sc.refresh_from_db()
    assert sc.employee == emp_b
    assert sc.is_swap_requested is False
    assert sc.swap_status == 'approved'


@pytest.mark.django_db
def test_designation_crud_api(api_client, workforce_setup):
    from apps.authentication.models import Role
    admin_role = Role.objects.get(code="admin")
    admin_user = User.objects.create_user(
        username="admin_des", email="admin_des@test.com", password="password", role=admin_role
    )
    api_client.force_authenticate(user=admin_user)
    
    dept = Department.objects.first()
    
    # 1. Create Designation
    url = "/api/v1/workforce/designations/"
    payload = {"name": "New Manager", "department": dept.id}
    res = api_client.post(url, payload)
    assert res.status_code == 201
    des_id = res.data["id"]
    
    # 2. Retrieve Designations
    res = api_client.get(url)
    assert res.status_code == 200
    
    # 3. Update Designation
    url_detail = f"/api/v1/workforce/designations/{des_id}/"
    res = api_client.put(url_detail, {"name": "Senior Manager", "department": dept.id})
    assert res.status_code == 200
    assert res.data["name"] == "Senior Manager"
    
    # 4. Delete Designation
    res = api_client.delete(url_detail)
    assert res.status_code == 204


@pytest.mark.django_db
def test_employee_registration_with_designation(api_client, workforce_setup):
    from apps.authentication.models import Role
    admin_role = Role.objects.get(code="admin")
    admin_user = User.objects.create_user(
        username="admin_emp", email="admin_emp@test.com", password="password", role=admin_role
    )
    api_client.force_authenticate(user=admin_user)

    emp_user = User.objects.create_user(
        username="emp_new", email="emp_new@test.com", password="password"
    )

    dept = Department.objects.first()
    desig = Designation.objects.create(name="Kitchen Assistant", department=dept)

    url = "/api/v1/workforce/employees/"
    payload = {
        "user_email": "emp_new@test.com",
        "employee_id": "EMP-999",
        "designation": desig.id,
        "hourly_rate": "18.50",
        "hire_date": "2026-07-12",
        "skills": "prep, cleanup"
    }

    res = api_client.post(url, payload)
    assert res.status_code == 201
    
    emp = Employee.objects.get(employee_id="EMP-999")
    assert emp.designation == desig
    assert emp.user == emp_user
