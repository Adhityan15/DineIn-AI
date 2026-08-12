import os

apps_dir = "c:/Users/adhit/Downloads/Ai_DineIn_Management/backend/apps"
for app in os.listdir(apps_dir):
    model_file = os.path.join(apps_dir, app, "models.py")
    if os.path.exists(model_file):
        print(f"=== Models in APP: {app} ===")
        with open(model_file, "r", encoding="utf-8") as f:
            for line in f:
                if line.startswith("class "):
                    print("  ", line.strip())
        print()
