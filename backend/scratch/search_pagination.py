with open("c:/Users/adhit/Downloads/Ai_DineIn_Management/backend/dinein_project/settings/base.py", "r", encoding="utf-8") as f:
    content = f.read()

if "PAGINATION" in content or "PAGE_SIZE" in content:
    print("Pagination is configured in base.py!")
else:
    print("No pagination configuration found in base.py.")
