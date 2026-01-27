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

With --production-check: verify debug/test endpoints return 404 (disabled in production).

Run:
  python3 scripts/api_smoke_tests.py --round 100
  python3 scripts/api_smoke_tests.py --round 100 --production-check

"""
import os
import sys
import argparse
import requests

BACKEND_URL = os.environ.get('BACKEND_URL', 'http://127.0.0.1:8000')


def get_super_admin_token():
    try:
        # Local import from project to create token using same secret and helpers
        from sqlalchemy import text
        from backend.database import SessionLocal
        from backend.auth import create_access_token
        s = SessionLocal()
        row = s.execute(text("SELECT email FROM users WHERE role = 'super_admin' LIMIT 1")).fetchone()
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


def run_production_debug_checks():
    """
    Verify debug/test endpoints return 404 when backend runs with ENVIRONMENT=production.
    Call this with backend started as: ENVIRONMENT=production SECRET_KEY=... uvicorn ...
    """
    debug_endpoints = [
        ('GET', f'{BACKEND_URL}/api/test/rounds', None),
        ('GET', f'{BACKEND_URL}/api/debug/constraints', None),
        ('POST', f'{BACKEND_URL}/api/test-login', {}),
        ('POST', f'{BACKEND_URL}/api/emergency/create-test-round', None),
    ]
    failed = []
    for method, url, body in debug_endpoints:
        try:
            if method == 'GET':
                resp = requests.get(url, timeout=10)
            else:
                resp = requests.post(url, json=body or {}, timeout=10)
            if resp.status_code != 404:
                failed.append((url, resp.status_code, resp.text[:200]))
                print(f'FAIL {method} {url} -> {resp.status_code} (expected 404)')
            else:
                print(f'OK   {method} {url} -> 404')
        except Exception as e:
            failed.append((url, None, str(e)))
            print(f'ERR  {method} {url} -> {e}')
    if failed:
        print(f'\nProduction debug check failed: {len(failed)} endpoint(s) did not return 404')
        sys.exit(1)
    print('\nProduction debug check passed: all debug endpoints returned 404')


if __name__ == '__main__':
    p = argparse.ArgumentParser()
    p.add_argument('--round', type=int, default=100)
    p.add_argument('--production-check', action='store_true', help='Verify debug endpoints return 404 (production mode)')
    args = p.parse_args()
    if args.production_check:
        run_production_debug_checks()
    else:
        run_smoke_tests(args.round)


