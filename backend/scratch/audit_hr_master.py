import os
import sys
import django

sys.path.insert(0, 'c:/Users/adhit/Downloads/Ai_DineIn_Management/backend')
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'dinein_project.settings.development')
django.setup()

from apps.authentication.models import User, Role, Permission
from apps.core.models import Branch
from apps.staff.models import (
    Department, Designation, Employee, Attendance, Leave, 
    EmployeeAsset, EmployeeAward, Shift, Schedule, PerformanceReview
)

print("=== EMPLOYEE CRM & HR MASTER MODEL AUDIT ===")
print(f"Total Users: {User.objects.count()}")
print(f"Total Employees: {Employee.objects.count()}")
print(f"Total Departments: {Department.objects.count()}")
print(f"Total Designations: {Designation.objects.count()}")
print(f"Total Branches: {Branch.objects.count()}")

print("\n--- Department List ---")
for d in Department.objects.all():
    print(f"  ID: {d.id} | Name: {d.name} | Branch: {d.branch}")

print("\n--- Designation List ---")
for des in Designation.objects.all():
    print(f"  ID: {des.id} | Title: {des.title} | Dept: {des.department.name if des.department else 'None'}")

print("\n--- Sample Employee Records ---")
for emp in Employee.objects.all()[:5]:
    manager_str = f"{emp.manager.user.username}" if emp.manager else "No Manager"
    print(f"  Emp ID: {emp.employee_id} | User: {emp.user.username} | Email: {emp.user.email} | Dept: {emp.department.name if emp.department else 'None'} | Manager: {manager_str} | Status: {emp.status}")
