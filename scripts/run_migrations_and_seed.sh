#!/usr/bin/env bash
# Run DB migrations and seed sample CAPA data
# Usage: DATABASE_URL=postgresql://user:pass@host:port/dbname ./scripts/run_migrations_and_seed.sh

set -euo pipefail

if [ -z "${DATABASE_URL:-}" ]; then
  echo "ERROR: Please set DATABASE_URL environment variable, e.g. postgresql://user:pass@host:5432/db"
  exit 2
fi

echo "Running migrations..."
# Apply migration files in order
psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f backend/migrations/0002_add_updated_at_to_capas.sql
psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f backend/migrations/add_capa_dashboard_tables.sql || true

echo "Seeding sample CAPA data (may fail if already applied)..."
psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f backend/migrations/insert_sample_capa_data.sql || {
  echo "Seed script failed; check the SQL for constraint issues."
  exit 0
}

echo "Updating sequences..."
psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -c "SELECT setval('capas_id_seq', (SELECT COALESCE(MAX(id), 1) FROM capas));"
psn
echo "Done."


