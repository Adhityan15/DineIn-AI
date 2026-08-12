import pymysql

try:
    conn = pymysql.connect(
        host="127.0.0.1",
        user="root",
        password="2101",
        port=3306,
        connect_timeout=2
    )
    print("SUCCESS! Connected to MySQL host.")
    
    with conn.cursor() as cursor:
        cursor.execute("SHOW DATABASES;")
        databases = [row[0] for row in cursor.fetchall()]
        print("Existing databases:", databases)
        
        db_name = "dinein_ai"
        if db_name not in databases:
            cursor.execute(f"CREATE DATABASE {db_name} CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;")
            print(f"Database '{db_name}' created successfully!")
        else:
            print(f"Database '{db_name}' already exists.")
            
    conn.close()
    
    # Try connecting directly to the dinein_ai database
    conn2 = pymysql.connect(
        host="127.0.0.1",
        user="root",
        password="2101",
        database="dinein_ai",
        port=3306,
        connect_timeout=2
    )
    print("SUCCESS! Connected to database 'dinein_ai'.")
    conn2.close()
except Exception as e:
    print(f"Connection failed: {e}")
