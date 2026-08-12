with open("c:/Users/adhit/Downloads/Ai_DineIn_Management/frontend/src/pages/Dashboard.jsx", "r", encoding="utf-8") as f:
    content = f.read()

lines = content.split("\n")
for i, line in enumerate(lines):
    if "client.get" in line or "client.post" in line:
        print(f"Line {i+1}: {line.strip()}")
