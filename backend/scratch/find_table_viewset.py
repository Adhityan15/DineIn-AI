with open("c:/Users/adhit/Downloads/Ai_DineIn_Management/backend/apps/inventory/views.py", "r") as f:
    lines = f.readlines()
for i, line in enumerate(lines):
    if "class Table" in line or "TableViewSet" in line:
        print(f"Line {i+1}: {line.strip()}")
