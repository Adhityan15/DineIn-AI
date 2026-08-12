import os
import django
import sys
import sqlite3
import pymysql

sys.stdout.reconfigure(encoding='utf-8')

print("=== SIDE-BY-SIDE DATABASE ROW COUNT COMPARISON ===")

# SQLite Connection
sqlite_conn = sqlite3.connect("db.sqlite3")
sqlite_cursor = sqlite_conn.cursor()

# Get all SQLite tables
sqlite_cursor.execute("SELECT name FROM sqlite_master WHERE type='table';")
sqlite_tables = [row[0] for row in sqlite_cursor.fetchall()]

# MySQL Connection
mysql_conn = pymysql.connect(
    host="127.0.0.1",
    user="root",
    password="2101",
    database="dinein_ai",
    port=3306
)
mysql_cursor = mysql_conn.cursor()

# Get all MySQL tables
mysql_cursor.execute("SHOW TABLES;")
mysql_tables = [row[0] for row in mysql_cursor.fetchall()]

# Compare row counts
print(f"{'Table Name':<45} | {'SQLite Rows':<12} | {'MySQL Rows':<12} | Status")
print("-" * 85)

all_matched = True
for t in sorted(sqlite_tables):
    if t.startswith('sqlite_'):
        continue
        
    # Count rows in SQLite
    sqlite_cursor.execute(f"SELECT COUNT(*) FROM {t};")
    sqlite_count = sqlite_cursor.fetchone()[0]
    
    # Count rows in MySQL (check if table exists first)
    if t in mysql_tables:
        mysql_cursor.execute(f"SELECT COUNT(*) FROM {t};")
        mysql_count = mysql_cursor.fetchone()[0]
    else:
        mysql_count = "N/A"
        
    status = "MATCH" if sqlite_count == mysql_count else "MISMATCH"
    if sqlite_count > 0 or mysql_count != 0:
        print(f"{t:<45} | {sqlite_count:<12} | {mysql_count:<12} | {status}")
        if status != "MATCH" and t not in ['django_migrations', 'django_content_type', 'auth_permission']:
            # we don't care about system internals if we excluded them
            all_matched = False

sqlite_conn.close()
mysql_conn.close()

if all_matched:
    print("\nSUCCESS! All application database tables match row counts perfectly!")
else:
    print("\nWARNING: Some application table row counts do not match.")
