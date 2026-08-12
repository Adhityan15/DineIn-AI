with open("c:/Users/adhit/Downloads/Ai_DineIn_Management/backend/apps/reservation/serializers.py", "r", encoding="utf-8") as f:
    lines = f.readlines()

for idx, line in enumerate(lines):
    if "class ReservationSerializer" in line:
        for i in range(idx, idx+25):
            print(f"{i+1}: {lines[i].strip()}")
