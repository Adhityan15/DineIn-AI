import os

inventory_dir = "c:/Users/adhit/Downloads/Ai_DineIn_Management/backend/apps/inventory"
for f in os.listdir(inventory_dir):
    if f.endswith(".py"):
        print(f"=== File: {f} ===")
        with open(os.path.join(inventory_dir, f), "r", encoding="utf-8") as f_obj:
            content = f_obj.read()
            for line in content.splitlines():
                if "class " in line or "def " in line:
                    print("  ", line.strip())
        print()
