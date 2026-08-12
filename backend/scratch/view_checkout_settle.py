with open("c:/Users/adhit/Downloads/Ai_DineIn_Management/backend/apps/inventory/views.py", "r", encoding="utf-8") as f:
    content = f.read()

import re
match = re.search(r"def checkout_settle\(.*?\):.*?(?=\n\s*def |\n\s*class |\Z)", content, re.DOTALL)
if match:
    print(match.group(0))
else:
    print("Not found")
