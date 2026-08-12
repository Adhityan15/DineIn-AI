with open("c:/Users/adhit/Downloads/Ai_DineIn_Management/frontend/src/layouts/DashboardLayout.jsx", "r", encoding="utf-8") as f:
    content = f.read()

lines = content.split('\n')
for idx, line in enumerate(lines):
    if "branch" in line.lower() or "switcher" in line.lower():
        if "select" in line.lower() or "dropdown" in line.lower() or "button" in line.lower():
            for i in range(idx-2, idx+15):
                print(f"{idx}:{i+1}: {lines[i].strip()}")
            print("-" * 30)
