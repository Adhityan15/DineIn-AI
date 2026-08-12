import os

backend_dir = "c:/Users/adhit/Downloads/Ai_DineIn_Management/backend"
for root, dirs, files in os.walk(backend_dir):
    for file in files:
        if "renderer" in file.lower() or "middleware" in file.lower():
            print(f"File: {os.path.join(root, file)}")
