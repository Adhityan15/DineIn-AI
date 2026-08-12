with open("c:/Users/adhit/Downloads/Ai_DineIn_Management/backend/apps/reservation/models.py", "r", encoding="utf-8") as f:
    lines = f.readlines()

for line in lines:
    if "class " in line:
        print(line.strip())
