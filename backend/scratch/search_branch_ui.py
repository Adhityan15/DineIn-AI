with open("c:/Users/adhit/Downloads/Ai_DineIn_Management/frontend/src/pages/POS.jsx", "r") as f:
    lines = f.readlines()
for i, line in enumerate(lines):
    if "branch" in line.lower() and ("select" in line.lower() or "picker" in line.lower() or "option" in line.lower()):
        print(f"Line {i+1}: {line.strip()}")
