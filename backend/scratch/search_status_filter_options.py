with open(r'c:\Users\adhit\Downloads\Ai_DineIn_Management\frontend\src\pages\Reservations.jsx', 'r', encoding='utf-8') as f:
    lines = f.readlines()

for idx, line in enumerate(lines):
    if 'statusFilter' in line or 'value="confirmed"' in line or 'value="seated"' in line:
        print(f"L{idx+1}: {line.strip()}")
