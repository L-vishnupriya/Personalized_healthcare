import sqlite3
import random
from faker import Faker
from typing import List, Dict, Any

# Define the DB path (will be mounted by Docker)
import os
DB_PATH = os.path.join(os.path.dirname(__file__), "users.db") 



def create_and_populate_db():
    """Initializes the SQLite DB and populates 100 synthetic user records."""
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()

    # 1. User Profile Table
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS users (
            user_id INTEGER PRIMARY KEY,
            first_name TEXT,
            last_name TEXT,
            city TEXT,
            dietary_preference TEXT,
            medical_conditions TEXT, -- Stored as comma-separated string
            physical_limitations TEXT
        )
    """)

    # 2. Logs Table 
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS logs (
            log_id INTEGER PRIMARY KEY,
            user_id INTEGER,
            timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
            log_type TEXT, -- 'mood', 'cgm', 'food'
            value TEXT,     
            FOREIGN KEY(user_id) REFERENCES users(user_id)
        )
    """)
    conn.commit()

    # Check if users already exist
    cursor.execute("SELECT COUNT(*) FROM users")
    user_count = cursor.fetchone()[0]
    
    if user_count == 0:
        # --- Generate Synthetic Data ---
        fake = Faker()
        CITIES = ['New York', 'Los Angeles', 'Chicago', 'Houston', 'Phoenix']
        DIETS = ['vegetarian', 'non-vegetarian', 'vegan']
        CONDITIONS = ['Type 2 Diabetes', 'Hypertension', 'Arthritis', 'Asthma', 'None']
        
        users_data = []
        for i in range(1, 101):
            conditions = random.sample(CONDITIONS, random.randint(1, 3))
            # Ensure Type 2 Diabetes users get a CGM range
            if 'Type 2 Diabetes' not in conditions:
                if random.random() < 0.2: # 20% chance of diabetes 
                    conditions.append('Type 2 Diabetes')

            user = (
                i,
                fake.first_name(),
                fake.last_name(),
                random.choice(CITIES),
                random.choice(DIETS),
                ", ".join(list(set(conditions))), # Use list(set) to remove duplicates
                random.choice(['None', 'Mobility Issues', 'Swallowing Difficulties'])
            )
            users_data.append(user)

        cursor.executemany("""
            INSERT INTO users VALUES (?, ?, ?, ?, ?, ?, ?)
        """, users_data)
        conn.commit()
        print(f"Database created and populated with {len(users_data)} users.")
    else:
        print(f"Database already exists with {user_count} users.")
    
    conn.close()

def get_user_profile(user_id: int) -> Dict[str, Any] or None:
    """Retrieves user profile data from the database."""
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM users WHERE user_id=?", (user_id,))
    user = cursor.fetchone()
    conn.close()
    if user:
        # Map to dict for easier use
        keys = ["user_id", "first_name", "last_name", "city", "dietary_preference", "medical_conditions", "physical_limitations"]
        return dict(zip(keys, user))
    return None

def log_data(user_id: int, log_type: str, value: str):
    """Logs mood, CGM, or food intake data."""
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    cursor.execute(
        "INSERT INTO logs (user_id, log_type, value) VALUES (?, ?, ?)",
        (user_id, log_type, value)
    )
    conn.commit()
    conn.close()


