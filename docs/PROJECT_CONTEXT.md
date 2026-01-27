# 📦 Project Context Pack: Sallamaty (سلامتي)

> **Last Updated:** January 25, 2026

---

## 1. App Purpose & Overview

**Sallamaty** is a healthcare quality management web application for managing **patient safety rounds** and **quality assessments** in healthcare institutions. The name "سلامتي" translates to "My Safety" in Arabic.

### Core Value Proposition
- Conduct and track quality rounds (patient safety, infection control, hygiene, etc.)
- Evaluate compliance using standardized evaluation items
- Generate and track **CAPA** (Corrective and Preventive Actions) for non-compliant findings
- Provide analytics and reporting for quality management

---

## 2. User Roles & Permissions

| Role | Arabic | Permissions |
|------|--------|-------------|
| `super_admin` | مدير النظام | Full system access, all CRUD operations, user management |
| `quality_manager` | مدير الجودة | Quality management, CAPA operations, user management, reports |
| `department_head` | رئيس القسم | Department-level management, create CAPAs, view rounds |
| `assessor` | مقيّم | Conduct rounds, submit evaluations, view assigned tasks |
| `viewer` | مشاهد | Read-only access to dashboards and reports |

---

## 3. Architecture Map

```
┌─────────────────────────────────────────────────────────────────┐
│                        FRONTEND                                  │
│  React 18 + TypeScript + Vite (Port 5174)                       │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │ UI: shadcn/ui + TailwindCSS + RTL Support (Arabic)          ││
│  │ State: React Context (Auth, Notifications, Layout)          ││
│  │ Forms: React Hook Form + Zod Validation                     ││
│  │ Charts: Recharts                                            ││
│  └─────────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────────┘
                              │ HTTP/REST
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                        BACKEND                                   │
│  FastAPI + Python 3.11 + Uvicorn (Port 8000)                    │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │ Auth: JWT (HS256, 60min expiry)                             ││
│  │ ORM: SQLAlchemy 2.0                                         ││
│  │ Validation: Pydantic                                        ││
│  │ Migrations: Alembic + SQL scripts                           ││
│  └─────────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────────┘
                              │ SQL
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                        DATABASE                                  │
│  PostgreSQL (salamaty_db)                                       │
│  Connection: postgresql://postgres:mass@localhost:5432          │
└─────────────────────────────────────────────────────────────────┘
```

---

## 4. Key Entry Points & Important Folders

### Frontend (`src/`)

| Path | Description |
|------|-------------|
| `src/main.tsx` | Application bootstrap |
| `src/App.tsx` | Root component, routing, auth guard |
| `src/components/pages/` | Page components (RoundsManagement, ReportsPage, etc.) |
| `src/components/forms/` | Form components (RoundForm, CapaForm, UserForm) |
| `src/components/dashboard/` | Dashboard widgets (EnhancedCapaDashboard, AlertSystem) |
| `src/components/ui/` | shadcn/ui components (button, card, input, etc.) |
| `src/context/` | React contexts (Auth, Notifications, Layout, Evaluation) |
| `src/hooks/` | Custom hooks (useAuth, useRounds, useCapas, useApi) |
| `src/lib/api.ts` | Centralized API client |
| `src/lib/validations.ts` | Zod schemas for frontend validation |
| `src/types/index.ts` | TypeScript type definitions |

### Backend (`backend/`)

| Path | Description |
|------|-------------|
| `backend/main.py` | FastAPI app, routes, middleware (~3000 lines) |
| `backend/models_updated.py` | **Primary** SQLAlchemy models |
| `backend/schemas.py` | Pydantic request/response schemas |
| `backend/crud.py` | Database CRUD operations |
| `backend/auth.py` | JWT authentication, password hashing |
| `backend/database.py` | SQLAlchemy engine & session |
| `backend/capa_router.py` | CAPA-specific API routes |
| `backend/api_capa_actions.py` | CAPA action endpoints |
| `backend/api_enhanced_dashboard.py` | Dashboard API |
| `backend/api_analytics.py` | Analytics endpoints |
| `backend/notification_service.py` | Notification logic |
| `backend/migrations/` | SQL migration files |

