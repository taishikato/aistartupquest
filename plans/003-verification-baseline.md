# Plan 003: Establish a verification baseline — CI, server-action tests, zero lint warnings

> **Executor instructions**: Follow this plan step by step. Run every
> verification command and confirm the expected result before moving to the
> next step. If anything in the "STOP conditions" section occurs, stop and
> report — do not improvise. When done, update the status row for this plan
> in `plans/README.md` — unless a reviewer dispatched you and told you they
> maintain the index.
>
> **Drift check (run first)**: `git diff --stat 2e48725..HEAD -- tests lib/meetup.ts lib/meetup-submit.ts package.json .github/workflows`
> If any in-scope file changed since this plan was written, compare the
> "Current state" excerpts against the live code before proceeding; on a
> mismatch, treat it as a STOP condition.

## Status

- **Priority**: P1
- **Effort**: M
- **Risk**: LOW
- **Depends on**: none
- **Category**: tests
- **Planned at**: commit `2e48725`, 2026-07-11 (refreshed; originally `ba0778c`, 2026-07-06)
- **Refresh note**: Step 1 (lint warning in `components/events-world-map.tsx`) was dropped — that file was deleted in the events-first top-page rewrite; `pnpm lint --max-warnings 0` already passes. Remaining work is timezone/submit helper tests + CI workflow.

## Why this matters

The repo has no CI: nothing runs `pnpm lint` / `pnpm typecheck` / `pnpm test` / `pnpm build` automatically, so a broken commit reaches `main` silently.
Test coverage is three files (`tests/meetup.test.ts`, `tests/cursor-events.test.ts`, `tests/cursor-events-fetch.test.ts`) while the riskiest logic — timezone-sensitive date handling for six cities (SF through Tokyo) and the public submission pipeline — has no coverage at its edges.
This plan is the prerequisite safety net for the riskier map refactors (plans 006 and 007).

## Current state

- No `.github/workflows/` directory exists.
- `package.json` scripts: `"lint": "eslint"`, `"typecheck": "tsc --noEmit"`, `"test": "vitest run"`, `"build": "next build"`. Package manager is pinned: `"packageManager": "pnpm@10.26.2+..."` (use corepack in CI). Next.js is `16.2.10`.
- `vitest.config.ts` — resolves the `@` alias to the repo root and includes `tests/**/*.test.ts`. New test files just need to live under `tests/`.
- `tests/meetup.test.ts` — the structural exemplar: plain vitest `describe`/`it` with a `makeMeetup(overrides)` factory (lines 10-28).
- Lint baseline is already clean (`pnpm lint --max-warnings 0` exits 0). Do not change any component for lint.
- Timezone logic that needs edge tests, in `lib/meetup.ts`:
  - `localDateKey(date, timeZone)` (lines 51-62) formats a Date into `YYYY-MM-DD` in a given IANA timezone via `Intl.DateTimeFormat`. It is not exported; test it only through `isMeetupUpcoming`.
  - `isMeetupUpcoming(meetup, nowMs)` (lines 104-116) compares `meetup.eventDate >= localDateKey(new Date(nowMs), CITY_TIMEZONES[meetup.city])` and requires `status === "published"`. Note it already accepts `nowMs` for deterministic testing.
  - `filterAndSortUpcomingMeetups(meetups)` (from line 118) sorts and filters. It calls `isMeetupUpcoming(m)` with no `nowMs`, so it uses the real clock — use far-future dates for that case.
- Pure submission helpers that need tests, in `lib/meetup-submit.ts` (44 lines): `hashClientIp`, `hashMeetupPayload`, `slugifyMeetupBase`, `buildMeetupGeocodeQuery`.
- `CITY_TIMEZONES` and `CITY_GEO_LABELS` live in `lib/city-config.ts` and cover `sf`, `toronto`, `ny`, `london`, `vancouver`, `tokyo`.

### Exemplar factory (copy this pattern)

From `tests/meetup.test.ts`:

