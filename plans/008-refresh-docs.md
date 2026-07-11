# Plan 008: Refresh README and fix the stale genType command in agent docs

> **Executor instructions**: Follow this plan step by step. Run every
> verification command and confirm the expected result before moving to the
> next step. If anything in the "STOP conditions" section occurs, stop and
> report — do not improvise. When done, update the status row for this plan
> in `plans/README.md`.
>
> **Drift check (run first)**: `git diff --stat ba0778c..HEAD -- README.md CLAUDE.md AGENTS.md`
> If any in-scope file changed since this plan was written, compare the
> "Current state" excerpts against the live files before proceeding; on a
> mismatch, treat it as a STOP condition.

## Status

- **Priority**: P2
- **Effort**: S
- **Risk**: LOW
- **Depends on**: none
- **Category**: docs
- **Planned at**: commit `ba0778c`, 2026-07-06

> **Premise update (2026-07-11, commit `16f120d`)**: the route inventory below drifted.
> `/` is now the events-first world atlas (`components/home-events-map.tsx`), and `app/events/page.tsx` is a `permanentRedirect("/")`.
> Describe the events map as the top page, not as `/events`.
> Additionally, Step 3 below was added: the delta introduced a second event-data pipeline that must be documented in `AGENTS.md`.
> The original drift check only covers the doc files; also run `git ls-files app` to confirm the live route list before writing.

## Why this matters

`README.md` says startup data "is maintained in `lib/companies.ts`" — a file that does not exist (data comes from the Supabase `companies` table) — and describes the app as SF-only, while the product now covers six cities (SF, Toronto, NY, London, Vancouver, Tokyo) plus an events-first world map on the top page.
A wrong README is worse than a missing one: it actively misdirects new contributors and coding agents.
Separately, `CLAUDE.md`/`AGENTS.md` line 70 tells agents to run `nr genType`; `nr` (the antfu/ni runner) is a personal global tool not guaranteed in any environment, and the repo's real command is `pnpm genType`.

## Current state

- `README.md` (20 lines total):
  - Line 1-3: `# SF AI Startup Quest Map` / "Dragon quest-like map that shows AI startups in SF".
  - Line 12: "Startup data is maintained in `lib/companies.ts` with source links" — FALSE: `ls lib/companies.ts` → no such file. Real flow: each city page (e.g. `app/sf/page.tsx`) loads from the Supabase `companies` table via `lib/city-page-data.ts`.
  - Lines 14-19: Development section with `pnpm install` / `pnpm dev` — correct, keep.
- `CLAUDE.md:70` and `AGENTS.md:70` (both files contain the identical line — check `ls -la CLAUDE.md AGENTS.md` to see whether one is a symlink; at `ba0778c` they are separate files with identical content):
  - `- After changing Supabase schema or views, run \`nr genType\` and commit the updated \`types/supabase.ts\`.`
- Real product surface (verify by listing `app/`): routes `/` (events-first world atlas), `/sf`, `/toronto`, `/ny`, `/london`, `/vancouver`, `/tokyo`, `/events` (permanent redirect to `/`), `/map-libre`.
- Event data pipelines (for Step 3; verified at `16f120d`):
  - City maps: `scripts/fetch-cursor-events.ts` (`pnpm fetch:cursor`) scrapes cursor.com/community into `scripts/data/cursor-events.json`; `scripts/import-cursor-events.ts` (`pnpm import:cursor`) validates and upserts it into the Supabase `meetups` table, which the six city pages read.
  - Top page: `components/home-events-map.tsx` reads the hand-maintained `lib/data/cursor-community-events.json` (different shape: per-city coordinates plus per-event `company`). `fetch:cursor` does NOT refresh this file.
- Brand language to honor (from `CLAUDE.md` Brand Language section): cities are game worlds, startups are sprites/bosses, meetups are quests, event sources are guilds; action words stay plain.
- Writing conventions for this repo's Markdown (user rule): each full sentence on its own line; plain dash `-`, never the em dash.

## Commands you will need

