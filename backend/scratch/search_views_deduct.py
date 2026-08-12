with open("c:/Users/adhit/Downloads/Ai_DineIn_Management/backend/apps/inventory/views.py", "r", encoding="utf-8") as f:
    lines = f.readlines()

for idx, line in enumerate(lines):
    if "deduct" in line.lower() or "inventoryservice" in line.lower():
        for i in range(idx-2, idx+12):
            print(f"{idx}:{i+1}: {lines[i].strip()}")
        print("-" * 30)
