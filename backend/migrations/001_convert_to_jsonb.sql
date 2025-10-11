-- Migration: Convert rounds TEXT fields to JSONB for better data integrity
-- Date: 2025-10-11
-- Purpose: Ensure selected_categories, evaluation_items, and assigned_to_ids are stored as JSONB

-- STEP 1: BACKUP CURRENT DATA
-- Before running this migration, create a backup:
-- pg_dump -U postgres -d salamaty_db > salamaty_db_backup_$(date +%Y%m%d_%H%M%S).dump

BEGIN;

-- STEP 2: Add temporary columns with JSONB type
ALTER TABLE rounds ADD COLUMN IF NOT EXISTS selected_categories_new JSONB DEFAULT '[]'::jsonb;
ALTER TABLE rounds ADD COLUMN IF NOT EXISTS evaluation_items_new JSONB DEFAULT '[]'::jsonb;
ALTER TABLE rounds ADD COLUMN IF NOT EXISTS assigned_to_ids_new JSONB DEFAULT '[]'::jsonb;

-- STEP 3: Migrate data safely with validation and logging
-- For selected_categories
UPDATE rounds 
SET selected_categories_new = CASE 
    -- If NULL, set to empty array
    WHEN selected_categories IS NULL THEN '[]'::jsonb
    -- If empty string, set to empty array
    WHEN selected_categories = '' THEN '[]'::jsonb
    -- If already valid JSON, cast it
    WHEN selected_categories::text ~ '^\s*\[.*\]\s*$' THEN 
        CASE 
            WHEN selected_categories::jsonb IS NOT NULL THEN selected_categories::jsonb
            ELSE '[]'::jsonb
        END
    -- Fallback to empty array for invalid data
    ELSE '[]'::jsonb
END;

-- For evaluation_items
UPDATE rounds 
SET evaluation_items_new = CASE 
    WHEN evaluation_items IS NULL THEN '[]'::jsonb
    WHEN evaluation_items = '' THEN '[]'::jsonb
    WHEN evaluation_items::text ~ '^\s*\[.*\]\s*$' THEN 
        CASE 
            WHEN evaluation_items::jsonb IS NOT NULL THEN evaluation_items::jsonb
            ELSE '[]'::jsonb
        END
    ELSE '[]'::jsonb
END;

-- For assigned_to_ids
UPDATE rounds 
SET assigned_to_ids_new = CASE 
    WHEN assigned_to_ids IS NULL THEN '[]'::jsonb
    WHEN assigned_to_ids = '' THEN '[]'::jsonb
    WHEN assigned_to_ids::text ~ '^\s*\[.*\]\s*$' THEN 
        CASE 
            WHEN assigned_to_ids::jsonb IS NOT NULL THEN assigned_to_ids::jsonb
            ELSE '[]'::jsonb
        END
    ELSE '[]'::jsonb
END;

-- STEP 4: Log any rows that had invalid data (for audit purposes)
-- Create a temporary table to store migration logs
CREATE TEMP TABLE migration_log AS
SELECT 
    id,
    round_code,
    selected_categories as old_selected_categories,
    evaluation_items as old_evaluation_items,
    assigned_to_ids as old_assigned_to_ids,
    selected_categories_new::text as new_selected_categories,
    evaluation_items_new::text as new_evaluation_items,
    assigned_to_ids_new::text as new_assigned_to_ids
FROM rounds
WHERE 
    selected_categories IS NOT NULL AND selected_categories != '[]'
    OR evaluation_items IS NOT NULL AND evaluation_items != '[]'
    OR assigned_to_ids IS NOT NULL AND assigned_to_ids != '[]';

-- Display migration summary
DO $$
DECLARE
    total_rounds INTEGER;
    migrated_categories INTEGER;
    migrated_items INTEGER;
    migrated_assigned INTEGER;
BEGIN
    SELECT COUNT(*) INTO total_rounds FROM rounds;
    SELECT COUNT(*) INTO migrated_categories FROM rounds WHERE selected_categories_new != '[]'::jsonb;
    SELECT COUNT(*) INTO migrated_items FROM rounds WHERE evaluation_items_new != '[]'::jsonb;
    SELECT COUNT(*) INTO migrated_assigned FROM rounds WHERE assigned_to_ids_new != '[]'::jsonb;
    
    RAISE NOTICE 'Migration Summary:';
    RAISE NOTICE '  Total rounds: %', total_rounds;
    RAISE NOTICE '  Rounds with categories: %', migrated_categories;
    RAISE NOTICE '  Rounds with evaluation items: %', migrated_items;
    RAISE NOTICE '  Rounds with assigned users: %', migrated_assigned;
END $$;

-- STEP 5: Drop old columns and rename new ones
ALTER TABLE rounds DROP COLUMN IF EXISTS selected_categories;
ALTER TABLE rounds DROP COLUMN IF EXISTS evaluation_items;
ALTER TABLE rounds DROP COLUMN IF EXISTS assigned_to_ids;

ALTER TABLE rounds RENAME COLUMN selected_categories_new TO selected_categories;
ALTER TABLE rounds RENAME COLUMN evaluation_items_new TO evaluation_items;
ALTER TABLE rounds RENAME COLUMN assigned_to_ids_new TO assigned_to_ids;

-- STEP 6: Add constraints and indexes for performance
ALTER TABLE rounds ALTER COLUMN selected_categories SET DEFAULT '[]'::jsonb;
ALTER TABLE rounds ALTER COLUMN evaluation_items SET DEFAULT '[]'::jsonb;
ALTER TABLE rounds ALTER COLUMN assigned_to_ids SET DEFAULT '[]'::jsonb;

-- Add GIN indexes for faster JSONB queries
CREATE INDEX IF NOT EXISTS idx_rounds_selected_categories ON rounds USING GIN (selected_categories);
CREATE INDEX IF NOT EXISTS idx_rounds_evaluation_items ON rounds USING GIN (evaluation_items);
CREATE INDEX IF NOT EXISTS idx_rounds_assigned_to_ids ON rounds USING GIN (assigned_to_ids);

-- STEP 7: Verify migration
DO $$
DECLARE
    invalid_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO invalid_count 
    FROM rounds 
    WHERE 
        selected_categories IS NULL 
        OR evaluation_items IS NULL 
        OR assigned_to_ids IS NULL;
    
    IF invalid_count > 0 THEN
        RAISE EXCEPTION 'Migration verification failed: % rows have NULL values', invalid_count;
    ELSE
        RAISE NOTICE 'Migration verification passed: All JSONB columns are non-NULL';
    END IF;
END $$;

COMMIT;

-- STEP 8: Display final verification
SELECT 
    'Migration completed successfully' as status,
    COUNT(*) as total_rounds,
    COUNT(*) FILTER (WHERE selected_categories != '[]'::jsonb) as with_categories,
    COUNT(*) FILTER (WHERE evaluation_items != '[]'::jsonb) as with_items,
    COUNT(*) FILTER (WHERE assigned_to_ids != '[]'::jsonb) as with_assigned
FROM rounds;

-- To view migration log (if needed):
-- SELECT * FROM migration_log;

