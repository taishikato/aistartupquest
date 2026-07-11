# Plan 019: Make the top-page events map shareable — sync city selection and view to the URL

> **Executor instructions**: Follow this plan step by step. Run every
> verification command and confirm the expected result before moving to the
> next step. If anything in the "STOP conditions" section occurs, stop and
> report — do not improvise. When done, update the status row for this plan
> in `plans/README.md`.
>
> **Drift check (run first)**: `git diff --stat d1a8440..HEAD -- components/home-events-map.tsx app/page.tsx`
> Expected drift: plans 015 (extracts `getUpcomingCities` and types to
> `lib/cursor-community-events.ts`), 016 (rewrites the event-marker effects),
> and 017 (touches only `app/page.tsx` metadata) may have landed — those are
> not a STOP. On any other content mismatch with the excerpts below, STOP.

## Status

- **Priority**: P2
- **Effort**: M
- **Risk**: MED (hydration-sensitive URL state on the flagship page; needs manual browser verification)
- **Depends on**: 015 and 016 (soft — same file; run those first if still TODO to avoid conflicting diffs)
- **Category**: direction (shareability / listing loop)
- **Planned at**: commit `d1a8440`, 2026-07-11

## Why this matters

The top page is the product's flagship: a world map of AI community events, positioned as the thing people share.
But its selection state lives only in `useState` — a visitor who opens San Francisco's quest board and copies the URL shares a bare `/` that forgets everything.
The six city pages already solved exactly this problem: `components/city-map.tsx` serializes selection to query params (`?c=`, `?m=`, `?mode=`) with `history.replaceState` and rehydrates from `useSearchParams`.
This plan ports that working pattern to the top page so "SF, this week's events" is a link.

## Current state

Files (line numbers at `d1a8440`):

- `components/home-events-map.tsx` — the `"use client"` top-page map.
  - State, lines 194-198:

```ts
  const [mapReady, setMapReady] = useState<MapLibreMap | null>(null)
  const [view, setView] = useState<WorldView>("mercator")
  const [query, setQuery] = useState("")
  const [selectedCity, setSelectedCity] = useState<string | null>(null)
  const [boardOpen, setBoardOpen] = useState(false)
```

  - `upcomingCities` (line 200) is the list of cities that have upcoming events; each has `name`, `lat`, `lon`, `events`. City names are display strings with spaces (e.g. "San Francisco").
  - `selectCity` callback, lines 268-276 — sets state and flies the camera:

```ts
  const selectCity = useCallback((city: CursorCommunityCity) => {
    setSelectedCity(city.name)
    setBoardOpen(true)
    mapRef.current?.flyTo({
      center: [city.lon, city.lat],
      zoom: viewRef.current === "globe" ? 2.7 : 3,
      duration: 900,
    })
  }, [])
```

  - `switchView` (lines 278-304) toggles `"mercator"`/`"globe"` projections; `viewRef` mirrors `view` for use inside map callbacks.
  - The component has NO `useSearchParams`/`usePathname` usage today (`grep -n "useSearchParams" components/home-events-map.tsx` → no matches).

- `app/page.tsx` (13 lines) — renders `<HomeEventsMap />` with NO `Suspense` wrapper:

```ts
export default function Page() {
  return <HomeEventsMap />
}
```

- The reference implementation — `components/city-map.tsx`:
  - Read state: `useSearchParams` + `useMemo` derivations (lines 33-78; e.g. `searchParams.get("c")` resolved against known slugs with a fallback).
  - Write state: `syncSelectionToUrl` (lines 255-298) builds `URLSearchParams` from the current params, mutates only its own keys, no-ops when unchanged, and calls `window.history.replaceState(null, "", nextUrl)` — never `router.push` (no history spam, no server round-trip).
  - The city pages wrap `CityMap` in `<Suspense fallback={null}>` (`app/sf/page.tsx:18-20`) because `useSearchParams` in a client component requires a Suspense boundary on an otherwise-static route.

Conventions to match:

- No semicolons, double quotes, 2-space indent.
- Match `city-map.tsx`'s URL philosophy exactly: `replaceState` (not push), delete params at their default value so the bare `/` stays canonical, tolerate unknown/invalid param values by falling back to defaults silently.

## Commands you will need

| Purpose   | Command                      | Expected on success |
|-----------|------------------------------|---------------------|
| Typecheck | `corepack pnpm typecheck`    | exit 0              |
| Tests     | `corepack pnpm test`         | all pass            |
| Lint      | `corepack pnpm lint`         | exit 0, no warnings |
| Build     | `corepack pnpm build`        | exit 0 (catches the missing-Suspense error) |
| Dev       | `corepack pnpm dev`          | serves on localhost (manual verification) |

## Scope

**In scope** (the only files you should modify):

- `components/home-events-map.tsx`
- `app/page.tsx` (Suspense wrapper only)

**Out of scope** (do NOT touch, even though they look related):

- `components/city-map.tsx` — the reference; read it, never edit it.
- The search `query` and `boardOpen` state — deliberately NOT URL-synced (transient UI, and a shared URL should not open half-typed searches). Do not add params for them.
- Marker creation/diffing effects — plan 016's territory; this plan only adds URL read/write around the existing `selectCity`/`switchView` entry points.
- `lib/data/cursor-community-events.json`, metadata blocks in `app/page.tsx` (plan 017 owns those lines — touch only the JSX return).

## Git workflow

- Branch: `advisor/019-home-map-deep-links`
- Conventional commits in English, e.g. `feat: sync top-page city selection and view to the URL`.
- Do NOT push or open a PR unless the operator instructed it.

