# figma-make-app

React + Next.js + Tailwind CSS application running in Figma Make and locally.

The kiosk UI, HRMD workspace, API routes, and staff authentication live in this
Next.js project. The Next.js server connects to MySQL using the server-only
`DATABASE_URL`; the database schema and seed are in `db/`. Do not add Payload or
a second backend/database layer unless the user asks. Keep database access out
of client components.

This file is supplied as project instructions at the start of each task. Do not
reread it before opening source. Load `nextjs-docs` when the task involves
routing, pages, components, caching, images, or metadata, not for style-only
changes.

For frontend work, keep a **Verify production delivery** todo pending until all
of these are done:

- Preview every requested route and fix every runtime or build error. Server
  Components cannot contain event handlers; use CSS interaction or a Client
  Component boundary.
- When a Client Component calls a Server Action inside `useTransition`, keep
  `revalidatePath` out of the action. Return a serializable result and call
  `router.refresh()` in the client after success. (The app currently uses API
  route handlers; do not add Server Actions without a need.)
- Run `figma make verify-deploy`, inspect its production route table, and visit
  every generated public route. `verify-bootstrap` and source inspection are
  not substitutes.
- Keep page routes static unless the user requests dynamic rendering. API routes
  are expected to be dynamic and should not be confused with page routes in the
  production route table.

The app currently uses regular image elements and files in `public/`. If adding
remote images, use an approved URL or configure `images.remotePatterns`; do not
add a custom image proxy.

## Development Server

A Next.js development server is **always running** on `$PORT` (default 3000).
You don't need to start it manually.

- Preview URL: The user can access the running app through the preview panel
- Hot reload: Changes to source files are reflected immediately

## Project Structure

This is a single-route-group Next.js App Router app:

- `src/app/(frontend)/` - All application pages and components
- `src/app/api/` - Same-origin API route handlers
- `src/app/(frontend)/lib/server/` - Server-side database repositories and auth
- `db/` - MySQL schema, sample data, and database setup guide
- `src/lib/make-custom-code.tsx` - Renders platform-supplied custom head/body code
- `src/lib/make-site-settings.ts` - Reads site metadata from `.figma/make/site.json`

Do not add Payload CMS files such as `src/app/(payload)/`,
`src/collections/`, or `payload.config.ts`.

## Key Files

- `src/app/(frontend)/layout.tsx` - Root layout, metadata, custom code injection
- `src/app/(frontend)/page.tsx` - Employee kiosk route (`/`)
- `src/app/(frontend)/hrmd-admin/` - HRMD dashboard, requests, employees,
  activity, and sign-in pages
- `src/app/api/` - Request, employee, tracking, activity, and auth endpoints
- `src/app/(frontend)/lib/server/` - MySQL repositories and session handling
- `src/app/(frontend)/data/` - Request types, translations, and demo data
- `db/schema.sql` - MySQL schema
- `db/seed.sql` - Synthetic development/demo records
- `src/app/(frontend)/components/Brand.tsx` - Logo lockup and prototype notice
- `src/app/(frontend)/components/Icons.tsx` - Typed inline SVG icon set
- `src/app/(frontend)/not-found.tsx` - Not-found page
- `src/app/(frontend)/styles.css` - Global styles and Tailwind CSS import
- `next.config.ts` - Next.js configuration (standalone output, custom image loader)
- `package.json` - Dependencies and scripts
- `.mise.toml` - Toolchain versions (Node.js, pnpm)
- `.figma/make/*` - Lifecycle scripts (install, dev, deploy, deploy-preview, verify)

## Styling

This project uses **Tailwind CSS v4** for frontend styling. Tailwind and its
PostCSS plugin are already installed and configured, and Tailwind is loaded by
the `@import "tailwindcss"` directive in `src/app/(frontend)/styles.css`.

Use Tailwind utility classes directly in JSX for application UI. Keep
`styles.css` for the Tailwind import, shared theme tokens, and truly global base
styles; do not default to inline style objects, CSS-in-JS, or hand-written
component classes when Tailwind utilities express the same design. If a Make Kit
or design-system package is installed, its components, tokens, and Tailwind
setup take precedence over generic utilities.

The existing design is a teal/green LGU Tanjay City kiosk theme with large
touch targets (`touch-button`, `min-h-16`, `min-h-20`), `page-title`, `eyebrow`,
`service-card`, `notice`, and `kiosk-input` component classes. Reuse those
rather than inventing new visual patterns.

## Data And State

