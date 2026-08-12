import os
import glob

for filename in glob.glob("c:/Users/adhit/Downloads/Ai_DineIn_Management/backend/**/test_*.py", recursive=True):
    with open(filename, "r", encoding="utf-8", errors="ignore") as f:
        content = f.read()
    if "APIClient" in content or "self.client" in content or "force_authenticate" in content:
        print("Found client in:", filename)
