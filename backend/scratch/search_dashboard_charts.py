with open("c:/Users/adhit/Downloads/Ai_DineIn_Management/frontend/src/pages/Dashboard.jsx", "r", encoding="utf-8") as f:
    lines = f.readlines()

for idx, line in enumerate(lines):
    if "grid grid-cols-1 lg:grid-cols-2" in line or "grid grid-cols-1 lg:grid-cols-3" in line or "col-span-" in line:
        print(f"Line {idx+1}: {line.strip()}")
