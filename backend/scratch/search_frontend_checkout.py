with open(r'c:\Users\adhit\Downloads\Ai_DineIn_Management\frontend\src\pages\Reservations.jsx', 'r', encoding='utf-8') as f:
    lines = f.readlines()

for idx, line in enumerate(lines):
    if 'checkout' in line.lower() or 'check_out' in line.lower() or 'check-out' in line.lower():
        print(f"L{idx+1}: {line.strip()}")
