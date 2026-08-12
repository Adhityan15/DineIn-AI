import glob

files = glob.glob("c:/Users/adhit/Downloads/Ai_DineIn_Management/backend/apps/**/*.py", recursive=True)
for f_path in files:
    with open(f_path, "r", encoding="utf-8") as f:
        content = f.read()
    if "Department.objects.create" in content or "Department(" in content:
        print(f"File {f_path} matches.")
