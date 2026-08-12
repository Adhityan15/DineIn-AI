with open(r'c:\Users\adhit\Downloads\Ai_DineIn_Management\frontend\src\pages\Analytics.jsx', 'r', encoding='utf-8') as f:
    lines = f.readlines()

for i in range(49, 90):
    if i < len(lines):
        print(f"{i+1}: {lines[i]}", end="")
