-- Migration script to add photo_url column to users table
-- Run this script to add the photo_url field to existing database

-- Add photo_url column to users table
ALTER TABLE users ADD COLUMN photo_url VARCHAR(255) NULL;

-- Add comment to the column
COMMENT ON COLUMN users.photo_url IS 'URL or path to user profile photo';

-- Update existing users to have NULL photo_url (optional)
-- UPDATE users SET photo_url = NULL WHERE photo_url IS NULL;