## Steps

### Step 1: Wrap the top page in Suspense

In `app/page.tsx`, wrap the component: `<Suspense fallback={null}><HomeEventsMap /></Suspense>` (import `Suspense` from `"react"`), mirroring `app/sf/page.tsx:18-20`. Without this, `corepack pnpm build` fails once `useSearchParams` lands in the component.

**Verify**: `corepack pnpm typecheck` → exit 0.

### Step 2: Read URL state on mount

In `components/home-events-map.tsx`:

1. Import `usePathname, useSearchParams` from `"next/navigation"`.
2. Param scheme: `?city=<city name>` (URLSearchParams handles space encoding; matched case-sensitively against `upcomingCities[].name`) and `?view=globe` (absent = `"mercator"`, the default).
3. Initialize state from the URL: derive the initial `view` from `searchParams.get("view") === "globe" ? "globe" : "mercator"` (lazy `useState` initializer is fine — the param is read once; later changes flow through `switchView`). For the city: resolve `searchParams.get("city")` against `upcomingCities` in an effect that runs when `mapReady` becomes non-null, and if it matches, call `selectCity(matchedCity)` so the camera flies there and the board opens. An unknown or absent `city` value falls back to no selection, silently.
4. Because the map initializes with `FLAT_CAMERA`/mercator regardless, when the initial view is `"globe"` call the existing `switchView("globe")` from that same `mapReady` effect BEFORE the `selectCity` flyTo (order matters: projection switch runs `easeTo`; let `selectCity`'s `flyTo` be the last camera command). If both a globe view and a city are requested, the fly-to zoom must use the globe zoom — `selectCity` already reads `viewRef.current`, and `switchView` sets `viewRef.current` synchronously, so calling `switchView` first is sufficient.

**Verify**: `corepack pnpm typecheck` → exit 0; manual check in Step 4.

### Step 3: Write URL state on change

Port the `syncSelectionToUrl` pattern from `city-map.tsx:255-298`:

- A `useCallback` + effect that builds `new URLSearchParams(searchParams.toString())`, then: `selectedCity` set → `params.set("city", selectedCity)`, else `params.delete("city")`; `view === "globe"` → `params.set("view", "globe")`, else `params.delete("view")`.
- No-op when the serialized query is unchanged; otherwise `window.history.replaceState(null, "", nextQuery ? `${pathname}?${nextQuery}` : pathname)`.
- Do not carry over the hash handling from city-map unless the page uses hashes (it does not — omit it).

**Verify**: `corepack pnpm lint` → exit 0; `corepack pnpm build` → exit 0.

### Step 4: Manual browser verification

`corepack pnpm dev`, then:

1. Load `/` → URL stays bare `/` (no params at defaults).
2. Click a city marker → URL becomes `/?city=<name>` (encoded); panel opens.
3. Toggle GLOBE → `/?city=<name>&view=globe`; toggle MAP → `view` param disappears.
4. Copy `/?city=San%20Francisco&view=globe` into a fresh tab → globe projection, camera on SF, SF panel open, guild board shows SF highlighted.
5. `/?city=Nowhereville` → loads normally with no selection, no console errors.
6. Close the selected-city panel (X) → `city` param disappears.
7. Browser Back after several selections does NOT step through each selection (replaceState, not push).
8. No hydration warnings in the console on any of the above loads.

**Verify**: all eight checks pass; `corepack pnpm test` still green.

## Test plan

No component-test infrastructure exists (plan 003 owns that posture); the net is `typecheck`/`lint`/`build` plus the Step 4 checklist.
If plan 015 landed, run `corepack pnpm test` to confirm the extracted data helpers still pass — this plan must not touch them.

## Done criteria

Machine-checkable where possible. ALL must hold:

- [ ] `corepack pnpm typecheck`, `corepack pnpm test`, `corepack pnpm lint`, `corepack pnpm build` all exit 0
- [ ] `grep -c "useSearchParams" components/home-events-map.tsx` → ≥1; `grep -c "replaceState" components/home-events-map.tsx` → ≥1
- [ ] `grep -c "Suspense" app/page.tsx` → ≥1
- [ ] `grep -n "router.push" components/home-events-map.tsx` → no matches
- [ ] Step 4 checklist executed and recorded (paste the eight pass/fail lines in the status update)
- [ ] No files outside the in-scope list modified (`git status`)
- [ ] `plans/README.md` status row updated

## STOP conditions

Stop and report back (do not improvise) if:

- The excerpts don't match the live code beyond the documented drift from plans 015/016/017.
- Hydration warnings appear that you cannot eliminate by moving URL reads into effects/lazy initializers — report the exact warning.
- You find yourself wanting to URL-sync `query` or `boardOpen` — explicitly out of scope.
- The initial globe + city combination produces a broken camera (e.g. flyTo fighting easeTo) that reordering per Step 2.4 does not fix after two attempts.

## Maintenance notes

- Plan 018's company pages and any future "share this city" affordance should generate links in this scheme (`/?city=<name>` / `/?city=<name>&view=globe`); keep param names stable once shipped — shared links live forever.
- If the follow/digest feature (strategy Phase 2) lands, `?city=` is the natural follow-granularity hook.
- If a future plan switches city identity from display names to slugs/IDs in the events dataset, the `city` param must keep accepting old name-based URLs (redirect or alias) — note this in that migration.
- Reviewer focus: the no-op guard in the URL-sync effect (missing it causes replaceState loops), and that defaults produce a bare `/`.
