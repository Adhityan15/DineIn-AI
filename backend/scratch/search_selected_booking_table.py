with open(r'c:\Users\adhit\Downloads\Ai_DineIn_Management\frontend\src\pages\Reservations.jsx', 'r', encoding='utf-8') as f:
    lines = f.readlines()

for idx, line in enumerate(lines):
    if 'selectedtable' in line.lower() or 'selectedbooking' in line.lower():
        # print if it looks like unsafe usage
        clean_line = line.strip()
        if any(char in clean_line for char in ['.', '[', '(', ')']):
            print(f"L{idx+1}: {clean_line}")
