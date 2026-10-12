# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project status

Nimzo is a platform for fire-protection companies to digitize inspection, testing and maintenance (ITM) service forms. The monorepo skeleton is in place: every app builds and runs a placeholder screen, but no business features exist yet. There is no database schema yet (no migrations) and no test runner.

## Commands (run from repo root)

```bash
pnpm install                        # also enables .githooks via the "prepare" script
pnpm supabase start                 # local Supabase (requires Docker); prints the URL and keys for .env files
pnpm supabase db reset              # apply migrations + seed data
pnpm dev                            # all apps via Turborepo
pnpm dev --filter @nimzo/mobile     # one app only (also @nimzo/admin, @nimzo/pdf)
pnpm lint | pnpm typecheck | pnpm build
pnpm format | pnpm format:check     # Prettier (Markdown is excluded)
```

CI runs `format:check`, `lint`, `typecheck` and `build`. Run them before declaring work done.

- pnpm is pinned in `package.json` (`packageManager`). If `pnpm` isn't on PATH, use `corepack pnpm`.
- pnpm blocks dependency install scripts and very new releases (supply-chain protection). Approved build scripts live under `allowBuilds` in `pnpm-workspace.yaml`; add new ones with `pnpm approve-builds <pkg>` only when a package really needs it.
- In `apps/mobile`, install packages with `npx expo install <pkg>` so versions match the Expo SDK. See `apps/mobile/CLAUDE.md`.

Env files are copied from `.env.example` in `apps/mobile`, `apps/admin` and `services/pdf`, filled with the values printed by `supabase start`. Development always targets **local** Supabase; the cloud project is production only.

## Architecture

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

- **Security:** public sign-up is disabled, because only admins create accounts (`enable_signup = false` in `supabase/config.toml`; mirror it in the cloud project). RLS is enabled on every table. Photos and signatures live in private Storage buckets and are served through short-lived signed URLs. `SUPABASE_SERVICE_ROLE_KEY` is used only in `services/pdf`, never in `apps/mobile` or `apps/admin`.
- **Database changes** go only through versioned migrations in `supabase/` (`supabase db push` in production). No manual changes in the Supabase dashboard. Use the `supabase` and `supabase-postgres-best-practices` skills for schema, RLS and SQL work. Follow the guides in `docs/ai/supabase/` (SQL style, migrations, database functions, RLS policies).
- **UI:** `docs/ux-principles.es.md` (Spanish) is the UX rulebook for any interface work: Hick/Fitts/Miller, form design, WCAG 2.1, loading states. Apply it when designing screens.
- **Language:** code, comments, identifiers and file names are in English. The README and user-facing docs are in Spanish.
- **Git:** see `CONTRIBUTING.md` for the full branch flow. `main` and `develop` only receive PRs. GitHub's free plan can't enforce this on a private repo, so it is enforced by `.githooks/` (enabled automatically by `pnpm install`), deny rules in `.claude/settings.json` (no push to `main`/`develop`, no force push, no `gh pr merge`) and the `protected-branches.yml` workflow. Branches are `develop`, `feature/<name>` and `fix/<name>`. Commits follow Conventional Commits (`feat:`, `fix:`, `docs:`, `refactor:`, `chore:`). Don't add AI co-author or "generated with" attribution to commits or PRs (enforced in `.claude/settings.json`). Feature work branches from `develop` and opens a PR against it. Request review from the software lead (@Paytini) by hand: `.github/CODEOWNERS` only auto-assigns once the repo moves to a paid plan. CI (`.github/workflows/ci.yml`) runs format, lint, typecheck and build.
- **Deployment:** mobile via `eas build --platform android` + `eas submit` (Google Play internal testing), with `eas update` for OTA. Admin is a static Vite build. The PDF service deploys from `main` to Railway or Render. Native `android/` and `ios/` folders are generated by `expo prebuild` and gitignored.
- Project-local Expo, EAS, shadcn, Supabase and React Native skills are installed in `.claude/skills/`. Use them for work in their areas.
