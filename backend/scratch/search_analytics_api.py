with open("c:/Users/adhit/Downloads/Ai_DineIn_Management/backend/apps/notifications/views.py", "r", encoding="utf-8") as f:
    content = f.read()

lines = content.split("\n")
for i, line in enumerate(lines):
    if "analytics" in line:
        print(f"Line {i+1}: {line}")
