with open("c:/Users/adhit/Downloads/Ai_DineIn_Management/backend/apps/reservation/views.py", "r", encoding="utf-8") as f:
    lines = f.readlines()

for idx, line in enumerate(lines):
    if "branch" in line.lower() or "filter" in line.lower() or "queryset" in line.lower():
        if any(kw in line for kw in ["get_queryset", "branch_id", "params"]):
             print(f"Line {idx+1}: {line.strip()}")
