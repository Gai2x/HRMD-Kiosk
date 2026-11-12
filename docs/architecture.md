# Application architecture

This is one Next.js App Router application: its React UI, same-origin API
handlers, and staff authentication run in the Next.js server. The server
connects to MySQL; browser code calls the API and never connects to MySQL
directly.

## Routes

| Route | Purpose |
|---|---|
| `/` | Employee request kiosk |
| `/hrmd-admin/login` | HRMD staff sign-in |
| `/hrmd-admin` | HRMD dashboard |
| `/hrmd-admin/requests` | Request management |
| `/hrmd-admin/employees` | Employee roster |
| `/hrmd-admin/activity` | Staff activity log |

The `/api/*` route handlers are under `src/app/api/`. They cover request
submission and tracking, employee lookup and management, staff authentication,
and activity history. `/api/health` reports database connectivity.

## Main code areas

- `src/app/(frontend)/page.tsx`: kiosk flow.
- `src/app/(frontend)/screens/`: kiosk and HRMD screen components.
- `src/app/(frontend)/components/`: shared UI and admin components.
- `src/app/(frontend)/lib/server/`: database repositories, session handling,
  and staff access checks.
- `src/app/api/`: server API route handlers.
- `src/middleware.ts`: HRMD route and API access gate.
- `db/schema.sql` and `db/seed.sql`: MySQL schema and sample records.

## Data and sessions

The app connects to MySQL on the server using `DATABASE_URL`. API operations
that require an unavailable database return an error; parts of the UI provide
demo-mode behavior. The HRMD workspace uses signed, server-validated sessions
and requires `SESSION_SECRET`.

For a local-server deployment, the kiosk browser must be able to reach the
machine running the Next.js server. Keep the database connection on that server
and do not expose MySQL directly to kiosk devices. See the
[database guide](../db/README.md) for setup details.
