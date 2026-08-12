import glob

files = glob.glob("c:/Users/adhit/Downloads/Ai_DineIn_Management/frontend/src/pages/**/*.jsx", recursive=True)
for f_path in files:
    with open(f_path, "r", encoding="utf-8") as f:
        content = f.read()
    if "branchUpdate" in content:
        print(f"Page {f_path} listens to branchUpdate.")
    else:
        print(f"Page {f_path} does NOT listen to branchUpdate.")
