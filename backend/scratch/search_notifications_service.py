with open(r'c:\Users\adhit\Downloads\Ai_DineIn_Management\backend\apps\notifications\services.py', 'r', encoding='utf-8') as f:
    lines = f.readlines()

for idx, line in enumerate(lines):
    if 'class NotificationService' in line or 'def send_reservation' in line:
        print(f"L{idx+1}: {line.strip()}")
