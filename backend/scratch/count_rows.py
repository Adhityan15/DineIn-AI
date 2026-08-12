import sqlite3

conn = sqlite3.connect("db.sqlite3")
cursor = conn.cursor()

# Get all tables
cursor.execute("SELECT name FROM sqlite_master WHERE type='table';")
tables = [row[0] for row in cursor.fetchall()]

print("--- SQLITE ROW COUNTS ---")
for t in sorted(tables):
    # Exclude django internal tables from count if we want, or count all
    cursor.execute(f"SELECT COUNT(*) FROM {t};")
    count = cursor.fetchone()[0]
    if count > 0:
        print(f"{t}: {count} rows")

conn.close()
