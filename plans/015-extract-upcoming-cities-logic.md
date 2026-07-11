# Plan 015: Extract and unit-test the top page's upcoming-events logic, and slim its client payload

> **Executor instructions**: Follow this plan step by step. Run every
> verification command and confirm the expected result before moving to the
> next step. If anything in the "STOP conditions" section occurs, stop and
> report — do not improvise. When done, update the status row for this plan
> in `plans/README.md`.
>
> **Drift check (run first)**: `git diff --stat 16f120d..HEAD -- components/home-events-map.tsx lib/data/cursor-community-events.json`
> Expected drift: commit `0adafe4` (landed during planning) removed a compact
> city-nav block and an unused `Link` import from `home-events-map.tsx`; line
> numbers below refer to `16f120d`, so JSX after line ~518 sits ~19 lines
> lower post-`0adafe4`. That is not a STOP. Compare the "Current state"
> excerpts against the live code before proceeding; on any other content
> mismatch, treat it as a STOP condition.

## Status

- **Priority**: P2
- **Effort**: S
- **Risk**: LOW
- **Depends on**: none (plan 016 touches the same file — do not run both concurrently; 015 first)
- **Category**: tests + perf
- **Planned at**: commit `16f120d`, 2026-07-11
- **Status**: DONE (merged to main; feature branch deleted)

## Why this matters

The top page (`/`) is now the product's events-first centerpiece, and its only pure business logic — which events count as "upcoming", per-city bucketing, and the header's "{N} upcoming events in {M} cities" — lives in a module-private function with zero test coverage.
This exact logic already shipped one production bug: commit `b455cd1` hotfixed a hydration mismatch caused by a stale module-level "today".
Separately, the component imports the entire events JSON into the client bundle, including 13 already-past events (of 89) and per-city `artLon`/`artLat` fields that nothing reads anymore (the hand-drawn art map was removed).
This plan makes the date logic testable and tested, and removes the dead weight from the dataset.

## Current state

Files:

- `components/home-events-map.tsx` (738 lines at `16f120d`) — the `"use client"` top-page map. Contains `getUpcomingCities()` (lines 49-75), local types `CursorCommunityCity`/`CursorCommunityEvent`/`CityWithEvents` (lines 22-39), an unmemoized `selectedCityEvents` derivation (lines 230-232), and a per-row `upcomingCities.find(...)` inside `GuildBoardList` (line 675).
- `lib/data/cursor-community-events.json` — hand-curated dataset: `{ fetchedAt, source, cities: [{name, lat, lon, artLon, artLat}], events: [{id, title, city, date, url, company}] }`. 71 cities, 89 events.

The function to extract — `components/home-events-map.tsx:49-75`:

```ts
function getUpcomingCities(): CityWithEvents[] {
  // Compute per call so a long-lived server module does not keep a stale UTC day
  // and mismatch the client's fresh evaluation during hydration.
  const today = new Date().toISOString().slice(0, 10)
  const eventsByCity = new Map<string, CursorCommunityEvent[]>()

  ;(cursorCommunityEvents.events as CursorCommunityEvent[]).forEach((event) => {
    if (event.date < today) {
      return
    }

    const cityEvents = eventsByCity.get(event.city) ?? []
    cityEvents.push(event)
    eventsByCity.set(event.city, cityEvents)
  })

  eventsByCity.forEach((events) => {
    events.sort((a, b) => a.date.localeCompare(b.date))
  })

  return (cursorCommunityEvents.cities as CursorCommunityCity[])
    .map((city) => ({
      ...city,
      events: eventsByCity.get(city.name) ?? [],
    }))
    .filter((city) => city.events.length >= 1)
}
```

Its call site — `components/home-events-map.tsx:200`:

```ts
  const upcomingCities = useMemo(() => getUpcomingCities(), [])
```

The unmemoized derivation — `components/home-events-map.tsx:230-232`:

```ts
  const selectedCityEvents = selectedCity
    ? (upcomingCities.find((city) => city.name === selectedCity)?.events ?? [])
    : []
```

The `artLon`/`artLat` fields are dead in this dataset: `grep -rn "artLon" components lib --include='*.ts*'` matches only `lib/world-stage-cities.ts` (a different, six-city dataset with its own fields).
The maintainer's strategy notes state the top page needs real coordinates only ("実座標のみ ... artLon/artLat 補正は不要").

Conventions to match:

- Code style: no semicolons, double quotes, 2-space indent (Prettier config in `package.json`).
- Shared domain helpers live in `lib/` with a matching `tests/*.test.ts` vitest file — model the new module on `lib/cursor-events.ts` + `tests/cursor-events.test.ts` (plain exported functions and types, table-of-cases tests).
- The comment above `today` in the excerpt records the `b455cd1` hydration lesson — preserve its meaning in the extracted module.

## Commands you will need

| Purpose   | Command                      | Expected on success |
|-----------|------------------------------|---------------------|
| Typecheck | `corepack pnpm typecheck`    | exit 0              |
| Tests     | `corepack pnpm test`         | all pass            |
| Lint      | `corepack pnpm lint`         | exit 0, no warnings |
| Format    | `corepack pnpm format:check` | exit 0              |
| Build     | `corepack pnpm build`        | exit 0              |

## Scope

**In scope** (the only files you should modify/create):

- `lib/cursor-community-events.ts` (create — the extracted module)
- `tests/cursor-community-events.test.ts` (create)
- `components/home-events-map.tsx` (rewire imports; memoize `selectedCityEvents`)
- `lib/data/cursor-community-events.json` (Step 4 only: remove `artLon`/`artLat` keys and past-dated events)

**Out of scope** (do NOT touch, even though they look related):

