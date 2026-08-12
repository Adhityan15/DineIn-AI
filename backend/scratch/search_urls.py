import os
for root, dirs, files in os.walk("c:/Users/adhit/Downloads/Ai_DineIn_Management/backend"):
    for file in files:
        if file == "urls.py":
            print(os.path.join(root, file))
