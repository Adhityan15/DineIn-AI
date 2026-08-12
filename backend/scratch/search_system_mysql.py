import os

# Check environment variables
print("--- MySQL env variables ---")
for k, v in os.environ.items():
    if 'mysql' in k.lower() or 'password' in k.lower() or 'db' in k.lower():
        print(f"{k} = {v}")

# Check default Windows MySQL config files
possible_paths = [
    r"C:\ProgramData\MySQL\MySQL Server 8.0\my.ini",
    r"C:\Program Files\MySQL\MySQL Server 8.0\my.ini",
    os.path.expanduser("~/_my.cnf"),
    os.path.expanduser("~/my.cnf"),
]

for p in possible_paths:
    if os.path.exists(p):
        print(f"\nFound config file: {p}")
        try:
            with open(p, 'r', encoding='utf-8', errors='ignore') as f:
                lines = f.readlines()
            for line in lines:
                if 'user' in line.lower() or 'password' in line.lower() or 'port' in line.lower() or 'socket' in line.lower():
                    print("  ", line.strip())
        except Exception as e:
            print("  Error reading file:", e)
