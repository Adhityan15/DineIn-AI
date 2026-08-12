with open("c:/Users/adhit/Downloads/Ai_DineIn_Management/backend/apps/authentication/models.py", "r", encoding="utf-8") as f:
    lines = f.readlines()

printing = False
for line in lines:
    if "class User(" in line:
        printing = True
    elif "class " in line and printing and "User(" not in line:
        printing = False
    if printing:
        print(line, end="")
