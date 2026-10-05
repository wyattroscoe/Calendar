# Weekly Calendar App — Design Brief for Claude Code

Oct 1, 2026 · @Wyatt Roscoe

## How to use this brief with Claude Code and GitHub

Put this brief in a GitHub repo, let Claude Code build it in phases, and let Vercel deploy every update to calendar.wyattroscoe.info automatically.

1. **Create the repo.** On github.com, make a new private repository (e.g. `weekly-calendar`). To work with others later, add them under Settings → Collaborators.
2. **Install Claude Code.** Use the Claude desktop app's Code tab or the terminal version, and sign in.
3. **Open the repo in Claude Code.** Clone it to your computer and point Claude Code at that folder.
4. **Add this brief.** Save this file in the root of the repo as `BRIEF.md`. Ask Claude Code to create a `CLAUDE.md` file summarizing the key rules; Claude Code reads that file automatically every session.
5. **Build one phase at a time.** Start with the prompt below, review what it builds, then move to the next phase (see Build phases at the end).
6. **Use branches and pull requests.** Ask Claude Code to work on a branch per feature and open a pull request. Collaborators can review and comment before changes merge into `main`.
7. **Deploy.** Connect the repo to Vercel (free tier is fine). Every merge to `main` redeploys. In Vercel, add the domain `calendar.wyattroscoe.info`, then add the CNAME record it gives you in GoDaddy's DNS settings.
8. **Keep secrets out of GitHub.** API keys (Claude, Google, Microsoft, Notion) and your password go in Vercel environment variables and a local `.env` file that is git-ignored. The repo only contains a `.env.example` with blank names.

**Starter prompt to paste into Claude Code:**

> Read BRIEF.md fully. Create CLAUDE.md with the project's key rules and conventions. Then propose a technical plan and file structure for Phase 1 only, and wait for my approval before writing code. Use a feature branch and open a pull request when Phase 1 is done.

## Project overview

A clean, personal weekly planner for Wyatt that tracks how much of each planned block actually gets done, surfaces annual reminders at the right time, and runs a weekly debrief with an AI agent.

- **User:** Wyatt only, behind a password. Every table and feature is built with a user ID so multiple users and share links can be added later without a rewrite. Do not build multi-user now.
- **Devices:** desktop-first (planning and adjusting before and during the workday), with a responsive phone view for glancing and one-tap completion.
- **Core pieces:** weekly calendar, dashboard, Year at a Glance reminders page, a quick-add text bar, and a weekly debrief agent.
- **Design feel:** very clean, minimal, color-coded by project. Plenty of white space, readable time labels, no clutter.

## Tech stack and repo setup

Recommended stack below; Claude Code may propose alternatives in its Phase 1 plan, but must keep it a single deployable app with a real database and server-side API routes.

| Layer | Recommendation | Why |
| --- | --- | --- |
| App framework | Next.js (React, TypeScript) | Pages plus server API routes in one project |
| Styling | Tailwind CSS | Fast, consistent, clean UI |
| Database and auth | Supabase (Postgres) or Vercel Postgres | Stores blocks, completions, reminders, memory; simple password login |
| Hosting | Vercel, linked to GitHub | Auto-deploys on merge; custom subdomain support |
| Agent | Claude API, called only from the server | Quick-add parsing, debrief, recipe picks |
| Calendars | Google Calendar API; Microsoft Graph for Teams/Outlook | Read-only import of external events |
| Priorities | Notion API | Pull priorities into the debrief |

**Repo conventions**

- `README.md` with local setup steps, `.env.example`, `CLAUDE.md`, and `BRIEF.md`.
- `main` branch is protected; all work happens on feature branches merged by pull request.
- A seed script loads the weekly template below, so a fresh database starts with the real schedule.
- Automated tests for the scoring math (actual hours and consistency %) and the rotation logic.
- API keys never touch the browser or the repo.

**Core data model** (each table includes `user_id`)

- `projects`: name, color, parent project (e.g. Run under Exercise)
- `template_blocks`: weekday, start, end, project, title, tags (e.g. on-call), rotation rule
- `week_blocks`: date, start, end, project, title, source (template, manual, agent, Google, Teams), percent complete (blank until marked), marked at
- `reminders`: title, month, optional date or window, link, notes, last surfaced
- `recipes`: title, link, optional ingredients, last cooked
- `agent_memory`: anything added via the quick-add bar or debrief that isn't scheduled yet
- `debriefs`: week, questions, answers, decisions made

## Pages and navigation

A dropdown menu switches between pages; the quick-add bar and a Debrief button sit in the header on every page.

| Page | Purpose |
| --- | --- |
| Weekly Calendar (default) | The week, Monday to Sunday, with completion controls |
| Dashboard | Planned vs actual hours and consistency scores |
| Year at a Glance | All 12 months of reminders, editable per month |
| Debrief | Guided weekly planning with the agent; opens any time |
| Settings | Projects and colors, weekly template, favorite recipes, connections |

## Weekly calendar

