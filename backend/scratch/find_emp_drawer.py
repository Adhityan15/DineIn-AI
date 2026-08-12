with open("c:/Users/adhit/Downloads/Ai_DineIn_Management/frontend/src/pages/Staff.jsx", "r", encoding="utf-8") as f:
    content = f.read()

lines = content.split("\n")
for i, line in enumerate(lines):
    if "employeeDrawerOpen" in line or "user_email" in line:
        if len(line) < 150:
            print(f"Line {i+1}: {line.strip()}")
