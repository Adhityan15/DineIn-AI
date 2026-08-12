with open("c:/Users/adhit/Downloads/Ai_DineIn_Management/frontend/src/pages/Dashboard.jsx", "r", encoding="utf-8") as f:
    lines = f.readlines()

for idx, line in enumerate(lines):
    if "api" in line or "fetch" in line or "axios" in line or "useEffect" in line:
        print(f"Line {idx+1}: {line.strip()}")