The week starts Monday, shows 5:00am to 10:00pm, and supports blocks in 15-minute increments. Gaps marked as buffers stay visibly empty.

**Projects and colors**

| Project | Color | Includes |
| --- | --- | --- |
| Nth Cycle | Orange | All work blocks |
| Exercise | Green | Workouts; Run and Walk/stretch as lighter greens |
| Personal projects | Blue | Afternoon project blocks |
| Family time | Pink | Breakfast, kid time, pickups, evenings; some tagged "on call" |
| Home projects | Turquoise | Sunday half days |
| Cooking | Warm yellow (adjustable) | Mon/Wed/Fri recipe blocks |
| Date, Adventure, Guys' night, Commute, Bed | Soft distinct neutrals (adjustable) | — |

Colors are editable in Settings. "On call" blocks show a small tag meaning Nth Cycle is running in the background.

**Monday and Wednesday**

| Time | Block | Project |
| --- | --- | --- |
| 5:00–6:00 | Workout | Exercise |
| 6:00–6:30 | Breakfast (on call) | Family |
| 6:30–8:00 | Wolf and Gianna time, school drop-off (on call) | Family |
| 8:00–8:30 | Buffer | — |
| 8:30–9:00 | Go to co-working space | Commute |
| 9:00–10:00 | Work | Nth Cycle |
| 10:00–10:15 | Walk/stretch | Exercise |
| 10:15–11:30 | Work | Nth Cycle |
| 11:30–12:30 | Run | Exercise |
| 12:30–1:00 | Lunch | Family/personal |
| 1:00–2:00 | Work | Nth Cycle |
| 2:00–4:00 | Personal project | Personal projects |
| 4:00–4:30 | Buffer | — |
| 4:30–4:45 | Pick up Wolf | Family |
| 5:00–5:30 | Family time | Family |
| 5:30–6:30 | Cooking (recipe from debrief) | Cooking |
| 6:30–8:30 | Family time | Family |
| 8:30–9:30 | Wind-down and bed | Bed |

**Tuesday**

| Time | Block | Project |
| --- | --- | --- |
| 5:15–6:15 | Exercise | Exercise |
| 6:15–6:45 | Breakfast | Family |
| 6:45–7:15 | Go to co-working space | Commute |
| 7:30–9:00 | Work | Nth Cycle |
| 9:00–10:00 | Run or workout | Exercise |
| 10:00–11:00 | Work | Nth Cycle |
| 11:00–11:15 | Stretch/walk | Exercise |
| 11:15–12:30 | Work | Nth Cycle |
| 12:30–1:00 | Lunch | Family/personal |
| 1:00–2:00 | Work | Nth Cycle |
| 2:00–5:00 | Date with Gianna | Date |
| 5:00–5:30 | Pick up Wolf | Family |
| 5:30–8:30 | Family time | Family |
| 8:30–9:30 | Wind-down and bed | Bed |

**Thursday:** same as Tuesday until 2:00pm. Then 2:00–10:00pm is either a big Adventure (3 Thursdays a month) or Guys' night (1 Thursday a month). No bedtime block.

**Friday:** same as Monday, except 4:00–4:15 buffer, 4:15–4:30 pick up Wolf, 4:30–5:30 family time, then cooking 5:30–6:30, family 6:30–8:30, bed 8:30–9:30.

**Saturday:** all-day block on a 4-week rotation: 2 Family days, 1 Gianna adventure day, 1 Wyatt adventure day.

