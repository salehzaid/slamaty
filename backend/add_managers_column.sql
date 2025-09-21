-- Add managers column to departments table
-- This script adds a managers column to store JSON array of user IDs

ALTER TABLE departments ADD COLUMN managers TEXT;

-- Add comment to explain the column
COMMENT ON COLUMN departments.managers IS 'JSON string containing array of user IDs for department managers';

-- Update existing departments to have empty managers array
UPDATE departments SET managers = '[]' WHERE managers IS NULL;
