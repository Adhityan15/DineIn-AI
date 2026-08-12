import pymysql

passwords = [
    "adhit",
    "adhit123",
    "adhit@123",
    "adhit123!",
    "adhityansomen",
    "MySQL80",
    "mysql80",
    "12345",
    "123",
    "rootroot",
    "admin1234",
    "admin@1234",
    "root1234",
    "adminpass",
    "rootpass"
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
    print("Failed to connect with custom passwords.")
