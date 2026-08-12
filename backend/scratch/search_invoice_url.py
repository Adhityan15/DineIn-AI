import glob

files = glob.glob("c:/Users/adhit/Downloads/Ai_DineIn_Management/backend/**/*.py", recursive=True)
for f_path in files:
    if "urls.py" in f_path:
        with open(f_path, "r", encoding="utf-8") as f:
            content = f.read()
        if "invoices" in content or "InvoiceViewSet" in content:
            print(f"File {f_path} matches.")
