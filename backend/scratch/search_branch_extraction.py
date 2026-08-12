import glob

files = glob.glob("c:/Users/adhit/Downloads/Ai_DineIn_Management/backend/apps/**/*.py", recursive=True)
for f_path in files:
    with open(f_path, "r", encoding="utf-8") as f:
        content = f.read()
    if "query_params.get('branch')" in content or "query_params.get(\"branch\")" in content:
        print(f"File {f_path} matches query_params.")
    if "headers.get('X-Branch-ID')" in content or "headers.get(\"X-Branch-ID\")" in content or "X-Branch-ID" in content:
        print(f"File {f_path} matches headers.")
