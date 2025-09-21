-- Migration script to add deadline column to rounds table
-- Run this script to add the deadline column to existing database

-- Add deadline column to rounds table
ALTER TABLE rounds ADD COLUMN IF NOT EXISTS deadline TIMESTAMP WITH TIME ZONE;

-- Add comment to the column
COMMENT ON COLUMN rounds.deadline IS 'Deadline for round completion - used to calculate round period in timeline view';

-- Update existing rounds to have a default deadline (7 days after scheduled_date)
UPDATE rounds 
SET deadline = scheduled_date + INTERVAL '7 days' 
WHERE deadline IS NULL;

-- Make the column NOT NULL after setting default values (optional)
-- ALTER TABLE rounds ALTER COLUMN deadline SET NOT NULL;
