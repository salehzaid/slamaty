
from sqlalchemy import text
from database import engine, SessionLocal
import os
from dotenv import load_dotenv


load_dotenv('env.local')
if os.path.exists('.env.production'):
    load_dotenv('.env.production', override=True)
    print("Loaded .env.production")

def migrate():
    try:
        url = os.getenv('DATABASE_URL')
        if not url:
            print("❌ DATABASE_URL not found!")
            return
            
        print(f"Connecting to: {url.split('@')[-1]}") # Print only host for safety
        
        with engine.connect() as conn:
            print("Changing rounds.round_type to TEXT...")
            conn.execute(text("ALTER TABLE rounds ALTER COLUMN round_type TYPE TEXT USING round_type::TEXT;"))
            # SQLAlchemy 2.0+ might require commit on the connection if not autocommit
            conn.commit()
            print("✅ Successfully migrated rounds.round_type to TEXT.")
    except Exception as e:
        print(f"❌ Error during migration: {e}")

if __name__ == "__main__":
    migrate()
