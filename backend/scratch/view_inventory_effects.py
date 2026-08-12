with open("c:/Users/adhit/Downloads/Ai_DineIn_Management/frontend/src/pages/Inventory.jsx", "r", encoding="utf-8") as f:
    lines = f.readlines()

for idx, line in enumerate(lines):
    if "useEffect" in line or "const fetch" in line:
        print(f"Line {idx+1}: {line.strip()}")
