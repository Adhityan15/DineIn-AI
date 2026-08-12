with open("c:/Users/adhit/Downloads/Ai_DineIn_Management/frontend/src/pages/Dashboard.jsx", "r", encoding="utf-8") as f:
    content = f.read()

lines = content.split("\n")
print("Total lines:", len(lines))
# Let's search for role checks (like "owner" or "admin" or "manager")
for i, line in enumerate(lines):
    if "role" in line or "dashboard" in line or "fetch" in line or "state" in line:
        if len(line) < 150:
            print(f"Line {i+1}: {line.strip()}")
