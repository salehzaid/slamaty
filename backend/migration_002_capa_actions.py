#!/usr/bin/env python3
"""
Migration 002: Create capa_actions table
تحويل الإجراءات من JSON إلى جدول منفصل للاستعلام والتقارير الفعّالة

الهدف:
- إنشاء جدول capa_actions لتخزين الإجراءات التصحيحية/الوقائية/خطوات التحقق
- إضافة فهارس للأداء
- إنشاء trigger لـ updated_at
"""

from sqlalchemy import create_engine, text
import os
from dotenv import load_dotenv
import sys

load_dotenv('env.local')

def get_db_url():
    """Get database URL from environment"""
    return os.getenv("DATABASE_URL", "postgresql://postgres:mass@localhost:5432/salamaty_db")

def run_migration():
    """تنفيذ Migration لإنشاء جدول capa_actions"""
    
    engine = create_engine(get_db_url())
    
    with engine.begin() as connection:
        print("=" * 80)
        print("🚀 Migration 002: Create capa_actions table")
        print("=" * 80)
        
        try:
            # Step 1: Create capa_actions table
            print("\n📝 Step 1: Creating capa_actions table...")
            
            create_table_sql = text("""
                CREATE TABLE IF NOT EXISTS capa_actions (
                    id SERIAL PRIMARY KEY,
                    capa_id INTEGER NOT NULL REFERENCES capas(id) ON DELETE CASCADE,
                    action_type VARCHAR(50) NOT NULL,
                    task TEXT NOT NULL,
                    due_date TIMESTAMP WITH TIME ZONE,
                    assigned_to VARCHAR(255),
                    assigned_to_id INTEGER REFERENCES users(id),
                    notes TEXT,
                    status VARCHAR(50) DEFAULT 'open' NOT NULL,
                    completed_at TIMESTAMP WITH TIME ZONE,
                    completed_by_id INTEGER REFERENCES users(id),
                    required BOOLEAN DEFAULT TRUE,
                    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
                    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
                );
            """)
            
            connection.execute(create_table_sql)
            print("   ✅ Table capa_actions created successfully")
            
            # Step 2: Create indexes
            print("\n📝 Step 2: Creating indexes...")
            
            indexes = [
                ("idx_capa_actions_capa_id", "capa_id"),
                ("idx_capa_actions_action_type", "action_type"),
                ("idx_capa_actions_due_date", "due_date"),
                ("idx_capa_actions_assigned_to_id", "assigned_to_id"),
                ("idx_capa_actions_status", "status"),
                ("idx_capa_actions_completed_at", "completed_at")
            ]
            
            for index_name, column_name in indexes:
                try:
                    index_sql = text(f"""
                        CREATE INDEX IF NOT EXISTS {index_name} 
                        ON capa_actions({column_name});
                    """)
                    connection.execute(index_sql)
                    print(f"   ✅ Index {index_name} created")
                except Exception as e:
                    if "already exists" in str(e).lower():
                        print(f"   ⏭️  Index {index_name} already exists, skipping...")
                    else:
                        raise e
            
            # Step 3: Create composite index for common queries
            print("\n📝 Step 3: Creating composite indexes...")
            
            try:
                composite_index_sql = text("""
                    CREATE INDEX IF NOT EXISTS idx_capa_actions_type_status 
                    ON capa_actions(action_type, status);
                """)
                connection.execute(composite_index_sql)
                print("   ✅ Composite index idx_capa_actions_type_status created")
            except Exception as e:
                if "already exists" in str(e).lower():
                    print("   ⏭️  Composite index already exists, skipping...")
                else:
                    raise e
            
            try:
                overdue_index_sql = text("""
                    CREATE INDEX IF NOT EXISTS idx_capa_actions_overdue 
                    ON capa_actions(due_date, status) 
                    WHERE status NOT IN ('completed', 'cancelled');
                """)
                connection.execute(overdue_index_sql)
                print("   ✅ Partial index idx_capa_actions_overdue created")
            except Exception as e:
                if "already exists" in str(e).lower():
                    print("   ⏭️  Partial index already exists, skipping...")
                else:
                    raise e
            
            # Step 4: Create trigger for updated_at
            print("\n📝 Step 4: Creating trigger for updated_at...")
            
            try:
                # Function already exists from previous migration, just create trigger
                trigger_sql = text("""
                    CREATE TRIGGER update_capa_actions_updated_at
                        BEFORE UPDATE ON capa_actions
                        FOR EACH ROW
                        EXECUTE FUNCTION update_updated_at_column();
                """)
                connection.execute(trigger_sql)
                print("   ✅ Trigger update_capa_actions_updated_at created")
            except Exception as e:
                if "already exists" in str(e).lower():
                    print("   ⏭️  Trigger already exists, skipping...")
                else:
                    # Create function if it doesn't exist
                    try:
                        function_sql = text("""
                            CREATE OR REPLACE FUNCTION update_updated_at_column()
                            RETURNS TRIGGER AS $$
                            BEGIN
                                NEW.updated_at = NOW();
                                RETURN NEW;
                            END;
                            $$ LANGUAGE plpgsql;
                        """)
                        connection.execute(function_sql)
                        print("   ✅ Function update_updated_at_column created")
                        
                        # Try trigger again
                        connection.execute(trigger_sql)
                        print("   ✅ Trigger update_capa_actions_updated_at created")
                    except Exception as e2:
                        if "already exists" in str(e2).lower():
                            print("   ⏭️  Function/Trigger already exists, skipping...")
                        else:
                            raise e2
            
            # Step 5: Verify table creation
            print("\n📝 Step 5: Verifying table structure...")
            
            verify_sql = text("""
                SELECT column_name, data_type, is_nullable 
                FROM information_schema.columns 
                WHERE table_name = 'capa_actions' 
                ORDER BY ordinal_position;
            """)
            
            result = connection.execute(verify_sql)
            columns = result.fetchall()
            
            if columns:
                print(f"   ✅ Table capa_actions verified with {len(columns)} columns:")
                for col in columns:
                    print(f"      - {col[0]}: {col[1]} (nullable: {col[2]})")
            else:
                print("   ❌ Table verification failed!")
                return False
            
            print("\n" + "=" * 80)
            print("✅ Migration 002 completed successfully!")
            print("=" * 80)
            return True
            
        except Exception as e:
            print(f"\n❌ Migration failed: {e}")
            import traceback
            traceback.print_exc()
            return False

def rollback_migration():
    """التراجع عن Migration (حذف الجدول والفهارس)"""
    
    engine = create_engine(get_db_url())
    
    with engine.begin() as connection:
        print("=" * 80)
        print("🔄 Rolling back Migration 002...")
        print("=" * 80)
        
        try:
            # Drop trigger
            print("\n📝 Dropping trigger...")
            connection.execute(text("DROP TRIGGER IF EXISTS update_capa_actions_updated_at ON capa_actions;"))
            print("   ✅ Trigger dropped")
            
            # Drop table (CASCADE will drop indexes)
            print("\n📝 Dropping table capa_actions...")
            connection.execute(text("DROP TABLE IF EXISTS capa_actions CASCADE;"))
            print("   ✅ Table dropped")
            
            print("\n" + "=" * 80)
            print("✅ Rollback completed successfully!")
            print("=" * 80)
            return True
            
        except Exception as e:
            print(f"\n❌ Rollback failed: {e}")
            import traceback
            traceback.print_exc()
            return False

if __name__ == "__main__":
    import sys
    
    if len(sys.argv) > 1 and sys.argv[1] == "rollback":
        success = rollback_migration()
    else:
        success = run_migration()
    
    sys.exit(0 if success else 1)

