# Plan 007: Decompose the 1383-line map-shell.tsx into focused modules

> **Executor instructions**: Follow this plan step by step. Run every
> verification command and confirm the expected result before moving to the
> next step. If anything in the "STOP conditions" section occurs, stop and
> report — do not improvise. When done, update the status row for this plan
> in `plans/README.md`.
>
> **Drift check (run first)**: `git diff --stat ba0778c..HEAD -- components/map-shell.tsx`
> This plan EXPECTS drift from plan 006 (marker diffing) — read 006's diff
> first if it landed. Any OTHER drift: compare excerpts before proceeding.

## Status

- **Priority**: P3
- **Effort**: L
- **Risk**: HIGH
- **Depends on**: plans/003-verification-baseline.md (CI gate), plans/006-map-marker-diffing.md (land first so its logic moves wholesale)
- **Category**: tech-debt
- **Planned at**: commit `ba0778c`, 2026-07-06

## Why this matters

`components/map-shell.tsx` is 1383 lines — twice the size of the next-largest file — and mixes five concerns: map bootstrapping, "Minecraft" style painting, three marker sprite factories, marker lifecycle effects, and camera/selection choreography.
It is also the highest-churn file in the repo (recent history: quest-UI polish, review fixes, city layers all touched it).
Every change forces a contributor (or agent) to load 1400 lines of context, and unrelated concerns break each other — the audit found its bugs precisely in the seams between these concerns.
This is a **move-only refactor**: no behavior change, no signature redesign beyond what extraction requires.

## Current state

`components/map-shell.tsx` structure at `ba0778c` (line numbers shift after plan 006 — use the section anchors, not raw numbers):

- Lines ~90-100: `setPaintPropertyIfLayerExists(map, layerId, prop, value)` helper — NOTE: a near-identical copy exists in `lib/world-atlas-style.ts` (~line 18). Consolidating these two is part of this plan.
- Lines ~103-332: Minecraft/RPG terrain style painting — a long series of `setPaintPropertyIfLayerExists` calls (`applyMinecraftStyle`-like logic; read the actual function names in the file).
- Lines ~353-720: sprite factories — `createFloatingMarkerFrame`, `createMarkerSprite`, `createBossSpriteMarker`, `createMeetupSignboardMarker` and their helpers. Pure DOM-building functions of `(item, active, dense)`.
- Lines ~915-1000: refs + map initialization effect (creates the `maplibregl.Map`, sets camera constants `MAP_PITCH`, `MAP_BEARING`).
- Lines ~1005-1153: Effect A — marker set rebuild per mode/list, with bounds-refit signature logic.
- Lines ~1155-1191: Effect B — selection restyle (diffed by slug after plan 006).
- Lines ~1193-end: camera-on-selection effect and the JSX render.

Conventions: components in `components/`, shared non-component logic in `lib/`; path alias `@/`; no semicolons, double quotes; types for shared entities in `lib/company.ts` / `lib/meetup.ts`.

## Commands you will need

| Purpose   | Command          | Expected on success |
|-----------|------------------|---------------------|
| Typecheck | `pnpm typecheck` | exit 0              |
| Lint      | `pnpm lint --max-warnings 0` | exit 0 |
| Tests     | `pnpm test`      | all pass            |
| Build     | `pnpm build`     | exit 0 (needs `.env.local`) |
| Dev       | `pnpm dev`       | manual verification |

## Scope

**In scope**:
- `components/map-shell.tsx` (shrinks to a coordinator)
- `lib/map-paint.ts` (create — `setPaintPropertyIfLayerExists` + the terrain painting functions)
- `components/map-markers/sprites.ts` (create — the sprite factories; pure DOM, no React)
- `components/map-markers/use-map-markers.ts` (create — Effects A+B and `markersRef`)
- `lib/world-atlas-style.ts` (switch its local helper copy to import from `lib/map-paint.ts`)

**Out of scope** (do NOT touch):
- Any behavior, styling, or animation change — this is move-only.
- `components/city-map.tsx`, `components/events-world-map.tsx` — even where they duplicate patterns; consolidation across components is a later decision.
- Renaming exported props of `MapShell` — its consumers must not change (`grep -rn "MapShell" app components` first to know them).

## Git workflow

