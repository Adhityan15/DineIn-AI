with open("c:/Users/adhit/Downloads/Ai_DineIn_Management/frontend/src/layouts/DashboardLayout.jsx", "r", encoding="utf-8") as f:
    content = f.read()

lines = content.split('\n')
for idx, line in enumerate(lines):
    if "userrole" in line.lower() and "=" in line:
        for i in range(idx-1, idx+5):
            print(f"{i+1}: {lines[i].strip()}")
        break