**Sunday:** Family day by default, with 1–2 half days of Home projects per month. Fixed blocks: weekly Debrief (proposed 4:00–4:30pm), "Check in with Gianna: order ingredients" right after (lists the week's three recipes with links), and a 5:00pm reminder to plan date night with G.

**Rotations:** Thursday and Saturday rotations start with placeholder order. The debrief confirms or swaps them each week. Fifth Thursdays or Saturdays in a month default to Adventure and Family day, respectively, until changed.

**Editing rules**

- Blocks can be dragged, resized, added, renamed, or deleted.
- Any edit applies to that week only. Never ask "this week or all weeks?"
- The template changes only when Wyatt explicitly says so (e.g. "move all Monday runs to 3pm going forward" in the quick-add bar).
- Overlaps are highlighted with a clear visual (e.g. red outline), including clashes with imported Google or Teams events.

## Completion tracking and dashboard

Every block counts, and progress is measured in hours: actual hours = planned hours × percent complete.

**Marking blocks**

- One click on a "Complete" control marks a block 100%.
- A small input lets Wyatt type any percent (e.g. 50).
- No notes, no reschedule prompts. Keep it one action.
- Works with a single tap on phone.

**Unmarked blocks**

- Each morning, a nudge lists the previous day's unmarked blocks for quick marking.
- Blocks still unmarked after 5 days are excluded from all scores (not counted as 0%).

**Dashboard**

- **Hours by project:** a bar per project for the selected week. The full bar is planned hours; the filled portion is actual hours.
- **Consistency score:** actual hours ÷ planned hours across all counted blocks, shown for this week, this month, this quarter, and this year.

```latex
\text{Consistency} = \frac{\sum (\text{planned hours} \times \text{percent complete})}{\sum \text{planned hours (excluding blocks unmarked 5+ days)}}
```

- Build the dashboard as a grid of independent components so new metrics can be added later without reworking the page.
- Keep history indefinitely (adjustable later).

## Year at a Glance reminders

One page shows all 12 months at once, each listing its reminders in small text, with add, edit, and remove controls per month.

- **Examples of reminders:** ski hut applications, river permit lotteries, annual races, and recurring trips or activities. The list starts empty and grows over time.
- **Fields:** title, month, optional exact date or application window, link, notes.
- **Sources:** added directly on this page, via the quick-add bar, or remembered by the agent during a debrief.
- **Recurring yearly:** reminders repeat each year by default until removed.
- **Alerts:** in-app only for now. Build the notification layer so email or phone push can be added later.

**When reminders surface**

- The first debrief of each month lists everything happening that month.
- After that, each reminder surfaces in the Sunday debrief before the week it falls in.
- Each surfaced reminder has two buttons: **Fit into my schedule** (agent proposes a slot, Wyatt approves) and **Manually place** (Wyatt drags it onto the calendar).
- Training-related items (like a race) can include suggested training blocks in the weeks before, offered the same way.

## Agent features

The agent is the Claude API called from the server, with the app's database as its memory. Anything Wyatt tells it is stored and resurfaced at the right debrief.

**Quick-add bar** (in the header of every page)

- Accepts casual text ("dentist Tue 3pm"), pasted emails, and links. For links, the server fetches the page and extracts dates, deadlines, and details.
- Decides whether the input is a calendar event this week, a future event, a yearly reminder, a template change, or something to remember for the debrief.
- Shows a one-line preview with a confirm button before saving (default; see open questions).
- Commands like "move all Monday runs to 3pm going forward" update the template.

**Weekly debrief** (Sundays by default; opens any time from the header)

1. If it's the first debrief of the month, list all of that month's reminders.
2. Ask about priorities for the week, pulling current priorities from Notion.
3. Show this week's reminders and anything remembered from quick-add, each with **Fit into my schedule** / **Manually place**.
4. Confirm the Thursday and Saturday rotations for the coming week.
5. Propose three recipes for Monday, Wednesday, and Friday cooking blocks; allow swaps.
6. Show an overlap report: double-booked times, and clashes with Google or Teams events.
7. Show the proposed week for approval, then apply it.
8. Save the answers and decisions to the debrief history.

**Recipes**

- A favorites list in Settings: recipe name, NYT Cooking link, and optional ingredients Wyatt pastes in himself. Store links and his notes only; don't copy recipe content from the site, which is behind a paywall.
- In the debrief, the agent picks three, rotating so recent ones don't repeat, and places them in the Mon/Wed/Fri 5:30–6:30pm Cooking blocks.
- It also fills the Sunday "Check in with Gianna: order ingredients" block with the three recipe names and links (and ingredients if saved).

## Integrations

External calendars are read-only and used for display and overlap detection; Notion feeds the debrief.

| Service | How | Notes |
| --- | --- | --- |
| Google Calendar | Google Calendar API, OAuth, read-only | Events shown as grey blocks on the week view |
| Microsoft Teams (Outlook/365) | Microsoft Graph API, read-only | A work account may need IT approval; fallback is a published calendar (ICS) subscription link |
| Notion | Notion API with an integration token shared to the priorities database | Read priorities into the debrief; write-back is an open question |

All tokens live in environment variables. Connections are managed in Settings, and the app keeps working if any one connection fails.

## Build phases and open questions

Build in five phases, each ending in a pull request and a working deploy.

1. **Foundation:** repo, password login, database, seeded weekly template, Weekly Calendar page with colors, editing rules, overlap highlighting, and completion controls. Deploy to calendar.wyattroscoe.info.
2. **Dashboard:** planned vs actual bars, consistency scores, morning nudge for unmarked blocks.
3. **Year at a Glance:** reminders page and monthly/weekly surfacing logic.
4. **Agent:** quick-add bar, agent memory, weekly debrief, recipes and the Sunday ingredients block.
5. **Integrations:** Google Calendar, Teams, Notion.

**Open questions** (defaults in brackets until answered)

- [ ] Quick-add: preview and confirm, or add instantly with undo? [preview]
- [ ] Exact debrief time on Sunday [4:00pm]
- [ ] Full list of debrief questions beyond priorities
- [ ] Overlap: only double-booked time, or also things like too many hard training days in a row? [double-booked only]
- [ ] Do imported Google/Teams events count toward consistency? [no]
- [ ] Notion: priorities database fields, and should debrief answers write back? [read only]
- [ ] Visual references and light/dark mode [both, following system setting]
- [ ] Colors for Cooking, Date, Adventure, Guys' night, Commute, Bed
- [ ] Rotation order for Thursdays and Saturdays [set in debrief]
