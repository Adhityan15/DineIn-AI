with open("c:/Users/adhit/Downloads/Ai_DineIn_Management/frontend/src/pages/Communication.jsx", "r", encoding="utf-8") as f:
    lines = f.readlines()

for idx, line in enumerate(lines):
    if "message_type" in line or "logs.filter" in line or "logList" in line or "log.message_type" in line:
        print(f"Line {idx+1}: {line.strip()}")