- The marker-creation effects and view/rotation logic in `home-events-map.tsx` — plan 016 owns those; touch only the lines this plan names.
- `lib/world-stage-cities.ts` — its own `artLon`/`artLat` may have other consumers; not this plan's concern.
- `lib/cursor-events-fetch.ts`, `scripts/` — plan 014 owns the fetch path.
- Do NOT restore the city-nav block removed in `0adafe4`.

## Git workflow

- Branch: `advisor/015-extract-upcoming-cities`
- Conventional commits in English, e.g. `refactor: extract upcoming-cities logic into lib with tests`.
- Do NOT push or open a PR unless the operator instructed it.

## Steps

### Step 1: Create `lib/cursor-community-events.ts`

Move the types and logic out of the component:

- Export `CursorCommunityCity`, `CursorCommunityEvent`, `CityWithEvents` (same shapes as `components/home-events-map.tsx:22-39`).
- Export `getUpcomingCities(today?: string): CityWithEvents[]` — same body as the excerpt, with `today` defaulting to `new Date().toISOString().slice(0, 10)`. The injectable parameter exists for tests; production callers pass nothing. Keep (adapt) the stale-today comment.
- The module imports the JSON itself (`import cursorCommunityEvents from "@/lib/data/cursor-community-events.json"`), same as the component does today.

**Verify**: `corepack pnpm typecheck` → exit 0.

### Step 2: Rewire the component

In `components/home-events-map.tsx`:

- Delete the local type declarations (lines 22-39) and `getUpcomingCities` (lines 49-75); import them from `@/lib/cursor-community-events`.
- Remove the now-unused `cursorCommunityEvents` JSON import if nothing else in the file references it.
- Wrap `selectedCityEvents` (lines 230-232) in `useMemo` with deps `[selectedCity, upcomingCities]`.

**Verify**: `corepack pnpm typecheck` → exit 0; `corepack pnpm lint` → exit 0 (catches the unused import).

### Step 3: Add `tests/cursor-community-events.test.ts`

Because the module imports the real JSON, test against it with a pinned `today` argument (the dataset's dates are fixed in git). Cases:

1. `getUpcomingCities("2020-01-01")` → every event in the JSON is included; total event count across cities equals the JSON's event count; each city's events are date-ascending.
2. `getUpcomingCities("2099-01-01")` → `[]` (all past ⇒ no cities).
3. Boundary: pick one exact `date` value present in the JSON (read it in the test from the imported JSON, e.g. the max date) and assert an event dated exactly `today` IS included — the `b455cd1` regression class.
4. Cities with zero upcoming events are absent from the result (assert with the `2099` case or a mid-range date).
5. Calling with no argument returns the same shape as calling with the real current UTC date string (assert deep equality against an explicit `new Date().toISOString().slice(0, 10)` call) — documents the default.

Model the file structure on `tests/cursor-events.test.ts`.

**Verify**: `corepack pnpm test` → all pass, including the 5 new cases.

### Step 4: Slim the dataset

In `lib/data/cursor-community-events.json`:

1. Remove the `artLon` and `artLat` keys from every entry in `cities`.
2. Remove every event whose `date` is before today's UTC date (13 events at planning time; recompute at execution time), and remove any city left with zero events referencing it only if no remaining event names it (cities are the pin catalog — keep any city still referenced).

Pre-check before editing: `grep -rn "artLon\|artLat" components lib app --include='*.ts*'` → matches only in `lib/world-stage-cities.ts`. If anything else matches, STOP.

**Verify**: `corepack pnpm typecheck` → exit 0; `corepack pnpm test` → all pass (case 1's count assertion reads the JSON dynamically, so it stays valid); `corepack pnpm build` → exit 0.

## Test plan

Covered by Step 3 — five vitest cases in `tests/cursor-community-events.test.ts` pinning the date-boundary semantics that previously regressed.
No component/DOM tests: the repo has no component-test infrastructure (that posture is owned by plan 003).

## Done criteria

Machine-checkable. ALL must hold:

- [ ] `corepack pnpm typecheck`, `corepack pnpm test`, `corepack pnpm lint`, `corepack pnpm build` all exit 0
- [ ] `grep -n "function getUpcomingCities" components/home-events-map.tsx` → no matches
- [ ] `grep -n "getUpcomingCities" lib/cursor-community-events.ts` → at least 1 match
- [ ] `grep -c "artLon" lib/data/cursor-community-events.json` → 0
- [ ] `tests/cursor-community-events.test.ts` exists with ≥5 cases
- [ ] Only in-scope files modified (`git status`)
- [ ] `plans/README.md` status row updated

## STOP conditions

Stop and report back (do not improvise) if:

- The "Current state" excerpts don't match the live code beyond the documented ~19-line offset from `0adafe4`.
- The Step 4 pre-check grep finds `artLon`/`artLat` consumers outside `lib/world-stage-cities.ts`.
- You are tempted to change how `today` is computed (e.g. locale-local instead of UTC) — that is a product decision; the UTC choice is deliberate and hydration-sensitive.
- Anything requires editing the marker effects (lines 416-462) — that's plan 016's territory.

## Maintenance notes

- Weekly ops rewrites `lib/data/cursor-community-events.json` by hand; after this plan, the file's contract is "no artLon/artLat, past events pruned opportunistically" — the runtime filter still handles dates rolling over between refreshes, so stale entries are cosmetic, not functional.
- If plan 009's spike decides the top page should read Supabase instead of this JSON, `lib/cursor-community-events.ts` is the seam to swap: keep its return shape stable.
- Reviewer focus: the `useMemo` deps for `selectedCityEvents`, and that the extracted function is byte-equivalent in behavior (the tests pin it).
