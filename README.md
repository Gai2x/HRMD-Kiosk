# HRMD Employee Request Kiosk

A bilingual employee self-service kiosk and HRMD staff workspace for submitting,
tracking, and managing employee requests.

## Features

- Guided employee request flow with request tracking.
- HRMD workspace for requests, employees, and staff activity.
- MySQL-backed API for requests, employee records, and audit history.
- Server-side staff sessions for the HRMD workspace.
- Demo-mode UI when a database is not configured.

The UI, API routes, and authentication run in the same Next.js server. The
database is accessed server-side and is never connected to directly by the
browser.

## Requirements

- Node.js 24.22.1 or later
- pnpm 9 or later
- MySQL 8 or MariaDB 10.6+ for database-backed use

The pinned Node.js and pnpm versions are in [.mise.toml](.mise.toml).

## Quick start

```powershell
pnpm install
Copy-Item .env.example .env.local
```

Edit `.env.local` and set `DATABASE_URL` and a unique `SESSION_SECRET`. The
database is needed for persistent requests, employee data, and HRMD sign-in.
See [Database setup](db/README.md) for schema, seed, and account instructions.

Start the app on Windows with:

```powershell
pnpm exec next dev --hostname 0.0.0.0 --port 3000
```

Open [http://localhost:3000](http://localhost:3000) for the employee kiosk and
[http://localhost:3000/hrmd-admin/login](http://localhost:3000/hrmd-admin/login)
for the HRMD workspace. Stop the development server with `Ctrl+C`.

The project’s `pnpm run dev` script is used by the Figma Make environment. For
Windows PowerShell, the `pnpm exec next dev` command above avoids its
POSIX-specific environment-variable syntax.

## Documentation

- [Development setup and commands](docs/development.md)
- [Application structure and routes](docs/architecture.md)
- [MySQL schema, seed data, and staff accounts](db/README.md)

## Before publishing

- Keep `.env.local` and all real credentials out of Git. `.env*` files are
  ignored except `.env.example`.
- The seed and mock records are synthetic development data. Replace demo
  records and rotate the demo staff credential before using a live database.
- Root-level screenshot captures and one-off image scripts are excluded from
  Git; the local files are preserved.
