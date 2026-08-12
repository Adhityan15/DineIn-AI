import re

files_to_check = [
    "c:/Users/adhit/Downloads/Ai_DineIn_Management/backend/apps/authentication/models.py",
    "c:/Users/adhit/Downloads/Ai_DineIn_Management/backend/apps/core/models.py",
    "c:/Users/adhit/Downloads/Ai_DineIn_Management/backend/apps/notifications/models.py"
]

for filepath in files_to_check:
    print("=" * 60)
    print("File:", filepath)
    print("=" * 60)
    with open(filepath, "r", encoding="utf-8") as f:
        lines = f.readlines()
    
    # Let's print sections starting with @receiver
    in_receiver = False
    brace_count = 0
    for idx, line in enumerate(lines):
        if "@receiver" in line:
            in_receiver = True
            print(f"--- Line {idx+1} ---")
        if in_receiver:
            print(f"{idx+1}: {line}", end="")
            # simple heuristic to print about 20 lines or stop when we hit another def/class without indent
            if idx + 1 < len(lines):
                next_line = lines[idx+1]
                if next_line.strip() and not next_line.startswith(" ") and not next_line.startswith("@") and not "def " in next_line:
                    in_receiver = False
