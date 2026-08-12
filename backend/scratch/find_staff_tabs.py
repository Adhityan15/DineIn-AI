with open("c:/Users/adhit/Downloads/Ai_DineIn_Management/frontend/src/pages/Staff.jsx", "r", encoding="utf-8") as f:
    lines = f.readlines()

for idx, line in enumerate(lines):
    if "const [" in line or "return (" in line or "tab" in line.lower():
        if 80 < idx < 160:
            print(f"Line {idx+1}: {line.strip()}")
