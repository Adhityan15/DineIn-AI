import glob

files = glob.glob("c:/Users/adhit/Downloads/Ai_DineIn_Management/backend/**/*.py", recursive=True)
for f_path in files:
    with open(f_path, "r", encoding="utf-8") as f:
        content = f.read()
    if "deduct_ingredients_for_order" in content:
        print(f"Call: {f_path}")
