with open("c:/Users/adhit/Downloads/Ai_DineIn_Management/backend/apps/inventory/services.py", "r", encoding="utf-8") as f:
    lines = f.readlines()

for idx, line in enumerate(lines):
    if "class " in line:
        print(f"Line {idx+1}: {line.strip()}")
