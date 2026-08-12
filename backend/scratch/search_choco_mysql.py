import os

choco_log = r"C:\ProgramData\chocolatey\logs\chocolatey.log"
if os.path.exists(choco_log):
    print(f"Chocolatey log found: {choco_log}")
    try:
        with open(choco_log, 'r', encoding='utf-8', errors='ignore') as f:
            lines = f.readlines()
        print(f"Total lines: {len(lines)}")
        # Search for mysql or password
        print("Matches in chocolatey log:")
        count = 0
        for line in lines:
            if 'mysql' in line.lower() or 'password' in line.lower():
                print("  ", line.strip())
                count += 1
                if count >= 30:
                    break
    except Exception as e:
        print("Error reading log:", e)
else:
    print("Chocolatey log not found.")
