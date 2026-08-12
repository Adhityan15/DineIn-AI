with open("c:/Users/adhit/Downloads/Ai_DineIn_Management/backend/apps/core/views.py", "r", encoding="utf-8") as f:
    content = f.read()

lines = content.split("\n")
for i, line in enumerate(lines):
    if "class BranchViewSet" in line or "class Branch" in line:
        for j in range(max(0, i-5), min(len(lines), i+25)):
            print(f"Line {j+1}: {lines[j]}")