| Purpose   | Command          | Expected on success |
|-----------|------------------|---------------------|
| Sanity    | `pnpm genType --help 2>&1 | head -2` (do NOT run bare `pnpm genType`; it rewrites types/supabase.ts against the live project) | command exists |
| Lint      | `pnpm lint`      | exit 0 (docs don't affect it; run as a no-regression check) |

## Scope

**In scope** (the only files you should modify):
- `README.md`
- `CLAUDE.md`
- `AGENTS.md`

**Out of scope** (do NOT touch):
- Any source file.
- The rest of `CLAUDE.md`/`AGENTS.md` content — only the `nr genType` line changes; do not "improve" other rules.
- `plans/` content other than the status row.

## Git workflow

- Branch: `advisor/008-refresh-docs`
- Conventional commits in English (e.g. `docs: update README for multi-city scope`).
- Do NOT push or open a PR unless the operator instructed it.

## Steps

### Step 1: Rewrite README.md

Keep it short (25-40 lines). Structure:

1. Title: rename to reflect the product (e.g. `# AI Startup Quest`) with the one-line pitch: a pixel-art RPG map for exploring AI startups and community events across six cities.
2. Keep the existing screenshot image line.
3. "What's this" bullets: an events-first world map on the top page; city maps for SF, Toronto, NY, London, Vancouver, Tokyo; startups as sprites on a game-style map; community meetups as quests.
4. Data section (replaces the false line): startup data lives in the Supabase `companies` table, loaded per city page via `lib/city-page-data.ts`; meetups come from the `published_upcoming_meetups` view; community submissions go through server actions in `app/actions/`.
5. Development section: keep `pnpm install` / `pnpm dev`; add `pnpm lint`, `pnpm typecheck`, `pnpm test`.
6. Note that agent/contributor rules live in `AGENTS.md`.

Write each full sentence on its own line; use plain `-` dashes only.

**Verify**: `grep -n "lib/companies.ts" README.md` → no matches; `grep -c "tokyo\|Tokyo" README.md` → at least 1.

### Step 2: Fix the genType command in both agent docs

In `CLAUDE.md:70` and `AGENTS.md:70`, replace `nr genType` with `pnpm genType`.
If `ls -la` shows one is a symlink to the other, edit the real file once.

**Verify**: `grep -rn "nr genType" CLAUDE.md AGENTS.md` → no matches; `grep -rn "pnpm genType" CLAUDE.md AGENTS.md` → 2 matches (or 1 if symlinked).

### Step 3: Document the two event-data pipelines in AGENTS.md (added 2026-07-11)

Add a short "Event data pipelines" subsection under Implementation Notes in `AGENTS.md` (and `CLAUDE.md` if they are still identical copies), stating in 3-4 lines:

- `pnpm fetch:cursor` scrapes cursor.com/community into `scripts/data/cursor-events.json`; `pnpm import:cursor` upserts it into Supabase `meetups` for the six city pages.
- The top page reads `lib/data/cursor-community-events.json`, a separate hand-maintained file with a different shape (city coordinates + per-event `company`); `fetch:cursor` does not touch it.

Write each full sentence on its own line; plain `-` dashes only.

**Verify**: `grep -n "fetch:cursor" AGENTS.md` → at least 1 match; `grep -n "cursor-community-events.json" AGENTS.md` → at least 1 match.

## Test plan

Docs-only change; no tests.
`pnpm lint` as a no-regression smoke check.

## Done criteria

Machine-checkable. ALL must hold:

- [ ] `grep -n "lib/companies.ts" README.md` → no matches
- [ ] `grep -rn "nr genType" CLAUDE.md AGENTS.md` → no matches
- [ ] README mentions all six cities and the events-first top page
- [ ] `AGENTS.md` documents both event-data pipelines (Step 3 verifies)
- [ ] `git status` shows only README.md, CLAUDE.md, AGENTS.md modified
- [ ] `plans/README.md` status row updated

## STOP conditions

Stop and report back (do not improvise) if:

- `CLAUDE.md` and `AGENTS.md` contents have DIVERGED (they are identical at `ba0778c`) — reconcile is a maintainer decision.
- You are tempted to document `/map-libre` in the README — don't; direction plan 011 decides its fate. Leave it undocumented.

## Maintenance notes

- When plan 011 resolves the `/map-libre` experiment and plan 009/010 land new flows, the README's feature list needs one-line updates — keep it lean rather than exhaustive.
- If `CLAUDE.md`/`AGENTS.md` keep having to be edited in pairs, converting one to a symlink (or an `@import`) is worth proposing to the maintainer.
