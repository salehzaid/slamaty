#!/usr/bin/env python3
"""
CAPA Scheduler Cron Job
Runs daily to check for overdue CAPAs, send reminders, and handle escalations
"""

import os
import sys
import logging
from datetime import datetime
from pathlib import Path

# Add the backend directory to Python path
backend_dir = Path(__file__).parent
sys.path.insert(0, str(backend_dir))

# Set up logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler(backend_dir / 'capa_scheduler.log'),
        logging.StreamHandler()
    ]
)

logger = logging.getLogger(__name__)

def main():
    """Main function to run CAPA scheduler tasks"""
    try:
        logger.info("Starting CAPA scheduler cron job")
        
        # Import and run the scheduler
        from capa_scheduler import run_daily_capa_tasks
        
        # Run daily tasks
        result = run_daily_capa_tasks()
        
        logger.info(f"CAPA scheduler completed successfully: {result}")
        
        # Exit with success code
        sys.exit(0)
        
    except Exception as e:
        logger.error(f"CAPA scheduler failed: {e}", exc_info=True)
        sys.exit(1)

if __name__ == "__main__":
    main()
