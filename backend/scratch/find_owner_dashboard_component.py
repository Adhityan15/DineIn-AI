with open("c:/Users/adhit/Downloads/Ai_DineIn_Management/frontend/src/pages/Dashboard.jsx", "r", encoding="utf-8") as f:
    content = f.read()

lines = content.split("\n")
for i, line in enumerate(lines):
    if "const OwnerDashboard" in line or "function OwnerDashboard" in line:
        print(f"OwnerDashboard starts at Line {i+1}: {line}")
