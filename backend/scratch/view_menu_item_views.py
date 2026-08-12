with open("c:/Users/adhit/Downloads/Ai_DineIn_Management/backend/apps/inventory/views.py", "r", encoding="utf-8") as f:
    lines = f.readlines()

for idx, line in enumerate(lines):
    if "class MenuItemViewSet" in line or "class OrderViewSet" in line:
        print(f"Line {idx+1}: {line.strip()}")
        # print next 10 lines
        for j in range(1, 8):
            if idx + j < len(lines):
                print(f"  + {lines[idx+j].strip()}")
