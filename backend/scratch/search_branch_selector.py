import os
import re

src_dir = r'c:\Users\adhit\Downloads\Ai_DineIn_Management\frontend\src'
for root, dirs, files in os.walk(src_dir):
    for f in files:
        if f.endswith('.jsx') or f.endswith('.js'):
            path = os.path.join(root, f)
            with open(path, 'r', encoding='utf-8') as file:
                content = file.read()
            if 'branch' in content.lower():
                matches = re.finditer(r'branch', content, re.IGNORECASE)
                print(f"File: {f}")
                # Print a few occurrences
                count = 0
                for m in matches:
                    if count > 4:
                        break
                    start = max(0, m.start() - 30)
                    end = min(len(content), m.end() + 30)
                    snippet = content[start:end].replace('\n', ' ')
                    print(f"  ... {snippet} ...")
                    count += 1
