# Development setup

## Prerequisites

- Node.js 24.22.1 or newer
- pnpm 9 or newer
- MySQL 8 or MariaDB 10.6+ for persistent data and HRMD staff sign-in

The repository pins Node.js and pnpm in `.mise.toml`. Install dependencies from
the project root:

```sh
pnpm install
```

## Local environment

Copy the example environment file to `.env.local`:

PowerShell:

```powershell
Copy-Item .env.example .env.local
```

macOS/Linux:

```sh
cp .env.example .env.local
```

Set these server-only variables in `.env.local`:

- `DATABASE_URL`: MySQL connection string for the `hrmd_kiosk` database.
- `SESSION_SECRET`: a unique random secret used to sign HRMD session cookies.

Generate a secret locally with Node.js:

```sh
node -e "console.log(require('node:crypto').randomBytes(32).toString('hex'))"
```

Do not commit `.env.local` or share its values. `.env.example` contains
placeholders only. For database initialization and staff account setup, follow
the [database guide](../db/README.md).

## Run locally

On Windows PowerShell:

```powershell
pnpm exec next dev --hostname 0.0.0.0 --port 3000
```

On macOS/Linux, or in the Figma Make environment:

```sh
pnpm run dev
```

Routes:

- Employee kiosk: `http://localhost:3000/`
- HRMD sign-in: `http://localhost:3000/hrmd-admin/login`
- HRMD workspace: `http://localhost:3000/hrmd-admin`

Stop the server with `Ctrl+C`.

## Build and serve

```sh
pnpm exec next build
pnpm exec next start --hostname 0.0.0.0 --port 3000
```

No test script is currently defined in `package.json`.
