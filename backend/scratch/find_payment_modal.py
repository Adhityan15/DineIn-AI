with open("c:/Users/adhit/Downloads/Ai_DineIn_Management/frontend/src/pages/POS.jsx", "r", encoding="utf-8") as f:
    content = f.read()

import re
matches = re.finditer(r"paymentStep === 3.*?Close", content, re.DOTALL)
for m in matches:
    print(m.group(0))

# Also search for "Close & Clear" or where "setCart([])" is called inside checkout completion
print("\n--- cart resets ---")
matches = re.finditer(r"setCart\(\[\]\).*?setCustomerName", content, re.DOTALL)
for m in matches:
    print(m.group(0))
