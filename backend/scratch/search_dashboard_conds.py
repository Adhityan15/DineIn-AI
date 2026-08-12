with open("c:/Users/adhit/Downloads/Ai_DineIn_Management/frontend/src/pages/Dashboard.jsx", "r", encoding="utf-8") as f:
    content = f.read()

lines = content.split("\n")
for i, line in enumerate(lines):
    if "user?.role === 'customer'" in line or "['kitchen_staff'" in line:
        print(f"Line {i+1}: {line.strip()}")
        for j in range(i, min(len(lines), i+15)):
            print(f"  Line {j+2}: {lines[j+1].strip()}")
