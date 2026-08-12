file_path = r'c:\Users\adhit\Downloads\Ai_DineIn_Management\frontend\src\pages\Dashboard.jsx'

with open(file_path, 'r', encoding='utf-8') as f:
    code = f.read()

old_badge = """            <Badge status="info">
              Branch: {activeBranchName}
            </Badge>"""

new_badge = """            <Badge status="info">
              📍 {activeBranchName}
            </Badge>"""

if old_badge in code:
    code = code.replace(old_badge, new_badge)
    with open(file_path, 'w', encoding='utf-8') as f:
        f.write(code)
    print("Dashboard branch badge updated to include 📍 emoji prefix.")
else:
    print("Error: Could not find exact old_badge match.")
