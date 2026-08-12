import os

src_dir = r'c:\Users\adhit\Downloads\Ai_DineIn_Management\frontend\src'
for root, dirs, files in os.walk(src_dir):
    for f in files:
        if f == 'DashboardLayout.jsx':
            print("Found DashboardLayout at:", os.path.join(root, f))
