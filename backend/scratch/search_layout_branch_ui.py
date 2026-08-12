with open("c:/Users/adhit/Downloads/Ai_DineIn_Management/frontend/src/layouts/DashboardLayout.jsx", "r", encoding="utf-8") as f:
    content = f.read()

for i, line in enumerate(content.split("\n")):
    if "branchName" in line or "selectedBranchId" in line or "MapPin" in line or "Building2" in line:
        print(f"Line {i+1}: {line.strip()}")
