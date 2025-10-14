#!/usr/bin/env python3
"""
Simple API smoke tests for CAPA-related endpoints.

Requires:
  - A running backend at BACKEND_URL (default http://127.0.0.1:8000)
  - The project's Python environment available so we can create a SUPER_ADMIN JWT locally

This script will:
  - Generate a SUPER_ADMIN JWT using backend.auth.create_access_token for an existing super_admin user
  - Call endpoints: /api/capas/, /api/actions/, /api/alerts/, /api/timeline/events/, /api/rounds/{id}/items-needing-capa
  - Print status codes and first JSON objects

Run:
  python3 scripts/api_smoke_tests.py --round 100

"""
import os
import sys
import argparse
import requests

BACKEND_URL = os.environ.get('BACKEND_URL', 'http://127.0.0.1:8000')


def get_super_admin_token():
    try:
        # Local import from project to create token using same secret and helpers
        from backend.database import SessionLocal
        from backend.auth import create_access_token
        s = SessionLocal()
        row = s.execute("SELECT email FROM users WHERE role = 'super_admin' LIMIT 1").fetchone()
        s.close()
        if not row:
            print('No super_admin user found in DB')
            return None
        email = row[0]
        token = create_access_token({ 'sub': email })
        return token
    except Exception as e:
        print('Failed to create token locally:', e)
        return None


def pretty_print_response(resp):
    print(f"{resp.status_code} {resp.url}")
    try:
        j = resp.json()
        if isinstance(j, list):
            print('  count =', len(j))
            if len(j) > 0:
                print('  sample:', j[0])
        elif isinstance(j, dict):
            # print top-level keys and small sample
            print('  keys =', list(j.keys()))
            # print a small sample if contains 'capas' or similar
            for k in ('capas','items','data'):
                if k in j:
                    print('  sample ->', (j[k][0] if isinstance(j[k], list) and j[k] else j[k]))
        else:
            print('  response:', j)
    except Exception:
        print('  (non-json response)')


def run_smoke_tests(round_id: int):
    token = get_super_admin_token()
    headers = {}
    if token:
        headers['Authorization'] = f'Bearer {token}'
    else:
        print('Warning: no token available, requests may be unauthorized')

    endpoints = [
        ('GET', f'{BACKEND_URL}/api/capas/'),
        ('GET', f'{BACKEND_URL}/api/actions/'),
        ('GET', f'{BACKEND_URL}/api/alerts/'),
        ('GET', f'{BACKEND_URL}/api/timeline/events/'),
        ('GET', f'{BACKEND_URL}/api/rounds/{round_id}/items-needing-capa')
    ]

    for method, url in endpoints:
        try:
            if method == 'GET':
                resp = requests.get(url, headers=headers, timeout=15)
            else:
                resp = requests.request(method, url, headers=headers, timeout=15)
            pretty_print_response(resp)
        except Exception as e:
            print('Request failed for', url, e)


if __name__ == '__main__':
    p = argparse.ArgumentParser()
    p.add_argument('--round', type=int, default=100)
    args = p.parse_args()
    run_smoke_tests(args.round)


