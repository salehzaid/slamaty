import os
import sys
from datetime import datetime
from sqlalchemy.orm import Session
from database import get_db

# Add the backend directory to the Python path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from reminder_service import get_reminder_service

def run_reminders():
    """Run reminder checks"""
    print(f"Running reminders at {datetime.now()}")
    
    # Get database session
    db = next(get_db())
    
    try:
        reminder_service = get_reminder_service(db)
        reminder_service.check_round_deadlines()
        reminder_service.check_capa_deadlines()
        print("Reminders completed successfully")
    except Exception as e:
        print(f"Error running reminders: {str(e)}")
    finally:
        db.close()

if __name__ == "__main__":
    run_reminders()
