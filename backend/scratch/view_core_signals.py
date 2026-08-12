with open("c:/Users/adhit/Downloads/Ai_DineIn_Management/backend/apps/core/models.py", "r", encoding="utf-8") as f:
    content = f.read()

import re
matches = re.finditer(r"@receiver\(.*?\n(.*?)(?=@receiver|\Z)", content, re.DOTALL)
for m in matches:
    print(m.group(0))
