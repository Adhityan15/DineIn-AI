with open("c:/Users/adhit/Downloads/Ai_DineIn_Management/backend/apps/reservation/services.py", "r", encoding="utf-8") as f:
    lines = f.readlines()

for idx, line in enumerate(lines):
    if "waiter" in line.lower():
        print(f"{idx+1}: {line.strip()}")
