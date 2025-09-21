-- Add assigned_to_id column to capas table
-- This column will store the user ID of the assigned manager

ALTER TABLE capas ADD COLUMN IF NOT EXISTS assigned_to_id INTEGER REFERENCES users(id);

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_capas_assigned_to_id ON capas(assigned_to_id);

-- Update existing CAPAs to have assigned_to_id if assigned_to contains user information
-- This is a placeholder - actual migration logic would depend on current data format
-- UPDATE capas SET assigned_to_id = (SELECT id FROM users WHERE CONCAT(first_name, ' ', last_name) = assigned_to LIMIT 1) WHERE assigned_to_id IS NULL;
