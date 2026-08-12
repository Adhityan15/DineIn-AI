import os

backend_dir = "c:/Users/adhit/Downloads/Ai_DineIn_Management/backend"
for root, dirs, files in os.walk(backend_dir):
    for file in files:
        if file.endswith(".py"):
            path = os.path.join(root, file)
            with open(path, 'r', encoding='utf-8', errors='ignore') as f:
                content = f.read()
                if "class Table" in content or "TableViewSet" in content or "table" in content.lower():
                    # Check if it defines a model or view
                    if "class Table(" in content or "class TableViewSet(" in content:
                        print(f"File: {os.path.relpath(path, backend_dir)}")
                        # Print occurrences
                        for i, line in enumerate(content.split('\n')):
                            if "class Table" in line:
                                print(f"  Line {i+1}: {line.strip()}")
