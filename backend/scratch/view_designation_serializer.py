with open("c:/Users/adhit/Downloads/Ai_DineIn_Management/backend/apps/staff/serializers.py", "r", encoding="utf-8") as f:
    lines = f.readlines()

for idx, line in enumerate(lines):
    if "class DesignationSerializer" in line:
        for i in range(idx, idx+15):
            print(f"{i+1}: {lines[i].strip()}")
