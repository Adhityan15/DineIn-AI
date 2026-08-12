import glob

test_files = glob.glob("c:/Users/adhit/Downloads/Ai_DineIn_Management/backend/apps/inventory/tests/*.py")
for f_path in test_files:
    with open(f_path, "r", encoding="utf-8") as f:
        content = f.read()
    if "reverse(" in content:
        print(f"File {f_path}:")
        for line in content.split("\n"):
            if "reverse(" in line:
                print("  ", line.strip())
