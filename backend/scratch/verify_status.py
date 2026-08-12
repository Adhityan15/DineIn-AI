import pymysql

conn = pymysql.connect(
    host="127.0.0.1",
    user="root",
    password="2101",
    database="dinein_ai",
    port=3306
)

with conn.cursor() as cursor:
    cursor.execute("SELECT id, guest_name, status, created_at FROM reservation_reservation WHERE guest_name LIKE '%Integration Test%';")
    rows = cursor.fetchall()
    print("Integration test bookings:")
    for row in rows:
        print(row)
conn.close()
