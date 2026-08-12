with open("c:/Users/adhit/Downloads/Ai_DineIn_Management/frontend/src/pages/Dashboard.jsx", "r", encoding="utf-8") as f:
    lines = f.readlines()

for idx, line in enumerate(lines):
    # Find Dashboard render start and return statement
    if "const Dashboard = () =>" in line:
        print(f"Dashboard start at line {idx+1}")
    if idx > 300 and "return (" in line:
        print(f"Return statement at line {idx+1}: {line.strip()}")
