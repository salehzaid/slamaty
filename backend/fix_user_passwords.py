#!/usr/bin/env python3
"""Fix user password hashes in neondb: re-hash non-bcrypt entries using backend.auth.get_password_hash

Usage: python3 backend/fix_user_passwords.py
"""
import os
import subprocess
from sqlalchemy import create_engine, text
from dotenv import load_dotenv

load_dotenv('backend/env.neon')
REMOTE_DB = os.getenv('DATABASE_URL')

if not REMOTE_DB:
    print('DATABASE_URL not set in backend/env.neon')
    raise SystemExit(1)

print('Backing up users table to backend/users_backup.sql')
cmd = f"pg_dump '{REMOTE_DB}' --table=public.users --data-only --column-inserts -f backend/users_backup.sql"
subprocess.run(cmd, shell=True, check=False)

engine = create_engine(REMOTE_DB)

from backend.auth import get_password_hash

with engine.connect() as conn:
    rows = conn.execute(text("SELECT id, email, hashed_password FROM public.users")).fetchall()
    to_fix = [r for r in rows if not (r.hashed_password and str(r.hashed_password).startswith('$2'))]
    print(f"Found {len(to_fix)} users to re-hash")
    for r in to_fix:
        # If hashed_password appears to be plaintext (short), re-hash it
        plain = r.hashed_password
        if plain is None:
            print(f"Skipping id={r.id} email={r.email}: no password")
            continue
        if len(str(plain)) < 60:
            new_hash = get_password_hash(str(plain))
        else:
            # Fallback: treat as plaintext
            new_hash = get_password_hash(str(plain))
        print(f"Updating user id={r.id} email={r.email}")
        conn.execute(text("UPDATE public.users SET hashed_password = :h WHERE id = :id"), {'h': new_hash, 'id': r.id})
    print('Done. Committing changes.')
    conn.commit()

print('Password fix script completed.')


