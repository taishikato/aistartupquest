# AI Startup Quest

A pixel-art RPG map for exploring AI startups and community events across six cities.

<img width="2106" height="1486" alt="Image" src="https://github.com/user-attachments/assets/7315b2c6-5e4b-4ca5-8411-35e2e583a5b7" />

## What's This

- An events-first world map on the top page.
- City maps for San Francisco, Toronto, New York, London, Vancouver, and Tokyo.
- Startups shown as sprites on a game-style map.
- Community events shown as quests on the map.

## Data

- Startup data lives in the Supabase `companies` table.
- Each city page loads it via `lib/city-page-data.ts`.
- Events live in the Supabase `events` table and the home page reads the `published_upcoming_events` view.
- Cursor events are refreshed with `pnpm sync:cursor-events`.

## Development

```bash
pnpm install
pnpm dev
pnpm lint
pnpm typecheck
pnpm test
```

Agent and contributor rules live in `AGENTS.md`.
