from django.db.models import Count
from apps.staff.models import Employee
from apps.core.models import Branch

print("=================== STEP 1: DATABASE DIAGNOSTIC ===================")
print("TOTAL EMPLOYEES IN DATABASE:", Employee.objects.count())
print("TOTAL BRANCHES IN DATABASE:", Branch.objects.count())

print("\n--- ALL BRANCHES AND EMPLOYEE COUNTS ---")
for b in Branch.objects.all():
    emp_count = Employee.objects.filter(branch=b).count()
    print(f"ID: {b.id} | Code: {b.branch_code:<25} | Name: {b.name:<30} | Employee Count: {emp_count}")

print("\n--- GROUPED BY BRANCH ---")
for item in Employee.objects.values('branch_id', 'branch__name', 'branch__branch_code').annotate(count=Count('id')):
    print(f"Branch ID: {item['branch_id']} | Code: {item['branch__branch_code']} | Name: {item['branch__name']} | Count: {item['count']}")
print("=================================================================")
