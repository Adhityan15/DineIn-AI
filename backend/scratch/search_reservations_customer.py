with open("c:/Users/adhit/Downloads/Ai_DineIn_Management/frontend/src/pages/Reservations.jsx", "r", encoding="utf-8") as f:
    content = f.read()

import re
matches = re.finditer(r'role\b|customer\b', content, re.IGNORECASE)
for m in matches:
    idx = content.count('\n', 0, m.start())
    print(f"Match in Reservations.jsx line {idx+1}: {content.split(chr(10))[idx].strip()}")
