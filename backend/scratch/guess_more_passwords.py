import pymysql

passwords = [
    "Password123",
    "root123!",
    "root@123",
    "admin123!",
    "admin@123",
    "mysql123!",
    "mysql@123",
    "DineIn123!",
    "DineIn123",
    "Dinein123!",
    "Dinein123",
    "Dinein@123",
    "dinein@123",
    "dinein123!",
    "dinein123",
    "root_123",
    "admin_123",
    "mysql_123",
    "1234567"
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
    print("Failed to connect with custom second list.")
