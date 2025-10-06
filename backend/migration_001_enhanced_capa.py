"""
Migration script for enhanced CAPA system
This script creates the new tables for the enhanced CAPA tracking system
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
    """Run the migration to create enhanced CAPA tables"""
    
    with engine.connect() as connection:
        # Start transaction
        trans = connection.begin()
        
        try:
            print("🚀 Starting enhanced CAPA migration...")
            
            # Create new enums
            print("📝 Creating new enums...")
            
            # ActionStatus enum
            connection.execute(text("""
                CREATE TYPE actionstatus AS ENUM (
                    'pending', 'in_progress', 'completed', 'overdue', 'cancelled'
                );
            """))
            
            # ActionType enum
            connection.execute(text("""
                CREATE TYPE actiontype AS ENUM (
                    'corrective', 'preventive', 'verification'
                );
            """))
            
            # Priority enum
            connection.execute(text("""
                CREATE TYPE priority AS ENUM (
                    'low', 'medium', 'high', 'critical'
                );
            """))
            
            # Add 'draft' to CapaStatus enum
            connection.execute(text("""
                ALTER TYPE capastatus ADD VALUE 'draft';
            """))
            
            print("✅ Enums created successfully")
            
            # Create corrective_actions table
            print("📋 Creating corrective_actions table...")
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
            
            # Create preventive_actions table
            print("📋 Creating preventive_actions table...")
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
            
            # Create verification_steps table
            print("📋 Creating verification_steps table...")
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
            
            # Create capa_progress_tracking table
            print("📋 Creating capa_progress_tracking table...")
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
            
            # Add new columns to capas table
            print("🔧 Adding new columns to capas table...")
            
            # Add department_id foreign key (if not exists)
            try:
                connection.execute(text("""
                    ALTER TABLE capas ADD COLUMN department_id INTEGER REFERENCES departments(id);
                """))
            except Exception as e:
                if "already exists" in str(e):
                    print("   department_id column already exists, skipping...")
                else:
                    raise
            
            # Add new fields (if not exist)
            try:
                connection.execute(text("""
                    ALTER TABLE capas ADD COLUMN actual_completion_date DATE;
                """))
            except Exception as e:
                if "already exists" in str(e):
                    print("   actual_completion_date column already exists, skipping...")
                else:
                    raise
            
            try:
                connection.execute(text("""
                    ALTER TABLE capas ADD COLUMN actual_cost NUMERIC(10,2);
                """))
            except Exception as e:
                if "already exists" in str(e):
                    print("   actual_cost column already exists, skipping...")
                else:
                    raise
            
            try:
                connection.execute(text("""
                    ALTER TABLE capas ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
                """))
            except Exception as e:
                if "already exists" in str(e):
                    print("   updated_at column already exists, skipping...")
                else:
                    raise
            
            try:
                connection.execute(text("""
                    ALTER TABLE capas ADD COLUMN verified_at TIMESTAMP WITH TIME ZONE;
                """))
            except Exception as e:
                if "already exists" in str(e):
                    print("   verified_at column already exists, skipping...")
                else:
                    raise
            
            # Skip type conversions to avoid conflicts with existing views
            print("   Skipping type conversions to avoid conflicts with existing views...")
            
            print("✅ New columns added successfully")
            
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
                ("idx_capa_progress_tracking_updated_by", "capa_progress_tracking", "updated_by_id"),
                ("idx_capas_department_id", "capas", "department_id"),
                ("idx_capas_target_date", "capas", "target_date"),
                ("idx_capas_status", "capas", "status")
            ]
            
            for index_name, table_name, column_name in indexes:
                try:
                    connection.execute(text(f"""
                        CREATE INDEX {index_name} ON {table_name}({column_name});
                    """))
                except Exception as e:
                    if "already exists" in str(e):
                        print(f"   Index {index_name} already exists, skipping...")
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
            except Exception as e:
                print(f"   Function creation skipped: {str(e)}")
            
            # Create triggers
            triggers = [
                ("update_corrective_actions_updated_at", "corrective_actions"),
                ("update_preventive_actions_updated_at", "preventive_actions"),
                ("update_verification_steps_updated_at", "verification_steps"),
                ("update_capas_updated_at", "capas")
            ]
            
            for trigger_name, table_name in triggers:
                try:
                    connection.execute(text(f"""
                        CREATE TRIGGER {trigger_name} 
                        BEFORE UPDATE ON {table_name} 
                        FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
                    """))
                except Exception as e:
                    if "already exists" in str(e):
                        print(f"   Trigger {trigger_name} already exists, skipping...")
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
            
            # Remove new columns from capas
            connection.execute(text("ALTER TABLE capas DROP COLUMN IF EXISTS department_id;"))
            connection.execute(text("ALTER TABLE capas DROP COLUMN IF EXISTS actual_completion_date;"))
            connection.execute(text("ALTER TABLE capas DROP COLUMN IF EXISTS actual_cost;"))
            connection.execute(text("ALTER TABLE capas DROP COLUMN IF EXISTS updated_at;"))
            connection.execute(text("ALTER TABLE capas DROP COLUMN IF EXISTS verified_at;"))
            
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
