import glob

files = glob.glob("c:/Users/adhit/Downloads/Ai_DineIn_Management/backend/**/serializers.py", recursive=True)
for f in files:
    with open(f, "r", encoding="utf-8") as f_obj:
        content = f_obj.read()
    if "InvoiceSerializer" in content or "class Invoice" in content:
        print(f"File: {f}")
        print(content)
        print("="*40)
