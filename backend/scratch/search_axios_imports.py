import os

found = False
for root, dirs, files in os.walk(r'c:\Users\adhit\Downloads\Ai_DineIn_Management\frontend\src'):
    for file in files:
        if file.endswith('.js') or file.endswith('.jsx'):
            file_path = os.path.join(root, file)
            with open(file_path, 'r', encoding='utf-8', errors='ignore') as f:
                content = f.read()
            if 'axios.create' in content or 'baseURL' in content:
                print(f"Found Axios client config in: {file_path}")
                # print first 30 lines
                print("\n".join(content.splitlines()[:40]))
                found = True
                break
    if found:
        break
