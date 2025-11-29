import sqlite3
import os

def migrate_add_username_column(db_path):
    if not os.path.exists(db_path):
        print(f"Database file not found: {db_path}")
        return
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    # Check if 'username' column exists
    cursor.execute("PRAGMA table_info(users)")
    columns = [row[1] for row in cursor.fetchall()]
    if 'username' not in columns:
        print("Adding 'username' column to users table...")
        cursor.execute("ALTER TABLE users ADD COLUMN username TEXT")
        conn.commit()
        print("Migration complete: 'username' column added.")
    else:
        print("'username' column already exists. No migration needed.")
    conn.close()

if __name__ == "__main__":
    # Update this path if needed
    db_path = "pinglo_local.db"
    migrate_add_username_column(db_path)
