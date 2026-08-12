import os
import glob

# Search for receiver(post_save, sender=Invoice) or similar in backend
for path in glob.glob("c:/Users/adhit/Downloads/Ai_DineIn_Management/backend/apps/**/*.py", recursive=True):
    if "__pycache__" in path:
        continue
    try:
        with open(path, "r", encoding="utf-8") as f:
            content = f.read()
        if "post_save" in content and "Invoice" in content:
            print(f"Found in: {path}")
    except Exception:
        pass
