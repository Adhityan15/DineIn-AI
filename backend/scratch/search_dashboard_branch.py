with open(r'c:\Users\adhit\Downloads\Ai_DineIn_Management\frontend\src\pages\Dashboard.jsx', 'r', encoding='utf-8') as f:
    lines = f.readlines()

for idx, line in enumerate(lines):
    if 'bangalore' in line.lower() or 'branch' in line.lower():
        print(f"L{idx+1}: {line.strip()}")
