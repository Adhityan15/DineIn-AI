with open("c:/Users/adhit/Downloads/Ai_DineIn_Management/frontend/src/pages/Analytics.jsx", "r", encoding="utf-8") as f:
    content = f.read()

lines = content.split("\n")
print("Total lines:", len(lines))
# Let's see if there is any hardcoded data variables, e.g. "revenue" or "profit" or charts data
for i, line in enumerate(lines):
    if "const " in line and ("data" in line.lower() or "chart" in line.lower() or "sales" in line.lower() or "revenue" in line.lower() or "top" in line.lower() or "financial" in line.lower()):
        if len(line) < 120 and "const [" not in line:
            print(f"Line {i+1}: {line.strip()}")
