import glob

files = glob.glob("c:/Users/adhit/Downloads/Ai_DineIn_Management/frontend/src/**/*.jsx", recursive=True)
for f_path in files:
    with open(f_path, "r", encoding="utf-8") as f:
        content = f.read()
    if "qr" in content.lower() and "scan" in content.lower():
        print(f"File {f_path} matches.")
