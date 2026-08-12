with open("c:/Users/adhit/Downloads/Ai_DineIn_Management/frontend/src/pages/Reservations.jsx", "r", encoding="utf-8") as f:
    content = f.read()

lines = content.split("\n")
for i, line in enumerate(lines):
    if "render" in line.lower() or "return (" in line:
        if "const " in line or "function " in line or "class " in line or "render" in line:
            print(f"Line {i+1}: {line.strip()}")
