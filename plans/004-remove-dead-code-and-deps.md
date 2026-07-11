# Plan 004: Remove dead code and misplaced dependencies

> **Executor instructions**: Follow this plan step by step. Run every
> verification command and confirm the expected result before moving to the
> next step. If anything in the "STOP conditions" section occurs, stop and
> report — do not improvise. When done, update the status row for this plan
> in `plans/README.md`.
>
> **Drift check (run first)**: `git diff --stat c5c9021..HEAD -- lib/yc-sf-companies.ts lib/supabase/middleware.ts components/theme-provider.tsx app/layout.tsx package.json app/globals.css`
> If any in-scope file changed since this plan was written, compare the
> "Current state" excerpts against the live code before proceeding; on a
> mismatch, treat it as a STOP condition.

## Status

- **Priority**: P2
- **Effort**: S
- **Risk**: LOW
- **Depends on**: none (001 already DONE; lockfile churn from Next upgrade is settled)
- **Category**: tech-debt
- **Planned at**: commit `ba0778c`, 2026-07-06
- **Refreshed at**: commit `c5c9021`, 2026-07-11 (pre-execute reconcile)

## Why this matters

Three pieces of dead weight confuse both humans and coding agents working in this repo:
a 944-line static data file nothing imports, an unwired Supabase middleware helper that implies auth exists when it does not, and a theme provider that can never switch themes in a deliberately dark-only app.
Removing them shrinks the surface every future audit, refactor, and onboarding has to wade through.

**Out of this plan (reconciled 2026-07-11)**: removing the `shadcn` package from `dependencies`.
The original audit treated `shadcn` as CLI-only, but `app/globals.css` line 3 has `@import "shadcn/tailwind.css";`, so the package is a real build-time CSS dependency.
Vendoring that CSS would require editing `app/globals.css`, which project rules forbid without an explicit maintainer request.
Leave `shadcn` in `dependencies`; do not move it to `devDependencies` either (CSS imports resolve from installed packages at build time either way, and the audit-noise goal is secondary to a green build).

## Current state

Verified at commit `c5c9021` (re-verify each with the grep commands in the steps — that IS the drift check):

- `lib/yc-sf-companies.ts` (944 lines) — exports static YC company data; `grep -rn "yc-sf-companies" app components lib scripts tests` returns only the file itself. Dead.
- `lib/supabase/middleware.ts` — a Supabase session-refresh helper for Next.js middleware; there is NO root `middleware.ts` (or `app/middleware.ts` / `proxy.ts`) in the repo, and `grep -rn "supabase/middleware" app lib components` returns nothing. Never executed.
- `components/theme-provider.tsx` — wraps `next-themes`. Used exactly once, in `app/layout.tsx:74-78`:

```tsx
// app/layout.tsx:74-80
<ThemeProvider
  attribute="class"
  forcedTheme="light"
  disableTransitionOnChange
>
  <QueryProvider>{children}</QueryProvider>
</ThemeProvider>
```

`forcedTheme` pins a single theme forever, and the project rule (`CLAUDE.md` / `AGENTS.md` UI Rules) says "there is no light/dark toggle. Do not add one." — so `next-themes` does nothing except add a client provider and ~KBs to the bundle.

Theme / `dark:` note (do NOT treat as STOP):
- `app/globals.css` defines `@custom-variant dark (&:is(.dark *));` and a `.dark { ... }` token block.
- `components/ui/button.tsx` contains Tailwind `dark:` utility classes.
- With `forcedTheme="light"`, next-themes never adds the `.dark` class, so those `dark:` utilities and the `.dark` token block are already inert.
- Removing the provider leaves `:root` tokens in force (same as today). Rendered styling must not change.
- `package.json` still has `"next-themes": "^0.4.6"` and `"shadcn": "^4.1.0"`. Keep `shadcn`.

## Commands you will need

| Purpose   | Command          | Expected on success |
|-----------|------------------|---------------------|
| Install   | `pnpm install`   | exit 0              |
| Typecheck | `pnpm typecheck` | exit 0              |
| Tests     | `pnpm test`      | all pass            |
| Lint      | `pnpm lint`      | exit 0              |
| Build     | `pnpm build`     | exit 0 (needs `.env.local`) |

## Scope

**In scope** (the only files you should modify/delete):
- `lib/yc-sf-companies.ts` (delete)
- `lib/supabase/middleware.ts` (delete)
- `components/theme-provider.tsx` (delete)
- `app/layout.tsx` (remove the ThemeProvider import and wrapper only; also remove `suppressHydrationWarning` from `<html>` if it was only for next-themes)
- `package.json` + `pnpm-lock.yaml` (remove `next-themes` only)