Requests, employees, and staff activity persist in MySQL through the API
handlers when `DATABASE_URL` is configured. If the database is unavailable,
the request UI can fall back to in-memory demo data in
`src/app/(frontend)/data/mockRequests.ts`; demo state does not persist.

- Keep demo data clearly synthetic; never put real employee records in source
  code or sample seed data.
- Do not add `localStorage`/`sessionStorage` persistence unless requested; a
  shared public kiosk must not retain one employee's details for the next.
- Do not move database credentials into client code or expose them through
  `NEXT_PUBLIC_*` variables.

## Secrets And Environment Variables

For any future third-party integration, collect API keys, client secrets, and
tokens with the Make environment-variable card flow, then reference them from
server-only code as `process.env.*`. Secret-backed integration calls must live
in server components, server actions, or route handlers.

Do not ask users to paste secret values into ordinary chat, code, comments, or
docs. Do not print, log, summarize, or expose secret values. Treat saved
environment variable values as write-only: you can reference variable names in
code, but you should not try to reveal existing values. Add, replace, or delete
user-provided environment variables only when the user explicitly asks for
secret or integration setup.

Do not put private values in static data, rendered props, browser components, or
public client environment variables. In Next.js, `NEXT_PUBLIC_*` values are
bundled into browser code. Use public prefixes only for configuration that is
intentionally public, and warn the user if a sensitive key appears to use a
public prefix.

## Routing

Frontend pages live in `src/app/(frontend)/`. Pages are defined by creating
`page.tsx` files:

- `src/app/(frontend)/page.tsx` - `/`
- `src/app/(frontend)/hrmd-admin/page.tsx` - `/hrmd-admin`

There is no `/admin` CMS panel. The current app has same-origin API endpoints
under `src/app/api/`; keep their routes and handlers consistent with the UI.

The kiosk's multi-screen request flow is client state inside the `/` route.
Keep that flow there unless the user asks for separate URLs.

Use `notFound()` from `next/navigation` for missing records, rendering
`src/app/(frontend)/not-found.tsx`.

## Preview/Proxy Configuration

Keep the Make preview origin configuration in `next.config.ts` intact. The
template uses the exact platform-provisioned preview host from
`FIGMA_PUBLIC_URL` for both `allowedDevOrigins` and
`experimental.serverActions.allowedOrigins`.

Do not disable Server Actions or rewrite routing to work around a preview proxy
`origin`/`x-forwarded-host` mismatch; fix the allowed origin instead.

## Figma Make Scripts

These scripts are called by sboxd to manage the project lifecycle:

- `.figma/make/install` - Install project dependencies (`pnpm install`)
- `.figma/make/dev` - Start the dev server (`pnpm run dev`)
- `.figma/make/deploy` - Build (`next build`) and report completion through
  `figma make deploy`
- `.figma/make/deploy-preview` - Build the platform-provided cached preview;
  keep its `.next`/`nextjs` contract intact and delegate packaging/upload
  through `figma make deploy-preview`

Do **not** remove or rename these scripts. They must remain executable.

## Environment Variables

These are injected by sboxd at runtime:

- `FIGMA` - Set to `"1"` when running inside sboxd
- `PORT` - The port to listen on (passed to `next dev` via the dev script)
- `FIGMA_PUBLIC_URL` - The public URL of the site
- `FIGMA_SITE_NAME` - The human-readable site name
- `FIGMA_SITE_DESCRIPTION` - Short site description
- `FIGMA_ASSETS_PATH` - Directory where exported Figma assets are written
- `FIGMA_FAVICON_PATH` - Path to the exported favicon
- `FIGMA_PREVIEW_IMAGE_PATH` - Path to the OG/social preview image

`NEXT_PUBLIC_SITE_URL` is derived from `FIGMA_PUBLIC_URL` in `next.config.ts`
and used as `metadataBase` in the root layout.

## File Writing

When writing multiple files, parallelize independent Write calls in a single
response. Files are independent when none depends on another's output at write
time. Batch by dependency layer — don't write files one at a time.

## Important

- The dev server must listen on `$PORT` - do not hardcode a port
- Use `pnpm install` to add new dependencies
- Toolchain versions are managed by `.mise.toml`, not installed manually
- This template is Next.js App Router + React 19 + Tailwind CSS v4;
  check `package.json` before adding or using other dependencies
- `build` runs `next build` - there is no `payload build`, `generate:types`, or
  `generate:importmap` script any more
- `output: 'standalone'` in `next.config.ts` is required by the deploy adapter;
  keep it
