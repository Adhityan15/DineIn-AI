with open("c:/Users/adhit/Downloads/Ai_DineIn_Management/frontend/src/pages/POS.jsx", "r", encoding="utf-8") as f:
    lines = f.readlines()
for idx, line in enumerate(lines):
    if "transfer" in line.lower() or "merge" in line.lower() or "drawer" in line.lower():
        print(f"{idx+1}: {line.strip()}")
