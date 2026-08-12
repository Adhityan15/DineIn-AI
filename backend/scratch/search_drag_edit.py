with open("c:/Users/adhit/Downloads/Ai_DineIn_Management/frontend/src/pages/Reservations.jsx", "r", encoding="utf-8") as f:
    content = f.read()

lines = content.split("\n")
for i, line in enumerate(lines):
    if "drag" in line.lower() or "edit" in line.lower() or "mode" in line.lower() or "save" in line.lower():
        if "const " in line or "function " in line or "onClick" in line or "onDrag" in line:
            print(f"Line {i+1}: {line.strip()}")