---

## 5. Core Entities & Relationships

### Entity Relationship Diagram

```
┌─────────────┐         ┌─────────────┐
│    User     │────────▶│   Round     │ (creates)
│             │◀────────│             │ (assigned_to)
└─────────────┘         └──────┬──────┘
       │                       │
       │                       │ 1:N
       │                       ▼
       │                ┌─────────────┐
       │                │    CAPA     │◀───────────┐
       │                └──────┬──────┘            │
       │                       │                    │
       │                       │ 1:N               │
       │                       ▼                    │
       │                ┌─────────────┐            │
       │                │ CapaAction  │            │
       │                │(corrective/ │            │
       │                │preventive/  │            │
       │                │verification)│            │
       │                └─────────────┘            │
       │                                           │
       │    ┌─────────────────────────────────┐   │
       │    │     EvaluationCategory          │   │
       │    └───────────┬─────────────────────┘   │
       │                │ 1:N                      │
       │                ▼                          │
       │    ┌─────────────────────────────────┐   │
       │    │       EvaluationItem            │───┘
       │    └───────────┬─────────────────────┘
       │                │ 1:N
       │                ▼
       │    ┌─────────────────────────────────┐
       └───▶│      EvaluationResult           │
            │  (score, comments, needs_capa)  │
            └─────────────────────────────────┘
```

### Entity Summary

| Entity | Key Fields |
|--------|------------|
| **User** | id, username, email, role, department, is_active |
| **Department** | id, name, name_en, code, location |
| **Round** | id, round_code, title, round_type, status, scheduled_date, compliance_percentage |
| **CAPA** | id, title, status, priority, risk_score, target_date, corrective_actions, preventive_actions |
| **CapaAction** | id, capa_id, action_type, task, due_date, status |
| **EvaluationCategory** | id, name, name_en, color, icon |
| **EvaluationItem** | id, code, title, risk_level, category_id |
| **EvaluationResult** | id, round_id, item_id, score, needs_capa |
| **Notification** | id, user_id, title, message, status |
| **AuditLog** | id, user_id, action, entity_type, entity_id |

### Key Enums

```python
# Round Status
RoundStatus = SCHEDULED | IN_PROGRESS | PENDING_REVIEW | UNDER_REVIEW | COMPLETED | CANCELLED | ON_HOLD | OVERDUE

# CAPA Status
CapaStatus = PENDING | ASSIGNED | IN_PROGRESS | IMPLEMENTED | VERIFICATION | VERIFIED | REJECTED | CLOSED

# Round Types
RoundType = PATIENT_SAFETY | INFECTION_CONTROL | HYGIENE | MEDICATION_SAFETY | EQUIPMENT_SAFETY | ENVIRONMENTAL | GENERAL

# Priority Levels
Priority = LOW | MEDIUM | HIGH | CRITICAL

# User Roles
UserRole = SUPER_ADMIN | QUALITY_MANAGER | DEPARTMENT_HEAD | ASSESSOR | VIEWER

# Risk Levels
RiskLevel = MINOR | MAJOR | CRITICAL
```

---

## 6. Major Application Flows

### Flow 1: Round Creation & Assignment

```
User → Create Round Form → POST /api/rounds → Generate round_code 
→ Assign users → Create notifications → Status: SCHEDULED
```

**Steps:**
1. User navigates to `/rounds`
2. Clicks "Create Round"
3. Fills `RoundForm` (title, type, department, assigned users, scheduled date, deadline, evaluation items)
4. `POST /api/rounds` creates round with auto-generated `round_code`
5. Notifications sent to assigned users
6. Round status set to `SCHEDULED`

### Flow 2: Round Evaluation

```
Assessor → Select Round → Load EvaluationItems → Fill scores/comments
→ Save Draft (optional) → Finalize → Calculate compliance % 
→ Auto-create CAPAs for non-compliant items (<70%) → Status: COMPLETED
```

