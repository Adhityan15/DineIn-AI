with open("c:/Users/adhit/Downloads/Ai_DineIn_Management/backend/apps/notifications/services.py", "r", encoding="utf-8") as f:
    content = f.read()

lines = content.split("\n")
for i, line in enumerate(lines):
    if "sms" in line.lower() or "twilio" in line.lower() or "msg91" in line.lower() or "notification" in line.lower():
        if "def " in line or "class " in line:
            print(f"Line {i+1}: {line.strip()}")
