import os
for root, dirs, files in os.walk("c:/Users/adhit/Downloads/Ai_DineIn_Management/backend"):
    for file in files:
        if file.endswith(".py"):
            path = os.path.join(root, file)
            try:
                with open(path, "r", encoding="utf-8") as f:
                    content = f.read()
                    if "backup" in content.lower():
                        print(f"File: {path}")
            except Exception:
                pass
