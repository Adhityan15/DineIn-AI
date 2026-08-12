with open("c:/Users/adhit/Downloads/Ai_DineIn_Management/backend/apps/reservation/models.py", "r", encoding="utf-8") as f:
    content = f.read()

import re
matches = re.finditer(r'class\s+\w+\(.*?\):', content)
lines = content.split('\n')
for m in matches:
    idx = content.count('\n', 0, m.start())
    print(f"Class: {lines[idx]}")
    for i in range(idx+1, idx+25):
        if i < len(lines) and ("models." in lines[i] or "def " in lines[i]):
            print(f"  {lines[i].strip()}")
