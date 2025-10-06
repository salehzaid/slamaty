"""
Simplified migration script for enhanced CAPA system
This script creates only the new tables without modifying existing ones
"""

from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker
import os
from dotenv import load_dotenv

load_dotenv()

# Database connection
DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://user:password@localhost/salamah_db")
engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def run_migration():
    """Run the simplified migration to create only new tables"""
    
    with engine.connect() as connection:
        # Start transaction
        trans = connection.begin()
        
        try:
            print("🚀 Starting simplified enhanced CAPA migration...")
            
            # Create new enums
            print("📝 Creating new enums...")
            
            # ActionStatus enum
            try:
                connection.execute(text("""
                    CREATE TYPE actionstatus AS ENUM (
                        'pending', 'in_progress', 'completed', 'overdue', 'cancelled'
                    );
                """))
                print("   ✅ ActionStatus enum created")
            except Exception as e:
                if "already exists" in str(e):
                    print("   ⚠️  ActionStatus enum already exists, skipping...")
                else:
                    raise
            
            # ActionType enum
            try:
                connection.execute(text("""
                    CREATE TYPE actiontype AS ENUM (
                        'corrective', 'preventive', 'verification'
                    );
                """))
                print("   ✅ ActionType enum created")
            except Exception as e:
                if "already exists" in str(e):
                    print("   ⚠️  ActionType enum already exists, skipping...")
                else:
                    raise
            
            # Priority enum
            try:
                connection.execute(text("""
                    CREATE TYPE priority AS ENUM (
                        'low', 'medium', 'high', 'critical'
                    );
                """))
                print("   ✅ Priority enum created")
            except Exception as e:
                if "already exists" in str(e):
                    print("   ⚠️  Priority enum already exists, skipping...")
                else:
                    raise
            
            print("✅ Enums created successfully")
            
            # Create corrective_actions table
            print("📋 Creating corrective_actions table...")
            try:
                connection.execute(text("""
                    CREATE TABLE corrective_actions (
                        id SERIAL PRIMARY KEY,
                        capa_id INTEGER NOT NULL REFERENCES capas(id) ON DELETE CASCADE,
                        task TEXT NOT NULL,
                        description TEXT,
                        assigned_to_id INTEGER REFERENCES users(id),
                        due_date DATE,
                        completed_date DATE,
                        status actionstatus DEFAULT 'pending',
                        completion_percentage INTEGER DEFAULT 0,
                        notes TEXT,
                        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
                        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
                    );
                """))
                print("   ✅ corrective_actions table created")
            except Exception as e:
                if "already exists" in str(e):
                    print("   ⚠️  corrective_actions table already exists, skipping...")
                else:
                    raise
            
            # Create preventive_actions table
            print("📋 Creating preventive_actions table...")
            try:
                connection.execute(text("""
                    CREATE TABLE preventive_actions (
                        id SERIAL PRIMARY KEY,
                        capa_id INTEGER NOT NULL REFERENCES capas(id) ON DELETE CASCADE,
                        task TEXT NOT NULL,
                        description TEXT,
                        assigned_to_id INTEGER REFERENCES users(id),
                        due_date DATE,
                        completed_date DATE,
                        status actionstatus DEFAULT 'pending',
                        completion_percentage INTEGER DEFAULT 0,
                        notes TEXT,
                        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
                        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
                    );
                """))
                print("   ✅ preventive_actions table created")
            except Exception as e:
                if "already exists" in str(e):
                    print("   ⚠️  preventive_actions table already exists, skipping...")
                else:
                    raise
            
            # Create verification_steps table
            print("📋 Creating verification_steps table...")
            try:
                connection.execute(text("""
                    CREATE TABLE verification_steps (
                        id SERIAL PRIMARY KEY,
                        capa_id INTEGER NOT NULL REFERENCES capas(id) ON DELETE CASCADE,
                        step TEXT NOT NULL,
                        description TEXT,
                        required BOOLEAN DEFAULT true,
                        assigned_to_id INTEGER REFERENCES users(id),
                        due_date DATE,
                        completed_date DATE,
                        completed BOOLEAN DEFAULT false,
                        notes TEXT,
                        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
                        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
                    );
                """))
                print("   ✅ verification_steps table created")
            except Exception as e:
                if "already exists" in str(e):
                    print("   ⚠️  verification_steps table already exists, skipping...")
                else:
                    raise
            
            # Create capa_progress_tracking table
            print("📋 Creating capa_progress_tracking table...")
            try:
                connection.execute(text("""
                    CREATE TABLE capa_progress_tracking (
                        id SERIAL PRIMARY KEY,
                        capa_id INTEGER NOT NULL REFERENCES capas(id) ON DELETE CASCADE,
                        action_type actiontype NOT NULL,
                        action_id INTEGER,
                        progress_percentage INTEGER,
                        status_change VARCHAR(50),
                        notes TEXT,
                        updated_by_id INTEGER NOT NULL REFERENCES users(id),
                        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
                    );
                """))
                print("   ✅ capa_progress_tracking table created")
            except Exception as e:
                if "already exists" in str(e):
                    print("   ⚠️  capa_progress_tracking table already exists, skipping...")
                else:
                    raise
            
            # Create indexes for better performance
            print("📊 Creating indexes...")
            
            indexes = [
                ("idx_corrective_actions_capa_id", "corrective_actions", "capa_id"),
                ("idx_corrective_actions_assigned_to", "corrective_actions", "assigned_to_id"),
                ("idx_corrective_actions_due_date", "corrective_actions", "due_date"),
                ("idx_preventive_actions_capa_id", "preventive_actions", "capa_id"),
                ("idx_preventive_actions_assigned_to", "preventive_actions", "assigned_to_id"),
                ("idx_preventive_actions_due_date", "preventive_actions", "due_date"),
                ("idx_verification_steps_capa_id", "verification_steps", "capa_id"),
                ("idx_verification_steps_assigned_to", "verification_steps", "assigned_to_id"),
                ("idx_capa_progress_tracking_capa_id", "capa_progress_tracking", "capa_id"),
                ("idx_capa_progress_tracking_updated_by", "capa_progress_tracking", "updated_by_id")
            ]
            
            for index_name, table_name, column_name in indexes:
                try:
                    connection.execute(text(f"""
                        CREATE INDEX {index_name} ON {table_name}({column_name});
                    """))
                    print(f"   ✅ Index {index_name} created")
                except Exception as e:
                    if "already exists" in str(e):
                        print(f"   ⚠️  Index {index_name} already exists, skipping...")
                    else:
                        raise
            
            print("✅ Indexes created successfully")
            
            # Create triggers for updated_at
            print("⚡ Creating update triggers...")
            
            # Create function
            try:
                connection.execute(text("""
                    CREATE OR REPLACE FUNCTION update_updated_at_column()
                    RETURNS TRIGGER AS $$
                    BEGIN
                        NEW.updated_at = NOW();
                        RETURN NEW;
                    END;
                    $$ language 'plpgsql';
                """))
                print("   ✅ Update function created")
            except Exception as e:
                print(f"   ⚠️  Function creation skipped: {str(e)}")
            
            # Create triggers
            triggers = [
                ("update_corrective_actions_updated_at", "corrective_actions"),
                ("update_preventive_actions_updated_at", "preventive_actions"),
                ("update_verification_steps_updated_at", "verification_steps")
            ]
            
            for trigger_name, table_name in triggers:
                try:
                    connection.execute(text(f"""
                        CREATE TRIGGER {trigger_name} 
                        BEFORE UPDATE ON {table_name} 
                        FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
                    """))
                    print(f"   ✅ Trigger {trigger_name} created")
                except Exception as e:
                    if "already exists" in str(e):
                        print(f"   ⚠️  Trigger {trigger_name} already exists, skipping...")
                    else:
                        raise
            
            print("✅ Update triggers created successfully")
            
            # Commit transaction
            trans.commit()
            print("🎉 Migration completed successfully!")
            
        except Exception as e:
            # Rollback on error
            trans.rollback()
            print(f"❌ Migration failed: {str(e)}")
            raise

