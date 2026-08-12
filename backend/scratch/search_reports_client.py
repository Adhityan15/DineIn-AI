with open("c:/Users/adhit/Downloads/Ai_DineIn_Management/frontend/src/pages/Reports.jsx", "r", encoding="utf-8") as f:
    content = f.read()

import re
matches = re.finditer(r'client\.\w+|useEffect', content)
for m in matches:
    idx = content.count('\n', 0, m.start())
    print(f"Line {idx+1}: {content.split(chr(10))[idx].strip()}")
