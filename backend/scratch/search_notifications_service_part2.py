with open(r'c:\Users\adhit\Downloads\Ai_DineIn_Management\backend\apps\notifications\services.py', 'r', encoding='utf-8') as f:
    lines = f.readlines()

for idx, line in enumerate(lines):
    if 'welcome' in line.lower() or 'thank' in line.lower() or 'table_ready' in line.lower():
        print(f"L{idx+1}: {line.strip()}")
