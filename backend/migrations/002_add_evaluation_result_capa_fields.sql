-- Migration: add needs_capa and capa_note to evaluation_results
BEGIN;

ALTER TABLE IF EXISTS evaluation_results
  ADD COLUMN IF NOT EXISTS needs_capa BOOLEAN DEFAULT FALSE;

ALTER TABLE IF EXISTS evaluation_results
  ADD COLUMN IF NOT EXISTS capa_note TEXT;

COMMIT;


