# Plan 016: Stop rebuilding every top-page event marker on each selection and keystroke

> **Executor instructions**: Follow this plan step by step. Run every
> verification command and confirm the expected result before moving to the
> next step. If anything in the "STOP conditions" section occurs, stop and
> report — do not improvise. When done, update the status row for this plan
> in `plans/README.md` — unless a reviewer dispatched you and told you they
> maintain the index.
>
> **Drift check (run first)**: `git diff --stat f145ca21..HEAD -- components/home-events-map.tsx lib/world-art-map.ts`
> If any in-scope file changed since this plan was refreshed, compare the
> "Current state" excerpts against the live code before proceeding; on a
> mismatch, treat it as a STOP condition.

## Status

- **Priority**: P2
- **Effort**: M
- **Risk**: MED (interaction-heavy code with no automated tests; verify in the browser)
- **Depends on**: 015 DONE, 003 DONE, 019 DONE (soft — 019 already synced URL state into this file; do not regress `?city=` / `?view=`)
- **Category**: perf + tech-debt
- **Planned at**: commit `16f120d`, 2026-07-11
- **Reconciled at**: commit `f145ca21`, 2026-07-13 (excerpts + line numbers refreshed; finding still present)
- **Executed at**: `advisor/016-home-events-marker-diffing` @ `6f747ae9` (2026-07-13) — APPROVED; merged PR #31 → `fc7fd5c0` (browser checklist was unverified beyond HTTP 200 at merge time)

## Why this matters

On the top page, selecting a city or typing one character into the guild-board search tears down and recreates every event marker on the map: each is a DOM subtree (button + span + `<img src="/map-assets/quest-marker.png">` + count label) plus a `maplibregl.Marker` instance.
That is O(all markers) DOM churn for an O(1) state change, and it produces marker flicker on every interaction.
This is the same defect class plan 006 fixes in `components/map-shell.tsx`, but in the new top-page component, which plan 006 does not cover.
A small cleanup rides along: `lib/world-art-map.ts` is an 11-line leftover of the deleted hand-drawn art map that now exports only `GLOBE_CAMERA`, consumed solely by this component — the constant moves next to its sibling `FLAT_CAMERA` and the misleading module dies.

## Current state

Files (verified at `f145ca21`):

- `components/home-events-map.tsx` — the `"use client"` top-page map (778 lines). Plan 015 extracted `getUpcomingCities` / types to `lib/cursor-community-events.ts`. Plan 019 added URL sync via `lib/home-map-url.ts` (`useSearchParams`, `buildHomeMapQuery`, etc.). Do not undo those.
- `lib/world-art-map.ts` (11 lines) — exports only `GLOBE_CAMERA: WorldCamera` (`{ center: [-40, 30], zoom: 1.75, minZoom: 1.2 }`). Verify it has no other consumers: `grep -rn "world-art-map" app components lib --include='*.ts*'` → only `components/home-events-map.tsx:22`.

The rebuild-everything effect — `components/home-events-map.tsx:478-502`:

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

Why it churns: `filteredCities` (lines 190-199) is a new array on every search keystroke, and `selectedCity` is in the deps solely so the `active` flag re-renders — so toggling one marker's highlight rebuilds all of them.

The marker factory — `createEventCityMarker` (lines 42-102). Key details the refactor must preserve:

- `button.className` is `"quest-event-marker is-active"` when active, `"quest-event-marker"` otherwise (lines 53-55); global CSS in the same file at lines 651-658 keys the bounce animation and `scale(1.2)` off these classes.
- `button.style.zIndex` is `"20"` when active, `"1"` otherwise (line 65).
- The count label (`count.textContent = String(city.events.length)`, line 85) must update when search filtering changes a city's visible event count.
- Click handler calls `onSelectCity(city)` (line 99).

The camera constants — `FLAT_CAMERA` lives inline at `components/home-events-map.tsx:34-38`; `GLOBE_CAMERA` is imported at line 22 from `@/lib/world-art-map` and used in `switchView` (around line 263) and map boot (around line 300).

