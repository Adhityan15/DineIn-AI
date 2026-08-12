with open("c:/Users/adhit/Downloads/Ai_DineIn_Management/frontend/src/pages/Staff.jsx", "r", encoding="utf-8") as f:
    lines = f.readlines()

for idx, line in enumerate(lines):
    if "const handleEmployeeSubmit" in line:
        for i in range(idx, idx+25):
            print(f"{i+1}: {lines[i].strip()}")
