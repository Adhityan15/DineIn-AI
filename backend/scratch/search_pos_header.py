with open("c:/Users/adhit/Downloads/Ai_DineIn_Management/frontend/src/pages/POS.jsx", "r", encoding="utf-8") as f:
    content = f.read()

lines = content.split("\n")
for i, line in enumerate(lines):
    if "return (" in line:
        print(f"Return line: {i+1}")
        for j in range(i, min(i+150, len(lines))):
            print(f"  Line {j+1}: {lines[j]}")
        break
