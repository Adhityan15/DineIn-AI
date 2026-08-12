import os
import django
import requests

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'dinein_project.settings.development')
django.setup()

from django.contrib.auth import get_user_model
from apps.core.models import Branch, Invoice
from apps.reservation.models import Reservation, Table, Waitlist
from apps.inventory.models import InventoryBatch, ReorderAlert
from apps.staff.models import Employee, Attendance
from apps.feedback.models import CustomerReview

print("--- DineIn AI Enterprise SaaS Verification ---")

# 1. Database Check
print("\n1. Active Database Engine Check:")
from django.db import connection
print(f"Active DB Engine: {connection.vendor}")
print(f"Database Name: {connection.settings_dict['NAME']}")

# 2. Record Counts by Branch
print("\n2. Dynamic Branch Isolation Record Counts:")
for b in Branch.objects.all():
    print(f"\nBranch: {b.name} ({b.id})")
    print(f"  - Total Tables: {Table.objects.filter(branch=b).count()}")
    print(f"  - Total Reservations: {Reservation.objects.filter(branch=b).count()}")
    print(f"  - Total Waitlist: {Waitlist.objects.filter(branch=b).count()}")
    print(f"  - Total Inventory Batches: {InventoryBatch.objects.filter(branch=b).count()}")
    print(f"  - Total Employees: {Employee.objects.filter(user__branch=b).count()}")
    print(f"  - Total Attendance Records: {Attendance.objects.filter(employee__user__branch=b).count()}")
    print(f"  - Total Feedback Reviews: {CustomerReview.objects.filter(branch=b).count()}")

print("\nVerification Completed successfully!")