```ts
function makeMeetup(overrides: Partial<Meetup> = {}): Meetup {
  return {
    slug: "test-meetup-sf-20260801",
    city: "sf",
    title: "Test Meetup",
    description: "A test meetup",
    venueName: "GitHub HQ",
    locationLabel: "88 Colin P Kelly Jr St",
    coordinates: [-122.3934, 37.7822],
    eventDate: "2026-08-01",
    organizerName: null,
    eventUrl: "https://luma.com/test",
    contactEmail: null,
    status: "published",
    source: "community",
    locationPrecision: "exact",
    ...overrides,
  }
}
```

### `lib/meetup-submit.ts` behavior to assert

```ts
buildMeetupGeocodeQuery(venueName, locationLabel, city)
// => `${venueName}, ${locationLabel}, ${CITY_GEO_LABELS[city]}`

slugifyMeetupBase(title, city, eventDate)
// lowercases title, replaces non [a-z0-9] with "-", trims edges, slices to 48,
// falls back to "meetup" if empty, then `${base}-${city}-${YYYYMMDD}`

hashMeetupPayload(parts) / hashClientIp(ip)
// sha256 hex digests; deterministic for identical input
```

## Commands you will need

| Purpose   | Command                    | Expected on success |
|-----------|----------------------------|---------------------|
| Install   | `pnpm install`             | exit 0 (fresh worktree has no node_modules) |
| Typecheck | `pnpm typecheck`           | exit 0              |
| Tests     | `pnpm test`                | all pass            |
| Lint      | `pnpm lint --max-warnings 0` | exit 0            |
| Build     | `pnpm build`               | exit 0 (needs `.env.local`; not required by this plan) |

## Scope

**In scope** (the only files you should modify/create):
- `tests/meetup-datetime-edges.test.ts` (create)
- `tests/meetup-submit-helpers.test.ts` (create)
- `.github/workflows/ci.yml` (create)

**Out of scope** (do NOT touch, even though they look related):
- Any component file (lint is already clean; map marker work is owned by plans 006/007/016).
- `lib/meetup.ts` / `lib/meetup-submit.ts` — tests only; if a test reveals a bug, STOP and report (do not fix).
- `app/actions/meetup-submit.ts` / `app/actions/company-request.ts` source — action-level tests with network mocks belong to plan 002; here we cover only pure helpers.
- Adding new lint rules or a pre-commit hook — separate decision for the maintainer.
- `plans/README.md` — the reviewer maintains the index (do not edit it).

## Git workflow

- Branch: `advisor/003-verification-baseline`
- Conventional commits in English (e.g. `test: cover timezone edges for meetup date logic`, `ci: add lint/typecheck/test workflow`).
- Do NOT push or open a PR unless the operator instructed it.

## Steps

### Step 0: Drift check + install

Run the drift check command from the executor instructions.
Then `pnpm install` (fresh worktrees lack `node_modules`).

**Verify**: drift check shows no unexpected changes to `lib/meetup.ts` / `lib/meetup-submit.ts`. `pnpm lint --max-warnings 0` and `pnpm test` both exit 0 on the baseline before you add files.

### Step 1: Timezone edge tests

Create `tests/meetup-datetime-edges.test.ts` modeled on `tests/meetup.test.ts` (reuse a `makeMeetup` factory).
Import `isMeetupUpcoming` and `filterAndSortUpcomingMeetups` from `@/lib/meetup`.
Cases (use fixed `nowMs` values via `Date.UTC(...)` — never the real clock):

1. An event dated "today in Tokyo" is upcoming when UTC time is late evening the day before (Tokyo is UTC+9, so `2026-08-01T20:00:00Z` is already `2026-08-02` in Tokyo — an event on `2026-08-01` must NOT be upcoming for a `tokyo` meetup, but MUST be upcoming for an `sf` meetup at the same instant, since it is still `2026-08-01` in SF).
2. An event dated today is upcoming at 23:59 local time (same-day events stay listed all day). Pick one city (e.g. `sf`) and a `nowMs` that is 23:59 in that city's timezone on the event date.
3. Year boundary: event `2027-01-01`, now `2026-12-31T12:00:00Z` → upcoming in every city (`sf`, `toronto`, `ny`, `london`, `vancouver`, `tokyo`).
4. A `cancelled` or `hidden` meetup is never upcoming regardless of date.
5. `filterAndSortUpcomingMeetups` sorts by date ascending and drops past events (build 3 meetups: yesterday/today/tomorrow relative to a fixed far-future window — e.g. dates in 2099 — so the test is stable against the real clock). Add a short comment noting that `filterAndSortUpcomingMeetups` has no `nowMs` injection point.

