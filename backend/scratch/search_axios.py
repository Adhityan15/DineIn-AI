import os

def find_file(name, path):
    for root, dirs, files in os.walk(path):
        if name in files:
            return os.path.join(root, name)
    return None

api_file = find_file('api.js', r'c:\Users\adhit\Downloads\Ai_DineIn_Management\frontend')
if api_file:
    print(f"Found api.js at: {api_file}")
    with open(api_file, 'r', encoding='utf-8') as f:
        print(f.read())
else:
    # search for axios setup
    print("api.js not found.")
