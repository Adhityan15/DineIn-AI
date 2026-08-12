import os

keywords = ["mysql", "db_password", "db_user", "database"]
found = []
for root, dirs, files in os.walk(r'c:\Users\adhit\Downloads\Ai_DineIn_Management'):
    if '.git' in root or '.pytest_cache' in root or '__pycache__' in root or 'node_modules' in root:
        continue
    for file in files:
        if file.endswith(('.py', '.json', '.yml', '.yaml', '.sh', '.bat', '.ps1', '.txt', '.md', '.env', '.example')):
            fp = os.path.join(root, file)
            try:
                with open(fp, 'r', encoding='utf-8', errors='ignore') as f:
                    content = f.read()
                for kw in keywords:
                    if kw in content.lower():
                        found.append((fp, kw))
                        break
            except Exception:
                pass

for fp, kw in found[:100]:
    print(f"Found keyword '{kw}' in: {fp}")
