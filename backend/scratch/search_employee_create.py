with open("c:/Users/adhit/Downloads/Ai_DineIn_Management/backend/apps/staff/views.py", "r", encoding="utf-8") as f:
    content = f.read()

import re
matches = re.finditer(r'def\s+(create|perform_create)\b', content)
for m in matches:
    idx = content.count('\n', 0, m.start())
    print(f"Match found at line {idx+1}")
