# CLAUDE.md

Personal weekly planner for Wyatt. Full spec lives in `BRIEF.md` — read it before starting any phase. This file holds the rules that apply every session.

## Workflow

- Build one phase at a time (see "Build phases" in `BRIEF.md`). Propose a plan and wait for approval before writing code for a new phase.
- Never commit directly to `main`. Work on a feature branch (e.g. `phase-1-foundation`) and open a pull request.
- Wyatt is new to dev tooling: explain steps in plain language and say what he needs to do in a browser (GitHub, Vercel, GoDaddy) versus what Claude does.
- Production domain: `calendar.wyattroscoe.com` (Vercel; DNS at GoDaddy).

## Architecture rules

- One deployable app: Next.js (App Router, TypeScript) + Tailwind, Postgres, server-side API routes.
- Every table has a `user_id`. Single user (Wyatt) behind a password today; don't build multi-user, but don't block it.
- All secrets (password, Claude, Google, Microsoft, Notion keys) live in env vars: local `.env` (git-ignored) and Vercel. The repo only has `.env.example` with blank values. API keys never reach the browser.
- The Claude API is only called from the server.
- External calendars are read-only. The app must keep working if any integration fails.
- A seed script loads the weekly template from `BRIEF.md` so a fresh database starts with the real schedule.

## Calendar behavior

- Week runs Monday–Sunday, 5:00am–10:00pm, 15-minute increments. Buffers stay visibly empty.
- Edits (drag, resize, add, rename, delete) apply to **that week only**. Never ask "this week or all weeks?"
- The template changes only when Wyatt explicitly says so (e.g. "...going forward").
- Overlaps get a clear visual (red outline), including clashes with imported events.
- Colors per project are editable in Settings. "On call" blocks show a small tag.
- Rotations: Thursday = Adventure ×3 / Guys' night ×1 per month; Saturday = 4-week cycle (Family, Family, Gianna adventure, Wyatt adventure). 5th Thursday → Adventure, 5th Saturday → Family day, until changed.

## Completion and scoring

- One click/tap marks a block 100%; a small input accepts any percent. No notes, no prompts.
- Actual hours = planned hours × percent complete.
- Consistency = Σ(planned × percent) ÷ Σ(planned), excluding blocks still unmarked 5+ days after they ended (excluded, not counted as 0%).
- Imported Google/Teams events don't count toward scores.
- Scoring math and rotation logic must have automated tests.

## Design

- Very clean and minimal, lots of white space, readable time labels, color-coded by project.
- Desktop-first; responsive phone view for glancing and one-tap completion.
- Light and dark mode following the system setting.
- Dashboard is a grid of independent components so metrics can be added later.

## Open-question defaults (until Wyatt decides)

Quick-add: preview + confirm · Debrief: Sunday 4:00pm · Overlaps: double-booked only · Notion: read-only · Rotation order: set in debrief.

@AGENTS.md