`eventMarkersRef` is declared as `useRef<Marker[]>([])` at line 156.

Conventions to match:

- No semicolons, double quotes, 2-space indent (Prettier config in `package.json`).
- Comments only for constraints the code can't show — this file already does that well (e.g. the bounce/transform-origin comment at line 67); match it.
- UI rules from `AGENTS.md`: pixel aesthetic, no rounded corners, no gradients — you are not changing visuals, so any visual diff is a bug.
- Preserve plan 019 URL behavior: city selection and MAP/GLOBE view stay reflected in `?city=` / `?view=globe`. Diffing markers must not break deep-link hydrate or `router.replace` sync.

## Commands you will need

| Purpose   | Command                      | Expected on success |
|-----------|------------------------------|---------------------|
| Typecheck | `corepack pnpm typecheck`    | exit 0              |
| Tests     | `corepack pnpm test`         | all pass (58+)      |
| Lint      | `corepack pnpm lint`         | exit 0, no warnings |
| Build     | `corepack pnpm build`        | exit 0              |
| Dev       | `corepack pnpm dev`          | serves on localhost (manual verification) |

## Scope

**In scope** (the only files you should modify/delete):

- `components/home-events-map.tsx`
- `lib/world-art-map.ts` (delete in Step 3)

**Out of scope** (do NOT touch, even though they look related):

- `components/map-shell.tsx` — plan 006 owns its marker diffing; shared extraction waits on 006 + 007, not here.
- `lib/home-map-url.ts` and the URL hydrate/`router.replace` effects in this file — plan 019; leave them alone unless a rename of `eventMarkersRef` requires a mechanical type fix (it should not).
- The city-sign markers effect (`components/home-events-map.tsx:456-476`) — `WORLD_STAGE_CITIES` is a static six-entry constant and its effect only depends on `mapReady`; it does not churn. Leave it alone.
- `lib/data/cursor-community-events.json`, `lib/cursor-community-events.ts` (plan 015 — already landed).
- Do NOT restore the city-nav block removed in `0adafe4`.
- Do NOT reintroduce `components/map-libre-world-select.tsx` (deleted by plan 011).

## Git workflow

- Branch: `advisor/016-home-events-marker-diffing`
- Conventional commits in English, e.g. `perf: diff top-page event markers instead of rebuilding them`.
- Do NOT push or open a PR unless the operator instructed it.

## Steps

### Step 1: Split marker membership from active-state styling

Restructure so that:

