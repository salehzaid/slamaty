Playwright E2E run guide (local & CI)

Quick smoke (fast, uses injected failingItems):

- Ensure backend and frontend are running (docker compose or individually).
- From project root run (uses Playwright Docker image to avoid local browser install):

  docker run --rm --network container:salamah-frontend -v $(pwd)/e2e:/work/e2e -v $(pwd)/playwright.config.ts:/work/playwright.config.ts -w /work mcr.microsoft.com/playwright:v1.56.0-jammy \
    bash -lc "npm init -y >/dev/null 2>&1 || true; npm i @playwright/test@1.56.0 --silent --no-audit --no-fund || true; npx playwright test e2e/tests/evaluate_to_capa.spec.ts --project=chromium --reporter=list --timeout=120000"

- The test uses an injected localStorage key `E2E_FAILING_ITEMS` to show the failing panel and avoids full UI login to be fast and stable.

Full E2E (CI / complete local run):

- Install dependencies locally:
  - npm ci
  - npx playwright install --with-deps
- Run all tests:
  - npx playwright test

CI (GitHub Actions):

- Workflow should:
  - Set up services (Postgres, backend, frontend) or use test containers.
  - Install Node deps and Playwright browsers: `npm ci && npx playwright install --with-deps`.
  - Start frontend with Vite and backend with uvicorn (or use built images).
  - Run `npx playwright test --project=chromium --reporter=dot`.

Notes / Troubleshooting:
- If you see `Executable doesn't exist` error, use matching Playwright Docker image version (e.g. `mcr.microsoft.com/playwright:v1.56.0-jammy`).
- If tests cannot reach `http://127.0.0.1:5173` inside container, run Playwright container with `--network container:salamah-frontend` so it shares the same network/localhost.
- Use the smoke test first to validate the minimal flow quickly.


