with open(r'c:\Users\adhit\Downloads\Ai_DineIn_Management\frontend\src\pages\Settings.jsx', 'r', encoding='utf-8') as f:
    lines = f.readlines()

for idx, line in enumerate(lines):
    if 'branch' in line.lower() or 'latitude' in line.lower() or 'longitude' in line.lower():
        print(f"L{idx+1}: {line.strip()}")
