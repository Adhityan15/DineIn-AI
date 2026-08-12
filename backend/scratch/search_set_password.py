import os

for root, dirs, files in os.walk(r'c:\Users\adhit\Downloads\Ai_DineIn_Management\backend'):
    for file in files:
        if file.endswith('.py'):
            file_path = os.path.join(root, file)
            with open(file_path, 'r', encoding='utf-8', errors='ignore') as f:
                content = f.read()
            if 'set_password' in content:
                print(f"Found set_password in: {file_path}")
                for idx, line in enumerate(content.splitlines()):
                    if 'set_password' in line or 'password =' in line or 'password=' in line:
                        print(f"  L{idx+1}: {line.strip()}")
