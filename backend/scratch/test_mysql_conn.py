import pymysql

credentials = [
    {"user": "root", "password": ""},
    {"user": "root", "password": "root"},
    {"user": "root", "password": "Password123!"},
    {"user": "root", "password": "password"},
]

success = False
for cred in credentials:
    try:
        conn = pymysql.connect(
            host="127.0.0.1",
            user=cred["user"],
            password=cred["password"],
            port=3306,
            connect_timeout=2
        )
        print(f"SUCCESS with user: {cred['user']}, password: '{cred['password']}'")
        
        with conn.cursor() as cursor:
            cursor.execute("SHOW DATABASES;")
            databases = [row[0] for row in cursor.fetchall()]
            print("Existing databases:", databases)
            
            # Check if we can create a database or if it exists
            db_name = "dinein_db"
            if db_name not in databases:
                cursor.execute(f"CREATE DATABASE {db_name} CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;")
                print(f"Database '{db_name}' created successfully!")
            else:
                print(f"Database '{db_name}' already exists.")
                
        conn.close()
        success = True
        break
    except Exception as e:
        print(f"FAILED with user: {cred['user']}, password: '{cred['password']}'. Error: {e}")

if not success:
    print("Failed to connect to local MySQL with all common credentials.")