**Verify**: `pnpm test` → all pass, new file included in the run output.

### Step 2: Submission helper tests

Create `tests/meetup-submit-helpers.test.ts` covering `lib/meetup-submit.ts`:

1. `slugifyMeetupBase` produces a stable slug for a given title/city/date, lowercases, strips unsafe characters (assert an exact expected string for one input, and determinism for repeated calls).
2. `hashMeetupPayload` — identical payload → identical hash; changing one field → different hash.
3. `hashClientIp` — deterministic and different for different IPs.
4. `buildMeetupGeocodeQuery` — joins venue, address, and the city geo label. Read `lib/meetup-submit.ts` and `CITY_GEO_LABELS` in `lib/city-config.ts` first; assert the actual string (e.g. for `sf` the label is `"San Francisco"`).

**Verify**: `pnpm test` → all pass.

### Step 3: CI workflow

Create `.github/workflows/ci.yml`:

- Trigger: `push` to `main` and `pull_request`.
- Single job on `ubuntu-latest`: checkout → enable corepack (`corepack enable`) so the pinned `pnpm@10.x` from `packageManager` is used → `actions/setup-node` with Node 22 and pnpm cache → `pnpm install --frozen-lockfile` → `pnpm lint --max-warnings 0` → `pnpm typecheck` → `pnpm test`.
- Do NOT include `pnpm build` in CI: the build requires real Supabase env vars (`NEXT_PUBLIC_SUPABASE_URL` etc. are read at page render, see `lib/supabase/*`), and this plan must not move secrets into GitHub. Leave a YAML comment noting build is deliberately excluded and can be added later with repo secrets.

Example shape (adapt as needed; keep the steps above):

```yaml
name: CI

on:
  push:
    branches: [main]
  pull_request:

jobs:
  verify:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - run: corepack enable
      - uses: actions/setup-node@v4
        with:
          node-version: 22
          cache: pnpm
      - run: pnpm install --frozen-lockfile
      - run: pnpm lint --max-warnings 0
      - run: pnpm typecheck
      - run: pnpm test
      # pnpm build deliberately excluded: needs Supabase env secrets.
```

**Verify**: YAML parses cleanly via `python3 -c "import yaml,sys; yaml.safe_load(open('.github/workflows/ci.yml')); print('ok')"`. Also re-run the three CI commands locally in the same order → all exit 0.

## Test plan

Covered by Steps 1-2 above: two new test files, ~10-15 cases total, modeled on `tests/meetup.test.ts`.
No mocking, no network, no real clock (except the far-future dates for `filterAndSortUpcomingMeetups`).

## Done criteria

Machine-checkable. ALL must hold:

- [ ] `pnpm lint --max-warnings 0` exits 0
- [ ] `pnpm test` exits 0 with 2 new test files running (`meetup-datetime-edges`, `meetup-submit-helpers`)
- [ ] `pnpm typecheck` exits 0
- [ ] `.github/workflows/ci.yml` exists and parses as valid YAML
- [ ] `git status` / `git diff --stat` shows only in-scope files modified (the two test files + the workflow)

## STOP conditions

Stop and report back (do not improvise) if:

- Step 1's test #1 FAILS: that means the timezone logic has a real bug — report it as a finding with the failing case; do not change `lib/meetup.ts` in this plan.
- `filterAndSortUpcomingMeetups` turns out to be untestable even with far-future dates — flag the injection gap in your report and still land the other cases + CI.
- Drift check shows `lib/meetup.ts` or `lib/meetup-submit.ts` changed in a way that invalidates the Current state excerpts.

## Maintenance notes

- Plans 006 and 007 (map-shell perf and decomposition) rely on this CI gate; land this first.
- When the maintainer later adds repo secrets, appending a `pnpm build` step to the workflow closes the last gap.
- The `--max-warnings 0` flag only works while the baseline stays clean; any PR that introduces a warning will now fail CI, which is the point.
