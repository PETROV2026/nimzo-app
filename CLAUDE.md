# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project status

Nimzo is an app for independent fire-protection technicians to digitize inspection, testing and maintenance (ITM) service forms. The monorepo skeleton is in place: every app builds and runs a placeholder screen, but no business features exist yet. Migrations exist for profiles and roles, technician-owned catalogs (clients, branches, systems, service packages), the service form catalog and sent reports. Database migrations and RLS policies are tested with `pnpm test:db`; there is no app test runner yet.

## Commands (run from repo root)

```bash
pnpm install                        # also enables .githooks via the "prepare" script
pnpm env:setup                      # create .env files from the linked Supabase project (public keys only)
pnpm dev                            # all apps via Turborepo
pnpm mobile | pnpm mobile:android | pnpm mobile:ios   # Expo dev server / Android emulator / iPad simulator (UI preview only)
pnpm admin                          # admin panel (localhost:5173)
pnpm check                          # everything CI runs: format:check, lint, typecheck, build, test:db, test:forms
pnpm lint | pnpm typecheck | pnpm build | pnpm format
pnpm test:db                        # apply all migrations to in-memory Postgres (PGlite) and run RLS tests
pnpm test:forms                     # validate every form definition in packages/shared/formatos/
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

1. **Forms are data.** Each service form is a JSON definition validated with Zod, stored in `packages/shared/formatos/<code>.json` and registered there. The `code` is an internal snake_case key in English (e.g. `diesel_pump_annual`) that links the definition, the `service_forms` catalog and sent reports; it never changes and is never shown to users: the apps and the PDF identify a form by its name and subtitle (`formTitle()` in `@nimzo/shared`). Don't reintroduce `F-SER-XXX` codes: they were another company's internal numbering. A single form engine renders it in the mobile app; the future PDF generator will use the same definition. Adding or changing a form must not require new screens. The schema is `packages/shared/src/form-definition.ts` (see `docs/project-structure.md`): `N/A / X / OK` checks (optionally with a measured value), `SI / NO`, text, date/time, dropdowns, choices, checkboxes, photos, calculated values, tables, repeatable lists, per-equipment items and service types that enable sections. The client block and the two signatures (supervisor and technician) are fixed for every form. `pnpm test:forms` validates every definition.
2. **Offline first.** The mobile app works against local SQLite. Technicians create their own clients, branches, systems and packages offline, with uuid ids generated on the device. Sync is: download the technician's own catalogs and the service form catalog; upload the technician's own catalog changes; upload sent reports with their photos and signatures. Don't add other sync paths.
3. **Service packages** (per branch and frequency: weekly, monthly, quarterly, semiannual, annual) generate all the forms for a visit in one step. Each form in a package can be tied to a system of the branch (one form per system).

### Report lifecycle

`Activo` (draft, on device) → `Pendiente` (finished, on device) → `Enviado` (cloud; the PDF is generated and stored in Supabase). There is no approval step. The stored values are the English codes in `packages/shared/src/report.ts` (`draft`, `pending`, `sent`), with the Spanish display labels next to them. Use the codes as-is in SQLite, Postgres and the admin panel. Roles follow the same pattern in `roles.ts`.

Roles: `technician` (Técnico: an independent technician with their own clients, branches, systems, packages and reports; mobile app only) and `admin` (Administrador: the platform owners; web panel only). Set `app_metadata.role` to one of these codes when creating an account.

**Independent technicians.** Every client, branch, system, service package and report has a `technician_id`. A technician only sees and writes their own rows (enforced by RLS and owner triggers; children copy the owner from their parent and it never changes). Admins see everything and create catalog rows for a chosen active technician. Two technicians serving the same company each have their own copy. Only the service form catalog and the form definitions are shared. Sent reports (`public.reports`) never change and are never deleted; each gets a platform-wide `folio` on arrival. See `docs/superpowers/specs/2026-10-26-independent-technicians-and-reports-design.md`.

**Everything stored in the database is in English**: enum values, codes, table and column names, and any fixed value a column accepts. Spanish appears only in the labels the apps show to users.

## Rules

- **Security:** public sign-up is disabled, because only admins create accounts (turn off "Allow new users to sign up" in the dashboard under Authentication; `supabase/config.toml` mirrors it). RLS is enabled on every table. A technician can read only their own profile. Photos and signatures live in the private `report-files` bucket under `{technician_id}/{report_id}/`, never overwritten or deleted through the API, and are served through short-lived signed URLs. The technician's own signature (shown in the Perfil tab) lives in the private `signatures` bucket under `{user_id}/` (`profiles.signature_path`); a new one gets a new file name and the old file is removed. Technicians edit their own phone, state, city and signature; admins can edit them too. The only public bucket is `form-icons` (service form icons, not sensitive). `SUPABASE_SERVICE_ROLE_KEY` bypasses RLS: it never goes in `apps/mobile` or `apps/admin`. Only Edge Functions in `supabase/functions/` use it (Supabase injects it at runtime). Anything that needs it, like creating accounts, resetting passwords or banning users, goes through an Edge Function that first checks the caller is an active `admin` (see `supabase/functions/admin-users/`). The admin panel signs in through the `admin-login` Edge Function, which verifies a Cloudflare Turnstile captcha (`TURNSTILE_SECRET_KEY` secret) before calling Supabase Auth and only returns a session to active admins. Captcha is not enabled in Supabase Auth itself, because the mobile app signs in without one. See `docs/deploy-vercel.md`.
- **Database changes** go only through versioned migrations in `supabase/` (`supabase db push` in production). No manual changes in the Supabase dashboard. Use the `supabase` and `supabase-postgres-best-practices` skills for schema, RLS and SQL work. Follow the guides in `docs/ai/supabase/` (SQL style, migrations, database functions, RLS policies). Every migration that adds tables or policies also adds tests in `supabase/tests/` (see `harness.mjs`): who can and cannot read and write. Role checks in policies go through the `private.is_admin()` / `private.current_user_role()` helpers; roles come from `profiles.role`, which only administrators can change (enforced by a trigger). New users get a profile automatically, with the role taken from `app_metadata.role`.
- **Edge Functions:** keep the logic in `handler.ts` (plain TypeScript, no Deno APIs, behind a small backend interface) and make `index.ts` a thin Deno entry that wires it to supabase-js. `handler.ts` is tested with Node in `supabase/tests/` (there is no Deno in the toolchain). Deploying is like applying migrations: only the software lead runs `pnpm supabase functions deploy <name>`, after review. Claude must ask before deploying.
- **UI:** `docs/ux-principles.es.md` (Spanish) is the UX rulebook for any interface work: Hick/Fitts/Miller, form design, WCAG 2.1, loading states. Apply it when designing screens. Mobile colors come only from `apps/mobile/src/theme/colors.js` (brand palette, used through NativeWind classes such as `bg-background`, `text-foreground`, `text-muted`, `bg-primary`, `text-danger-strong`): white background, black text, brand gray (`#484349`) for subtitles. Never use hex values or Tailwind's default palette (`neutral-500`, `blue-600`…) in screens. Teal, orange and yellow fail contrast as small text on white: use the `*-strong` variants for text and the base colors for fills, icons and large elements. Mobile typography is Inter, loaded in `src/app/_layout.tsx` and mapped in `src/theme/fonts.js`: set the weight with `font-sans`, `font-sans-medium`, `font-sans-semibold` or `font-sans-bold` on every `Text` and `TextInput`, never with `font-medium`/`font-bold` (on Android those fake the weight instead of using the Inter file). Admin panel UI follows `docs/ai/material-ui.md` (Refine hooks, theme tokens instead of hardcoded values, `sx`/`styled()`, path imports, accessibility and UX states) and the WordPress-admin-style layout described there (dark admin bar and sidebar, white boxes on a gray canvas), with the Nimzo palette in `apps/admin/src/theme.ts`; read it before writing admin UI. `apps/admin/src/pages/clients/` is the reference implementation for new resources. Only active `admin` users can sign in to the panel (`src/providers/auth-provider.ts`).
- **Language:** code, comments, identifiers and file names are in English. The README and user-facing docs are in Spanish.
- **Git:** see `CONTRIBUTING.md` for the full branch flow. `main` and `develop` only receive PRs. GitHub's free plan can't enforce this on a private repo, so it is enforced by `.githooks/` (enabled automatically by `pnpm install`), deny rules in `.claude/settings.json` (no push to `main`/`develop`, no force push, no `gh pr merge`) and the `protected-branches.yml` workflow. Branches are `develop`, `feature/<name>` and `fix/<name>`. Commits follow Conventional Commits (`feat:`, `fix:`, `docs:`, `refactor:`, `chore:`). Don't add AI co-author or "generated with" attribution to commits or PRs (enforced in `.claude/settings.json`). Feature work branches from `develop` and opens a PR against it. Request review from the software lead (@Paytini) by hand: `.github/CODEOWNERS` only auto-assigns once the repo moves to a paid plan. CI (`.github/workflows/ci.yml`) runs the same checks as `pnpm check`.
- **Target platform:** the mobile app targets Android tablets only. iOS (iPhone and iPad) is not supported: don't add iOS-specific code, config or dependencies, and verify UI on an Android tablet emulator or device. The iPad simulator is only a quick preview on a Mac.
- **Deployment:** mobile via `eas build --platform android` + `eas submit` (Google Play internal testing), with `eas update` for OTA. Admin is a static Vite build deployed on Vercel from GitHub (Root Directory `apps/admin`; build, install, SPA rewrites and security headers in `apps/admin/vercel.json`; see `docs/deploy-vercel.md`). Native `android/` and `ios/` folders are generated by `expo prebuild` and gitignored.
- Project-local Expo, EAS, Supabase and React Native skills are installed in `.claude/skills/`. Use them for work in their areas.
