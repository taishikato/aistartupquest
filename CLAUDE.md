@AGENTS.md

# CLAUDE.md

## Communication

- Respond to the user in Japanese.
- Use English for commit messages and source code comments.

## Project Overview

SF AI Startup Map — a Next.js 16 app that displays curated San Francisco AI startups on an interactive map with a filterable sidebar.

- **Framework**: Next.js 16.1.7 (App Router, Turbopack dev server)
- **Package manager**: pnpm
- **Language**: TypeScript (strict mode)
- **Styling**: Tailwind CSS v4 + shadcn/ui (base-lyra style, neutral base color, oklch CSS variables)
- **Map**: maplibre-gl with CartoDB Positron basemap
- **Fonts**: Inter (sans), Geist Mono (mono) via next/font/google
- **Theme**: Light only — forced via `next-themes` `forcedTheme="light"`

## Commands

```sh
pnpm install        # Install dependencies
pnpm dev            # Start dev server (Turbopack)
pnpm build          # Production build
pnpm lint           # ESLint
pnpm typecheck      # TypeScript type checking (tsc --noEmit)
```

## Architecture

```
app/
  layout.tsx         # Root layout (fonts, ThemeProvider)
  page.tsx           # Single page — renders <SfAiMap />
  globals.css        # Tailwind imports + CSS variables (do NOT edit unless asked)

components/
  sf-ai-map.tsx      # Top-level client component — state, filtering, layout
  discovery-panel.tsx # Sidebar: search, category filters, company list
  company-card.tsx   # Company card (compact + full variants, logo with fallback)
  map-shell.tsx      # MapLibre GL map with markers
  theme-provider.tsx # next-themes wrapper (light only)
  ui/                # shadcn/ui primitives

lib/
  company.ts         # Shared company types, category metadata, logo helpers, DB row mapper
  supabase/          # Supabase browser/server/middleware clients
  utils.ts           # cn() utility (clsx + tailwind-merge)
```

## Key Types

```ts
type Company = {
  slug: string
  name: string
  website: string
  shortDescription: string
  category: CompanyCategory
  locationLabel: string
  city: "sf" | "toronto"
  coordinates: [number, number]   // [lng, lat]
  founded: number
  logoUrl?: string
  mapSprite?: "default" | "boss"
  sourceUrl: string
}

type CompanyCategory = "Core Labs" | "Consumer AI" | "Devtools" | "Infra" | "Agents" | "Vertical AI"
```

## Data Flow

1. `app/page.tsx` reads companies from the Supabase `companies` table.
2. `companyFromRow` in `lib/company.ts` maps DB rows into the UI-facing `Company` shape.
3. `SfAiMap` holds `search`, `category`, and `selectedSlug` state; filters and sorts companies; passes subsets to `DiscoveryPanel` and `MapShell`.

## UI Rules

- **Light mode only.** Do not reintroduce dark mode or a theme toggle.
- **White-first, neutral palette.** No dark navy backgrounds.
- **No rounded corners** unless explicitly requested.
- **No decorative gradients, glassmorphism, or editorial styling** unless explicitly requested.
- **Flat, clean, product-focused** layout.

## Layout Rules

- The whole page must **never scroll**. The sidebar scrolls internally.
- On first load, the map shows San Francisco as a whole (zoom ~12.15), not a single startup.
- Map markers must remain visible in the initial viewport.

## Code Style

- Prettier: no semicolons, double quotes, 2-space indent, trailing commas (es5), 80 char width.
- Tailwind class sorting via `prettier-plugin-tailwindcss`.
- Path alias: `@/*` maps to project root.
- Use `cn()` for conditional Tailwind classes.

## Change Discipline

- Prefer small, direct edits over broad redesigns.
- Before changing shared styles, confirm whether the user wants that scope.
- Do **not** edit `app/globals.css` unless the user explicitly asks for it.
- Company logos are shown in both cards and map markers — keep those in sync.
- In Supabase client queries, prefer `.match()` over `.eq()`.
