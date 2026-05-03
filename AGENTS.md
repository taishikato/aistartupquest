# AGENTS.md

## Communication

- Respond to the user in Japanese.
- Use English for commit messages.

## Project Overview

- This project is a Next.js 16 app for browsing San Francisco AI startups on a map.
- The UI is intentionally simple and product-like, not editorial or playful.
- The map is powered by `maplibre-gl`.

## Commands

- Install deps: `pnpm install`
- Start dev server: `pnpm dev`
- Build: `pnpm build`
- Lint: `pnpm lint`
- Typecheck: `pnpm typecheck`

## UI Rules

- Keep the app `light` only. Do not reintroduce system dark mode or a dark-mode toggle.
- The page should be white-first and neutral. Do not use dark navy backgrounds.
- Do not add rounded corners unless explicitly requested.
- Do not add decorative gradients, glassmorphism, or editorial styling unless explicitly requested.
- Keep the layout flat, clean, and product-focused.
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
