import os

downloads_dir = r"c:\Users\adhit\Downloads"
found = []
for root, dirs, files in os.walk(downloads_dir):
    # Exclude our project directory to keep it fast
    if 'Ai_DineIn_Management' in root:
        continue
    for file in files:
        if file.endswith(('.txt', '.log', '.ini', '.cnf', '.md', '.json')):
            name_lower = file.lower()
            if 'mysql' in name_lower or 'password' in name_lower:
                fp = os.path.join(root, file)
                found.append(fp)

print("Found files:")
for f in found[:30]:
    print(f"  {f}")
