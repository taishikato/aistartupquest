# Plan 016: Stop rebuilding every top-page event marker on each selection and keystroke

> **Executor instructions**: Follow this plan step by step. Run every
> verification command and confirm the expected result before moving to the
> next step. If anything in the "STOP conditions" section occurs, stop and
> report — do not improvise. When done, update the status row for this plan
> in `plans/README.md`.
>
> **Drift check (run first)**: `git diff --stat 16f120d..HEAD -- components/home-events-map.tsx lib/world-art-map.ts`
> Expected drift: commit `0adafe4` (landed during planning) removed a compact
> city-nav block and an unused `Link` import; line numbers below are from
> `16f120d`, so JSX after line ~518 sits ~19 lines lower post-`0adafe4`.
> If plan 015 has landed, the types/`getUpcomingCities` lines have also moved
> to `lib/cursor-community-events.ts`. Both are expected drift, not a STOP.
> On any other content mismatch, STOP.

## Status

- **Priority**: P2
- **Effort**: M
- **Risk**: MED (interaction-heavy code with no automated tests; verify in the browser)
- **Depends on**: 015 (soft — same file; run 015 first to avoid conflicting diffs), 003 (soft — the CI gate is the only regression net)
- **Category**: perf + tech-debt
- **Planned at**: commit `16f120d`, 2026-07-11

## Why this matters

On the top page, selecting a city or typing one character into the guild-board search tears down and recreates every event marker on the map: each is a DOM subtree (button + span + `<img src="/map-assets/quest-marker.png">` + count label) plus a `maplibregl.Marker` instance.
That is O(all markers) DOM churn for an O(1) state change, and it produces marker flicker on every interaction.
This is the same defect class plan 006 fixes in `components/map-shell.tsx`, but in the new top-page component, which plan 006 does not cover.
A small cleanup rides along: `lib/world-art-map.ts` is an 11-line leftover of the deleted hand-drawn art map that now exports only `GLOBE_CAMERA`, consumed solely by this component — the constant moves next to its sibling `FLAT_CAMERA` and the misleading module dies.

## Current state

Files:

- `components/home-events-map.tsx` — the `"use client"` top-page map. All line numbers below are from commit `16f120d`.
- `lib/world-art-map.ts` (11 lines) — exports only `GLOBE_CAMERA: WorldCamera` (`{ center: [-40, 30], zoom: 1.75, minZoom: 1.2 }`). Verify it has no other consumers: `grep -rn "world-art-map" app components lib --include='*.ts*'` → only `components/home-events-map.tsx:10`.

The rebuild-everything effect — `components/home-events-map.tsx:438-462`:

```ts
  useEffect(() => {
    if (!mapReady) {
      return
    }

    eventMarkersRef.current.forEach((marker) => marker.remove())
    eventMarkersRef.current = filteredCities.map((city) =>
      new maplibregl.Marker({
        element: createEventCityMarker({
          city,
          active: city.name === selectedCity,
          onSelectCity: selectCity,
        }),
        anchor: "bottom",
        opacityWhenCovered: "0",
      })
        .setLngLat([city.lon, city.lat])
        .addTo(mapReady)
    )

    return () => {
      eventMarkersRef.current.forEach((marker) => marker.remove())
      eventMarkersRef.current = []
    }
  }, [filteredCities, mapReady, selectCity, selectedCity])
```

Why it churns: `filteredCities` (lines 219-228) is a new array on every search keystroke, and `selectedCity` is in the deps solely so the `active` flag re-renders — so toggling one marker's highlight rebuilds all of them.

The marker factory — `createEventCityMarker` (lines 77-137). Key details the refactor must preserve:

- `button.className` is `"quest-event-marker is-active"` when active, `"quest-event-marker"` otherwise (lines 88-90); global CSS at lines 600-619 keys the bounce animation and `scale(1.2)` off these classes.
- `button.style.zIndex` is `"20"` when active, `"1"` otherwise (line 100).
- The count label (`count.textContent = String(city.events.length)`, line 120) must update when search filtering changes a city's visible event count.
- Click handler calls `onSelectCity(city)` (line 134).

The camera constants — `FLAT_CAMERA` lives inline at `components/home-events-map.tsx:41-45`; `GLOBE_CAMERA` is imported at line 10 from `@/lib/world-art-map` and used in `switchView` (line 287).

Conventions to match:

- No semicolons, double quotes, 2-space indent (Prettier config in `package.json`).
- Comments only for constraints the code can't show — this file already does that well (e.g. the transform-origin comment at line 102); match it.
- UI rules from `AGENTS.md`: pixel aesthetic, no rounded corners, no gradients — you are not changing visuals, so any visual diff is a bug.

## Commands you will need

| Purpose   | Command                      | Expected on success |
|-----------|------------------------------|---------------------|
| Typecheck | `corepack pnpm typecheck`    | exit 0              |
| Tests     | `corepack pnpm test`         | all pass            |
| Lint      | `corepack pnpm lint`         | exit 0, no warnings |
| Build     | `corepack pnpm build`        | exit 0              |
| Dev       | `corepack pnpm dev`          | serves on localhost (manual verification) |

## Scope

**In scope** (the only files you should modify/delete):

- `components/home-events-map.tsx`
- `lib/world-art-map.ts` (delete in Step 3)

**Out of scope** (do NOT touch, even though they look related):

