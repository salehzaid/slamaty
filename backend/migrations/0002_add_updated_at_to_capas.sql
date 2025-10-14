-- Migration: add updated_at column to capas and trigger to maintain it
-- Adds a timestamp column with timezone and a trigger to update it on row updates

BEGIN;

-- Add column if not exists (safe to run multiple times)
ALTER TABLE IF EXISTS capas
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP;

-- Create function to set updated_at on update
CREATE OR REPLACE FUNCTION set_capas_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger that calls the function before update
DROP TRIGGER IF EXISTS trg_set_capas_updated_at ON capas;
CREATE TRIGGER trg_set_capas_updated_at
BEFORE UPDATE ON capas
FOR EACH ROW
EXECUTE FUNCTION set_capas_updated_at();

COMMIT;

-- Make the migration idempotent for environments that need the function name present
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'set_capas_updated_at') THEN
        PERFORM 1;
    END IF;
END$$;

-- Notes:
--  - This file is safe to re-run (uses IF NOT EXISTS and DROP TRIGGER IF EXISTS).
--  - After applying, views that reference updated_at should work.


