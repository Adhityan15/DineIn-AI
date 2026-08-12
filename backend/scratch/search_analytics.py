import os

backend_dir = r"c:\Users\adhit\Downloads\Ai_DineIn_Management\backend\apps"
matches = []
for root, dirs, files in os.walk(backend_dir):
    for f in files:
        if f.endswith(".py"):
            fp = os.path.join(root, f)
            with open(fp, "r", encoding="utf-8", errors="ignore") as file:
                lines = file.readlines()
            for idx, line in enumerate(lines):
                if "revenue" in line.lower() or "analytics" in line.lower():
                    matches.append((f"{f}:{idx+1}", line.strip()))

for m, line in matches[:30]:
    print(f"{m} -> {line}")
