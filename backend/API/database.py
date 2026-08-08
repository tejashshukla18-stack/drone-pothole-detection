import sqlite3
import json

DB_FILE = "pothole_records.db"

def init_db():
    conn = sqlite3.connect(DB_FILE)
    cursor = conn.cursor()
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS inspections (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            filename TEXT,
            defects_found INTEGER,
            severity TEXT,
            priority TEXT,
            bounding_boxes TEXT,
            timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    ''')
    conn.commit()
    conn.close()

def save_record(filename, defects_found, severity, priority, boxes):
    conn = sqlite3.connect(DB_FILE)
    cursor = conn.cursor()
    cursor.execute('''
        INSERT INTO inspections (filename, defects_found, severity, priority, bounding_boxes)
        VALUES (?, ?, ?, ?, ?)
    ''', (filename, defects_found, severity, priority, json.dumps(boxes)))
    conn.commit()
    conn.close()

# Initialize Database Table on Startup
init_db()