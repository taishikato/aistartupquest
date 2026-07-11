# World map consolidation: `/map-libre` verdict

> Design spike for plan 011.
> Scope narrowed on 2026-07-11 (commit `ab0a47e`): the maintainer already deleted `world-globe-select.tsx`, `world-map-select.tsx`, and `events-world-map.tsx`, and settled the `/events` exposure question by permanent-redirecting `/events` to `/`.
> What remains is a single artifact: the `/map-libre` comparison page and its `MapLibreWorldSelect` component.
> Verified against commit `13a807b` (HEAD at spike time; no in-scope file changed since `ab0a47e`, confirmed by `git diff --stat ab0a47e..HEAD -- app/map-libre app/page.tsx app/events components/map-libre-world-select.tsx components/home-events-map.tsx` returning empty).

## 1. Inventory

| Artifact | Role | Lines | Status |
|---|---|---|---|
| `components/home-events-map.tsx` | Live top page (`/`), events-first world atlas: sidebar guild board, map/globe toggle, quest markers | 738 | Production |
| `app/map-libre/page.tsx` + `components/map-libre-world-select.tsx` | Standalone city-selector comparison page, unlinked from navigation | 13 + 245 | Experiment, unresolved until this doc |
| `components/map-shell.tsx` | Per-city map (used by `/sf`, `/toronto`, etc.) | 1383 | Production; consolidation target of plans 006/007 |
| `components/city-map.tsx` | Per-city map support component | 510 | Production; consolidation target of plans 006/007 |

Deleted components (`world-globe-select.tsx`, `world-map-select.tsx`, `events-world-map.tsx`, `space-backdrop.tsx`) are not re-listed here; they are out of scope and must not be resurrected.

## 2. Decision: `/map-libre` + `MapLibreWorldSelect`

**Verdict: DELETE.**

Justification:

- `app/map-libre/page.tsx`'s own metadata describes it as a comparison page ("Compare the RPG world map with a MapLibre-powered world map city selector").
- It is reachable only by typing the URL directly.
`rg -n '"/map-libre"' app components` matches only the page itself; no navigation, header, or footer links to it.
- The comparison it exists for is concluded.
The maintainer already picked and shipped `home-events-map.tsx` as the live `/` experience, and deleted the other three comparison variants (`world-globe-select.tsx`, `world-map-select.tsx`, `events-world-map.tsx`).
Leaving `/map-libre` alive is the last remnant of that resolved comparison.
- The last commit touching `map-libre-world-select.tsx` (`5c4fce7`, 2026-07-05) predates the reconciliation commit `ab0a47e` (2026-07-11); nothing has touched it since the maintainer's cleanup pass, which is consistent with abandonment rather than active work.
- It duplicates `home-events-map.tsx` near-verbatim in two places: the city-sign marker factory (`createCityMarker`, hand-rolled DOM nodes for the wooden sign marker) and the MapLibre map bootstrap (`loadWorldAtlasStyle` + `applyRpgAtlasPaint` + manual style/center/zoom setup).
As long as `map-libre-world-select.tsx` lives, every restyle of the city-sign marker has to be made twice.
- No STOP condition applies: no analytics, README, or other non-plan documentation references `/map-libre`; no commits touch it after `ab0a47e`.

## 3. Exposure decision

Already answered outside this spike: `/` is the events map (`home-events-map.tsx`), and `/events` permanent-redirects to `/`.
This doc does not reopen that question.

## 4. Consolidation sketch

Since the verdict is delete, no shared marker-factory/bootstrap module needs to be built against `map-libre-world-select.tsx`.
The remaining consolidation question is whether `home-events-map.tsx` (738 lines) and `map-shell.tsx` (1383 lines) + `city-map.tsx` (510 lines) share enough to warrant extracting a common module between them.

Assessment: **not worth a dedicated follow-up right now.**

- `home-events-map.tsx` renders city-sign markers (linking out to per-city routes) and quest/event markers with a bounce animation and a guild-board sidebar; `map-shell.tsx` renders company/startup markers with logo images, popovers, and filtering tied to a single city's data.
The marker payloads and interaction models differ enough (quest counts vs. company logos, sidebar guild board vs. per-city panel) that a shared module would mostly extract the MapLibre bootstrap boilerplate (`loadWorldAtlasStyle` + `applyRpgAtlasPaint` + container ref plumbing), not the markers themselves.
- Plans 006 (map-shell marker diffing) and 007 (map-shell decomposition) are already queued to reshape `map-shell.tsx` internals.
Extracting a shared bootstrap module now, before those land, risks a second rewrite once 006/007 change `map-shell.tsx`'s internal shape.
- Recommendation: revisit this once plans 006 and 007 land.
If `map-shell.tsx`'s post-decomposition bootstrap logic still looks like `home-events-map.tsx`'s, extract a shared `lib/maplibre-bootstrap.ts` (or similar) then, backed by concrete duplication rather than speculation.

## 5. Open questions for the maintainer

1. Confirm the delete verdict for `/map-libre` before the optional deletion step in plan 011 runs.
2. Should this doc be linked from `AGENTS.md`'s Implementation Notes so future agents don't re-discover this history?
(Proposed here per plan 011's maintenance notes; not applied, since this doc must not edit `AGENTS.md`.)
3. After plans 006/007 land, should someone open a small follow-up plan to re-evaluate the `home-events-map.tsx` / `map-shell.tsx` bootstrap-sharing question from Section 4, or is duplication of ~30-40 lines of MapLibre setup acceptable indefinitely?
