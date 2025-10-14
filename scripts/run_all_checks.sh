#!/usr/bin/env bash
set -euo pipefail

if [ -z "${DATABASE_URL:-}" ]; then
  echo "Please set DATABASE_URL and run again. Example: DATABASE_URL=postgresql://user:pass@localhost:5432/db $0"
  exit 2
fi

echo "1/4: Running migrations and seed"
./scripts/run_migrations_and_seed.sh

echo "2/4: Run DB-backed CAPA creation script for round 100"
python3 scripts/create_capa_via_db.py --round 100 --creator 1 || true

echo "3/4: Run backend smoke test"
python3 - <<'PY'
from backend.database import SessionLocal
s=SessionLocal()
print('SELECT 1 ->', s.execute('SELECT 1').fetchone())
s.close()
PY

echo "4/4: Done"


