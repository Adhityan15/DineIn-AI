with open("c:/Users/adhit/Downloads/Ai_DineIn_Management/frontend/src/pages/POS.jsx", "r", encoding="utf-8") as f:
    content = f.read()

import re
matches = re.finditer(r"paymentStep === 3.*?PrimaryButton", content, re.DOTALL)
for m in matches:
    print(m.group(0))
