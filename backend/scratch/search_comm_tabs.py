with open("c:/Users/adhit/Downloads/Ai_DineIn_Management/frontend/src/pages/Communication.jsx", "r", encoding="utf-8") as f:
    content = f.read()

lines = content.split("\n")
for i, line in enumerate(lines):
    if "tab.label" in line or "TabIcon" in line:
        print(f"Line {i+1}: {line.strip()}")
        for j in range(max(0, i-5), min(len(lines), i+15)):
            print(f"  Line {j+1}: {lines[j]}")
