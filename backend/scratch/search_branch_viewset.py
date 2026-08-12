import os

backend_dir = "c:/Users/adhit/Downloads/Ai_DineIn_Management/backend"
for root, dirs, files in os.walk(backend_dir):
    for file in files:
        if file.endswith(".py"):
            path = os.path.join(root, file)
            with open(path, 'r', encoding='utf-8', errors='ignore') as f:
                content = f.read()
                if "class BranchViewSet" in content:
                    print(f"File: {os.path.relpath(path, backend_dir)}")
                    for i, line in enumerate(content.split('\n')):
                        if "class BranchViewSet" in line or "def get_queryset" in line or "permission_classes" in line:
                            print(f"  Line {i+1}: {line.strip()}")
