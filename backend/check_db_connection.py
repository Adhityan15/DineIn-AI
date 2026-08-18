import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'dinein_project.settings.development')
django.setup()

from django.db import connection

def check():
    print("Testing local database connection...")
    try:
        connection.ensure_connection()
        print("SUCCESS: Database connection established successfully!")
    except Exception as e:
        print("ERROR: Failed to connect to the database!")
        import traceback
        traceback.print_exc()

if __name__ == '__main__':
    check()
