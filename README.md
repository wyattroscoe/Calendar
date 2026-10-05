# Weekly Calendar

Wyatt's personal weekly planner: a color-coded week view with one-tap completion tracking, consistency scores, yearly reminders and a weekly debrief agent. The full spec is in [BRIEF.md](BRIEF.md); rules for Claude Code are in [CLAUDE.md](CLAUDE.md).

Live at **calendar.wyattroscoe.com** (deployed by Vercel on every merge to `main`).

## Run it on your computer

Requires Node.js 24.

```sh
npm install
cp .env.example .env     # then fill in APP_PASSWORD and SESSION_SECRET
npm run setup            # creates the database tables and loads the weekly template
npm run dev              # open http://localhost:3000
```

With `DATABASE_URL` left blank, the app uses **PGlite**, a local Postgres stored in `.pglite/` (git-ignored). Stop `npm run dev` before running `npm run setup` — only one program can open the local database at a time. To start over, delete `.pglite/` and run `npm run setup` again.

## Commands

| Command | What it does |
| --- | --- |
| `npm run dev` | Start the app locally |
| `npm test` | Run the automated tests (scoring, rotations, overlaps, week generation) |
| `npm run typecheck` / `npm run lint` | Check for type and style errors |
| `npm run db:generate` | After changing `src/db/schema.ts`, create a new migration in `drizzle/` |
| `npm run db:migrate` | Apply migrations to the database in `DATABASE_URL` (or local PGlite) |
| `npm run db:seed` | Load projects and the weekly template (skips if already loaded) |

## How it's built

- **Next.js 16** (App Router, TypeScript) + **Tailwind CSS 4**
- **Postgres** via Neon on Vercel, using **Drizzle ORM**; PGlite locally
- **Password login**: `APP_PASSWORD` is checked on the server, then a signed cookie (`SESSION_SECRET`) keeps you signed in for 30 days. `src/proxy.ts` sends signed-out visitors to `/login`.

```
src/app/(app)/         signed-in pages: week view (/), dashboard, year, debrief, settings
src/app/actions.ts     server actions: login, block edits, completion, project colors
src/components/week/   week grid, block editor, percent input
src/lib/               time, rotation, overlap, scoring, week generation (all tested)
src/db/                schema, connection, seed template from BRIEF.md
tests/                 Vitest tests
```

**How weeks work:** `template_blocks` holds the standard week. The first time a week is opened, it's copied into `week_blocks` with that week's Thursday/Saturday/Sunday rotations applied. Edits change only that copy, never the template.

## Deploying

1. Import the GitHub repo in Vercel.
2. Storage → add a **Neon** Postgres database (sets `DATABASE_URL`).
3. Settings → Environment Variables: `APP_PASSWORD`, `SESSION_SECRET`, `APP_TIMEZONE`.
4. Redeploy. Production builds run `scripts/deploy-db.ts`, which applies migrations and seeds the template automatically.
5. Settings → Domains → add `calendar.wyattroscoe.com`, then add the CNAME record Vercel shows in GoDaddy DNS.
