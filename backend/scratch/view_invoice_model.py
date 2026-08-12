with open("c:/Users/adhit/Downloads/Ai_DineIn_Management/backend/apps/core/models.py", "r", encoding="utf-8") as f:
    lines = f.readlines()
printing = False
for line in lines:
    if "class Invoice(" in line:
        printing = True
    elif "class " in line and printing and "Invoice(" not in line:
        printing = False
    if printing:
        print(line, end="")
