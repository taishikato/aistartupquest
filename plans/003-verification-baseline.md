# Plan 003: Establish a verification baseline — CI, server-action tests, zero lint warnings

> **Executor instructions**: Follow this plan step by step. Run every
> verification command and confirm the expected result before moving to the
> next step. If anything in the "STOP conditions" section occurs, stop and
> report — do not improvise. When done, update the status row for this plan
> in `plans/README.md`.
>
> **Drift check (run first)**: `git diff --stat ba0778c..HEAD -- tests lib/meetup.ts lib/meetup-submit.ts components/events-world-map.tsx package.json`
> If any in-scope file changed since this plan was written, compare the
> "Current state" excerpts against the live code before proceeding; on a
> mismatch, treat it as a STOP condition.

## Status

- **Priority**: P1
- **Effort**: M
- **Risk**: LOW
- **Depends on**: none
- **Category**: tests
- **Planned at**: commit `ba0778c`, 2026-07-06

## Why this matters

The repo has no CI: nothing runs `pnpm lint` / `pnpm typecheck` / `pnpm test` / `pnpm build` automatically, so a broken commit reaches `main` silently.
Test coverage is two files (`tests/meetup.test.ts`, `tests/cursor-events.test.ts`) while the riskiest logic — timezone-sensitive date handling for six cities (SF through Tokyo) and the public submission pipeline — has no coverage at its edges.
One ESLint warning (`react-hooks/exhaustive-deps` in `components/events-world-map.tsx:297`) sits in the baseline, which means `--max-warnings 0` cannot be enforced and new warnings can accumulate unnoticed.
This plan is the prerequisite safety net for the riskier map refactors (plans 006 and 007).

## Current state

- No `.github/workflows/` directory exists.
- `package.json` scripts: `"lint": "eslint"`, `"typecheck": "tsc --noEmit"`, `"test": "vitest run"`, `"build": "next build"`. Package manager is pinned: `"packageManager": "pnpm@10.26.2+..."` (use corepack in CI).
- `vitest.config.ts` — resolves the `@` alias to the repo root and includes `tests/**/*.test.ts`. New test files just need to live under `tests/`.
- `tests/meetup.test.ts` — the structural exemplar: plain vitest `describe`/`it` with a `makeMeetup(overrides)` factory (lines 10-28).
- The lint warning to fix:

```
components/events-world-map.tsx
  297:6  warning  React Hook useEffect has a missing dependency: 'markerPosition'
```

The effect (lines 272-297) creates map markers and calls `markerPosition(city)` at line 289; its dependency array is `[mapReady, upcomingCities]`.
`markerPosition` is a `useCallback` with an empty dependency array (defined at lines 365-384), so it is referentially stable; adding it to the array is a no-op at runtime and silences the warning honestly.

- Timezone logic that needs edge tests, in `lib/meetup.ts`:
  - `localDateKey(date, timeZone)` (lines 51-62) formats a Date into `YYYY-MM-DD` in a given IANA timezone via `Intl.DateTimeFormat`.
  - `isMeetupUpcoming(meetup, nowMs)` (lines 104-116) compares `meetup.eventDate >= localDateKey(new Date(nowMs), CITY_TIMEZONES[meetup.city])` and requires `status === "published"`. Note it already accepts `nowMs` for deterministic testing.
  - `filterAndSortUpcomingMeetups(meetups)` (from line 118) sorts and filters.
- Pure submission helpers that need tests, in `lib/meetup-submit.ts` (44 lines): `hashClientIp`, `hashMeetupPayload`, `slugifyMeetupBase`, `buildMeetupGeocodeQuery`.
- `CITY_TIMEZONES` lives in `lib/city-config.ts` and covers `sf`, `toronto`, `ny`, `london`, `vancouver`, `tokyo`.

## Commands you will need

| Purpose   | Command                    | Expected on success |
|-----------|----------------------------|---------------------|
| Typecheck | `pnpm typecheck`           | exit 0              |
| Tests     | `pnpm test`                | all pass            |
| Lint      | `pnpm lint --max-warnings 0` | exit 0 after Step 1 |
| Build     | `pnpm build`               | exit 0 (needs `.env.local`) |

## Scope

**In scope** (the only files you should modify/create):
- `components/events-world-map.tsx` (one-line dependency array change only)
- `tests/meetup-datetime-edges.test.ts` (create)
- `tests/meetup-submit-helpers.test.ts` (create)
- `.github/workflows/ci.yml` (create)

**Out of scope** (do NOT touch, even though they look related):
- Any other change to `components/events-world-map.tsx` — the marker logic is owned by plans 006/007.
- `app/actions/meetup-submit.ts` / `app/actions/company-request.ts` source — action-level tests with network mocks belong to plan 002's test file; here we cover only pure helpers.
- Adding new lint rules or a pre-commit hook — separate decision for the maintainer.

## Git workflow

- Branch: `advisor/003-verification-baseline`
- Conventional commits in English (e.g. `test: cover timezone edges for meetup date logic`, `ci: add lint/typecheck/test workflow`).
- Do NOT push or open a PR unless the operator instructed it.