**Out of scope** (do NOT touch, even though they look related):
- `package.json` `shadcn` dependency — keep it; required by `@import "shadcn/tailwind.css"` in `app/globals.css`.
- `app/globals.css` — never edit (project rule + not needed for this plan).
- `components.json` — keep; it is the shadcn CLI config and harmless.
- `lib/supabase/{admin,client,server}.ts` — all three are live.
- `components/ui/button.tsx` and other `dark:` class strings — leave alone; they are inert without `.dark`.
- Any styling change — removing the provider must not alter rendered CSS.
- `plans/README.md` — the reviewer updates the index; skip that instruction from the executor preamble override.

## Git workflow

- Branch: `advisor/004-remove-dead-code`
- One commit per deletion group is fine; conventional commits in English (e.g. `chore: remove unused yc-sf-companies data file`).
- Do NOT push or open a PR unless the operator instructed it.

## Steps

### Step 1: Delete the dead data file

**Verify first**: `grep -rn "yc-sf-companies" app components lib scripts tests --include='*.ts*' | grep -v 'lib/yc-sf-companies.ts'` → empty output.
Then `git rm lib/yc-sf-companies.ts`.

**Verify**: `pnpm typecheck` → exit 0.

### Step 2: Delete the unwired middleware helper

**Verify first**: `ls middleware.ts app/middleware.ts proxy.ts 2>&1` → all "No such file"; `grep -rn "supabase/middleware" app lib components --include='*.ts*'` → empty.
Then `git rm lib/supabase/middleware.ts`.

**Verify**: `pnpm typecheck` → exit 0.

### Step 3: Remove next-themes

1. In `app/layout.tsx`: delete the `ThemeProvider` import and unwrap it so `<QueryProvider>{children}</QueryProvider>` sits directly inside `<body>`. Keep `suppressHydrationWarning` on `<html>` only if something else needs it — with next-themes gone it was only needed for theme class injection, so remove it too.
2. `git rm components/theme-provider.tsx`.
3. Remove `"next-themes"` from `package.json` dependencies; run `pnpm install`.

**Pre-check**: `grep -rn "useTheme\|next-themes" app components lib --include='*.ts*' | grep -v theme-provider` → must be empty before deleting.

**Verify**: `pnpm typecheck` → exit 0; `pnpm build` → exit 0; visually the app renders identically (dark pixel theme comes from component Tailwind classes and `:root` / hardcoded navy tokens, not from the provider).

### Step 4: Do NOT remove shadcn

Skip. Record in your report NOTES that `shadcn` stays because `app/globals.css` imports `shadcn/tailwind.css`.
Do not add a README note about `pnpm dlx shadcn` in this plan (plan 008 owns README content).

## Test plan

No new tests: deletions of unreferenced code.
Regression gate is the full suite: `pnpm typecheck && pnpm test && pnpm lint && pnpm build`.

## Done criteria

Machine-checkable. ALL must hold:

- [ ] `ls lib/yc-sf-companies.ts lib/supabase/middleware.ts components/theme-provider.tsx 2>&1` → all three "No such file or directory"
- [ ] `grep -n "next-themes" package.json` → no matches
- [ ] `grep -n "\"shadcn\"" package.json` → still matches (dependency kept)
- [ ] `grep -n "ThemeProvider" app/layout.tsx` → no matches
- [ ] `pnpm typecheck`, `pnpm test`, `pnpm lint` exit 0; `pnpm build` exits 0
- [ ] `git status` / `git diff --stat` shows only in-scope files changed (plus lockfile)

## STOP conditions

Stop and report back (do not improvise) if:

- Any pre-check grep in Steps 1-3 returns matches — the file is no longer dead; the codebase drifted.
- After removing ThemeProvider, something starts applying the `.dark` class (e.g. a leftover script or className) — that would flip CSS variables; stop and report.
- `pnpm build` fails after removing `next-themes`.
- You feel tempted to edit `app/globals.css` or remove `shadcn` — stop; that is out of scope after the 2026-07-11 reconcile.

## Maintenance notes

- If a theme toggle is ever requested, it contradicts the standing UI rule in `CLAUDE.md` / `AGENTS.md`; resolve the rule first, then reintroduce next-themes deliberately.
- Company data lives in Supabase (`companies` table); anyone looking for a static company list after this change should be pointed to the migrations under `supabase/migrations/*seed*`.
- To later drop the `shadcn` package from prod deps: vendor `node_modules/shadcn/dist/tailwind.css` (currently ~95 lines of accordion keyframes, data-* variants, and `no-scrollbar`) into the repo and retarget the `@import` in `app/globals.css` — only with explicit maintainer approval to edit that file.
