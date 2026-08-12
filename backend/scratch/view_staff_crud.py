with open("c:/Users/adhit/Downloads/Ai_DineIn_Management/frontend/src/pages/Staff.jsx", "r", encoding="utf-8") as f:
    content = f.read()

# Let's search for "department" and "designation" in Staff.jsx
lines = content.split('\n')
for idx, line in enumerate(lines):
    if "department" in line.lower() or "designation" in line.lower():
        if "option" in line.lower() or "select" in line.lower() or "fetch" in line.lower() or "button" in line.lower() or "tab" in line.lower():
            print(f"{idx+1}: {line.strip()}")
