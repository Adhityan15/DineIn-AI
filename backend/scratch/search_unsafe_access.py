with open(r'c:\Users\adhit\Downloads\Ai_DineIn_Management\frontend\src\pages\Reservations.jsx', 'r', encoding='utf-8') as f:
    lines = f.readlines()

for idx, line in enumerate(lines):
    # Search for potential unsafe property accesses on selectedBooking or selectedTable
    if 'selectedbooking.' in line.lower() or 'selectedtable.' in line.lower():
        # Exclude checks like selectedBooking?. or selectedTable?. or simple checks
        if '?.' not in line and '&&' not in line and '!' not in line and '===' not in line:
            print(f"L{idx+1}: {line.strip()}")
