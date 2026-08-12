with open("c:/Users/adhit/Downloads/Ai_DineIn_Management/frontend/src/layouts/DashboardLayout.jsx", "r", encoding="utf-8") as f:
    lines = f.readlines()

for idx, line in enumerate(lines):
    if "branchesList" in line or "setSelectedBranchId" in line or "branchUpdate" in line or "select" in line:
        print(f"Line {idx+1}: {line.strip()}")
