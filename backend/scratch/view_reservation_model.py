with open("c:/Users/adhit/Downloads/Ai_DineIn_Management/backend/apps/reservation/models.py", "r", encoding="utf-8") as f:
    lines = f.readlines()

printing = False
for line in lines:
    if "class Reservation(" in line:
        printing = True
    elif "class " in line and printing and "Reservation(" not in line:
        printing = False
    if printing:
        print(line, end="")
