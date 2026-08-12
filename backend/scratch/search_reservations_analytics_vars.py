with open("c:/Users/adhit/Downloads/Ai_DineIn_Management/frontend/src/pages/Reservations.jsx", "r", encoding="utf-8") as f:
    content = f.read()

lines = content.split("\n")
for i, line in enumerate(lines):
    if "successRate" in line or "cancellationRate" in line or "noShowRate" in line or "kpiStats" in line:
        print(f"Line {i+1}: {line.strip()}")
