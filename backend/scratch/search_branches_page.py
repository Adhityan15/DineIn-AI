import glob

files = glob.glob("c:/Users/adhit/Downloads/Ai_DineIn_Management/frontend/src/**/*.jsx", recursive=True)
for f in files:
    with open(f, "r", encoding="utf-8") as file:
        content = file.read()
    if "branches" in content.lower() or "failed to load branch" in content.lower():
        print(f"Match: {f}")
