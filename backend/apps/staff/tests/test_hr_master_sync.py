import pytest
from django.utils import timezone
from apps.authentication.models import User
from apps.core.models import Branch, Restaurant
from apps.staff.models import Department, Designation, Employee
from apps.staff.services import HRMasterService

@pytest.fixture
def test_restaurant(db):
    return Restaurant.objects.create(
        name="Test Restaurant",
        code="test-rest",
        contact_email="test@rest.com",
        contact_phone="1234567890",
        address="Test Address"
    )

@pytest.mark.django_db
def test_employee_branch_transfer_syncs_user_branch(test_restaurant):
    branch1 = Branch.objects.create(restaurant=test_restaurant, name="Main Branch", branch_code="main-1")
    branch2 = Branch.objects.create(restaurant=test_restaurant, name="Branch Two", branch_code="branch-2")
    user = User.objects.create(username="test_emp_user", email="emp@test.com", branch=branch1)
    dept = Department.objects.create(name="Service", code="service-dept", branch=branch1)
    des = Designation.objects.create(name="Waiter", department=dept)
    
    emp = Employee.objects.create(
        user=user,
        employee_id="EMP-001",
        designation=des,
        hire_date=timezone.now().date(),
        hourly_rate=20.00,
        branch=branch1,
        department=dept
    )
    
    assert emp.user.branch == branch1
    
    # Transfer branch
    HRMasterService.transfer_branch(emp, branch2)
    
    emp.refresh_from_db()
    user.refresh_from_db()
    
    assert emp.branch == branch2
    assert user.branch == branch2


@pytest.mark.django_db
def test_employee_deactivation_disables_user_login(test_restaurant):
    branch = Branch.objects.create(restaurant=test_restaurant, name="Main Branch", branch_code="main-2")
    user = User.objects.create(username="emp_active", email="active@test.com", branch=branch, is_active=True)
    dept = Department.objects.create(name="Kitchen", code="kitchen-dept", branch=branch)
    des = Designation.objects.create(name="Cook", department=dept)
    
    emp = Employee.objects.create(
        user=user,
        employee_id="EMP-002",
        designation=des,
        hire_date=timezone.now().date(),
        hourly_rate=25.00,
        branch=branch,
        department=dept,
        status="active"
    )
    
    assert emp.user.is_active is True
    
    # Deactivate employee
    HRMasterService.deactivate_employee(emp, exit_reason="Left company")
    
    emp.refresh_from_db()
    user.refresh_from_db()
    
    assert emp.status == "terminated"
    assert user.is_active is False


@pytest.mark.django_db
def test_reporting_manager_hierarchy_and_org_chart(test_restaurant):
    branch = Branch.objects.create(restaurant=test_restaurant, name="Main Branch", branch_code="main-3")
    dept = Department.objects.create(name="Management", code="mgmt-dept", branch=branch)
    des_mgr = Designation.objects.create(name="General Manager", department=dept, hierarchy_level=4)
    des_staff = Designation.objects.create(name="Staff Member", department=dept, hierarchy_level=1)
    
    user_mgr = User.objects.create(username="mgr_user", email="mgr@test.com", branch=branch)
    user_staff = User.objects.create(username="staff_user", email="staff@test.com", branch=branch)
    
    mgr = Employee.objects.create(
        user=user_mgr, employee_id="EMP-MGR", designation=des_mgr, hire_date=timezone.now().date(), hourly_rate=40.00, branch=branch, department=dept
    )
    staff = Employee.objects.create(
        user=user_staff, employee_id="EMP-STAFF", designation=des_staff, hire_date=timezone.now().date(), hourly_rate=20.00, branch=branch, department=dept, manager=mgr
    )
    
    chain = staff.get_reporting_chain()
    assert len(chain) == 1
    assert chain[0]["employee_id"] == "EMP-MGR"
    
    subs = mgr.get_subordinates()
    assert len(subs) == 1
    assert subs[0]["employee_id"] == "EMP-STAFF"
    
    tree = HRMasterService.get_organization_chart(branch.id)
    assert len(tree) == 1
    assert tree[0]["employee_id"] == "EMP-MGR"
    assert len(tree[0]["subordinates"]) == 1
    assert tree[0]["subordinates"][0]["employee_id"] == "EMP-STAFF"
