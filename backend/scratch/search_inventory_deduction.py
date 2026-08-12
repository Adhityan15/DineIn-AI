import glob

files = glob.glob("c:/Users/adhit/Downloads/Ai_DineIn_Management/backend/**/*.py", recursive=True)
for f_path in files:
    with open(f_path, "r", encoding="utf-8") as f:
        content = f.read()
    if "deduct" in content.lower() or "fefo" in content.lower():
        print(f"File {f_path} matches.")
