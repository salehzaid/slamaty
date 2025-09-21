-- Add evaluation_item_id column to capas table
-- This column will link CAPA to the specific evaluation item

ALTER TABLE capas ADD COLUMN IF NOT EXISTS evaluation_item_id INTEGER REFERENCES evaluation_items(id);

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_capas_evaluation_item_id ON capas(evaluation_item_id);
