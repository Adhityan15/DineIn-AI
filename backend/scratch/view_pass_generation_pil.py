import sys
sys.stdout.reconfigure(encoding='utf-8')

with open(r'c:\Users\adhit\Downloads\Ai_DineIn_Management\backend\apps\notifications\services.py', 'r', encoding='utf-8') as f:
    lines = f.readlines()

for i in range(29, 110):
    if i < len(lines):
        clean_line = lines[i].encode('ascii', errors='replace').decode('ascii')
        print(f"{i+1}: {clean_line}", end="")
