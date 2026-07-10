# 012: Events-first top page

Status: implemented, verified locally (lint, typecheck, browser check). Awaiting owner review; flat vs globe decision still open.
Decided in brainstorm on 2026-07-10.

## Goal

Replace the hand-drawn city-select gate at `/` with an events-first world map so the top page shows living content (Cursor community events) on first load.

## Decisions

- `/` becomes the events world map. `/events` permanently redirects to `/`.
- Map engine: MapLibre with the RPG atlas style (`loadWorldAtlasStyle` + `applyRpgAtlasPaint`). The hand-drawn art raster and its coordinate remaps (`artLon`/`artLat`, `artPosition`, `artLatitude*`) are no longer used on the top page.
- Default view: flat (mercator). A MAP/GLOBE toggle is kept, and the globe also uses the atlas style with idle rotation (reuse the pattern in `components/events-world-map.tsx`). Flat vs globe will be judged later on the live page; the loser gets removed in a follow-up.
- Pins use real `[lon, lat]` only. No art-coordinate measuring anymore.
- Data source: `lib/data/cursor-community-events.json` (Cursor worldwide events only, ~89 events / 68 cities). Supabase meetups integration is out of scope (later phase).
- City-level pins only; venue is never shown ("Venue shared after registration" framing).

## New top page spec

Layout (page never scrolls; panel scrolls internally):

- Full-viewport MapLibre map, atlas style, flat by default. Initial camera shows the whole world with all pins visible (roughly center `[5, 14]`, zoom `1.34`, minZoom `1.2`).
- Event pins: quest-style marker (yellow bar + dot, brown count plaque) for every city with upcoming events (date >= today). Click selects the city and shows its events.
- City entrances: wooden sign markers (reuse `createCityMarker` pattern from `components/map-libre-world-select.tsx`) for the 6 `WORLD_STAGE_CITIES`, linking to `/sf`, `/toronto`, etc. Header also gets a compact city nav.
- Sidebar (guild notice board, left, ~380px, internal scroll):
  - Brand header + total count line ("N upcoming events in M cities").
  - Search input filtering by event title or city (case-insensitive). Filters both the list and the event pins on the map.
  - Upcoming events list sorted by date ascending. Card: date (pixel font, `#95602f`), title, city, `Register ↗` link (teal `#4ecdc4` button). Parchment card style (`#fff7dd`, 2px `#1a1a2e` border).
  - Clicking a card flies the map to that city and selects it.
- MAP/GLOBE toggle (top center, same style as current `/events`). Globe: atlas style, idle rotation that stops permanently on first interaction, `renderWorldCopies: false`.
- Attribution box "(c) CARTO (c) OpenStreetMap" bottom-right.
- UI rules apply strictly: pixel font, hard 2-3px borders, offset pixel shadows, no rounded corners, no gradients/blur, Tailwind + `cn` helper.

## Routing and cleanup

- `app/page.tsx`: render the new component; update metadata (events-first title/description).
- `app/events/page.tsx`: replace with a permanent redirect to `/`.
- Delete once unused: `components/world-globe-select.tsx`, `components/world-map-select.tsx`, `components/events-world-map.tsx`, and any art-remap helpers in `lib/world-art-map.ts` that lose all callers (keep `GLOBE_CAMERA` if still used). Keep `components/space-backdrop.tsx` only if the new globe view uses it; otherwise delete.
- `app/map-libre` comparison route is out of scope here (covered by plan 011).

## Verification

- `pnpm lint` and `pnpm typecheck` pass.
- Manual: `/` loads flat world map with pins visible, search filters list + pins, card click flies to city, city signs navigate, GLOBE toggle works, `/events` redirects.
