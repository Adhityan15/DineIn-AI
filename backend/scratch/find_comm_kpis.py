with open("c:/Users/adhit/Downloads/Ai_DineIn_Management/frontend/src/pages/Communication.jsx", "r", encoding="utf-8") as f:
    content = f.read()

lines = content.split("\n")
for i, line in enumerate(lines):
    if "KPICard" in line or "Total Notifications" in line or "SMS Sent" in line or "Unread" in line:
        print(f"Line {i+1}: {line.strip()}")
