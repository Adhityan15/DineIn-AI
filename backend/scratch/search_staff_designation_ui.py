with open("c:/Users/adhit/Downloads/Ai_DineIn_Management/frontend/src/pages/Staff.jsx", "r", encoding="utf-8") as f:
    content = f.read()

if "add designation" in content.lower() or "delete designation" in content.lower():
    print("Yes, designation CRUD exists in Staff.jsx!")
else:
    print("No, CRUD UI for designations does NOT exist in Staff.jsx.")
