-- Add completion_percentage column to rounds table
-- This column tracks the percentage of evaluation items that have been completed

ALTER TABLE rounds 
ADD COLUMN completion_percentage INTEGER DEFAULT 0;

-- Update existing rounds to have 0 completion percentage
UPDATE rounds 
SET completion_percentage = 0 
WHERE completion_percentage IS NULL;

-- Add comment to explain the column
COMMENT ON COLUMN rounds.completion_percentage IS 'Percentage of evaluation items completed (0-100)';
