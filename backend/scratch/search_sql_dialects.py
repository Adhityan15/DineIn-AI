import os

keywords = [".raw(", "execute(", "connection.cursor()", "select_extra"]
found = []
for root, dirs, files in os.walk(r'c:\Users\adhit\Downloads\Ai_DineIn_Management\backend\apps'):
    for file in files:
        if file.endswith('.py'):
            fp = os.path.join(root, file)
            try:
                with open(fp, 'r', encoding='utf-8', errors='ignore') as f:
                    content = f.read()
                for kw in keywords:
                    if kw in content:
                        found.append((fp, kw))
            except Exception:
                pass

if found:
    print("Found raw SQL in the following files:")
    for fp, kw in found:
        print(f"  {fp} -> contains '{kw}'")
else:
    print("No raw SQL usages found in apps folder. Clean Django ORM is used!")
