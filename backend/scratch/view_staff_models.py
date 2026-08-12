with open("c:/Users/adhit/Downloads/Ai_DineIn_Management/backend/apps/staff/models.py", "r", encoding="utf-8") as f:
    lines = f.readlines()

printing = False
for line in lines:
    if "class Department" in line or "class Designation" in line or "class Employee" in line:
        printing = True
    elif "class " in line and printing and "Department" not in line and "Designation" not in line and "Employee" not in line:
        printing = False
    if printing:
        print(line, end="")
