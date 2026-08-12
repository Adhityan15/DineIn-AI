with open("c:/Users/adhit/Downloads/Ai_DineIn_Management/backend/apps/reservation/views.py", "r", encoding="utf-8") as f:
    content = f.read()

import re
match = re.search(r"def active_booking\(.*?\):.*?(?=\n\s*def |\n\s*class |\Z)", content, re.DOTALL)
if match:
    print(match.group(0))
else:
    print("Not found")
