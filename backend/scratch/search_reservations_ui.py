with open("c:/Users/adhit/Downloads/Ai_DineIn_Management/frontend/src/pages/Reservations.jsx", "r", encoding="utf-8") as f:
    content = f.read()

lines = content.split("\n")
for i, line in enumerate(lines):
    if "x_coord" in line or "y_coord" in line or "analytics" in line.lower() or "permission" in line.lower() or "role" in line.lower() or "suggest" in line.lower() or "waitlist" in line.lower():
        if "render" in line or "function" in line or "const " in line or "<h3>" in line or "<h2>" in line or "<h4>" in line or "<div" in line:
            print(f"Line {i+1}: {line.strip()}")
