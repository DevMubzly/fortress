import sqlite3
import os

db_path = r"c:\Users\User\Desktop\Projects\fortress\backend\data\fortress.db"

if os.path.exists(db_path):
    try:
        conn = sqlite3.connect(db_path)
        cursor = conn.cursor()
        
        # Check tables exist first
        cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='users';")
        if cursor.fetchone():
            cursor.execute("DELETE FROM users;")
            print("Cleared users table.")
            
        cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='licenses';")
        if cursor.fetchone():
            cursor.execute("DELETE FROM licenses;")
            print("Cleared licenses table.")
            
        conn.commit()
        conn.close()
        print("Database cleanup complete.")
    except Exception as e:
        print(f"Error cleaning database: {e}")
else:
    print(f"Database not found at {db_path}")
