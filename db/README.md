# MySQL setup

The kiosk and the HRMD workspace read and write through `/api/*` route handlers.
Without a database they fall back to the in-memory demo data and the admin shows
a **Demo mode** banner; with one they use real rows.

## 1. Create the database

Install MySQL 8 (or XAMPP / MariaDB 10.6+), then from the project root:

```bash
mysql -u root -p < db/schema.sql
mysql -u root -p hrmd_kiosk < db/seed.sql
```

`schema.sql` creates `hrmd_kiosk` with three tables:

| Table | Purpose |
|---|---|
| `employees` | Roster imported from Excel (`employee_no`, names, position, SG, rate) plus the contacts the sheet does not carry (`email`, `phone`, `office`, `employment_status`) |
| `requests` | One row per kiosk submission, with the employee's details **snapshotted** onto the row and an optional `employee_id` link to the roster |
| `request_history` | The audit trail shown on the tracking screen and in the admin drawer |

`seed.sql` loads 12 demo employees and the six sample requests the prototype
shipped with. It is safe to re-run.

## 2. Point the app at it

Add `DATABASE_URL` to `.env.local` (local development) or to the hosted
environment's variables — never to a client component or to `next.config.ts`:

```bash
DATABASE_URL="mysql://root:YOUR_PASSWORD@127.0.0.1:3306/hrmd_kiosk"
```

Hosted MySQL usually needs TLS — append `?ssl=true`:

```bash
DATABASE_URL="mysql://user:password@db.example.com:3306/hrmd_kiosk?ssl=true"
```

Restart `next dev` (or redeploy) after changing it. Check the connection at any
time with:

```bash
curl http://localhost:3000/api/health
# {"data":{"configured":true,"connected":true,"database":"hrmd_kiosk"}}
```

## 3. Endpoints

| Endpoint | Methods | Purpose |
|---|---|---|
| `/api/health` | GET | Configured / connected status |
| `/api/requests` | GET, POST | List (with `?status=&service=&q=&limit=`) and create |
| `/api/requests/[reference]` | GET, PATCH | Read one, append a status change |
| `/api/employees` | GET, POST | Roster list (`?q=&office=`) and add |
| `/api/employees/[id]` | GET, PATCH | Personal details (Gmail, phone, SG, rate, office…) |
| `/api/employees/[id]/requests` | GET | That employee's request history |
| `/api/employees/search` | GET | Kiosk lookup: `?first=Joel&last=R` |

Every endpoint answers `503 {"error":"database-unavailable"}` when
`DATABASE_URL` is missing or the server is unreachable — that is what puts the
UI into demo mode, not an error the user has to fix.

## 4. Notes

- Deployment is `aws/lambda/nextjs`, so a `127.0.0.1` database is reachable from
  local dev only. A published deploy needs a publicly reachable MySQL (RDS,
  Aiven, PlanetScale, …) plus `ssl=true` in `DATABASE_URL`.
- The connection pool is capped at 5 with keep-alive, which suits Lambda. For a
  production load, front it with RDS Proxy or Aurora.
- Employee details are copied onto each request at submit time, so editing the
  roster never rewrites history.

## Docker (what is running on this machine)

MySQL 8.4 runs in a Docker container named `hrmd-mysql`, publishing port 3306 and
storing its data in the named volume `hrmd_mysql_data`:

```bash
docker run -d --name hrmd-mysql --restart unless-stopped \
  -e MYSQL_ROOT_PASSWORD=<root-password> \
  -e MYSQL_DATABASE=hrmd_kiosk \
  -e MYSQL_USER=hrmd_app -e MYSQL_PASSWORD=<app-password> \
  -p 3306:3306 -v hrmd_mysql_data:/var/lib/mysql mysql:8.4
```

- The app connects as `hrmd_app` (not root); its URL is in `.env.local`, which is
  git-ignored. Do not copy that file into a deploy.
- `docker stop hrmd-mysql` / `docker start hrmd-mysql` pauses and resumes it;
  removing the container keeps the data as long as the volume survives.
- Load the schema and seed into the running container with:

```bash
docker exec -i hrmd-mysql mysql -uroot -p < db/schema.sql
docker exec -i hrmd-mysql mysql -uroot -p hrmd_kiosk < db/seed.sql
```

## Staff accounts and sessions

The admin workspace is protected by a real server-side session, not a client flag.

| Piece | Where |
|---|---|
| `staff` table | username, display name, role (`admin` / `hr_staff`), scrypt `password_hash`, `is_active`, `last_login_at` |
| `staff_sessions` table | one row per signed-in device: random 64-char id, `staff_id`, `expires_at` |
| Hashing | `src/app/(frontend)/lib/server/password.ts` — Node scrypt, `scrypt$N$r$p$salt$key`, verified with `timingSafeEqual` |
| Cookie | `hrmd_session=<id>.<HMAC-SHA256>` — httpOnly, SameSite=Lax, Secure in production, 8 h sliding expiry |
| Edge gate | `src/middleware.ts` verifies the HMAC and redirects `/hrmd-admin*` to `/hrmd-admin/login`, returns 401 for staff APIs |
| Server check | `requireStaff()` in `lib/server/guard.ts` validates the session row (expiry, revocation, active account) on every staff request |

**Audit actors come from the session.** `PATCH /api/requests/[reference]` ignores any `actor` in the body and records the signed-in staff member's display name, so the history cannot be forged.

**Public endpoints** (no session): `POST /api/requests` (the kiosk), `GET /api/tracking/[reference]` (reference only, no contact fields), `GET /api/employees/search` (names/position/office only), `GET /api/health`, and the auth routes.

### `SESSION_SECRET`

Required for sessions. It is generated into `.env.local`; set the same value in the deployed environment. Rotating it invalidates every existing cookie (rows in `staff_sessions` should then be cleared).

### Managing accounts

```bash
node db/staff-cli.mjs --list
node db/staff-cli.mjs --username jdelacruz --password 'S3cret-pass' --name "Juan Dela Cruz" --role hr_staff
```

The CLI reads `DATABASE_URL` from `.env.local`, hashes with the same scrypt format, and upserts the row. Re-run it to reset a password; add `is_active = 1` back in SQL to re-enable a disabled account.

## Activity log

`staff_activity` is the admin audit trail, separate from each request's own `request_history`.

| Column | Meaning |
|---|---|
| `staff_id` / `staff_name` | Who acted. Taken from the server-side session; the name is snapshotted so old rows stay readable after an account is deleted (`staff_id` becomes NULL) |
| `action` | `sign_in`, `sign_out`, `request_status`, `employee_create`, `employee_update` |
| `entity` / `entity_ref` | `session`, `request` (`HR-2026-0005`), `employee` (`EMP-0003`) |
| `summary` | Human-readable line, e.g. `HR-2026-0005 marked Under Review` |
| `detail` | JSON. Status changes keep the new status and note; roster edits keep **field names only**, never values |
| `ip` / `user_agent` | `x-forwarded-for` / `x-real-ip` when present |
| `created_at` | UTC, indexed |

Written by `lib/server/activity.repo.ts` — `recordActivity()` is called from the login, logout, request-status and roster routes, always with the identity returned by `requireStaff()`. A logging failure is swallowed (with a console error) so it never fails the action itself.

Read through `GET /api/activity` (staff only):

```
/api/activity?actions=sign_in,sign_out&q=reyes&limit=100&offset=0
```

Returns `{ entries, total, summary }`; `summary` powers the module's cards (sign-ins today, sign-ins/status changes/roster edits in 7 days). The UI lives at `/hrmd-admin/activity`.
