import pymysql

passwords = [
    "dinein_ai123",
    "Dinein_ai123",
    "DineIn_ai123",
    "DineIn_AI123",
    "DineinAI123!",
    "DineInAI123!",
    "dineinai123",
    "Dineinai123",
    "DineInai123",
    "root@12345",
    "Password12345!",
    "Password123!",
    "Password@12345",
    "Password@123",
    "root12345!"
]

success = False
for pwd in passwords:
    try:
        conn = pymysql.connect(
            host="localhost",
            user="root",
            password=pwd,
            port=3306,
            connect_timeout=1
        )
        print(f"SUCCESS! Password is: '{pwd}'")
        conn.close()
        success = True
        with open("scratch/mysql_password.txt", "w") as f:
            f.write(pwd)
        break
    except Exception as e:
        err_code = e.args[0] if e.args else None
        print(f"Tried '{pwd}' -> Error {err_code}")

if not success:
    print("Failed to connect with project passwords.")
