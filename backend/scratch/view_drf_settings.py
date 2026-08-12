with open("c:/Users/adhit/Downloads/Ai_DineIn_Management/backend/dinein_project/settings/base.py", "r", encoding="utf-8") as f:
    content = f.read()

import re
match = re.search(r'REST_FRAMEWORK\s*=\s*\{.*?\}', content, re.DOTALL)
if match:
    print(match.group(0))
else:
    print("REST_FRAMEWORK settings block not found.")
