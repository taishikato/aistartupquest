# Map Mode Zoom Persistence Plan

## Summary

Keep the user's current map zoom level when switching between `Startups` and
`Meetups`.

This plan applies only to the in-city mode switch. City navigation such as
`SF`, `NY`, and `LDN` stays out of scope.

## Key Changes

- Update only `components/map-shell.tsx`.
- Track the previous `mode` with a ref so `MapShell` can detect a
  `Startups / Meetups` switch.
- Do not treat the initial mode, including an initial `?mode=meetups` load, as
  a mode switch.
- Initialize `prevModeRef` with the current `mode`. In the marker-render effect,
  compute `isModeSwitch = hasRenderedMarkersRef.current && prevModeRef.current
  !== mode`.
- When mode changes after the initial marker render, suppress the marker-set
  `fitBounds` / `jumpTo` camera reset for that mode-switch render.
- When skipping that camera reset, still update the marker-set signature for the
  active mode so the skipped `fitBounds` / `jumpTo` does not run on a later
  render.
- After handling a marker-render pass, update `prevModeRef.current` to the
  current `mode`.
- Use `map.getZoom()` for every selection `flyTo`, including mode-switch
  selection and manual startup/meetup selection, so selection changes recenter
  without changing zoom.
- Preserve the existing selected-marker refresh, pitch, bearing, and marker
  rendering behavior.
- Do not change Supabase queries, `types/supabase.ts`, database schema, global
  styles, or layout structure.

## Behavior

- Initial page load continues to show the whole city with visible markers.
- Manual zoom in/out stays intact after switching between `Startups` and
  `Meetups`.
- On a mode switch, preserve the current zoom. If the destination mode has a
  selected item, the existing selection `flyTo` may recenter to that item using
  the preserved zoom. If the destination mode has no selected item, do not move
  the camera.
- Company and meetup selection continues to focus the selected item while
  preserving the current zoom instead of returning to the old fixed `13.05`
  zoom.
- City-map navigation remains unchanged and may initialize each city from its
  own `config.mapCenter`; city navigation is not an acceptance target for this
  change.

## Test Plan

- Run `pnpm typecheck`.
- Run `pnpm lint`.
- Start the app with `nr dev`, using the project's existing dev script through
  the `nr` runner as requested.
- Use `$agent-browser` against the local dev URL to verify:
  - Initial SF load still shows the city and markers.
  - Wait until SF markers are visible, zoom in manually, record `map.getZoom()`
    as the pre-switch zoom, switch `Startups` to `Meetups`, wait for camera
    movement to settle, and confirm the post-switch zoom differs from the
    pre-switch zoom by no more than `0.1`.
  - Zoom out manually, record `map.getZoom()` as the pre-switch zoom, switch
    `Meetups` to `Startups`, wait for camera movement to settle, and confirm the
    post-switch zoom differs from the pre-switch zoom by no more than `0.1`.
  - After switching modes at a manually changed zoom, select a startup or meetup
    and confirm the selected marker is focused while the zoom remains within
    `0.1` of the pre-selection zoom.
  - Page-level scrolling remains disabled and the sidebar scrolls internally.

## Assumptions

- `between them` means the `Startups / Meetups` mode switch.
- The desired change is zoom persistence, not center persistence.
- No fallback behavior is needed for missing meetup data beyond the existing UI
  states.
