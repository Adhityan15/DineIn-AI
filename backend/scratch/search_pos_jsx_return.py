with open("c:/Users/adhit/Downloads/Ai_DineIn_Management/frontend/src/pages/POS.jsx", "r", encoding="utf-8") as f:
    content = f.read()

lines = content.split("\n")
return_lines = []
for i, line in enumerate(lines):
    if "return (" in line or "return  (" in line:
        return_lines.append(i+1)
print("Return lines:", return_lines)
