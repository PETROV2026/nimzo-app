# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project status

Nimzo is a platform for fire-protection companies to digitize inspection, testing and maintenance (ITM) service forms. The monorepo skeleton is in place: every app builds and runs a placeholder screen, but no business features exist yet. The first migration (profiles, roles, clients, branches, systems) exists. Database migrations and RLS policies are tested with `pnpm test:db`; there is no app test runner yet.

## Commands (run from repo root)

```bash
pnpm install                        # also enables .githooks via the "prepare" script
pnpm env:setup                      # create .env files from the linked Supabase project (public keys only)
pnpm dev                            # all apps via Turborepo
pnpm mobile | pnpm mobile:android | pnpm mobile:ios   # Expo dev server / Android emulator / iPad simulator (UI preview only)
pnpm admin                          # admin panel (localhost:5173)
pnpm check                          # everything CI runs: format:check, lint, typecheck, build, test:db
pnpm lint | pnpm typecheck | pnpm build | pnpm format
pnpm test:db                        # apply all migrations to in-memory Postgres (PGlite) and run RLS tests
pnpm db:new <name>                  # create a migration file in supabase/migrations/
pnpm db:status                      # local vs applied migrations in the cloud project
pnpm db:dry                         # preview pending migrations against the cloud database (no changes)
pnpm db:types                       # regenerate packages/shared/src/database.types.ts from the cloud schema
```

Setup once per clone: `pnpm supabase login` and `pnpm supabase link --project-ref <ref>`. Applying migrations (`pnpm supabase db push`) is deliberately not a script: only the software lead runs it.

CI runs the same checks as `pnpm check`. Run it before declaring work done.

- pnpm is pinned in `package.json` (`packageManager`). If `pnpm` isn't on PATH, use `corepack pnpm`.
- pnpm blocks dependency install scripts and very new releases (supply-chain protection). Approved build scripts live under `allowBuilds` in `pnpm-workspace.yaml`; add new ones with `pnpm approve-builds <pkg>` only when a package really needs it.
- In `apps/mobile`, install packages with `npx expo install <pkg>` so versions match the Expo SDK. See `apps/mobile/CLAUDE.md`.

**There is a single Supabase cloud project, shared by development and production. No local Supabase or Docker is used.** This is a deliberate, temporary choice while there are no real customers; a separate dev project must be created before launch. Consequences:

- Never run `supabase db reset --linked` or any destructive SQL against the project (denied in `.claude/settings.json`).
- Only the software lead applies migrations, with `pnpm supabase db push`, after the PR is reviewed. Claude must ask before running `db push`. Contributors write migrations and check them with `--dry-run`.
- Seed or test data in the shared database must be clearly fake.

Env files (`apps/mobile/.env`, `apps/admin/.env`) are created by `pnpm env:setup` with the project URL and public anon key. `.env.example` in each app documents the variables.

## Architecture

See `docs/project-structure.md` for a folder-by-folder guide and how to run the mobile app on an emulator (`pnpm mobile:android` opens it in the Android emulator through Expo Go).

Two apps share one Supabase backend (PostgreSQL, Auth, Storage, RLS) and one shared package. **Current focus: mobile and admin.** A server-side PDF service (`services/pdf`, Node + Hono + @react-pdf/renderer) is planned for later and does not exist yet: do not create it unless asked.

| Path | What | Stack |
|---|---|---|
| `apps/mobile` (`@nimzo/mobile`) | Field app for technicians (Android tablets only, landscape + portrait) | Expo SDK 57, Expo Router (routes in `src/app/`), NativeWind v4 (Tailwind 3), ESLint via `expo lint`. Planned: expo-sqlite + Drizzle, React Hook Form + Zod |
| `apps/admin` (`@nimzo/admin`) | Web panel for administrators (users, clients, branches, systems, service packages, report history) | Vite 8, React 19, Refine 5 with the Supabase data provider, **Material UI v6** via `@refinedev/mui` (pinned: Refine requires MUI v6), oxlint. No Tailwind, no other UI library |
| `packages/shared` (`@nimzo/shared`) | Types, Zod schemas and **form definitions** consumed by the apps | TypeScript, Zod 4 |
| `packages/brand` (`@nimzo/brand`) | Logos used by both apps. `source/` holds the originals; `logos/`, the mobile app icons/splash and the favicons are generated with `pnpm brand:assets` (Python + Pillow). See its README for which logo to use where | PNG assets |
| `supabase/` | Versioned migrations, RLS policies, seed data, Edge Functions (`functions/`) | Supabase CLI (a root devDependency, run as `pnpm supabase`); Edge Functions run on Deno |

`@nimzo/shared` exports its TypeScript sources directly (no build step). Metro and Vite compile it. React is pinned to the same version in mobile and admin. Keep them aligned when Expo upgrades.

Key design principles that cut across packages:

1. **Forms are data.** Each service form (code `F-SER-XXX`) is a JSON definition validated with Zod, stored in `packages/shared/formatos/` and registered there. A single form engine renders it in the mobile app; the future PDF generator will use the same definition. Adding or changing a form must not require new screens. Supported field types: `N/A / X / OK` checklists, `SI / NO` questions, text, date/time, dropdowns and repeatable groups.
2. **Offline first.** The mobile app works against local SQLite. Sync is just two flows: download catalogs (forms, clients, branches, packages) and upload submitted reports with photos and signatures. Don't add other sync paths.
3. **Service packages** (per branch and frequency: weekly, monthly, quarterly, annual) generate all the forms for a visit in one step.

### Report lifecycle

