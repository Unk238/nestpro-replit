# NestPro — PG & Hostel OS

A full-stack operating system for Indian PG/hostel owners to manage properties, guests, payments, and complaints.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server (port 5000)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- Required env: `DATABASE_URL` — Postgres connection string

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- API: Express 5
- DB: PostgreSQL + Drizzle ORM
- Validation: Zod (`zod/v4`), `drizzle-zod`
- API codegen: Orval (from OpenAPI spec)
- Build: esbuild (CJS bundle)

## Where things live

- API contract: `lib/api-spec/openapi.yaml`
- DB schema: `lib/db/src/schema/` (one file per entity)
- API routes: `artifacts/api-server/src/routes/`
- Frontend: `artifacts/nestpro/src/`
- Generated hooks: `lib/api-client-react/src/generated/api.ts`

## Architecture decisions

- Data hierarchy: Property → Building → Floor → Room → Bed (fully cascades on delete)
- All API routes are explicitly prefixed (e.g. `/properties`, `/buildings/:id`) — NOT mounted via sub-router to avoid Express path-matching issues
- Numeric DB columns (amount, rent) stored as PostgreSQL `numeric` and converted to `Number()` in route responses
- Bed status is updated automatically on guest check-in (`occupied`) and check-out (`available`)
- Activity logging is best-effort (swallows errors) so it never blocks primary operations

## Product

- **Dashboard**: Live occupancy, KPI cards, 6-month revenue chart, recent activity feed
- **Properties**: Multi-property management with per-property occupancy stats
- **Property Explorer**: Building → Floor → Room → Bed tree with color-coded bed grid
- **Guests**: Full guest lifecycle — check-in, profile, documents, check-out
- **Payments**: Rent ledger with UPI tracking, overdue detection, partial payments
- **Complaints**: 5-stage Kanban pipeline (Pending → Assigned → In Progress → Resolved → Closed)
- **Staff**: Role-based staff management (Owner / Manager / Operator)
- **Activity**: Full audit log across all properties

## User preferences

_Populate as you build — explicit user instructions worth remembering across sessions._

## Gotchas

- Always run codegen after OpenAPI spec changes: `pnpm --filter @workspace/api-spec run codegen`
- API routes must use full path prefixes (e.g. `/properties/:id`) — using bare `/:id` causes Express to mis-match other routes
- `numeric` Drizzle columns come back as strings from pg-driver — always wrap with `Number()` in route responses
- Bed status must be kept in sync with guest status (check-in = occupied, check-out = available)

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
