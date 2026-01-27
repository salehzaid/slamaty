import os
import sys
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

# Setup database connection
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
from database import Base, engine
from models_updated import EvaluationItem, EvaluationCategoryMapping

def migrate_mappings():
    print("🚀 Starting migration to Many-to-Many mappings...")
    
    # Create the new table
    Base.metadata.create_all(bind=engine)
    print("✅ Created 'evaluation_category_mappings' table.")
    
    SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    db = SessionLocal()
    
    try:
        # Get all items
        items = db.query(EvaluationItem).all()
        print(f"📊 Found {len(items)} items to process.")
        
        migrated_count = 0
        skipped_count = 0
        
        for item in items:
            if not item.category_id:
                print(f"⚠️ Item {item.id} ({item.code}) has no category_id. Skipping.")
                skipped_count += 1
                continue
            
            # Check if mapping already exists
            existing = db.query(EvaluationCategoryMapping).filter(
                EvaluationCategoryMapping.category_id == item.category_id,
                EvaluationCategoryMapping.item_id == item.id
            ).first()
            
            if not existing:
                mapping = EvaluationCategoryMapping(
                    category_id=item.category_id,
                    item_id=item.id,
                    sort_order=item.id, # Use ID as initial sort order
                    is_active=True
                )
                db.add(mapping)
                migrated_count += 1
        
        db.commit()
        print(f"✅ Migration complete!")
        print(f"   - Migrated: {migrated_count}")
        print(f"   - Skipped: {skipped_count}")
        
    except Exception as e:
        print(f"❌ Error during migration: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    migrate_mappings()
