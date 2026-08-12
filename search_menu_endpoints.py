import os

print("Searching for files with reservation in frontend...")
for root, dirs, files in os.walk("frontend/src"):
    for file in files:
        if "reser" in file.lower() or "booking" in file.lower():
            print(os.path.join(root, file))
