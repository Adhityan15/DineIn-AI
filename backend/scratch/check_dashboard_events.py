import glob

files = glob.glob("c:/Users/adhit/Downloads/Ai_DineIn_Management/frontend/src/pages/**/*.jsx", recursive=True)
for f in files:
    with open(f, "r", encoding="utf-8") as file:
        content = file.read()
    if "branchupdate" in content.lower():
        print(f"Listens: {f}")
