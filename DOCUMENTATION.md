# NestPro — PG & Hostel OS
## Complete Product & Technical Documentation

---

## Table of Contents

1. [Product Overview](#1-product-overview)
2. [Architecture Overview](#2-architecture-overview)
3. [Tech Stack](#3-tech-stack)
4. [Project Structure](#4-project-structure)
5. [Database Schema](#5-database-schema)
6. [API Reference](#6-api-reference)
7. [Frontend Pages & Routes](#7-frontend-pages--routes)
8. [Key Components](#8-key-components)
9. [Guest Self Check-In Portal](#9-guest-self-check-in-portal)
10. [Authentication & Session Model](#10-authentication--session-model)
11. [Onboarding Flow](#11-onboarding-flow)
12. [Running the App](#12-running-the-app)
13. [Environment Variables](#13-environment-variables)
14. [Codegen & DB Migrations](#14-codegen--db-migrations)
15. [Gotchas & Conventions](#15-gotchas--conventions)

---

## 1. Product Overview

**NestPro** is a full-stack operating system for Indian PG (Paying Guest) accommodation and hostel owners. It replaces spreadsheets and WhatsApp threads with a single, structured platform for day-to-day operations.

### Core capabilities

| Module | What it does |
|---|---|
| **Dashboard** | Live KPIs — occupancy rate, total beds, active guests, revenue; 6-month revenue chart; recent activity feed; overdue payment alerts |
| **Properties** | Create and manage multiple properties (PG / Hostel / Apartment / Villa / Co-Living); per-property context switching |
| **Property Explorer** | Drill-down tree: Property → Building → Floor → Room → Bed; color-coded bed grid (available / occupied / maintenance / reserved) |
| **Guests** | Full guest lifecycle — check-in form, guest profile, document storage, check-out |
| **Payments** | Monthly rent ledger with UPI reference tracking, partial payment support, overdue detection |
| **Complaints** | 5-stage Kanban pipeline (Pending → Assigned → In Progress → Resolved → Closed) with priority levels and staff assignment |
| **Staff** | Role-based staff management — Owner, Manager, Operator |
| **Activity Log** | Immutable audit trail across all entities and properties |
| **AI Receptionist** | Conversational assistant for quick answers about guests, payments, and vacancies |
| **Self Check-In Portal** | Public, token-gated mobile form that allows guests to register themselves before arrival; operator approves/rejects from dashboard |

---

## 2. Architecture Overview

```
Browser (React + Vite)
        │
        ▼
Shared Reverse Proxy (port 80)
        │
   ┌────┴────────────────┐
   │ path: /             │  React frontend (Vite dev server)
   │ path: /api          │  Express 5 API server
   └─────────────────────┘
        │
        ▼
  PostgreSQL (Drizzle ORM)
```

- All traffic goes through the shared proxy on **port 80** — never call service ports directly.
- The API server is mounted at `/api` and handles all `/api/*` routes.
- The React frontend handles all other paths (SPA with Wouter router).
- The public check-in portal (`/checkin/:token`) is served by the same React app but bypasses authentication entirely.

---

## 3. Tech Stack

| Layer | Technology |
|---|---|
| Runtime | Node.js 24 |
| Language | TypeScript 5.9 (strict) |
| Monorepo | pnpm workspaces |
| Frontend framework | React 18 + Vite |
| Frontend routing | Wouter |
| Server state / data fetching | TanStack React Query v5 |
| API framework | Express 5 |
| Database | PostgreSQL |
| ORM | Drizzle ORM |
| Validation | Zod v4 + drizzle-zod |
| API contract | OpenAPI 3.0 (YAML) |
| API codegen | Orval (React Query hooks + Zod schemas) |
| UI components | shadcn/ui (Radix UI primitives) |
| Styling | Tailwind CSS |
| Animations | Framer Motion |
| Icons | Lucide React |
| Charts | Recharts |
| Build tool | esbuild (server CJS bundle) |
| Logging | Pino |

---

## 4. Project Structure

```
/
├── artifacts/
│   ├── nestpro/            # React + Vite frontend (preview path: /)
│   │   └── src/
│   │       ├── App.tsx         # Root router + auth gate
│   │       ├── pages/          # One file per page
│   │       ├── components/     # Shared UI components
│   │       │   ├── layout.tsx
│   │       │   ├── onboarding-wizard.tsx
│   │       │   └── property-provider.tsx
│   │       ├── hooks/
│   │       ├── lib/
│   │       └── index.css
│   ├── api-server/         # Express 5 API (preview path: /api)
│   │   └── src/
│   │       ├── app.ts          # Express setup, middleware
│   │       ├── index.ts        # Server bootstrap
│   │       ├── routes/         # One file per resource
│   │       ├── middlewares/
│   │       └── lib/logger.ts
│   └── mockup-sandbox/     # Design prototype server
├── lib/
│   ├── api-spec/
│   │   └── openapi.yaml    # Source of truth for API contract
│   ├── api-client-react/
│   │   └── src/generated/  # Auto-generated React Query hooks + schemas
│   ├── api-zod/
│   │   └── src/generated/  # Auto-generated Zod type schemas
│   └── db/
│       └── src/
│           └── schema/     # Drizzle table definitions (one file per entity)
├── scripts/                # Utility scripts
├── pnpm-workspace.yaml
├── tsconfig.base.json
└── replit.md
```

---

## 5. Database Schema

### `properties`
| Column | Type | Notes |
|---|---|---|
| id | serial PK | |
| name | text | Required |
| address | text | |
| city | text | |
| state | text | |
| type | enum | `pg` / `hostel` / `apartment` / `villa` / `co_living` |
| description | text | |
| createdAt | timestamptz | |

### `buildings`
| Column | Type | Notes |
|---|---|---|
| id | serial PK | |
| propertyId | int FK → properties | CASCADE delete |
| name | text | |
| totalFloors | int | |
| createdAt | timestamptz | |

### `floors`
| Column | Type | Notes |
|---|---|---|
| id | serial PK | |
| buildingId | int FK → buildings | CASCADE delete |
| name | text | e.g. "Ground Floor", "Floor 1" |
| floorNumber | int | |
| createdAt | timestamptz | |

### `rooms`
| Column | Type | Notes |
|---|---|---|
| id | serial PK | |
| floorId | int FK → floors | CASCADE delete |
| name | text | |
| type | enum | `single` / `double` / `triple` / `quad` / `dormitory` |
| createdAt | timestamptz | |

### `beds`
| Column | Type | Notes |
|---|---|---|
| id | serial PK | |
| roomId | int FK → rooms | CASCADE delete |
| label | text | e.g. "Bed A", "Bed 1" |
| status | enum | `available` / `occupied` / `maintenance` / `reserved` |
| monthlyRent | numeric | Stored as `numeric`, returned as `Number()` |
| createdAt | timestamptz | |

### `guests`
| Column | Type | Notes |
|---|---|---|
| id | serial PK | |
| name | text | |
| phone | text | |
| email | text | |
| aadhaar | text | |
| emergencyContact | text | |
| emergencyPhone | text | |
| occupation | text | |
| hometown | text | |
| bedId | int FK → beds | |
| propertyId | int FK → properties | |
| checkInDate | date | |
| checkOutDate | date | |
| status | enum | `active` / `checked_out` |
| monthlyRent | numeric | |
| depositAmount | numeric | |
| notes | text | |
| createdAt | timestamptz | |

### `payments`
| Column | Type | Notes |
|---|---|---|
| id | serial PK | |
| guestId | int FK → guests | |
| propertyId | int FK → properties | |
| amount | numeric | |
| month | int | 1–12 |
| year | int | |
| status | enum | `paid` / `pending` / `overdue` / `partial` |
| paidAt | timestamptz | |
| method | enum | `cash` / `upi` / `bank_transfer` / `cheque` |
| upiRef | text | UPI transaction ID |
| discount | numeric | |
| notes | text | |
| createdAt | timestamptz | |

### `complaints`
| Column | Type | Notes |
|---|---|---|
| id | serial PK | |
| guestId | int FK → guests | |
| propertyId | int FK → properties | |
| title | text | |
| description | text | |
| category | enum | `maintenance` / `cleanliness` / `noise` / `security` / `food` / `internet` / `other` |
| status | enum | `pending` / `assigned` / `in_progress` / `resolved` / `closed` |
| priority | enum | `low` / `medium` / `high` / `urgent` |
| assignedTo | int FK → staff | nullable |
| resolvedAt | timestamptz | |
| createdAt | timestamptz | |

### `staff`
| Column | Type | Notes |
|---|---|---|
| id | serial PK | |
| name | text | |
| phone | text | |
| email | text | |
| role | enum | `owner` / `manager` / `operator` |
| isActive | boolean | default true |
| createdAt | timestamptz | |

### `activity_logs`
| Column | Type | Notes |
|---|---|---|
| id | serial PK | |
| action | text | e.g. `checkin`, `payment_recorded` |
| entity | text | e.g. `guest`, `payment` |
| entityId | int | |
| description | text | Human-readable summary |
| propertyId | int | |
| propertyName | text | Denormalized for fast display |
| createdAt | timestamptz | |

### `checkin_tokens`
| Column | Type | Notes |
|---|---|---|
| id | serial PK | |
| token | text unique | Random hex string, URL-safe |
| propertyId | int FK → properties | CASCADE delete |
| bedId | int FK → beds | nullable — pre-assign a specific bed |
| status | enum | `pending` / `submitted` / `approved` / `rejected` |
| submittedData | jsonb | Full guest form payload stored until approval |
| notes | text | Operator rejection reason |
| createdAt | timestamptz | |
| expiresAt | timestamptz | 7 days from creation |

---

## 6. API Reference

All routes are mounted under `/api`. The source of truth is `lib/api-spec/openapi.yaml`.

### Health
| Method | Path | Description |
|---|---|---|
| GET | `/api/healthz` | Liveness check — returns `{ status: "ok" }` |

### Properties
| Method | Path | Description |
|---|---|---|
| GET | `/api/properties` | List all properties with occupancy stats |
| POST | `/api/properties` | Create a new property |
| GET | `/api/properties/:id` | Get single property |
| PATCH | `/api/properties/:id` | Update property fields |
| DELETE | `/api/properties/:id` | Delete property (cascades to all children) |

### Buildings
| Method | Path | Description |
|---|---|---|
| GET | `/api/properties/:propertyId/buildings` | List buildings in a property |
| POST | `/api/properties/:propertyId/buildings` | Create building |
| PATCH | `/api/buildings/:id` | Update building |
| DELETE | `/api/buildings/:id` | Delete building |

### Floors
| Method | Path | Description |
|---|---|---|
| GET | `/api/buildings/:buildingId/floors` | List floors in a building |
| POST | `/api/buildings/:buildingId/floors` | Create floor |
| PATCH | `/api/floors/:id` | Update floor |
| DELETE | `/api/floors/:id` | Delete floor |

### Rooms
| Method | Path | Description |
|---|---|---|
| GET | `/api/floors/:floorId/rooms` | List rooms on a floor |
| POST | `/api/floors/:floorId/rooms` | Create room |
| PATCH | `/api/rooms/:id` | Update room |
| DELETE | `/api/rooms/:id` | Delete room |

### Beds
| Method | Path | Description |
|---|---|---|
| GET | `/api/rooms/:roomId/beds` | List beds in a room |
| POST | `/api/rooms/:roomId/beds` | Create bed |
| PATCH | `/api/beds/:id` | Update bed (label, rent, status) |
| DELETE | `/api/beds/:id` | Delete bed |
| GET | `/api/properties/:propertyId/beds` | Flat list of all beds with full location path |

### Guests
| Method | Path | Description |
|---|---|---|
| GET | `/api/guests` | List guests; supports `?propertyId=`, `?status=active\|checked_out` |
| POST | `/api/guests` | Check in / create a guest; marks bed as `occupied` |
| GET | `/api/guests/:id` | Guest profile details |
| PATCH | `/api/guests/:id` | Update guest fields |
| POST | `/api/guests/:id/checkout` | Check out guest; marks bed as `available` |

### Payments
| Method | Path | Description |
|---|---|---|
| GET | `/api/payments` | List payments; supports `?propertyId=`, `?status=`, `?guestId=` |
| POST | `/api/payments` | Record a payment |
| GET | `/api/payments/overdue` | Overdue payments with full guest details |
| GET | `/api/payments/:id` | Single payment |
| PATCH | `/api/payments/:id` | Update payment (mark paid, add UPI ref, etc.) |

### Complaints
| Method | Path | Description |
|---|---|---|
| GET | `/api/complaints` | List complaints; supports `?propertyId=`, `?status=` |
| POST | `/api/complaints` | Create complaint |
| GET | `/api/complaints/:id` | Single complaint |
| PATCH | `/api/complaints/:id` | Update status / priority / assignee |

### Staff
| Method | Path | Description |
|---|---|---|
| GET | `/api/staff` | List all staff |
| POST | `/api/staff` | Add staff member |
| PATCH | `/api/staff/:id` | Update staff |
| DELETE | `/api/staff/:id` | Remove staff |

### Dashboard (analytics)
| Method | Path | Description |
|---|---|---|
| GET | `/api/dashboard/summary` | KPIs: total beds, active guests, occupancy %, monthly revenue, overdue count |
| GET | `/api/dashboard/occupancy` | Occupancy breakdown by building / floor / room |
| GET | `/api/dashboard/revenue` | Monthly collected vs pending revenue for last 6 months |
| GET | `/api/dashboard/recent-activity` | Latest activity log entries |

### Activity Log
| Method | Path | Description |
|---|---|---|
| GET | `/api/activity` | Full audit log; supports `?propertyId=`, `?limit=` |

### Self Check-In (Public + Operator)
| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/api/checkin/generate` | Operator | Generate a new token for a property (and optional bed) |
| GET | `/api/checkin/submissions` | Operator | List all submitted/pending registrations |
| GET | `/api/checkin/:token` | Public | Fetch property context for the public form |
| POST | `/api/checkin/:token/submit` | Public | Submit guest registration form |
| POST | `/api/checkin/submissions/:id/approve` | Operator | Approve registration — creates guest, marks bed occupied |
| POST | `/api/checkin/submissions/:id/reject` | Operator | Reject registration with optional note |

### AI Receptionist
| Method | Path | Description |
|---|---|---|
| POST | `/api/ai/chat` | Send a message to the AI assistant; receives a contextual response |

---

## 7. Frontend Pages & Routes

All frontend routes are served under the React SPA. Routing is handled by **Wouter**.

| Route | File | Purpose |
|---|---|---|
| *(pre-auth)* `/checkin/:token` | `checkin-portal.tsx` | Public guest self-registration portal — no login required |
| *(no session)* | `login.tsx` | Login screen; stores session in `localStorage` |
| *(not onboarded)* | `onboarding.tsx` | First-run wizard to set up business profile and first property |
| `/` | `dashboard.tsx` | KPI overview, revenue chart, activity feed, overdue alerts |
| `/properties` | `properties.tsx` | Multi-property list and management |
| `/properties/:id/explorer` | `explorer.tsx` | Building → Floor → Room → Bed occupancy tree |
| `/guests` | `guests.tsx` | Guest list, check-in link generator, pending registrations |
| `/guests/:id` | `guest-detail.tsx` | Full guest profile, documents, check-out action |
| `/payments` | `payments.tsx` | Rent ledger with filters and overdue highlights |
| `/complaints` | `complaints.tsx` | Kanban-style complaint management |
| `/staff` | `staff.tsx` | Staff roster and role management |
| `/activity` | `activity.tsx` | Chronological audit log |
| `/settings` | `settings.tsx` | Business profile and account settings |
| `/ai` | `ai-receptionist.tsx` | AI chat interface for quick operational queries |
| *(fallback)* | `not-found.tsx` | 404 page |

---

## 8. Key Components

### `components/layout.tsx`
The main authenticated shell that wraps every page.

- **Sidebar**: Brand name, active property selector (dropdown backed by `useListProperties`), navigation links to all sections
- **Pending badge**: Polls `/api/checkin/submissions` every 30 seconds; shows an amber badge on the **Guests** nav link with the count of unreviewed submissions
- **Header**: Page context and user initials / logout
- **Toaster**: Global toast notification area

### `components/property-provider.tsx`
A React context that manages the **active property** selection.

- Persists the selection to `localStorage` under key `nestpro_active_property`
- Defaults to the first fetched property when nothing is stored
- All pages and API calls that are property-scoped consume `usePropertyContext()`

### `components/onboarding-wizard.tsx`
A 3-step modal wizard for adding a new property with a complete structure in one flow.

**Step 1 — Property Details**: name, address, city, state, type  
**Step 2 — Structure Setup**: number of buildings × floors × rooms × beds per room  
**Step 3 — Review & Create**: summary of what will be created

On confirm, it fires sequential API calls: create property → create buildings → create floors → create rooms → create beds. Invalidates the properties query on success.

---

## 9. Guest Self Check-In Portal

A **public, no-login** portal served at `/checkin/:token`.

### How it works

1. **Operator generates a link** from the Guests page → "Generate Check-In Link" modal. They select a property (and optionally a pre-assigned bed) and copy the URL.
2. **Guest opens the link** on any device (mobile-optimized). The link is valid for **7 days** and single-use.
3. **Guest completes a 5-step form:**
   - Step 1 — Welcome / property overview
   - Step 2 — Personal info (name, phone, email, DOB, gender, Aadhaar, addresses)
   - Step 3 — Emergency contact details
   - Step 4 — Stay details (stay type: Night / Weekly / Monthly / Long-Term, check-in date, check-out date)
   - Step 5 — Terms acceptance and submission
4. **Submission**: Form data is stored as JSON in `checkin_tokens.submittedData`; token status moves to `submitted`.
5. **Operator reviews** from the Guests page (pending registrations section) or from the dashboard notification. They can **Approve** (which creates the guest record + marks bed occupied) or **Reject** (with an optional note).

### Token lifecycle
```
pending → submitted → approved
                    ↘ rejected
```

---

## 10. Authentication & Session Model

NestPro currently uses a **lightweight local session** (no server-side auth).

- On login, user credentials are validated client-side and stored in `localStorage` as `nestpro_user`.
- An `nestpro_onboarded` flag in `localStorage` controls whether the onboarding wizard is shown.
- `App.tsx` reads these flags on mount and routes accordingly:
  - No session → `LoginPage`
  - Session but not onboarded → `Onboarding`
  - Session + onboarded → Main application
- The public check-in portal (`/checkin/:token`) is detected via regex **before** the auth gate and rendered without any session check.

---

## 11. Onboarding Flow

Triggered the first time a user logs in (when `nestpro_onboarded` is not set).

1. Business profile setup (business name, category, phone)
2. First property creation (name, address, type, state)
3. Initial structure (buildings / floors / rooms / beds count)
4. Review and confirm

On completion, `nestpro_onboarded = true` is written to `localStorage` and the user is taken to the Dashboard.

---

## 12. Running the App

### Start all services

The app runs via Replit managed workflows. Two services must be running:

| Service | Workflow name | Command |
|---|---|---|
| Frontend | `artifacts/nestpro: web` | `pnpm --filter @workspace/nestpro run dev` |
| API Server | `artifacts/api-server: API Server` | `pnpm --filter @workspace/api-server run dev` |

### Individual commands

```bash
# Start API server in dev mode
pnpm --filter @workspace/api-server run dev

# Start frontend in dev mode
pnpm --filter @workspace/nestpro run dev

# Full typecheck across all packages
pnpm run typecheck

# Typecheck only shared libs
pnpm run typecheck:libs

# Build everything (typecheck + compile)
pnpm run build
```

---

## 13. Environment Variables

| Variable | Required | Description |
|---|---|---|
| `DATABASE_URL` | ✅ Yes | PostgreSQL connection string |
| `SESSION_SECRET` | ✅ Yes | Secret for session signing |
| `PORT` | Auto-injected | Assigned by Replit workflow per service |
| `BASE_PATH` | Auto-injected | URL prefix injected by Replit artifact routing |

`PORT` and `BASE_PATH` are automatically provided by the Replit workflow system — do not hardcode them.

---

## 14. Codegen & DB Migrations

### After changing the OpenAPI spec

```bash
pnpm --filter @workspace/api-spec run codegen
```

This regenerates:
- `lib/api-client-react/src/generated/api.ts` — React Query hooks
- `lib/api-client-react/src/generated/api.schemas.ts` — Zod schemas
- `lib/api-zod/src/generated/` — Standalone Zod types

> **Do not hand-edit generated files.** They are overwritten on every codegen run.

### After changing the DB schema

```bash
pnpm --filter @workspace/db run push
```

This uses `drizzle-kit push` to apply schema changes directly to the database (dev only). For production, use migrations.

### After changing a `lib/*` package

```bash
pnpm run typecheck:libs
```

This rebuilds declaration files for composite lib packages so artifact typechecks see fresh types.

---

## 15. Gotchas & Conventions

### API routes
- All routes must use **full path prefixes** — e.g. `/properties/:id`, not `/:id`. Using bare dynamic segments causes Express to mis-match routes from other routers.
- All routes are composed flat in `routes/index.ts` using `router.use(...)` — not mounted with sub-path prefixes — because Express sub-router mounting has path-matching edge cases.

### Database
- `numeric` Drizzle columns come back as **strings** from the `pg` driver. Always wrap with `Number()` in route responses: `monthlyRent: Number(bed.monthlyRent)`.
- Bed status must stay in sync with guest status: check-in → `occupied`; check-out → `available`.

### Activity logging
- Activity logging is **best-effort** — it wraps calls in try/catch and swallows errors so it never blocks a primary operation.

### Server logging
- **Never use `console.log` in server code.** Use `req.log` inside route handlers and the singleton `logger` from `lib/logger.ts` for non-request code.

### Frontend API calls
- Import hooks from `@workspace/api-client-react`, never from relative paths.
- Hooks return `T` directly (not wrapped in `{ data: T }`).
- Query options pattern: `useGetThing(id, { query: { enabled: !!id } })`

### Proxy & URLs
- In shell/curl: always use `localhost:80/<path>` (the shared proxy). Never call service ports (e.g. 5000) directly.
- In application code: use relative URLs or `import.meta.env.BASE_URL`. Do not hardcode `localhost` or `$REPLIT_DEV_DOMAIN` in app code.

---

*Last updated: July 2026*