- `components/map-shell.tsx` — plan 006 owns its marker diffing; the two implementations converge later via plan 007/011 decisions, not here.
- `components/map-libre-world-select.tsx` — shares a similar city-sign marker factory; its fate is plan 011's call. Do not extract a shared module yet.
- The city-sign markers effect (`components/home-events-map.tsx:416-436`) — `WORLD_STAGE_CITIES` is a static six-entry constant and its effect only depends on `mapReady`; it does not churn. Leave it alone.
- `lib/data/cursor-community-events.json`, `lib/cursor-community-events.ts` (if plan 015 landed).
- Do NOT restore the city-nav block removed in `0adafe4`.

## Git workflow

- Branch: `advisor/016-home-events-marker-diffing`
- Conventional commits in English, e.g. `perf: diff top-page event markers instead of rebuilding them`.
- Do NOT push or open a PR unless the operator instructed it.

## Steps

### Step 1: Split marker membership from active-state styling

Restructure so that:

1. A ref holds `Map<string, Marker>` keyed by city name (replace the `eventMarkersRef: Marker[]`).
2. One effect depends on `[filteredCities, mapReady, selectCity]` and diffs membership: remove markers for cities no longer in `filteredCities`, add markers for new ones, and update the existing marker's count label when `city.events.length` changed (set `textContent` on the count element — give it a stable class or data attribute so it can be found, or keep a reference alongside the Marker in the map value).
3. A second, cheap effect depends on `[selectedCity, mapReady]` and only toggles `is-active` on the affected elements: `classList.toggle("is-active", cityName === selectedCity)` plus the zIndex swap (`"20"`/`"1"`), touching at most two markers (previous and next selection).
4. Store per-city refs as a small record, e.g. `{ marker: Marker, root: HTMLButtonElement, count: HTMLSpanElement }`, so no `querySelector` is needed.
5. Unmount cleanup still removes all markers (keep parity with the current cleanup; the map-init effect's teardown at lines 398-413 also clears `eventMarkersRef` — update that reference to the new Map shape).

`createEventCityMarker` may be refactored to return `{ root, count }` instead of a bare element; keep its DOM output byte-identical.

**Verify**: `corepack pnpm typecheck` → exit 0; `corepack pnpm lint` → exit 0.

### Step 2: Manual browser verification

Run `corepack pnpm dev` and on `http://localhost:3000`:

1. Markers render with correct counts on load.
2. Click a marker → it scales up and bounces (is-active), the previously active one (if any) reverts; NO other marker flickers (watch the DOM in devtools: existing marker elements must not be replaced — check element identity via `$0` retention or the Elements panel not collapsing).
3. Type in the search box → markers for filtered-out cities disappear, remaining markers keep their DOM identity; counts update where a city's event subset shrank.
4. Clear the search → all markers return.
5. Toggle MAP/GLOBE → markers survive the projection switch.
6. Unmount check: navigate to a city page (wooden sign) and back — no console errors.

**Verify**: all six checks pass; `corepack pnpm test` still green.

### Step 3: Inline GLOBE_CAMERA and delete lib/world-art-map.ts

Pre-check: `grep -rn "world-art-map" app components lib scripts tests --include='*.ts*'` → only `components/home-events-map.tsx`. If anything else matches, skip this step and report.

Move the `GLOBE_CAMERA` constant (and the `WorldCamera` type if needed — or type it structurally like `FLAT_CAMERA`, which uses a plain object literal with `as [number, number]`) into `components/home-events-map.tsx` next to `FLAT_CAMERA` (line 41). Delete `lib/world-art-map.ts`.

**Verify**: `corepack pnpm typecheck` → exit 0; `corepack pnpm build` → exit 0; `ls lib/world-art-map.ts` → No such file.

## Test plan

No automated component tests exist for map components (repo-wide posture owned by plan 003); the regression net is `typecheck` + `lint` + `build` plus the Step 2 manual checklist.
If plan 015 landed first, its `tests/cursor-community-events.test.ts` continues to pin the data derivations this component consumes — run `corepack pnpm test` to confirm no collateral damage.

## Done criteria

Machine-checkable where possible. ALL must hold:

- [ ] `corepack pnpm typecheck`, `corepack pnpm test`, `corepack pnpm lint`, `corepack pnpm build` all exit 0
- [ ] `grep -n "world-art-map" -r app components lib` → no matches; `lib/world-art-map.ts` deleted
- [ ] The marker effect no longer lists `selectedCity` in the same deps array that creates markers (`grep -n "filteredCities, mapReady, selectCity, selectedCity" components/home-events-map.tsx` → no matches)
- [ ] Step 2 manual checklist executed and recorded (paste the six pass/fail lines in the status update)
- [ ] Only in-scope files modified (`git status`)
- [ ] `plans/README.md` status row updated

## STOP conditions

Stop and report back (do not improvise) if:

- The excerpts don't match the live code beyond the two documented drifts (`0adafe4`'s city-nav removal; plan 015's extraction).
- Step 2's flicker check fails twice after a fix attempt — report what still rebuilds.
- Preserving the count-label update forces `createEventCityMarker` into a signature that `map-shell.tsx` or another file would need to import — shared extraction is out of scope here.
- The Step 3 pre-check finds another `world-art-map` consumer.

## Maintenance notes

- This intentionally duplicates the diffing idea of plan 006 (map-shell) rather than sharing code: the two components' marker payloads differ (quest count label vs. company logos), and plan 011's decision on `map-libre-world-select.tsx` determines whether a shared marker/bootstrap module is worth building. Revisit extraction only after 006 + 011 land.
- If marker counts ever grow past ~hundreds of cities, revisit the previously rejected canvas/symbol-layer approach (see plans/README "considered and rejected").
- Reviewer focus: teardown paths (map-init cleanup vs. the membership effect's cleanup) — a missed `marker.remove()` leaks DOM nodes across remounts.
