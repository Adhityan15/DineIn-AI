import pymysql

passwords = [
    "",
    "root",
    "Password123!",
    "password",
    "admin",
    "admin123",
    "mysql",
    "mysql123",
    "dinein",
    "dinein_ai",
    "dinein_password",
    "root123",
    "123456",
    "1234",
    "12345678",
    "123456789",
    "mypassword",
    "Pass@123",
    "Pass123",
    "Password@123",
    "Welcome1",
    "Welcome123",
    "welcome",
    "root_password"
]

success = False
for pwd in passwords:
    try:
        conn = pymysql.connect(
            host="127.0.0.1",
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
        # Check if error is access denied (1045) or something else
        err_code = e.args[0] if e.args else None
        print(f"Tried '{pwd}' -> Error {err_code}")

if not success:
    print("Could not guess MySQL root password.")
