with open("c:/Users/adhit/Downloads/Ai_DineIn_Management/backend/apps/core/models.py", "r", encoding="utf-8") as f:
    lines = f.readlines()

for idx, line in enumerate(lines):
    if "deduct_ingredients_for_order" in line:
        for i in range(idx-5, idx+15):
            print(f"{idx}:{i+1}: {lines[i].strip()}")
        break
