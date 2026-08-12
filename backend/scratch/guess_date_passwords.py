import pymysql

passwords = [
    "Password2026",
    "Password2025",
    "Admin2026",
    "Admin2025",
    "Root2026",
    "Root2025",
    "admin@2026",
    "admin@2025",
    "root@2026",
    "root@2025",
    "dinein_ai_2026",
    "dinein_ai_2025"
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
    print("Failed to connect with date-based passwords.")
