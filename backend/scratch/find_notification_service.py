with open("c:/Users/adhit/Downloads/Ai_DineIn_Management/backend/apps/notifications/services.py", "r", encoding="utf-8") as f:
    content = f.read()

lines = content.split("\n")
for i, line in enumerate(lines):
    if "class " in line or "def send_" in line:
        print(f"Line {i+1}: {line.strip()}")
