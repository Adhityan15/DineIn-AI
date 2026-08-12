import os

home_dir = r"C:\Users\adhit"
found_files = []
for f in os.listdir(home_dir):
    fp = os.path.join(home_dir, f)
    if os.path.isfile(fp):
        name_lower = f.lower()
        if any(kw in name_lower for kw in ["mysql", "cnf", "password", "cred", "env"]):
            found_files.append((fp, os.path.getsize(fp)))

print("Files in home directory:")
for fp, sz in found_files:
    print(f"  {fp} ({sz} bytes)")
