from django.contrib.auth import get_user_model
from apps.core.models import Branch

User = get_user_model()
print("BRANCHES:")
for b in Branch.objects.all():
    print(f"  Branch ID: {b.id} | Name: {b.name} | Code: {b.branch_code}")

print("\nUSERS:")
for u in User.objects.all():
    branch_name = u.branch.name if getattr(u, 'branch', None) else "None"
    branch_id = u.branch.id if getattr(u, 'branch', None) else "None"
    role = getattr(u, 'role', None)
    role_code = role.code if role else "None"
    print(f"  Username: {u.username} | Email: {u.email} | Role: {role_code} | Branch: {branch_name} ({branch_id})")