**Steps:**
1. Assessor navigates to `/rounds/evaluate/:roundId` or `/rounds/my-rounds`
2. Selects round to evaluate
3. `EvaluateRoundPage` loads evaluation items by category
4. User fills evaluation form (status, comments, evidence)
5. Can save draft: `POST /api/rounds/{round_id}/evaluations/draft`
6. On finalize: `POST /api/rounds/{round_id}/evaluations/finalize`
7. Backend calculates compliance percentage
8. Auto-creates CAPAs for non-compliant items (threshold < 70%)
9. Round status updated to `COMPLETED`

### Flow 3: CAPA Lifecycle

```
CAPA Created (auto/manual) → Status: PENDING
→ Assigned → Status: IN_PROGRESS
→ Complete corrective actions → Complete preventive actions
→ Verification steps → Quality Manager verifies
→ Status: VERIFIED → Status: CLOSED
```

**CAPA Workflow:**
1. CAPA created (automatically from evaluation or manually)
2. Assigned to responsible user/department
3. Status: `PENDING` → `ASSIGNED` → `IN_PROGRESS`
4. Complete corrective actions
5. Complete preventive actions
6. Execute verification steps
7. Quality Manager verifies: `POST /api/capas/{capa_id}/verify`
8. Status: `VERIFIED` → `CLOSED`

### Flow 4: Authentication

```
Login Page → POST /api/auth/signin → Validate credentials
→ Generate JWT (60min) → Store in localStorage
→ Include Bearer token in all requests → Auth guard on routes
```

**Auth Flow:**
1. User visits app → redirected to `/login` if not authenticated
2. `AuthContext` checks localStorage for stored token
3. If token exists, validates via `GET /api/auth/me`
4. On login: `POST /api/auth/signin` → receives JWT token
5. Token stored in `localStorage` as `access_token`
6. User data stored in `AuthContext`
7. Token included in all API requests via `Authorization: Bearer {token}`

---

## 7. Run & Test Commands

### Development

```bash
# Frontend (runs on port 5174)
npm install
npm run dev

# Backend (runs on port 8000)
cd backend
python3 -m venv venv
source venv/bin/activate  # or venv\Scripts\activate on Windows
pip install -r requirements.txt
python3 -m uvicorn main:app --reload --port 8000 --host 0.0.0.0

# Or use provided script (macOS)
./start_backend_macos.sh
```

### Docker

```bash
docker-compose up -d --build
```

### Testing

```bash
# Frontend E2E (Playwright)
npm run test:e2e

# Frontend linting
npm run lint

# Backend tests
cd backend
pytest tests/ -q

# Backend tests with coverage
pytest test_capa_improvements.py -v --cov=. --cov-report=xml
```

### Database Setup

```bash
# Create database
createdb salamaty_db

# Copy environment template
cp backend/env.example backend/.env

# Run migrations and seed
DATABASE_URL=postgresql://user:pass@localhost:5432/salamaty_db ./scripts/run_migrations_and_seed.sh

# Run all checks (includes CAPA creation from evaluations)
DATABASE_URL=postgresql://user:pass@localhost:5432/salamaty_db ./scripts/run_all_checks.sh
```

### Environment Variables Required

```bash
# Database Configuration
DATABASE_URL=postgresql://username:password@localhost:5432/salamaty_db

# Security
SECRET_KEY=your-super-secret-key-here-change-in-production
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=60

# Email Configuration (optional)
SMTP_SERVER=smtp.gmail.com
SMTP_PORT=587
SENDER_EMAIL=your-email@gmail.com
SENDER_PASSWORD=your-app-password
SENDER_NAME=نظام سلامتي

# Environment
ENVIRONMENT=development
DEBUG=True
PORT=8000

# Frontend (for builds)
VITE_API_URL=http://localhost:8000
```

### NPM Scripts

| Script | Command | Description |
|--------|---------|-------------|
| `dev` | `npm run dev` | Start Vite dev server (port 5174) |
| `build` | `npm run build` | Build production frontend |
| `preview` | `npm run preview` | Preview production build |
| `lint` | `npm run lint` | Run ESLint |
| `test:e2e` | `npm run test:e2e` | Run Playwright E2E tests |

---

