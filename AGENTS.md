# AGENTS.md

## Agent Roles

- Claude (Fable 5) is the planner, reviewer, and manager of the main loop.
- Codex is the IC (executor) for code changes.
- Delegate code changes to Codex through the codex-plugin-cc plugin (https://github.com/openai/codex-plugin-cc/blob/main/README.md).
- Claude reviews Codex's output before committing.

## Communication

- Respond to the user in Japanese.
- Use English for commit messages.

## Project Overview

- This project is a Next.js 16 app for browsing AI startups and community events on city maps (SF, Toronto, NY, London, Vancouver, Tokyo).
- The brand is a pixel-art RPG: users explore each city's AI ecosystem like a game world.
- The map is powered by `maplibre-gl`.

## Brand Language

- Core metaphor: cities are game worlds, startups are sprites/bosses on the map, meetups and events are quests on the guild notice board, event sources (e.g. Cursor) are guilds.
- Use the game metaphor for atmosphere only: markers, frames, icons, pixel type, microcopy accents.
- Action words stay plain and product-like (Register, RSVP, Search, Add meetup). Never make users decode game vocabulary to act.
- City-level events hide the venue by design; frame it as part of the experience ("Venue shared after registration"), never as a limitation.

## Commands

- Install deps: `pnpm install`
- Start dev server: `pnpm dev`
- Build: `pnpm build`
- Lint: `pnpm lint`
- Typecheck: `pnpm typecheck`

## UI Rules

- The app is a dark pixel-RPG theme; there is no light/dark toggle. Do not add one.
- Palette: navy backgrounds (`#1a1a2e`, `#151527`, `#23233b`), `#3a3a5e` borders, `#f0f7e6` text, teal `#4ecdc4` and yellow `#ffe66d` accents; wood/parchment browns (`#8b6914`, `#95602f`, `#ead9ab`) for meetup/quest elements.
- Pixel aesthetic: hard 2-3px borders, offset pixel shadows (e.g. `shadow-[3px_3px_0_...]`), the pixel font (`--font-pixel`) for small headings and labels.
- Never use rounded corners.
- Never use gradients, glassmorphism, blur, or smooth drop shadows; keep everything hard-edged.
- Despite the game skin, layouts stay clean and scannable: dates, cities, and links must be readable at a glance.
- Use Tailwind CSS for styling.
- When composing conditional `className` values in JavaScript or TypeScript, use the `cn` helper from `lib/utils.ts`.
- In forms, label optional fields with `(optional)` next to the field name.

## Layout Rules

- Do not allow the whole page to scroll.
- The sidebar should scroll internally.
- On first load, the map should show San Francisco as a whole, not jump to a single startup.
- Map markers should remain visible in the initial viewport.

## Implementation Notes

- Startup data is loaded from the Supabase `companies` table in `app/page.tsx`.
- Meetup data is loaded from the Supabase `published_upcoming_meetups` view.
- Meetup submissions use the `submitMeetup` server action and are published immediately.
- The meetup submission form should stay short: city, title, optional description, date only, address, link, and optional X account.
- Meetup dates are stored as `event_date` (`date`) because the product does not collect meetup times.
- Meetup `organizer_name` can be `null`; do not backfill a placeholder such as `Community`.
- Shared company types and helpers live in `lib/company.ts`.
- Shared meetup types and helpers live in `lib/meetup.ts`.
- Sidebar UI lives in `components/discovery-panel.tsx`.
- Company cards live in `components/company-card.tsx`.
- Map rendering lives in `components/map-shell.tsx`.
- Company logos are shown in both cards and map markers. Keep those in sync.
- In Supabase client queries, prefer `.match()` over `.eq()`.
- After changing Supabase schema or views, run `nr genType` and commit the updated `types/supabase.ts`.

## Change Discipline

- Prefer small, direct edits over broad redesigns.
- Before changing shared styles, confirm whether the user wants that scope.
- Do not edit `app/globals.css` unless the user explicitly asks for it.
