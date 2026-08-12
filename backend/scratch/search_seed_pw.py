import os

seed_path = r'c:\Users\adhit\Downloads\Ai_DineIn_Management\backend\apps\authentication\management\commands\seed_db.py'
if os.path.exists(seed_path):
    with open(seed_path, 'r', encoding='utf-8') as f:
        content = f.read()
    # print lines containing set_password
    for idx, line in enumerate(content.splitlines()):
        if 'set_password' in line or 'create_superuser' in line or 'password' in line:
            print(f"L{idx+1}: {line.strip()}")
else:
    print("seed_db.py not found.")
