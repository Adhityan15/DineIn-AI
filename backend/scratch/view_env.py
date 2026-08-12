import os

env_path = r'c:\Users\adhit\Downloads\Ai_DineIn_Management\backend\.env'
if os.path.exists(env_path):
    with open(env_path, 'r', encoding='utf-8') as f:
        print(f.read())
else:
    print(".env file not found.")