## 8. API Endpoint Groups

### Authentication (`/api/auth`)
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | User registration |
| POST | `/api/auth/signin` | User login |
| GET | `/api/auth/me` | Get current user |

### Rounds (`/api/rounds`)
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/rounds` | Create new round |
| GET | `/api/rounds` | List all rounds |
| GET | `/api/rounds/my` | Get user's assigned rounds |
| GET | `/api/rounds/{id}` | Get specific round |
| PUT | `/api/rounds/{id}` | Update round |
| DELETE | `/api/rounds/{id}` | Delete round |
| POST | `/api/rounds/{id}/evaluations` | Submit evaluations |
| POST | `/api/rounds/{id}/evaluations/draft` | Save draft |
| POST | `/api/rounds/{id}/evaluations/finalize` | Finalize evaluation |
| GET | `/api/rounds/{id}/non-compliant-items` | Get non-compliant items |

### CAPAs (`/api/capas`)
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/capas` | Create CAPA |
| GET | `/api/capas` | List CAPAs (with filters) |
| GET | `/api/capas/{id}` | Get specific CAPA |
| PATCH | `/api/capas/{id}` | Update CAPA |
| DELETE | `/api/capas/{id}` | Delete CAPA |
| POST | `/api/capas/{id}/progress` | Update progress |
| POST | `/api/capas/{id}/verify` | Verify CAPA |
| GET | `/api/capas/dashboard/stats` | Dashboard statistics |

### CAPA Actions (`/api/capa-actions`)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/capa-actions` | List all actions |
| POST | `/api/capa-actions` | Create action |
| PUT | `/api/capa-actions/{id}` | Update action |
| DELETE | `/api/capa-actions/{id}` | Delete action |
| GET | `/api/capa-actions/overdue/list` | Get overdue actions |
| GET | `/api/capa-actions/my-actions` | Get user's actions |

### Users (`/api/users`)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/users` | List users |
| POST | `/api/users` | Create user |
| GET | `/api/users/{id}` | Get user |
| PUT | `/api/users/{id}` | Update user |
| DELETE | `/api/users/{id}` | Delete user |

### Departments (`/api/departments`)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/departments` | List departments |
| POST | `/api/departments` | Create department |
| GET | `/api/departments/{id}` | Get department |
| PUT | `/api/departments/{id}` | Update department |
| DELETE | `/api/departments/{id}` | Delete department |

### Analytics & Reports
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/analytics/advanced` | Advanced analytics |
| GET | `/api/analytics/performance` | Performance metrics |
| GET | `/api/analytics/risk` | Risk analysis |
| GET | `/api/reports/dashboard/stats` | Dashboard stats |
| GET | `/api/reports/compliance-trends` | Compliance trends |
| GET | `/api/reports/export/{format}` | Export reports |

### Health Checks
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/health` | Health check |
| GET | `/api/health/database` | Database health |
| GET | `/api/health/version` | Version info |

---

## 9. Frontend Routes

| Route | Component | Description |
|-------|-----------|-------------|
| `/` | ReportsPage | Dashboard/Reports (default) |
| `/dashboard` | ReportsPage | Dashboard |
| `/login` | LoginPage | User login |
| `/rounds` | RoundsManagement | Rounds management |
| `/rounds/list` | RoundsListView | Rounds list view |
| `/rounds/calendar` | RoundsCalendarView | Calendar view |
| `/rounds/my-rounds` | MyRoundsPage | User's assigned rounds |
| `/rounds/evaluate/:roundId` | EvaluateRoundPage | Evaluate specific round |
| `/capa-dashboard` | EnhancedCapaDashboard | CAPA dashboard |
| `/departments` | DepartmentsPage | Department management |
| `/users` | UsersManagement | User management |
| `/settings` | SettingsPage | Application settings |
| `/reports` | ReportsPage | Reports and analytics |

---

## 10. Top 10 Risks & Technical Debt

