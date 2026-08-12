import os

test_dir = r'c:\Users\adhit\Downloads\Ai_DineIn_Management\backend\apps\reservation\tests'
for root, dirs, files in os.walk(test_dir):
    for f in files:
        if f.endswith('.py'):
            path = os.path.join(root, f)
            with open(path, 'r', encoding='utf-8') as file:
                lines = file.readlines()
            for idx, line in enumerate(lines):
                if 'checked_in' in line:
                    print(f"{f}:L{idx+1}: {line.strip()}")