def rollback_migration():
    """Rollback the migration"""
    
    with engine.connect() as connection:
        trans = connection.begin()
        
        try:
            print("🔄 Rolling back enhanced CAPA migration...")
            
            # Drop tables
            connection.execute(text("DROP TABLE IF EXISTS capa_progress_tracking CASCADE;"))
            connection.execute(text("DROP TABLE IF EXISTS verification_steps CASCADE;"))
            connection.execute(text("DROP TABLE IF EXISTS preventive_actions CASCADE;"))
            connection.execute(text("DROP TABLE IF EXISTS corrective_actions CASCADE;"))
            
            # Drop enums
            connection.execute(text("DROP TYPE IF EXISTS actiontype CASCADE;"))
            connection.execute(text("DROP TYPE IF EXISTS actionstatus CASCADE;"))
            connection.execute(text("DROP TYPE IF EXISTS priority CASCADE;"))
            
            # Drop function
            connection.execute(text("DROP FUNCTION IF EXISTS update_updated_at_column() CASCADE;"))
            
            trans.commit()
            print("✅ Rollback completed successfully!")
            
        except Exception as e:
            trans.rollback()
            print(f"❌ Rollback failed: {str(e)}")
            raise

if __name__ == "__main__":
    import sys
    
    if len(sys.argv) > 1 and sys.argv[1] == "rollback":
        rollback_migration()
    else:
        run_migration()
