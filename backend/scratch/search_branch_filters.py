import os

backend_dir = "c:/Users/adhit/Downloads/Ai_DineIn_Management/backend"
for root, dirs, files in os.walk(backend_dir):
    for file in files:
        if file.endswith(".py"):
            path = os.path.join(root, file)
            with open(path, 'r', encoding='utf-8', errors='ignore') as f:
                content = f.read()
                if "query_params.get('branch" in content or 'query_params.get("branch' in content:
                    print(f"File: {os.path.relpath(path, backend_dir)}")
                    for i, line in enumerate(content.split('\n')):
                        if "query_params.get('branch" in line or 'query_params.get("branch' in line:
                            print(f"  Line {i+1}: {line.strip()}")
