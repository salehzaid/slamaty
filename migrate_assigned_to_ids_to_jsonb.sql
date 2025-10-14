-- =====================================================
-- Migration Script: Convert assigned_to_ids to JSONB
-- Project: Salamah Rounds
-- Date: $(date)
-- Description: Safely migrate assigned_to_ids column from TEXT to JSONB
-- =====================================================

-- Step 1: Create backup table (optional but recommended)
CREATE TABLE IF NOT EXISTS rounds_backup_assigned_to_ids AS 
SELECT id, assigned_to_ids, created_at 
FROM rounds 
WHERE assigned_to_ids IS NOT NULL;

-- Step 2: Check for invalid JSON data
-- This query will show any rows that don't contain valid JSON arrays
SELECT 
    id, 
    assigned_to_ids,
    'Invalid JSON format' as issue
FROM rounds 
WHERE assigned_to_ids IS NOT NULL 
  AND assigned_to_ids != ''
  AND NOT (assigned_to_ids ~ '^\s*\[.*\]\s*$');

-- Step 3: Fix NULL and empty values
UPDATE rounds 
SET assigned_to_ids = '[]' 
WHERE assigned_to_ids IS NULL OR assigned_to_ids = '';

-- Step 4: Fix any malformed JSON (convert single numbers to arrays)
UPDATE rounds 
SET assigned_to_ids = '[' || assigned_to_ids || ']'
WHERE assigned_to_ids IS NOT NULL 
  AND assigned_to_ids != ''
  AND assigned_to_ids ~ '^\s*\d+\s*$';

-- Step 5: Validate all data before migration
-- Run this to ensure all data is valid JSON
SELECT 
    COUNT(*) as total_rows,
    COUNT(CASE WHEN assigned_to_ids ~ '^\s*\[.*\]\s*$' THEN 1 END) as valid_json_rows,
    COUNT(CASE WHEN NOT (assigned_to_ids ~ '^\s*\[.*\]\s*$') THEN 1 END) as invalid_json_rows
FROM rounds 
WHERE assigned_to_ids IS NOT NULL;

-- Step 6: Perform the actual migration
-- This is the critical step - convert TEXT to JSONB
BEGIN;

-- Add new JSONB column
ALTER TABLE rounds ADD COLUMN assigned_to_ids_new JSONB;

-- Copy and convert data
UPDATE rounds 
SET assigned_to_ids_new = assigned_to_ids::jsonb
WHERE assigned_to_ids IS NOT NULL;

-- Set default for any remaining NULL values
UPDATE rounds 
SET assigned_to_ids_new = '[]'::jsonb
WHERE assigned_to_ids_new IS NULL;

-- Drop old column
ALTER TABLE rounds DROP COLUMN assigned_to_ids;

-- Rename new column to original name
ALTER TABLE rounds RENAME COLUMN assigned_to_ids_new TO assigned_to_ids;

-- Add NOT NULL constraint with default
ALTER TABLE rounds ALTER COLUMN assigned_to_ids SET NOT NULL;
ALTER TABLE rounds ALTER COLUMN assigned_to_ids SET DEFAULT '[]'::jsonb;

-- Create GIN index for better JSONB performance
CREATE INDEX IF NOT EXISTS idx_rounds_assigned_to_ids_gin 
ON rounds USING GIN (assigned_to_ids);

COMMIT;

-- Step 7: Verification queries
-- Verify the migration was successful
SELECT 
    column_name, 
    data_type, 
    is_nullable, 
    column_default
FROM information_schema.columns 
WHERE table_name = 'rounds' 
  AND column_name = 'assigned_to_ids';

-- Test the JSONB operations
SELECT 
    id, 
    title, 
    assigned_to_ids,
    jsonb_array_length(assigned_to_ids) as user_count
FROM rounds 
WHERE assigned_to_ids @> '[1]'::jsonb
LIMIT 5;

-- Step 8: Cleanup (optional - run after confirming everything works)
-- DROP TABLE IF EXISTS rounds_backup_assigned_to_ids;

-- =====================================================
-- ROLLBACK SCRIPT (in case of issues)
-- =====================================================
/*
-- If you need to rollback, run this:

BEGIN;

-- Add back TEXT column
ALTER TABLE rounds ADD COLUMN assigned_to_ids_old TEXT;

-- Copy data back from backup
UPDATE rounds 
SET assigned_to_ids_old = backup.assigned_to_ids
FROM rounds_backup_assigned_to_ids backup
WHERE rounds.id = backup.id;

-- Drop JSONB column
ALTER TABLE rounds DROP COLUMN assigned_to_ids;

-- Rename back
ALTER TABLE rounds RENAME COLUMN assigned_to_ids_old TO assigned_to_ids;

COMMIT;
*/
