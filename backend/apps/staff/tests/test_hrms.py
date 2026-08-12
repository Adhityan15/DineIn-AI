import pytest
from django.urls import reverse
from rest_framework import status
from django.utils import timezone
from apps.staff.models import Employee, EmployeeDocument, EmployeeAsset, EmployeeAward, EmployeeTimelineEvent, Department, Designation
from django.contrib.auth import get_user_model

User = get_user_model()

@pytest.mark.django_db
class TestEmployeeHRMS:
    @pytest.fixture(autouse=True)
    def setup_method(self, db):
        self.user = User.objects.create_user(
            email="hrms_test@example.com",
            username="hrms_test",
            password="testpassword123",
            first_name="HRMS",
            last_name="Test"
        )
        self.dept = Department.objects.create(name="Kitchen Staff", code="kitchen")
        self.desig = Designation.objects.create(name="Line Cook", department=self.dept)
        self.employee = Employee.objects.create(
            user=self.user,
            employee_id="EMP-TEST-999",
            designation=self.desig,
            hire_date=timezone.now().date(),
            hourly_rate=15.00
        )

    def test_employee_creation_generates_qr(self):
        assert self.employee.qr_code_id.startswith("EMP-QR-")
        assert self.employee.joining_date == self.employee.hire_date

    def test_employee_document_creation(self):
        doc = EmployeeDocument.objects.create(
            employee=self.employee,
            document_type="pan",
            document_number="ABCDE1234F",
            file_url="https://s3.aws.com/doc.pdf"
        )
        assert doc.document_number == "ABCDE1234F"
        assert doc.document_type == "pan"
        assert self.employee.documents.count() == 1

    def test_employee_timeline_event(self):
        event = EmployeeTimelineEvent.objects.create(
            employee=self.employee,
            event_type="joined",
            title="Joined Company",
            description="Onboarded successfully as Cook.",
            event_date=timezone.now().date()
        )
        assert event.event_type == "joined"
        assert self.employee.timeline_events.count() == 1

    def test_employee_assets_issue_and_return(self):
        asset = EmployeeAsset.objects.create(
            employee=self.employee,
            asset_type="laptop",
            asset_name="Macbook Air",
            serial_number="C02XXYYZZ",
            assigned_date=timezone.now().date()
        )
        assert asset.returned is False
        assert asset.returned_date is None
        
        # Return asset
        asset.returned = True
        asset.returned_date = timezone.now().date()
        asset.save()
        assert asset.returned is True
        assert asset.returned_date is not None

    def test_employee_awards(self):
        award = EmployeeAward.objects.create(
            employee=self.employee,
            title="Star Cook of the Month",
            award_date=timezone.now().date(),
            description="Exemplary kitchen efficiency and hygiene."
        )
        assert award.title == "Star Cook of the Month"
        assert self.employee.awards.count() == 1
