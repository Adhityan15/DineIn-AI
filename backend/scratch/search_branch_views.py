with open("c:/Users/adhit/Downloads/Ai_DineIn_Management/backend/apps/core/views.py", "r", encoding="utf-8") as f:
    content = f.read()

if "BranchViewSet" in content:
    print("BranchViewSet exists in apps/core/views.py!")
else:
    print("BranchViewSet does NOT exist in apps/core/views.py.")
