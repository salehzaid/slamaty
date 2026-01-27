# Deployment and hosting setup

This document explains how to set up GitHub secrets, create and link a Railway project, connect Neon Postgres, and test Docker locally.

1) Set GitHub secret `RAILWAY_TOKEN`
  - Go to your repository on GitHub: `https://github.com/salehzaid/quality_rounds/settings/secrets/actions`
  - Click `New repository secret`.
  - Name: `RAILWAY_TOKEN`
  - Value: your Railway API token.
  - Click `Add secret`.

2) Create Railway project and link repository (web UI)
  - Open `https://railway.app` and sign in.
  - Click `New Project` -> `Deploy from GitHub`.
  - Authorize GitHub and select `salehzaid/quality_rounds`.
  - Choose branch `main` and deploy.
  - After creation, go to `Settings` -> `Environment` -> `Add Variable` and add `DATABASE_URL` with your Neon connection string.

3) Create Neon Postgres (if needed)
  - Sign in to Neon console: `https://console.neon.tech`.
  - Create a new project, then create a branching or dedicated Postgres database.
  - Obtain the `DATABASE_URL` from Neon (Connection -> JDBC/URI string) and copy it.

4) Local Docker test
  - Build and run locally:
    ```bash
    docker compose up --build
    ```
  - Backend should be on `http://localhost:8000` and frontend on `http://localhost:5173`.

5) GitHub Actions (CI)
  - The repository includes `.github/workflows/ci.yml` that runs on pushes to `main`.
  - To add deployment step to Railway, either use Railway's GitHub App or add a deploy step that uses `railway up` (requires `railway` CLI and `RAILWAY_TOKEN`).

If you want, I can continue and manually create the Railway project and set environment variables for you if you provide access via the Railway web UI or grant me temporary tokens. Otherwise follow the steps above and tell me when you're ready so I can finish the Neon linking.


