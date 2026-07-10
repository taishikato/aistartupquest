# Plan 009: Design spike — automated event sync and the second guild

> **Executor instructions**: This is a DESIGN SPIKE, not a build plan.
> The deliverable is a written design document plus at most a throwaway
> prototype script — no production code changes, no schema migrations.
> If anything in the "STOP conditions" section occurs, stop and report.
> When done, update the status row for this plan in `plans/README.md`.
>
> **Drift check (run first)**: `git diff --stat ba0778c..HEAD -- lib/cursor-events.ts scripts/import-cursor-events.ts lib/meetup.ts supabase/migrations`
> On drift, re-read the changed files before writing the design.

## Status

- **Priority**: P3
- **Effort**: M (spike itself; implementation estimated separately in the deliverable)
- **Risk**: LOW (no production changes)
- **Depends on**: none
- **Category**: direction
- **Planned at**: commit `ba0778c`, 2026-07-06

## Why this matters

The product's brand language says event sources are "guilds" and Cursor is the first one, but the pipeline is one-source and fully manual: someone hand-edits `scripts/data/cursor-events.json` (23 lines today) and runs `pnpm import:cursor`.
Manual sync means events go stale silently — the worst failure mode for a product whose pitch is "upcoming events".
The schema is already multi-source ready (`meetups.source` column, upsert on `(source, source_event_id)`, `MeetupSource` union type), so the marginal design cost is low and the decision now is HOW to automate and WHICH second guild proves the pattern.

## Current state (evidence for the spike to build on)

- `scripts/import-cursor-events.ts` (73 lines) — reads a JSON array from `scripts/data/cursor-events.json` (or argv path), validates each item via `validateCursorEvent`, maps city names via `mapCursorCity`, builds rows with `buildCursorMeetupRow`, then upserts with `onConflict: "source,source_event_id"` using the service-role key.
- `lib/cursor-events.ts` (131 lines) — `CursorEventInput` type (`id, title, city, date, url, organizer?, description?`), `CITY_ALIASES` map covering the six cities, validation returning `{ ok, reason }`.
- `lib/meetup.ts:8` — `export type MeetupSource = "community" | "cursor"`; `meetupFromRow` defaults null source to `"community"`.
- `lib/data/cursor-community-events.json` (1128 lines) — a SEPARATE static dataset used by the `/events` world map (`components/events-world-map.tsx` renders `getUpcomingCities()`); note the world map does NOT read from Supabase. Any sync design must state whether `/events` joins the database flow or stays static.
- City-level events hide venues by design (`location_precision = "city"`); imports geocode to `CITY_MAP_CENTERS`.
- Tests exist for the import helpers: `tests/cursor-events.test.ts`.
- Infra facts: Supabase project (cron + Edge Functions available), Next.js on Vercel-style hosting (check for `vercel.json`; none at `ba0778c`), no CI until plan 003 lands.

## Deliverable

Write `docs/design/event-sync.md` (create the directory) containing:

1. **Sync architecture decision** — compare at least: (a) Supabase scheduled Edge Function pulling each guild's source, (b) GitHub Actions cron running the existing tsx import scripts, (c) Vercel cron hitting a Next.js route handler. For each: where secrets live, failure visibility, cost, and how `pnpm genType`/migrations interact. Recommend ONE with a sentence of justification.
2. **Guild abstraction** — the minimal interface a new source must implement (fetch → normalize to `CursorEventInput`-like shape → validate → upsert). Name it in brand terms (a "guild adapter"), but keep code identifiers plain (`EventSourceAdapter`). Specify how `MeetupSource` grows (union member + DB enum/constraint check — find where `source` is constrained in `supabase/migrations/20260704120000_add_meetup_source_and_location_precision.sql`).
3. **Second guild candidate** — research 2-3 realistic candidates (e.g. Luma public calendars, an accelerator's event feed, a city AI community calendar). For each: is there a fetchable public source (API/ICS/HTML), what fields map to the schema, licensing/ToS concerns. Recommend one.
4. **Staleness handling** — what happens to previously imported events that disappear from the source (cancелled events currently linger as `published`); propose the reconciliation rule.
5. **The `/events` map question** — should `getUpcomingCities()` keep reading the static JSON or query Supabase; note the coupling either way.
6. **Implementation estimate** — S/M/L per piece, and the follow-up plan list you would write.
7. **Open questions for the maintainer** — anything requiring product judgment (e.g. does a guild's event override a community duplicate?).

A throwaway fetch experiment (e.g. curl-ing a candidate source to confirm the data shape) is encouraged; put artifacts under `docs/design/` or discard them — never under `lib/` or `scripts/`.

## Scope

**In scope**: `docs/design/event-sync.md` (create), read-only exploration anywhere in the repo, external research on candidate sources.

**Out of scope**: ANY change to `lib/`, `scripts/`, `app/`, `supabase/`, `package.json`; committing fetched datasets; adding dependencies.

## Git workflow

- Branch: `advisor/009-spike-event-sync`
- Single commit: `docs: design spike for automated event sync and guild adapters`
- Do NOT push or open a PR unless the operator instructed it.

## Done criteria

- [ ] `docs/design/event-sync.md` exists and covers all 7 deliverable sections
- [ ] Every claim about current code cites a `file:line`
- [ ] A single recommended sync architecture and a single recommended second guild are stated
- [ ] No files outside `docs/design/` changed (`git status`)
- [ ] `plans/README.md` status row updated

## STOP conditions

- A candidate source's ToS prohibits scraping/republishing — record it in the doc and pick another; do not design around a violation.
- The design starts requiring product decisions you cannot ground in the repo (pricing, partnerships) — list them as open questions instead of deciding.

## Maintenance notes

- This doc becomes the input for real build plans; keep it decision-oriented (recommendations, not surveys).
- Revisit after plan 010 (moderation) — a moderation queue changes whether guild imports publish immediately.
