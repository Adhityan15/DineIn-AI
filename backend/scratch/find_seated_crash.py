with open(r'c:\Users\adhit\Downloads\Ai_DineIn_Management\frontend\src\pages\Reservations.jsx', 'r', encoding='utf-8') as f:
    content = f.read()

import re
matches = re.finditer(r'\.\w+', content)
for m in matches:
    word = m.group(0)
    # Check if this property access is on status, slice, includes, etc.
    start = max(0, m.start() - 40)
    end = min(len(content), m.end() + 40)
    snippet = content[start:end].replace('\n', ' ')
    if 'status' in word or 'slice' in word:
        print(f"Index {m.start()}: ... {snippet} ...")
