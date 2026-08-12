with open("c:/Users/adhit/Downloads/Ai_DineIn_Management/frontend/src/pages/Communication.jsx", "r", encoding="utf-8") as f:
    content = f.read()

# Let's inspect where .map is used on states, check if it's safe
import re
matches = re.findall(r'(\w+)\.map\b', content)
print("Arrays being mapped:", set(matches))
