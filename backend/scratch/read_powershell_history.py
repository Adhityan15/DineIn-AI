import os

appdata = os.environ.get("APPDATA")
history_path = os.path.join(appdata, r"Microsoft\Windows\PowerShell\PSReadLine\ConsoleHost_history.txt")

if os.path.exists(history_path):
    print(f"PowerShell history file found at: {history_path}")
    try:
        with open(history_path, 'r', encoding='utf-8', errors='ignore') as f:
            lines = f.readlines()
        print(f"Total commands: {len(lines)}")
        print("\nLast 50 PowerShell commands:")
        for line in lines[-50:]:
            print("  ", line.strip())
            
        # Search for mysql keywords
        print("\nCommands containing 'mysql':")
        for line in lines:
            if 'mysql' in line.lower():
                print("  ", line.strip())
    except Exception as e:
         print("Error reading PowerShell history file:", e)
else:
    print("PowerShell history file not found.")
