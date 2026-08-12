with open("c:/Users/adhit/Downloads/Ai_DineIn_Management/backend/apps/inventory/services.py", "r", encoding="utf-8") as f:
    content = f.read()

lines = content.split("\n")
for i, line in enumerate(lines):
    if "class " in line or "def " in line:
        if len(line) < 150:
            print(f"Line {i+1}: {line}")