## Steps

### Step 1: Fix the lint warning

In `components/events-world-map.tsx`, change the effect dependency array at line 297 from `[mapReady, upcomingCities]` to `[mapReady, upcomingCities, markerPosition]`.
Change nothing else in the file.

**Verify**: `pnpm lint --max-warnings 0` → exit 0.

### Step 2: Timezone edge tests

Create `tests/meetup-datetime-edges.test.ts` modeled on `tests/meetup.test.ts` (reuse a `makeMeetup` factory).
Cases (use fixed `nowMs` values via `Date.UTC(...)` — never the real clock):

1. An event dated "today in Tokyo" is upcoming when UTC time is late evening the day before (Tokyo is UTC+9, so `2026-08-01T20:00:00Z` is already `2026-08-02` in Tokyo — an event on `2026-08-01` must NOT be upcoming for a `tokyo` meetup, but MUST be upcoming for an `sf` meetup at the same instant, since it is still `2026-08-01` in SF).
2. An event dated today is upcoming at 23:59 local time (same-day events stay listed all day).
3. Year boundary: event `2027-01-01`, now `2026-12-31T12:00:00Z` → upcoming in every city.
4. A `cancelled` or `hidden` meetup is never upcoming regardless of date.
5. `filterAndSortUpcomingMeetups` sorts by date ascending and drops past events (build 3 meetups: yesterday/today/tomorrow relative to a fixed `nowMs` — note the current signature takes no `nowMs`; if it internally uses the real clock, pick far-future dates like 2099 so the test is stable, and mention this limitation in a comment).

**Verify**: `pnpm test` → all pass, new file included in the run output.

### Step 3: Submission helper tests

Create `tests/meetup-submit-helpers.test.ts` covering `lib/meetup-submit.ts`:

1. `slugifyMeetupBase` produces a stable slug for a given title/city/date, lowercases, strips unsafe characters (assert an exact expected string for one input, and determinism for repeated calls).
2. `hashMeetupPayload` — identical payload → identical hash; changing one field → different hash.
3. `hashClientIp` — deterministic and different for different IPs.
4. `buildMeetupGeocodeQuery` — joins venue, address, and the city geo label (read the implementation first and assert its actual behavior; write the test from the code, not from this sentence).

**Verify**: `pnpm test` → all pass.

### Step 4: CI workflow

Create `.github/workflows/ci.yml`:

- Trigger: `push` to `main` and `pull_request`.
- Single job on `ubuntu-latest`: checkout → enable corepack (`corepack enable`) so the pinned `pnpm@10.x` from `packageManager` is used → `actions/setup-node` with Node 22 and pnpm cache → `pnpm install --frozen-lockfile` → `pnpm lint --max-warnings 0` → `pnpm typecheck` → `pnpm test`.
- Do NOT include `pnpm build` in CI: the build requires real Supabase env vars (`NEXT_PUBLIC_SUPABASE_URL` etc. are read at page render, see `lib/supabase/*`), and this plan must not move secrets into GitHub. Leave a YAML comment noting build is deliberately excluded and can be added later with repo secrets.

**Verify**: `npx --yes yaml-lint .github/workflows/ci.yml` (or any YAML parse check, e.g. `node -e "require('js-yaml')..."`; if no YAML tool is available, `python3 -c "import yaml,sys; yaml.safe_load(open('.github/workflows/ci.yml'))"`) → parses cleanly. Also re-run the three CI commands locally in the same order → all exit 0.

## Test plan

Covered by Steps 2-3 above: two new test files, ~10-15 cases total, modeled on `tests/meetup.test.ts`.
No mocking, no network, no real clock.

## Done criteria

Machine-checkable. ALL must hold:

- [ ] `pnpm lint --max-warnings 0` exits 0
- [ ] `pnpm test` exits 0 with 2 new test files running
- [ ] `pnpm typecheck` exits 0
- [ ] `.github/workflows/ci.yml` exists and parses as valid YAML
- [ ] `git status` shows only in-scope files modified
- [ ] `plans/README.md` status row updated

## STOP conditions

Stop and report back (do not improvise) if:

- Step 2's test #1 FAILS: that means the timezone logic has a real bug — report it as a finding with the failing case; do not change `lib/meetup.ts` in this plan.
- Adding `markerPosition` to the dependency array changes runtime behavior (it should not — it is a stable `useCallback([])`; if the live code differs, the codebase drifted).
- `filterAndSortUpcomingMeetups` turns out to be untestable deterministically (hard dependency on the real clock with no injection point) — write the far-future-date version and flag the injection gap in your report.

## Maintenance notes

- Plans 006 and 007 (map-shell perf and decomposition) rely on this CI gate; land this first.
- When the maintainer later adds repo secrets, appending a `pnpm build` step to the workflow closes the last gap.
- The `--max-warnings 0` flag only works while the baseline stays clean; any PR that introduces a warning will now fail CI, which is the point.
