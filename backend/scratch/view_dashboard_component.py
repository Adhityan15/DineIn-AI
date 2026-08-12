with open("c:/Users/adhit/Downloads/Ai_DineIn_Management/frontend/src/pages/Dashboard.jsx", "r", encoding="utf-8") as f:
    content = f.read()

# Let's locate the 'const Dashboard = () => {' implementation
import re
match = re.search(r'const Dashboard\s*=\s*\(\)\s*=>\s*\{', content)
if match:
    idx = content.count('\n', 0, match.start())
    print(f"Dashboard starts at line {idx+1}")
    # print lines from idx to idx+40
    lines = content.split('\n')
    for i in range(idx, min(idx+45, len(lines))):
        print(f"{i+1}: {lines[i]}")
else:
    print("Could not find const Dashboard = () => {")
