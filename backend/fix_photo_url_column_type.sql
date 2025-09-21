-- Migration script to change photo_url column type from VARCHAR(255) to TEXT
-- This allows storing larger base64 encoded images

-- Change photo_url column type to TEXT
ALTER TABLE users ALTER COLUMN photo_url TYPE TEXT;

-- Add comment to the column
COMMENT ON COLUMN users.photo_url IS 'URL or base64 encoded user profile photo (TEXT type for large images)';
