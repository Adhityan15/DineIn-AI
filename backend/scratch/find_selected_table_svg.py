with open(r'c:\Users\adhit\Downloads\Ai_DineIn_Management\frontend\src\pages\Reservations.jsx', 'r', encoding='utf-8') as f:
    content = f.read()

import re
matches = re.finditer(r'selectedTable', content)
for m in matches:
    start = max(0, m.start() - 60)
    end = min(len(content), m.end() + 60)
    snippet = content[start:end].replace('\n', ' ')
    print(f"Index {m.start()}: ... {snippet} ...")
