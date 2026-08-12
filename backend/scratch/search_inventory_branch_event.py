with open("c:/Users/adhit/Downloads/Ai_DineIn_Management/frontend/src/pages/Inventory.jsx", "r", encoding="utf-8") as f:
    content = f.read()

if "branchUpdate" in content:
    print("Inventory.jsx listens to branchUpdate!")
else:
    print("Inventory.jsx does NOT listen to branchUpdate.")
