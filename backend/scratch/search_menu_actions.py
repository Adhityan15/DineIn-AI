with open("c:/Users/adhit/Downloads/Ai_DineIn_Management/frontend/src/pages/Menu.jsx", "r", encoding="utf-8") as f:
    content = f.read()

for i, line in enumerate(content.split("\n")):
    if "client." in line or "/menu-items" in line:
        print(f"Line {i+1}: {line.strip()}")
