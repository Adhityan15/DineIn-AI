with open(r'c:\Users\adhit\Downloads\Ai_DineIn_Management\backend\apps\reservation\views.py', 'r', encoding='utf-8') as f:
    lines = f.readlines()

for i in range(25, 75):
    if i < len(lines):
        print(f"{i+1}: {lines[i]}", end="")
