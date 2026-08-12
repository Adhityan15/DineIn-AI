with open("c:/Users/adhit/Downloads/Ai_DineIn_Management/backend/apps/inventory/models.py", "r", encoding="utf-8") as f:
    lines = f.readlines()

for idx, line in enumerate(lines):
    if "prep" in line.lower() or "time" in line.lower():
        print(f"Line {idx+1}: {line.strip()}")
