# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project status

Nimzo is a platform for fire-protection companies to digitize inspection, testing and maintenance (ITM) service forms. The monorepo skeleton is in place: every app builds and runs a placeholder screen, but no business features exist yet. The first migration (profiles, roles, clients, branches, systems) exists. Database migrations and RLS policies are tested with `pnpm test:db`; there is no app test runner yet.

## Commands (run from repo root)

```bash
pnpm install                        # also enables .githooks via the "prepare" script
pnpm env:setup                      # create .env files from the linked Supabase project (public keys only)
pnpm dev                            # all apps via Turborepo
pnpm mobile | pnpm mobile:ios | pnpm mobile:android   # Expo dev server / iPad simulator / Android emulator
pnpm admin | pnpm pdf               # admin panel (localhost:5173) / PDF service (localhost:3001)
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

Env files are copied from `.env.example` in `apps/mobile`, `apps/admin` and `services/pdf`, filled with the URL and keys from the Supabase dashboard (Project Settings → API).

## Architecture

See `docs/project-structure.md` for a folder-by-folder guide and how to run the mobile app on a simulator (`pnpm mobile:ios` opens it in the iOS/iPad simulator through Expo Go).

Three apps share one Supabase backend (PostgreSQL, Auth, Storage, RLS) and one shared package:

| Path | What | Stack |
|---|---|---|
| `apps/mobile` (`@nimzo/mobile`) | Field app for technicians and supervisors (Android tablet, landscape + portrait) | Expo SDK 57, Expo Router (routes in `src/app/`), NativeWind v4 (Tailwind 3), ESLint via `expo lint`. Planned: expo-sqlite + Drizzle, React Hook Form + Zod |
| `apps/admin` (`@nimzo/admin`) | Web panel for administrators (users, clients, branches, systems, service packages, report history) | Vite 8, React 19, Refine 5 with the Supabase data provider, Tailwind 4, shadcn/ui (`base-nova` style, built on Base UI, not Radix), oxlint |
| `services/pdf` (`@nimzo/pdf`) | Server-side PDF generation, triggered when a report is submitted | Node, Hono, env validated with Zod in `src/env.ts`, bundled with tsup. Planned: @react-pdf/renderer |
| `packages/shared` (`@nimzo/shared`) | Types, Zod schemas and **form definitions** consumed by all three | TypeScript, Zod 4 |
| `supabase/` | Versioned migrations, RLS policies, seed data | Supabase CLI (a root devDependency, run as `pnpm supabase`) |

`@nimzo/shared` exports its TypeScript sources directly (no build step). Metro, Vite and tsx compile it, and tsup bundles it into the PDF service (`noExternal`). React is pinned to the same version in mobile and admin. Keep them aligned when Expo upgrades.

Key design principles that cut across packages:

1. **Forms are data.** Each service form (code `F-SER-XXX`) is a JSON definition validated with Zod, stored in `packages/shared/formatos/` and registered there. A single form engine renders it in the mobile app and the PDF service uses the same definition. Adding or changing a form must not require new screens. Supported field types: `N/A / X / OK` checklists, `SI / NO` questions, text, date/time, dropdowns and repeatable groups.
2. **Offline first.** The mobile app works against local SQLite. Sync is just two flows: download catalogs (forms, clients, branches, packages) and upload submitted reports with photos and signatures. Don't add other sync paths.
3. **Service packages** (per branch and frequency: weekly, monthly, quarterly, annual) generate all the forms for a visit in one step.

### Report lifecycle

`Activo` (draft, on device) → `Pendiente` (finished, on device) → optionally `Autorización` (cloud, waiting for supervisor approval, only for forms that require it) → `Enviado` (cloud; the PDF is generated and stored in Supabase). The stored values are the codes in `packages/shared/src/report.ts` (`activo`, `pendiente`, `autorizacion`, `enviado`), with display labels next to them. Use them as-is in SQLite, Postgres and the admin panel. Roles follow the same pattern in `roles.ts`.

Roles: **técnico** (fills, signs and submits), **supervisor** (signs and authorizes), **administrador** (web panel only).

## Rules

- **Security:** public sign-up is disabled, because only admins create accounts (turn off "Allow new users to sign up" in the dashboard under Authentication; `supabase/config.toml` mirrors it). RLS is enabled on every table. Photos and signatures live in private Storage buckets and are served through short-lived signed URLs. `SUPABASE_SERVICE_ROLE_KEY` is used only in `services/pdf`, never in `apps/mobile` or `apps/admin`.
- **Database changes** go only through versioned migrations in `supabase/` (`supabase db push` in production). No manual changes in the Supabase dashboard. Use the `supabase` and `supabase-postgres-best-practices` skills for schema, RLS and SQL work. Follow the guides in `docs/ai/supabase/` (SQL style, migrations, database functions, RLS policies). Every migration that adds tables or policies also adds tests in `supabase/tests/` (see `harness.mjs`): who can and cannot read and write. Role checks in policies go through the `private.is_admin()` / `private.current_user_role()` helpers; roles come from `profiles.role`, which only administrators can change (enforced by a trigger). New users get a profile automatically, with the role taken from `app_metadata.role`.
- **UI:** `docs/ux-principles.es.md` (Spanish) is the UX rulebook for any interface work: Hick/Fitts/Miller, form design, WCAG 2.1, loading states. Apply it when designing screens.
- **Language:** code, comments, identifiers and file names are in English. The README and user-facing docs are in Spanish.
- **Git:** see `CONTRIBUTING.md` for the full branch flow. `main` and `develop` only receive PRs. GitHub's free plan can't enforce this on a private repo, so it is enforced by `.githooks/` (enabled automatically by `pnpm install`), deny rules in `.claude/settings.json` (no push to `main`/`develop`, no force push, no `gh pr merge`) and the `protected-branches.yml` workflow. Branches are `develop`, `feature/<name>` and `fix/<name>`. Commits follow Conventional Commits (`feat:`, `fix:`, `docs:`, `refactor:`, `chore:`). Don't add AI co-author or "generated with" attribution to commits or PRs (enforced in `.claude/settings.json`). Feature work branches from `develop` and opens a PR against it. Request review from the software lead (@Paytini) by hand: `.github/CODEOWNERS` only auto-assigns once the repo moves to a paid plan. CI (`.github/workflows/ci.yml`) runs format, lint, typecheck and build.
- **Deployment:** mobile via `eas build --platform android` + `eas submit` (Google Play internal testing), with `eas update` for OTA. Admin is a static Vite build. The PDF service deploys from `main` to Railway or Render. Native `android/` and `ios/` folders are generated by `expo prebuild` and gitignored.
- Project-local Expo, EAS, shadcn, Supabase and React Native skills are installed in `.claude/skills/`. Use them for work in their areas.
