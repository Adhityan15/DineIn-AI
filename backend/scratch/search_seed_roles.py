import os

backend_dir = "c:/Users/adhit/Downloads/Ai_DineIn_Management/backend"
for root, dirs, files in os.walk(backend_dir):
    for file in files:
        if "seed_roles" in file or "seed" in file:
            print(f"File: {os.path.join(root, file)}")
