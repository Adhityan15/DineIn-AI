with open("c:/Users/adhit/Downloads/Ai_DineIn_Management/backend/apps/inventory/models.py", "r", encoding="utf-8") as f:
    lines = f.readlines()

for idx, line in enumerate(lines):
    if "class Order(" in line:
        for i in range(idx, idx+35):
            print(f"{i+1}: {lines[i].strip()}")
