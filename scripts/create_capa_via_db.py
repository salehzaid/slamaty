#!/usr/bin/env python3
"""
Create CAPAs for items flagged as needing CAPA in a round using direct DB access.

Usage:
  python3 scripts/create_capa_via_db.py --round 100 --creator 1

This script is intended to be run locally/CI where the repository has access to the project's
Python environment and database (via backend.database.SessionLocal).
"""
import argparse
from backend.database import SessionLocal
from backend import crud


def main(round_id: int, creator_id: int):
    db = SessionLocal()
    try:
        items = crud.get_evaluation_items_needing_capa(db, round_id)
        if not items:
            print(f"No items needing CAPA found for round {round_id}")
            return

        created = []
        errors = []
        for item in items:
            print(f"Creating CAPA for item {item.get('item_id')} - {item.get('item_title')}")
            try:
                capa = crud.create_capa_from_evaluation_item(db, round_id, item, creator_id)
                if capa:
                    created.append(capa.id)
                    print(f"  -> Created CAPA id={capa.id}")
                else:
                    errors.append(item.get('item_id'))
                    print(f"  -> Failed to create CAPA for item {item.get('item_id')}")
            except Exception as e:
                errors.append((item.get('item_id'), str(e)))
                print(f"  -> Exception creating CAPA for item {item.get('item_id')}: {e}")

        print("Summary:")
        print("  Created CAPAs:", created)
        if errors:
            print("  Errors:")
            for e in errors:
                print("   -", e)

    finally:
        db.close()


if __name__ == '__main__':
    p = argparse.ArgumentParser()
    p.add_argument('--round', type=int, required=True, help='Round ID to process')
    p.add_argument('--creator', type=int, default=1, help='User ID to set as creator')
    args = p.parse_args()
    main(args.round, args.creator)