- Branch: `advisor/007-decompose-map-shell`
- One commit per extraction step (each leaves the app working); conventional commits in English (e.g. `refactor: extract map paint helpers to lib/map-paint.ts`).
- Do NOT push or open a PR unless the operator instructed it.

## Steps

Each step is: move code verbatim → fix imports → verify. Never edit logic while moving it.

### Step 1: Extract paint helpers

Create `lib/map-paint.ts` with `setPaintPropertyIfLayerExists` and the terrain-painting functions from lines ~90-332.
Import them back into `map-shell.tsx`.
Then replace the duplicate helper in `lib/world-atlas-style.ts` with an import from `lib/map-paint.ts`.

**Verify**: `pnpm typecheck` → exit 0; `grep -rn "function setPaintPropertyIfLayerExists" components lib` → exactly ONE definition, in `lib/map-paint.ts`.

### Step 2: Extract sprite factories

Create `components/map-markers/sprites.ts` with the factories from lines ~353-720 and their private helpers/constants (float timing, palette constants — move everything they reference; typecheck will tell you what).
They must stay pure functions with the same signatures.

**Verify**: `pnpm typecheck` → exit 0; `pnpm build` → exit 0.

### Step 3: Extract the marker lifecycle hook

Create `components/map-markers/use-map-markers.ts` exporting `useMapMarkers(...)`, containing `markersRef`, `prevActiveSlugRef` (from plan 006), Effect A, Effect B, and the bounds-refit signature refs.
Its parameters are exactly the values those effects consume today (map instance, mode, companies, spreadMeetups, dense flags, selected items, select callbacks, and the skip-refit refs — enumerate from the two dependency arrays).
If the ref plumbing (e.g. `selectedSlugRef`, `skipNextBoundsRefitRef`) is shared with the camera effect that stays in map-shell, pass refs in as parameters rather than duplicating them — refs are stable, this is safe.

**Verify**: `pnpm typecheck` → exit 0; `pnpm lint --max-warnings 0` → exit 0 (the hook must not introduce exhaustive-deps warnings — keep dependency arrays exactly as they were).

### Step 4: Manual regression pass

Run `pnpm dev` and execute the same 4-scenario checklist as plan 006 Step 3 (select via map click, mode switch, filter, sidebar select), plus:

5. Initial load shows the whole SF map with markers visible (Layout Rule: no jump to a single startup).
6. Terrain styling (grass/water/roads colors) is unchanged.

**Verify**: 6/6 scenarios identical to the pre-refactor branch; report results.

### Step 5: Size check

**Verify**: `wc -l components/map-shell.tsx` → under ~500 lines; `wc -l lib/map-paint.ts components/map-markers/sprites.ts components/map-markers/use-map-markers.ts` → the moved bulk lives there.

## Test plan

No new automated tests (maplibre-gl needs WebGL; see plan 006's note).
The gates: typecheck, lint with zero warnings, build, existing suite, and the 6-scenario manual checklist with results recorded in the report.

## Done criteria

Machine-checkable where possible. ALL must hold:

- [ ] `wc -l components/map-shell.tsx` < 500
- [ ] Exactly one `setPaintPropertyIfLayerExists` definition repo-wide
- [ ] `pnpm typecheck`, `pnpm lint --max-warnings 0`, `pnpm test`, `pnpm build` all exit 0
- [ ] Manual checklist 6/6 reported
- [ ] `git status` shows only in-scope files changed
- [ ] `plans/README.md` status row updated

## STOP conditions

Stop and report back (do not improvise) if:

- Plan 006 has NOT landed — stop; doing both at once makes the diff unreviewable.
- An extraction forces a logic change (not just imports/parameters) to compile — that seam was mislabeled; report where.
- Any manual scenario differs visually from the pre-refactor build.
- `MapShell`'s external props would need to change.

## Maintenance notes

- After this, new marker types go in `components/map-markers/sprites.ts`, new terrain themes in `lib/map-paint.ts`, and map-shell stays a coordinator — reviewers should reject future PRs that grow map-shell past ~500 lines again.
- Deferred deliberately: consolidating the map-setup duplication across `city-map.tsx` / `events-world-map.tsx` / `world-globe-select.tsx`; direction plan 011 decides which of those even survive.
