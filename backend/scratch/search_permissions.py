import os

apps_dir = "c:/Users/adhit/Downloads/Ai_DineIn_Management/backend/apps"
for root, dirs, files in os.walk(apps_dir):
    for file in files:
        if file.endswith(".py"):
            path = os.path.join(root, file)
            with open(path, 'r', encoding='utf-8', errors='ignore') as f:
                content = f.read()
                if "class Is" in content or "permission_classes" in content:
                    print(f"File: {os.path.relpath(path, apps_dir)}")
                    for line in content.split('\n'):
                        if "class Is" in line and "Permission" in line:
                            print(f"  {line.strip()}")
