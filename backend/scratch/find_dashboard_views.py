import os
import glob

# Let's search for "class " and "Dashboard" or "Owner" or "Analytics" in views
for filename in glob.glob("c:/Users/adhit/Downloads/Ai_DineIn_Management/backend/apps/**/*.py", recursive=True):
    if "views.py" in filename or "view" in filename:
        try:
            with open(filename, "r", encoding="utf-8", errors="ignore") as f:
                content = f.read()
            if "dashboard" in content.lower() or "metrics" in content.lower() or "ceo" in content.lower() or "analytics" in content.lower():
                print("Found file:", filename)
        except Exception as e:
            pass
