-- Delete all CAPA data from the database
-- This script will permanently remove all CAPA records

-- First, let's see how many CAPA records exist
SELECT COUNT(*) as total_capas FROM capas;

-- Delete all CAPA records
DELETE FROM capas;

-- Verify deletion
SELECT COUNT(*) as remaining_capas FROM capas;

-- Optional: Reset CAPA ID sequence (if you want to start from 1 again)
-- ALTER SEQUENCE capas_id_seq RESTART WITH 1;
