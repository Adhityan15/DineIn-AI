with open("c:/Users/adhit/Downloads/Ai_DineIn_Management/frontend/src/pages/Communication.jsx", "r", encoding="utf-8") as f:
    content = f.read()

lines = content.split("\n")
for i, line in enumerate(lines):
    if "filteredLogs" in line:
        print(f"Line {i+1}: {line.strip()}")
