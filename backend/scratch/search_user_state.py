with open("c:/Users/adhit/Downloads/Ai_DineIn_Management/frontend/src/pages/POS.jsx", "r") as f:
    content = f.read()
for i, line in enumerate(content.split('\n')):
    if "user" in line.lower() and ("const" in line.lower() or "state" in line.lower() or "context" in line.lower() or "prop" in line.lower()):
        print(f"Line {i+1}: {line.strip()}")
