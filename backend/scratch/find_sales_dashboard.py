import os
import glob

# Search in views for anything calculating revenue, sales, meal period, table area, margin etc.
for filename in glob.glob("c:/Users/adhit/Downloads/Ai_DineIn_Management/backend/apps/**/*.py", recursive=True):
    if "views.py" in filename:
        try:
            with open(filename, "r", encoding="utf-8", errors="ignore") as f:
                content = f.read()
            if "sales" in content.lower() or "revenue" in content.lower() or "meal_period" in content.lower() or "margin" in content.lower():
                print("Found file:", filename)
        except Exception as e:
            pass
