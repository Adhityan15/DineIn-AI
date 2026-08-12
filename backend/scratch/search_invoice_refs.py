import glob

files = glob.glob("c:/Users/adhit/Downloads/Ai_DineIn_Management/backend/apps/**/*.py", recursive=True)
for f_path in files:
    if "test" in f_path:
        continue
    with open(f_path, "r", encoding="utf-8") as f:
        content = f.read()
    if "InvoiceViewSet" in content or "class Invoice" in content or "path('invoices'" in content:
        print(f"File {f_path} matches.")
