-- Rollback Migration: Convert JSONB back to TEXT
-- WARNING: Use this only if you need to revert the migration
-- Date: 2025-10-11

BEGIN;

-- STEP 1: Add TEXT columns back
ALTER TABLE rounds ADD COLUMN IF NOT EXISTS selected_categories_text TEXT DEFAULT '[]';
ALTER TABLE rounds ADD COLUMN IF NOT EXISTS evaluation_items_text TEXT DEFAULT '[]';
ALTER TABLE rounds ADD COLUMN IF NOT EXISTS assigned_to_ids_text TEXT DEFAULT '[]';

-- STEP 2: Convert JSONB back to TEXT
UPDATE rounds SET selected_categories_text = selected_categories::text;
UPDATE rounds SET evaluation_items_text = evaluation_items::text;
UPDATE rounds SET assigned_to_ids_text = assigned_to_ids::text;

-- STEP 3: Drop JSONB columns and indexes
DROP INDEX IF EXISTS idx_rounds_selected_categories;
DROP INDEX IF EXISTS idx_rounds_evaluation_items;
DROP INDEX IF EXISTS idx_rounds_assigned_to_ids;

ALTER TABLE rounds DROP COLUMN IF EXISTS selected_categories;
ALTER TABLE rounds DROP COLUMN IF EXISTS evaluation_items;
ALTER TABLE rounds DROP COLUMN IF EXISTS assigned_to_ids;

-- STEP 4: Rename TEXT columns
ALTER TABLE rounds RENAME COLUMN selected_categories_text TO selected_categories;
ALTER TABLE rounds RENAME COLUMN evaluation_items_text TO evaluation_items;
ALTER TABLE rounds RENAME COLUMN assigned_to_ids_text TO assigned_to_ids;

-- STEP 5: Verify rollback
SELECT 
    'Rollback completed' as status,
    COUNT(*) as total_rounds
FROM rounds;

COMMIT;

RAISE NOTICE 'Rollback completed. JSONB columns converted back to TEXT.';

