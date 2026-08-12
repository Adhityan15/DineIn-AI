import os

frontend_dir = "c:/Users/adhit/Downloads/Ai_DineIn_Management/frontend/src"
for root, dirs, files in os.walk(frontend_dir):
    for file in files:
        if file.endswith(".jsx") or file.endswith(".js"):
            path = os.path.join(root, file)
            with open(path, 'r', encoding='utf-8') as f:
                content = f.read()
                if "MenuStudio" in file or "MenuStudio" in content or "Menu Management" in content or "AI Menu Studio" in content:
                    print(f"File: {os.path.relpath(path, frontend_dir)}")
