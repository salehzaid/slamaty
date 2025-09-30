#!/usr/bin/env python3
"""
One-off backfill: create CAPA plans for all completed rounds that have
non-compliant evaluation results (score < 70) on the local PostgreSQL DB.

Usage:
  python3 backend/backfill_capa_for_completed_rounds.py
"""
import os
from dotenv import load_dotenv

load_dotenv()

from database import SessionLocal

def main():
    from models_updated import Round
    from sqlalchemy import or_
    from crud import create_capas_for_round_non_compliance
    from sqlalchemy.orm import Session

    db: Session = SessionLocal()
    created_total = 0
    processed = 0

    try:
        # Handle enum or string statuses
        try:
            from models_updated import RoundStatus
            completed_filter = or_(Round.status == RoundStatus.COMPLETED, Round.status == 'completed')
        except Exception:
            completed_filter = (Round.status == 'completed')

        rounds = db.query(Round).filter(completed_filter).all()
        print(f"Found {len(rounds)} completed rounds to process")

        for r in rounds:
            processed += 1
            try:
                result = create_capas_for_round_non_compliance(db, r.id, creator_id=1, threshold=70)
                n = len(result.get('created_capas', [])) if result else 0
                created_total += n
                print(f"Round {r.id} - created {n} CAPAs")
            except Exception as e:
                print(f"Error processing round {r.id}: {e}")

        print(f"\nBackfill completed. Processed {processed} rounds, created {created_total} CAPAs in total.")
    finally:
        db.close()

if __name__ == "__main__":
    main()


