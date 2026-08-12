import os

home_dir = r"C:\Users\adhit"
for f in os.listdir(home_dir):
    if 'mysql' in f.lower() or 'history' in f.lower():
        fp = os.path.join(home_dir, f)
        print(f"Found match: {fp}")
        if os.path.isfile(fp):
            try:
                with open(fp, 'r', encoding='utf-8', errors='ignore') as file:
                    lines = file.readlines()
                print("Last 20 lines of history:")
                for line in lines[-20:]:
                    # Mask potential password commands
                    print("  ", line.strip())
            except Exception as e:
                print("  Error reading history file:", e)