| # | Severity | Issue | Location | Recommendation |
|---|----------|-------|----------|----------------|
| 1 | 🔴 **CRITICAL** | **Multiple redundant model files** causing schema inconsistencies | `backend/models.py`, `models_updated.py`, `models_enhanced.py` | Consolidate into single `models.py` |
| 2 | 🔴 **CRITICAL** | **SQL injection risk** - f-string SQL queries with user input | `backend/main.py:2744, 2820, 2872, 2950` | Use parameterized queries |
| 3 | 🔴 **CRITICAL** | **Hardcoded default SECRET_KEY** exposes security risk | `backend/auth.py:14` | Require env var, fail fast if missing |
| 4 | 🔴 **CRITICAL** | **Debug endpoints exposed** without auth or environment guards | `backend/main.py` (multiple locations) | Guard with env checks or remove |
| 5 | 🟠 **HIGH** | **N+1 query pattern** in CAPA filtering causing performance issues | `backend/crud.py:696-748` | Use JOINs or `joinedload()` |
| 6 | 🟠 **HIGH** | **Broad exception handling** - `except Exception` swallows errors | Throughout `backend/main.py`, `crud.py` | Catch specific exceptions, proper logging |
| 7 | 🟠 **HIGH** | **Missing input validation** - raw dicts accepted on endpoints | Various endpoints in `backend/main.py` | Use Pydantic schemas everywhere |
| 8 | 🟠 **HIGH** | **250+ console.log statements** in production frontend | `src/**/*.tsx` | Remove or gate with environment checks |
| 9 | 🟡 **MEDIUM** | **Hardcoded localhost URLs** in email templates | `backend/email_service.py` | Use `FRONTEND_URL` env variable |
| 10 | 🟡 **MEDIUM** | **Missing database indexes** on FK and JSONB columns | Database models | Add indexes for query performance |

### Additional Technical Debt

| Issue | Severity | Description |
|-------|----------|-------------|
| Test files mixed with production | Medium | `backend/test_*.py` should be in `backend/tests/` |
| Inconsistent API patterns | Medium | Multiple routers with overlapping endpoints |
| Limited test coverage | Medium | ~23 test files for large codebase |
| TODO comments | Low | Incomplete features marked with TODOs |
| Environment-specific code | Low | Development defaults may leak to production |

---

## 11. Quick Reference Card

| Resource | Location |
|----------|----------|
| **Frontend URL** | `http://localhost:5174` |
| **Backend URL** | `http://localhost:8000` |
| **API Docs (Swagger)** | `http://localhost:8000/docs` |
| **API Docs (ReDoc)** | `http://localhost:8000/redoc` |
| **Database** | `postgresql://localhost:5432/salamaty_db` |
| **Primary Models** | `backend/models_updated.py` |
| **API Routes** | `backend/main.py`, `backend/capa_router.py` |
| **Auth Context** | `src/context/AuthContext.tsx` |
| **API Client** | `src/lib/api.ts` |
| **Types** | `src/types/index.ts` |
| **Validation Schemas** | `src/lib/validations.ts` |

---

## 12. Key Dependencies

### Frontend
| Package | Version | Purpose |
|---------|---------|---------|
| React | 18.x | UI library |
| TypeScript | 5.x | Type safety |
| Vite | 5.4.2 | Build tool |
| TailwindCSS | 3.4.1 | Styling |
| React Router DOM | 6.22.3 | Routing |
| React Hook Form | 7.62.0 | Form management |
| Zod | 4.1.5 | Schema validation |
| Recharts | 3.1.2 | Charts |
| Lucide React | 0.344.0 | Icons |
| date-fns | 4.1.0 | Date utilities |

### Backend
| Package | Version | Purpose |
|---------|---------|---------|
| FastAPI | 0.100.0+ | Web framework |
| SQLAlchemy | 2.0.0+ | ORM |
| Pydantic | 2.0.0+ | Data validation |
| python-jose | 3.3.0+ | JWT handling |
| passlib | 1.7.0+ | Password hashing |
| psycopg2-binary | 2.9.0+ | PostgreSQL adapter |
| Alembic | 1.10.0+ | Database migrations |
| uvicorn | - | ASGI server |

---

*This document provides a comprehensive overview of the Sallamaty project structure, architecture, and key information for developers.*
