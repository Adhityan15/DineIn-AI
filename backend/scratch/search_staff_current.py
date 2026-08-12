with open("c:/Users/adhit/Downloads/Ai_DineIn_Management/backend/apps/staff/views.py", "r") as f:
    lines = f.readlines()
for i, line in enumerate(lines):
    if "query_params.get('branch" in line:
        print(f"Line {i+1}: {line.strip()}")
