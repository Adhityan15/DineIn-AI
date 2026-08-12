with open("c:/Users/adhit/Downloads/Ai_DineIn_Management/frontend/src/pages/Staff.jsx", "r", encoding="utf-8") as f:
    content = f.read()

# Let's search for tab switcher list
lines = content.split('\n')
for idx, line in enumerate(lines):
    if "setActiveTab" in line:
        for i in range(idx-2, idx+15):
            print(f"{i+1}: {lines[i].strip()}")
