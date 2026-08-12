with open(r'c:\Users\adhit\Downloads\Ai_DineIn_Management\frontend\src\pages\Reservations.jsx', 'r', encoding='utf-8') as f:
    lines = f.readlines()

for idx, line in enumerate(lines):
    if 'activeTab' in line or 'floor' in line.lower() or 'seated' in line.lower() or 'button' in line.lower() or 'check' in line.lower():
        if 'className' not in line and len(line.strip()) < 100:
            print(f"L{idx+1}: {line.strip()}")
