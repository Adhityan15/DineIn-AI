with open("c:/Users/adhit/Downloads/Ai_DineIn_Management/frontend/src/pages/Staff.jsx", "r", encoding="utf-8") as f:
    content = f.read()

import re
matches = re.finditer(r'Designation', content)
lines = content.split('\n')
for m in matches:
    idx = content.count('\n', 0, m.start())
    if "const" in lines[idx] or "function" in lines[idx] or "handleSubmit" in lines[idx]:
        for i in range(idx-2, idx+25):
            print(f"{i+1}: {lines[i].strip()}")
        print("-" * 30)
