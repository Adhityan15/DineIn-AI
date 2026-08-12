with open("c:/Users/adhit/Downloads/Ai_DineIn_Management/frontend/src/pages/Dashboard.jsx", "r", encoding="utf-8") as f:
    lines = f.readlines()

for idx, line in enumerate(lines):
    if "switch" in line or "role" in line or "return (" in line:
        if idx > 1150: # render is usually at the bottom of the file
            print(f"Line {idx+1}: {line.strip()}")