`Activo` (draft, on device) → `Pendiente` (finished, on device) → `Enviado` (cloud; the PDF is generated and stored in Supabase). There is no approval step. The stored values are the English codes in `packages/shared/src/report.ts` (`draft`, `pending`, `sent`), with the Spanish display labels next to them. Use the codes as-is in SQLite, Postgres and the admin panel. Roles follow the same pattern in `roles.ts`.

Roles: `technician` (Técnico: fills, signs and submits; mobile app only) and `admin` (Administrador: web panel only). Set `app_metadata.role` to one of these codes when creating an account.

**Everything stored in the database is in English**: enum values, codes, table and column names, and any fixed value a column accepts. Spanish appears only in the labels the apps show to users.

## Rules

- **Security:** public sign-up is disabled, because only admins create accounts (turn off "Allow new users to sign up" in the dashboard under Authentication; `supabase/config.toml` mirrors it). RLS is enabled on every table. Photos and signatures live in private Storage buckets and are served through short-lived signed URLs. The only public bucket is `form-icons` (service form icons, not sensitive). `SUPABASE_SERVICE_ROLE_KEY` bypasses RLS: it never goes in `apps/mobile` or `apps/admin`. Only Edge Functions in `supabase/functions/` use it (Supabase injects it at runtime). Anything that needs it, like creating accounts, resetting passwords or banning users, goes through an Edge Function that first checks the caller is an active `admin` (see `supabase/functions/admin-users/`).
- **Database changes** go only through versioned migrations in `supabase/` (`supabase db push` in production). No manual changes in the Supabase dashboard. Use the `supabase` and `supabase-postgres-best-practices` skills for schema, RLS and SQL work. Follow the guides in `docs/ai/supabase/` (SQL style, migrations, database functions, RLS policies). Every migration that adds tables or policies also adds tests in `supabase/tests/` (see `harness.mjs`): who can and cannot read and write. Role checks in policies go through the `private.is_admin()` / `private.current_user_role()` helpers; roles come from `profiles.role`, which only administrators can change (enforced by a trigger). New users get a profile automatically, with the role taken from `app_metadata.role`.
- **Edge Functions:** keep the logic in `handler.ts` (plain TypeScript, no Deno APIs, behind a small backend interface) and make `index.ts` a thin Deno entry that wires it to supabase-js. `handler.ts` is tested with Node in `supabase/tests/` (there is no Deno in the toolchain). Deploying is like applying migrations: only the software lead runs `pnpm supabase functions deploy <name>`, after review. Claude must ask before deploying.
- **UI:** `docs/ux-principles.es.md` (Spanish) is the UX rulebook for any interface work: Hick/Fitts/Miller, form design, WCAG 2.1, loading states. Apply it when designing screens. Mobile colors come only from `apps/mobile/src/theme/colors.js` (brand palette, used through NativeWind classes such as `bg-background`, `text-foreground`, `text-muted`, `bg-primary`, `text-danger-strong`): white background, black text, brand gray (`#484349`) for subtitles. Never use hex values or Tailwind's default palette (`neutral-500`, `blue-600`…) in screens. Teal, orange and yellow fail contrast as small text on white: use the `*-strong` variants for text and the base colors for fills, icons and large elements. Mobile typography is Inter, loaded in `src/app/_layout.tsx` and mapped in `src/theme/fonts.js`: set the weight with `font-sans`, `font-sans-medium`, `font-sans-semibold` or `font-sans-bold` on every `Text` and `TextInput`, never with `font-medium`/`font-bold` (on Android those fake the weight instead of using the Inter file). Admin panel UI follows `docs/ai/material-ui.md` (Refine hooks, theme tokens instead of hardcoded values, `sx`/`styled()`, path imports, accessibility and UX states) and the WordPress-admin-style layout described there (dark admin bar and sidebar, white boxes on a gray canvas), with the Nimzo palette in `apps/admin/src/theme.ts`; read it before writing admin UI. `apps/admin/src/pages/clients/` is the reference implementation for new resources. Only active `admin` users can sign in to the panel (`src/providers/auth-provider.ts`).
- **Language:** code, comments, identifiers and file names are in English. The README and user-facing docs are in Spanish.
- **Git:** see `CONTRIBUTING.md` for the full branch flow. `main` and `develop` only receive PRs. GitHub's free plan can't enforce this on a private repo, so it is enforced by `.githooks/` (enabled automatically by `pnpm install`), deny rules in `.claude/settings.json` (no push to `main`/`develop`, no force push, no `gh pr merge`) and the `protected-branches.yml` workflow. Branches are `develop`, `feature/<name>` and `fix/<name>`. Commits follow Conventional Commits (`feat:`, `fix:`, `docs:`, `refactor:`, `chore:`). Don't add AI co-author or "generated with" attribution to commits or PRs (enforced in `.claude/settings.json`). Feature work branches from `develop` and opens a PR against it. Request review from the software lead (@Paytini) by hand: `.github/CODEOWNERS` only auto-assigns once the repo moves to a paid plan. CI (`.github/workflows/ci.yml`) runs the same checks as `pnpm check`.
- **Target platform:** the mobile app targets Android tablets only. iOS (iPhone and iPad) is not supported: don't add iOS-specific code, config or dependencies, and verify UI on an Android tablet emulator or device. The iPad simulator is only a quick preview on a Mac.
- **Deployment:** mobile via `eas build --platform android` + `eas submit` (Google Play internal testing), with `eas update` for OTA. Admin is a static Vite build. Native `android/` and `ios/` folders are generated by `expo prebuild` and gitignored.
- Project-local Expo, EAS, Supabase and React Native skills are installed in `.claude/skills/`. Use them for work in their areas.
