with open("c:/Users/adhit/Downloads/Ai_DineIn_Management/backend/apps/core/models.py", "r", encoding="utf-8") as f:
    content = f.read()

lines = content.split("\n")
for i, line in enumerate(lines):
    if "class Branch" in line or "auto_confirm" in line or "confirm" in line:
        print(f"Line {i+1}: {line.strip()}")
