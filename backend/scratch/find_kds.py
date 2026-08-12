import os

frontend_src = "c:/Users/adhit/Downloads/Ai_DineIn_Management/frontend/src"
for root, dirs, files in os.walk(frontend_src):
    for f in files:
        if f.endswith(".jsx") or f.endswith(".js"):
            path = os.path.join(root, f)
            with open(path, "r", encoding="utf-8") as f_obj:
                content = f_obj.read()
            if "Kitchen" in f or "KDS" in f or "kitchen" in content or "KDS" in content or "Preparing" in content:
                print(f"File: {os.path.relpath(path, frontend_src)}")
