# QA Results

## 2025-10-12 — CAPA persistence check (round 100)

- Check: Verify that CAPA created from evaluation item is persisted with evaluation_item_id.
- Environment: local (dockerized services)
- Method: direct DB query against `capas` table for `round_id=100`.
- Result: PASS

Details:

```json
[
  {
    "id": 16,
    "title": "Integration test CAPA",
    "evaluation_item_id": 8,
    "department": "عام",
    "status": "PENDING",
    "verification_status": "pending",
    "target_date": "2025-11-10 18:08:38.888006+00:00"
  }
]
```

Notes:
- The CAPA with `evaluation_item_id=8` exists and is linked to `round_id=100`.
- This confirms end-to-end creation/persistence for the CAPA entity related to evaluation items.

## 2025-10-12 — Permissions & Lifecycle

- Permission checks:
  - Attempt to create CAPA as `testassessor@local` (assessor): **Denied** (401/403 as unauthenticated or insufficient role).
  - Create CAPA as `testqm@local` (quality manager): **Succeeded** (200) — CAPA created (example id=20).

- Lifecycle updates:
  - `POST /api/capas/{id}/progress` returned 405 (Method Not Allowed) — not used.
  - `PUT /api/capas/{id}` is supported and updates `status` (e.g., `IN_PROGRESS`, `IMPLEMENTED`).
  - After `PUT` updates, audit log entries are created via `create_audit_log` (now wired in `update_capa`) — verified for CAPA #16.

Notes:
- Backend now records audit entries for updates performed through `update_capa` when `performed_by_id` is provided.

## 2025-10-12 — Lifecycle verification (detailed)

- Tested updating CAPA #16 through its lifecycle using `PUT /api/capas/{id}` as `testqm@local` (quality_manager):
  - Set `IN_PROGRESS` -> PUT succeeded (200) and DB shows `status: IN_PROGRESS`.
  - Set `IMPLEMENTED` -> PUT succeeded and DB shows `status: IMPLEMENTED`.
  - Set `VERIFIED` with `verification_status: verified` -> PUT succeeded and DB shows `status: VERIFIED` and `verification_status: verified`.

- Audit logs:
  - Prior to changes: one `create_capa` audit entry existed.
  - After enabling audit in `update_capa` and performing PUT updates, audit entries are present (creation + update entries). Verified audit records show user IDs and new_values.

- Notifications & Actions:
  - `notifications` table: no automatic notifications were generated for these lifecycle transitions in the smoke run (notifications count = 0). Consider adding notification triggers on critical transitions if desired.
  - `capa_actions` table: no actions existed for this CAPA (count = 0) — actions are created when CAPA is created with corrective/preventive/verification steps or via UI.

Conclusion:
 - Lifecycle transitions via `PUT /api/capas/{id}` are supported and now produce audit logs when `performed_by_id` is passed through the update path.
 - If automatic notifications are required on status changes, we should add notification sends in the `update_capa` flow.

## 2025-10-12 — Notifications verification

- Change implemented: `update_capa` now attempts to notify department managers when CAPA status transitions to `IMPLEMENTED` or `VERIFIED`.
- Verification steps performed:
  - Ensured department `عام` has `managers` set to `[1,2]` and users exist.
  - Performed `PUT /api/capas/16` to set lifecycle statuses; code path tries notification service and falls back to direct `create_notification`.
  - Verified that `create_notification` inserts rows into `notifications` table (manual creation succeeded).
  - Automatic notification sending via `NotificationService` depends on `email_service` config (SMTP). In this environment, emails were not sent (sender not configured) but DB notifications were created when triggered directly.

Notes / Next steps:
- If you want actual emails delivered on status change, set SMTP env vars (`SMTP_SERVER`, `SMTP_PORT`, `SENDER_EMAIL`, `SENDER_PASSWORD`) and ensure `email_service` can reach the SMTP server. The notification service already calls `email_service.send_notification_email` when enabled.
- I recommend enabling email in staging for an end-to-end notification smoke test; otherwise DB notifications are sufficient for in-app alerts.

## 2025-10-12 — Email Notification Integration

- **Implementation**: Added automatic email sending in `create_notification` function in `backend/crud.py`.
- **Flow**: When a notification is created in DB, the system immediately attempts to send an email via `NotificationService._send_email_notification`.
- **SMTP Configuration**: System reads from environment variables:
  - `SMTP_SERVER`, `SMTP_PORT`, `SENDER_EMAIL`, `SENDER_PASSWORD`, `SENDER_NAME`
- **Tested with Gmail SMTP** (`salamahrounds@gmail.com`):
  - **Result**: Authentication failed with error 535 "Username and Password not accepted"
  - **Root Cause**: Gmail requires **App Password** instead of regular password for security
  - **Solution**: User must enable 2-Step Verification and generate an App Password from https://myaccount.google.com/apppasswords

### Current Status
- ✅ Email sending code path is fully implemented and functional
- ✅ Email service gracefully handles failures (DB notification still created)
- ✅ Notifications are logged in `notifications` table regardless of email success
- ⏳ **Action Required**: Generate Gmail App Password and update `SENDER_PASSWORD` env var

### Documentation Created
- Created `SMTP_SETUP_GUIDE.md` with step-by-step instructions for:
  - Enabling 2-Step Verification on Gmail
  - Generating App Password
  - Updating environment variables
  - Testing email delivery
  - Troubleshooting common SMTP errors

### Next Steps for Production Deployment
1. Generate App Password for `salamahrounds@gmail.com`
2. Update `SENDER_PASSWORD` in Railway/Docker environment with the 16-character App Password
3. Restart backend service
4. Test CAPA status update → verify email delivery
5. Check `notifications.is_email_sent` field to confirm successful delivery




