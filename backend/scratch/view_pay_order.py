with open("c:/Users/adhit/Downloads/Ai_DineIn_Management/backend/apps/inventory/views.py", "r", encoding="utf-8") as f:
    content = f.read()

lines = content.split('\n')
for idx, line in enumerate(lines):
    if "def pay_order" in line or "action(detail=True" in line:
        if "pay" in line:
            for i in range(idx-1, idx+45):
                print(f"{i+1}: {lines[i].strip()}")
            break
