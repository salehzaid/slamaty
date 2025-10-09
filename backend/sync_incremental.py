#!/usr/bin/env python3
"""Incremental sync from local salamaty_db to remote neondb.

Usage: python3 backend/sync_incremental.py

This script reads rows modified since last sync (based on updated_at column when present)
and upserts them into the remote Neon database. It stores a checkpoint in sync_state.json.
"""
import os
import json
from datetime import datetime
from dotenv import load_dotenv
from sqlalchemy import create_engine, MetaData, Table, select
from sqlalchemy.dialects.postgresql import insert as pg_insert


load_dotenv('backend/env.neon')
# Local DB will use DATABASE_URL env or default to local salamaty_db
LOCAL_DB = os.getenv('LOCAL_DATABASE_URL') or os.getenv('DATABASE_URL') or 'postgresql://postgres:mass@localhost:5432/salamaty_db'
REMOTE_DB = os.getenv('DATABASE_URL')  # env.neon sets this

SYNC_STATE_FILE = 'backend/sync_state.json'
TABLES = [
    'users',
    'departments',
    'evaluation_categories',
    'evaluation_items',
    'round_types',
    'rounds',
    'capas',
]


def load_state():
    if os.path.exists(SYNC_STATE_FILE):
        return json.load(open(SYNC_STATE_FILE))
    return {}


def save_state(state):
    json.dump(state, open(SYNC_STATE_FILE, 'w'), indent=2, default=str)


def get_engine(url):
    return create_engine(url)


def sync_table(table_name, local_engine, remote_engine, state):
    print(f"Syncing table: {table_name}")
    local_meta = MetaData()
    remote_meta = MetaData()
    local_table = Table(table_name, local_meta, autoload_with=local_engine)
    remote_table = Table(table_name, remote_meta, autoload_with=remote_engine)

    last = state.get(table_name)
    # if last exists, query rows updated since then, else full copy
    if 'updated_at' in local_table.c:
        if last:
            since = last
            stmt = select(local_table).where(local_table.c.updated_at > since)
        else:
            stmt = select(local_table)
    else:
        # fallback to full copy when no updated_at
        stmt = select(local_table)

    with local_engine.connect() as lconn, remote_engine.connect() as rconn:
        rows = lconn.execute(stmt).fetchall()
        print(f"  Found {len(rows)} rows to upsert")
        max_ts = last
        for row in rows:
            row_dict = dict(row._mapping)
            # remove SQLAlchemy RowProxy objects in values
            if 'updated_at' in row_dict and row_dict['updated_at'] is not None:
                max_ts = max(max_ts, row_dict['updated_at']) if max_ts else row_dict['updated_at']

            insert_stmt = pg_insert(remote_table).values(**row_dict)
            pk_cols = [c.name for c in remote_table.primary_key.columns]
            upd = {c: insert_stmt.excluded[c] for c in row_dict.keys() if c not in pk_cols}
            upsert = insert_stmt.on_conflict_do_update(index_elements=pk_cols, set_=upd)
            try:
                rconn.execute(upsert)
            except Exception as e:
                print(f"    Warning: upsert failed for pk={ {k: row_dict.get(k) for k in pk_cols} }: {e}")
        # update state
        if max_ts:
            state[table_name] = str(max_ts)
        else:
            # set now to avoid repeating massive full copies
            state[table_name] = datetime.utcnow().isoformat()


def main():
    if not REMOTE_DB:
        print("REMOTE DATABASE_URL not set in backend/env.neon")
        return
    local_engine = get_engine(LOCAL_DB)
    remote_engine = get_engine(REMOTE_DB)
    state = load_state()
    for t in TABLES:
        try:
            sync_table(t, local_engine, remote_engine, state)
        except Exception as e:
            print(f"Error syncing {t}: {e}")
    save_state(state)
    print("Sync complete. State saved to", SYNC_STATE_FILE)


if __name__ == '__main__':
    main()


