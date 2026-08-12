import pytest
from django.urls import reverse
from rest_framework import status
from django.utils import timezone
from apps.staff.models import Employee, Attendance, EmployeeBreak, HolidayCalendar, Department, Designation
from django.contrib.auth import get_user_model

User = get_user_model()

@pytest.fixture
def attendance_setup(db):
    dept = Department.objects.create(name="Service Team", code="service")
    desig = Designation.objects.create(name="Waiter", department=dept)
    user = User.objects.create_user(
        email="att_test@example.com",
        username="att_test",
        password="testpassword123",
        first_name="Attendance",
        last_name="Test"
    )
    employee = Employee.objects.create(
        user=user,
        employee_id="EMP-ATT-777",
        designation=desig,
        hire_date=timezone.now().date(),
        hourly_rate=12.50
    )
    return user, employee


@pytest.mark.django_db
def test_clock_in_success(api_client, attendance_setup):
    user, employee = attendance_setup
    api_client.force_authenticate(user=user)
    
    url = reverse('attendance-clock-in')
    payload = {
        "latitude": "12.9716",
        "longitude": "77.5946",
        "qr_code_scanned": True
    }
    res = api_client.post(url, payload, format='json')
    assert res.status_code == status.HTTP_201_CREATED
    assert res.data['success'] is True
    assert Attendance.objects.filter(employee=employee).exists()


@pytest.mark.django_db
def test_double_clock_in_fails(api_client, attendance_setup):
    user, employee = attendance_setup
    api_client.force_authenticate(user=user)
    
    url = reverse('attendance-clock-in')
    payload = {
        "latitude": "12.9716",
        "longitude": "77.5946",
        "qr_code_scanned": True
    }
    api_client.post(url, payload, format='json')
    res = api_client.post(url, payload, format='json')
    assert res.status_code == status.HTTP_400_BAD_REQUEST
    assert res.data['success'] is False


@pytest.mark.django_db
def test_clock_out_success(api_client, attendance_setup):
    user, employee = attendance_setup
    api_client.force_authenticate(user=user)
    
    att = Attendance.objects.create(
        employee=employee,
        date=timezone.now().date(),
        clock_in=timezone.now(),
        status='present'
    )
    url = reverse('attendance-clock-out')
    res = api_client.post(url, format='json')
    assert res.status_code == status.HTTP_200_OK
    assert res.data['success'] is True
    att.refresh_from_db()
    assert att.clock_out is not None


@pytest.mark.django_db
def test_break_lifecycle_success(api_client, attendance_setup):
    user, employee = attendance_setup
    api_client.force_authenticate(user=user)
    
    att = Attendance.objects.create(
        employee=employee,
        date=timezone.now().date(),
        clock_in=timezone.now(),
        status='present'
    )

    url_start = reverse('attendance-start-break')
    res_start = api_client.post(url_start, {"is_paid": True, "description": "Tea break"}, format='json')
    assert res_start.status_code == status.HTTP_200_OK
    assert EmployeeBreak.objects.filter(attendance=att, end_time__isnull=True).exists()

    res_start_double = api_client.post(url_start, {"is_paid": True}, format='json')
    assert res_start_double.status_code == status.HTTP_400_BAD_REQUEST

    url_end = reverse('attendance-end-break')
    res_end = api_client.post(url_end, format='json')
    assert res_end.status_code == status.HTTP_200_OK
    assert not EmployeeBreak.objects.filter(attendance=att, end_time__isnull=True).exists()


@pytest.mark.django_db
def test_holiday_calendar_crud(api_client, attendance_setup):
    user, employee = attendance_setup
    api_client.force_authenticate(user=user)
    
    url = reverse('holiday-list')
    payload = {
        "name": "Independence Day",
        "date": "2026-08-15",
        "description": "National Holiday"
    }
    res = api_client.post(url, payload, format='json')
    assert res.status_code == status.HTTP_201_CREATED
    assert HolidayCalendar.objects.filter(name="Independence Day").exists()