1. A ref holds a `Map` keyed by city name (replace the `eventMarkersRef: Marker[]` at line 156).
2. One effect depends on `[filteredCities, mapReady, selectCity]` and diffs membership: remove markers for cities no longer in `filteredCities`, add markers for new ones, and update the existing marker's count label when `city.events.length` changed (set `textContent` on the count element — keep a reference alongside the Marker in the map value; no `querySelector`).
3. A second, cheap effect depends on `[selectedCity, mapReady]` and only toggles `is-active` on the affected elements: `classList.toggle("is-active", cityName === selectedCity)` plus the zIndex swap (`"20"`/`"1"`), touching at most two markers (previous and next selection).
4. Store per-city refs as a small record, e.g. `{ marker: Marker, root: HTMLButtonElement, count: HTMLSpanElement }`, so no `querySelector` is needed.
5. Unmount cleanup still removes all markers (keep parity with the current cleanup; the map-init effect's teardown at lines 438-453 also clears `eventMarkersRef` — update that reference to the new Map shape).

`createEventCityMarker` may be refactored to return `{ root, count }` instead of a bare element; keep its DOM output byte-identical.

**Verify**: `corepack pnpm typecheck` → exit 0; `corepack pnpm lint` → exit 0.

### Step 2: Manual browser verification

Run `corepack pnpm dev` and on `http://localhost:3000`:

1. Markers render with correct counts on load.
2. Click a marker → it scales up and bounces (is-active), the previously active one (if any) reverts; NO other marker flickers (watch the DOM in devtools: existing marker elements must not be replaced — check element identity via `$0` retention or the Elements panel not collapsing).
3. Type in the search box → markers for filtered-out cities disappear, remaining markers keep their DOM identity; counts update where a city's event subset shrank.
4. Clear the search → all markers return.
5. Toggle MAP/GLOBE → markers survive the projection switch; URL keeps/drops `?view=globe` correctly.
6. Deep link: open `/?city=San%20Francisco` → SF selected and active marker highlighted without a full marker flicker storm after hydrate.
7. Unmount check: navigate to a city page (wooden sign) and back — no console errors.

**Verify**: all seven checks pass; `corepack pnpm test` still green.

### Step 3: Inline GLOBE_CAMERA and delete lib/world-art-map.ts

Pre-check: `grep -rn "world-art-map" app components lib scripts tests --include='*.ts*'` → only `components/home-events-map.tsx`. If anything else matches, skip this step and report.

Move the `GLOBE_CAMERA` constant (and the `WorldCamera` type if needed — or type it structurally like `FLAT_CAMERA`, which uses a plain object literal with `as [number, number]`) into `components/home-events-map.tsx` next to `FLAT_CAMERA` (lines 34-38). Delete `lib/world-art-map.ts`.

**Verify**: `corepack pnpm typecheck` → exit 0; `corepack pnpm build` → exit 0; `ls lib/world-art-map.ts` → No such file.

## Test plan

No automated component tests exist for map components (repo-wide posture owned by plan 003); the regression net is `typecheck` + `lint` + `build` plus the Step 2 manual checklist.
Plan 015's `tests/cursor-community-events.test.ts` pins the data derivations this component consumes — run `corepack pnpm test` to confirm no collateral damage.
Plan 019's `lib/home-map-url` helpers (if tested) must stay green; do not change their contracts.

## Done criteria

Machine-checkable where possible. ALL must hold:

- [ ] `corepack pnpm typecheck`, `corepack pnpm test`, `corepack pnpm lint`, `corepack pnpm build` all exit 0
- [ ] `grep -n "world-art-map" -r app components lib` → no matches; `lib/world-art-map.ts` deleted
- [ ] The marker effect no longer lists `selectedCity` in the same deps array that creates markers (`grep -n "filteredCities, mapReady, selectCity, selectedCity" components/home-events-map.tsx` → no matches)
- [ ] Step 2 manual checklist executed and recorded (paste the seven pass/fail lines in the status update)
- [ ] Only in-scope files modified (`git status`)
- [ ] `plans/README.md` status row updated

## STOP conditions

Stop and report back (do not improvise) if:

- The excerpts don't match the live code (beyond whitespace) at `f145ca21` or later HEAD after this refresh.
- Step 2's flicker check fails twice after a fix attempt — report what still rebuilds.
- Preserving the count-label update forces `createEventCityMarker` into a signature that `map-shell.tsx` or another file would need to import — shared extraction is out of scope here.
- The Step 3 pre-check finds another `world-art-map` consumer.
- URL deep-link checks (Step 2 items 5-6) fail after the marker refactor — report rather than rewriting plan 019's URL effects.

## Maintenance notes

- This intentionally duplicates the diffing idea of plan 006 (map-shell) rather than sharing code: the two components' marker payloads differ (quest count label vs. company logos). Plan 011 deleted `map-libre-world-select.tsx`; revisit a shared marker module only after 006 + 007 land if duplication still hurts.
- If marker counts ever grow past ~hundreds of cities, revisit the previously rejected canvas/symbol-layer approach (see plans/README "considered and rejected").
- Reviewer focus: teardown paths (map-init cleanup vs. the membership effect's cleanup) — a missed `marker.remove()` leaks DOM nodes across remounts; also that `?city=` hydrate still highlights exactly one marker.
