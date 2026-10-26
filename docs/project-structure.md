# Project structure

How the Nimzo repository is organized, what lives where, and how to run the mobile app on a simulator.

For the product overview see the [README](../README.md). For the Git workflow see [CONTRIBUTING.md](../CONTRIBUTING.md).

## The big picture

Nimzo is a **monorepo**: one Git repository that holds every piece of the system. Two apps share one Supabase backend and one package of shared code.

```
              ┌──────────────────────┐
              │   packages/shared    │  types, Zod schemas, form definitions
              └──────────┬───────────┘
               imported by both apps
          ┌──────────────┴──────────────┐
          ▼                             ▼
   ┌─────────────┐               ┌──────────────┐
   │ apps/mobile │               │  apps/admin  │
   │ technicians │               │administrators│
   │ (tablet)    │               │ (web)        │
   └──────┬──────┘               └──────┬───────┘
          └──────────────┬──────────────┘
                         ▼
               ┌───────────────────┐
               │ Supabase (cloud)  │◄── schema defined in supabase/migrations
               │ Postgres · Auth · │
               │ Storage · RLS     │
               └───────────────────┘
```

The key idea: **anything both apps need to agree on lives in `packages/shared`**. The report statuses are the first example: the mobile app and the admin panel import the same `reportStatusSchema`, so they cannot drift apart.

A server-side **PDF service** (`services/pdf`) is part of the plan, but it comes later. The current focus is the mobile app and the admin panel.

## Folder by folder

```
nimzo-app/
├── apps/
│   ├── mobile/               Field app for technicians
│   └── admin/                Web panel for administrators
├── packages/
│   ├── shared/               Code shared by every app
│   └── brand/                Logos shared by both apps (see its README)
├── supabase/
│   ├── migrations/           Database changes, one SQL file per change
│   ├── tests/                Database and RLS tests (pnpm test:db)
│   └── config.toml           Supabase CLI settings
├── docs/                     Documentation and AI guides
├── .github/                  CI workflows, PR template, CODEOWNERS
├── .githooks/                Git hooks (blocked pushes, commit format)
├── .claude/                  Shared Claude Code settings and skills
├── package.json              Root scripts (pnpm dev, lint, build…)
├── pnpm-workspace.yaml       Lists the workspace packages
└── turbo.json                Turborepo task configuration
```

### `apps/mobile` — technician app

Expo (React Native) app for Android tablets. This is where technicians fill in service forms, offline. iOS (iPhone and iPad) is not supported.

```
apps/mobile/
├── src/
│   ├── app/                  Screens. Every file is a route (Expo Router)
│   │   ├── _layout.tsx       Root layout: wraps every screen
│   │   └── index.tsx         First screen shown when the app opens
│   ├── theme/
│   │   └── colors.js         Brand palette (single source of truth for colors)
│   └── global.css            Tailwind entry point (NativeWind)
├── assets/                   Icons and splash screen
├── app.json                  App name, icon, orientation, plugins
├── tailwind.config.js        NativeWind / Tailwind settings
├── metro.config.js           Bundler config (NativeWind hook)
├── babel.config.js           Babel config (NativeWind JSX transform)
└── CLAUDE.md                 Expo-specific rules for Claude Code
```

- **Routes are files.** `src/app/index.tsx` is the home screen. A new file `src/app/reports.tsx` becomes the `/reports` screen automatically. `_layout.tsx` files define navigation (stacks, tabs).
- **Non-screen code goes outside `src/app/`**, for example `src/components/`, `src/hooks/` and `src/db/` once they exist.
- **Styling** uses Tailwind classes through NativeWind: `<View className="flex-1 p-8">`.
- **Colors** come from the brand palette in `src/theme/colors.js`, exposed as classes:

  | Class | Color | Use |
  |---|---|---|
  | `bg-background` | white `#FFFFFF` | Main background |
  | `bg-surface` | off-white `#F8F7F8` | Grouped sections |
  | `text-foreground` | black `#000000` | Text and titles |
  | `text-muted` | gray `#484349` | Subtitles and secondary text |
  | `bg-primary` / `text-primary-strong` | teal `#20A39E` / `#19827E` | Main actions; `-strong` for teal text on white |
  | `bg-accent` + `text-on-accent` | yellow `#FFBA49` + black | Highlights, "needs attention" |
  | `bg-danger` / `text-danger-strong` | orange `#E4572E` / `#B64524` | Errors and destructive actions |
  | `border-border` / `border-border-strong` | light / medium gray | Dividers / input outlines |

  Never write hex values or Tailwind's default colors (`neutral-500`, `blue-600`…) in screens. Teal, orange and yellow are too light for small text on white, so text uses the `-strong` variants.
- **Install packages with `npx expo install <pkg>`** from `apps/mobile`, so versions match the Expo SDK.

#### Navigation

Without a session the app only shows the login. With a session it shows a bottom tab bar with four tabs, in this order:

| Tab (label) | File | Icon (`MaterialIcons`) | Purpose |
|---|---|---|---|
| **Inicio** | `src/app/(tabs)/index.tsx` | `home` | Initial tab. Summary of the technician's work: reports in progress and pending to send |
| **Servicios** | `src/app/(tabs)/services.tsx` | `assignment` | Service visits and their forms (`F-SER-XXX`): start, fill in and submit reports |
| **Clientes** | `src/app/(tabs)/clients.tsx` | `business` | Clients, branches and systems downloaded to the device |
| **Perfil** | `src/app/(tabs)/profile.tsx` | `person` | Account details, role and sign out |

```
src/app/
├── _layout.tsx        Session provider + protected routes (login without a session, tabs with one)
├── login.tsx
└── (tabs)/
    ├── _layout.tsx    Tab bar
    ├── index.tsx      Inicio
    ├── services.tsx   Servicios
    ├── clients.tsx    Clientes
    └── profile.tsx    Perfil
```

Labels are in Spanish, file names in English. The active tab uses `primary-strong`, inactive tabs `muted`, and every tab keeps a touch target of at least 48 px. Keep the tab bar to these four destinations: new screens go inside a tab (a stack within it), not as extra tabs.

### `apps/admin` — admin panel

React web app built with Vite. Administrators manage users, and see and manage every technician's clients, branches, systems and service packages. A new client is always created for a chosen technician (field **Técnico**); its branches, systems and packages belong to the same technician. The lists show the technician and can be filtered by it.

```
apps/admin/
├── src/
│   ├── App.tsx               Refine setup: MUI theme, router, Supabase data provider, routes
│   ├── main.tsx              Entry point
│   ├── theme.ts              The only MUI theme (Spanish locale included)
│   ├── pages/                One folder per resource (home.tsx today)
│   └── lib/
│       └── supabase.ts       Supabase client (public anon key only)
└── vite.config.ts            Vite config (`@/` alias → src/)
```

- **Refine** provides data hooks (`useList`, `useCreate`…) that read and write Supabase tables directly.
- **Material UI** (v6, through `@refinedev/mui`) provides the components: tables (`DataGrid`), forms, buttons, layout. Follow [docs/ai/material-ui.md](ai/material-ui.md) for the rules (theme tokens, Refine CRUD components, accessibility).

### `packages/shared` — shared code

```
packages/shared/
├── src/
│   ├── index.ts              Public exports
│   ├── form-definition.ts    Zod schema of a service form definition
│   ├── report.ts             Report statuses + labels
│   └── roles.ts              User roles + labels
├── formatos/                 One JSON definition per service form (F-SER-XXX.json)
└── test/                     Checks every definition against the schema (`pnpm test:forms`)
```

Import it from either app with `import { reportStatusSchema } from '@nimzo/shared'`. There is no build step: each app compiles it directly.

Values stored in the database are English codes (`draft`, `sent`, `technician`); the Spanish labels next to them (`Activo`, `Enviado`, `Técnico`) are what users see. Nothing stored in the database is in Spanish.

#### Formatos

**Formatos** (`/forms`) is the catalog of service forms (`public.service_forms`): code `F-SER-XXX` (unique and fixed once created, because reports use it), name, optional subtitle (frequency or test type), icon and active flag. Forms are deactivated, never deleted. The panel shows how the card will look in the mobile app.

Icons live in the public Storage bucket `form-icons` (SVG, PNG or WebP up to 512 KB); only admins can upload, replace or remove them. Use `formIconUrl(path)` from `apps/admin/src/lib/form-icons.ts` to show one. The fields of each form live in `packages/shared/formatos/F-SER-XXX.json`, validated by `formDefinitionSchema` (`packages/shared/src/form-definition.ts`):

- `report`: the form's own "Datos del reporte" fields in the General tab. The client block (company, address, branch, contact) and the Firmas tab (supervisor and technician signatures) are the same for every form, so they are not part of the definition.
- `sections`: the Llenado tab. Each section holds fields, `group`s (`style: "band"` for a titled sub-block, `columns: 2` for side-by-side data), `note`s, `table`s with fixed rows and `list`s the technician can add rows to.
- `serviceType`: when the type of service (monthly, annual…) decides which sections apply. `allowCustom` lets the technician pick sections by hand ("Otros"). With `items`, a form-level `serviceType` applies to every item (F-SER-039); put it inside `items` when each item picks its own.
- `items`: when the same sections repeat per piece of equipment (valve, hydrant, hose…); `keyLabel` is what the technician types to add one.
- Field types: `check` (N/A · X · OK, optionally with a measured value), `yes_no`, `text` (with `multiline`, `inputMode` and `unit`), `date`, `time`, `select`, `choice`, `checkbox`, `photos` and `calc` (a formula over other fields, such as net pressure). `visibleWhen` shows a field only for a given answer, and `highlight` marks it in red.
- Ids are English snake_case and must stay stable once reports exist; labels are Spanish. Numbering is automatic.

#### Paquetes de servicio

A **service package** (`public.service_packages`) is the set of forms a technician fills in one visit to a branch, for one frequency: `weekly`, `monthly`, `quarterly`, `semiannual` or `annual` (labels in `packages/shared/src/service-packages.ts`). A branch has at most one package per frequency. Each form in a package (`public.service_package_forms`) can be tied to one system of the same branch, so the technician fills one form per system; without a system it is a general form, like the observations report.

In the panel, packages are managed from the branch page (box **Paquetes de servicio**) and each one has its own page (`/packages/:id`). When adding a form, the forms whose subtitle matches the frequency are suggested first, and several systems can be picked at once. Packages are deactivated, not deleted; forms can be removed from a package.

#### Usuarios

**Usuarios** (`/users`) lists every account (`profiles`) with its email, role, last sign-in and status. Admins create accounts with a temporary password, change name and role, reset passwords and deactivate or reactivate accounts. Deactivating also bans the account in Supabase Auth, so it cannot sign in or refresh its session. Nobody can change their own role or deactivate themselves, and there is always at least one active admin.

Those actions need the service role key, so they go through the Edge Function `supabase/functions/admin-users` (called with `useCustomMutation({ url: 'functions/admin-users' })`). Email and last sign-in are copied from `auth.users` into `profiles` by triggers, so the list can show and search them.

#### Herramientas (developer tools)

The admin panel has a **Herramientas** section, visible to every `admin`:

- **Diagnóstico** (`/tools`): calls the read-only database function `public.admin_diagnostics()` and shows each table's row count, RLS and policies, users per role, the applied migrations, and the commit and build date of the panel. It warns when a migration in the code is not applied in the cloud yet.
- **Consultas SQL** (`/tools/queries`): a library of read-only SQL queries to copy into the Supabase SQL Editor or run with `pnpm supabase db query --linked "…"`. Nothing runs from the browser. To add one, append it to `apps/admin/src/pages/tools/queries.ts`; `pnpm test:db` runs every query on the demo data inside a read-only transaction, so a query that breaks or writes fails CI.
- **Accesos rápidos** (`/tools/links`): links to the Supabase dashboard, GitHub and the docs.

### `supabase/` — database

```
supabase/
├── migrations/
│   ├── 20261012210319_database_foundation.sql            profiles, roles, clients, branches, systems
│   ├── 20261015155554_english_role_values.sql            roles stored in English
│   ├── 20261015210044_system_types_and_branch_states.sql system types and state codes
│   ├── 20261016164430_admin_diagnostics.sql              read-only diagnostics for Herramientas
│   ├── 20261016172102_profile_email_and_last_sign_in.sql email and last sign-in in profiles
│   ├── 20261016214053_accent_insensitive_search.sql      search_text columns for accent-insensitive search
│   ├── 20261022173353_service_forms.sql                  service forms catalog and form-icons bucket
│   ├── 20261022183129_service_packages.sql               service packages per branch and frequency
│   ├── 20261026182135_independent_technicians.sql        uuid ids, technician owner on every catalog row, private profiles
│   └── 20261026183308_reports.sql                        sent reports with folio, and the report-files bucket
├── functions/
│   ├── admin-login/
│   │   ├── handler.ts         panel sign-in: Turnstile captcha, then Supabase Auth, admins only
│   │   └── index.ts           Deno entry: Cloudflare siteverify and supabase-js
│   └── admin-users/
│       ├── handler.ts         create, update, deactivate and reset accounts (logic, tested with Node)
│       └── index.ts           Deno entry: wires the handler to supabase-js with the service role
├── seeds/
│   ├── demo-catalogs.sql          25 fake clients with branches and systems
│   ├── remove-demo-catalogs.sql   deletes that demo data
│   └── generate_demo_catalogs.py  regenerates demo-catalogs.sql
├── tests/
│   ├── harness.mjs           Runs all migrations on an in-memory Postgres
│   └── *.test.mjs            Who can read and write each table, codes, demo seeds
└── config.toml
```

- **The database only changes through migrations.** Create one with `pnpm supabase migration new <name>`, write the SQL, add tests in `supabase/tests/`, and open a PR.
- `pnpm test:db` checks every migration and permission rule locally, without touching the cloud database. CI runs it on every PR.
- Only the software lead applies migrations to the cloud project, after review.
- **Demo data.** To see the admin panel with data, load 25 fake clients (names end in "(demo)", emails at `ejemplo.com`). They belong to the demo technician `tecnico.demo@ejemplo.com`: create that technician in the panel first, or the seed stops with an error.

  ```bash
  pnpm supabase db query --linked -f supabase/seeds/demo-catalogs.sql          # load (does nothing if already loaded)
  pnpm supabase db query --linked -f supabase/seeds/remove-demo-catalogs.sql   # remove
  ```

  Both scripts only touch clients whose notes are `Datos de ejemplo` (the removal also deletes their service packages). After changing the catalog tables, update `generate_demo_catalogs.py` and regenerate the file with `python3 supabase/seeds/generate_demo_catalogs.py supabase/seeds/demo-catalogs.sql`; `pnpm test:db` checks that both scripts still work.

#### Applying the independent-technicians migrations (software lead, once)

The ownership migration rebuilds the catalog tables and stops if they have rows. In order:

1. `pnpm supabase db query --linked -f supabase/seeds/remove-demo-catalogs.sql` (and remove any other test clients).
2. `pnpm supabase db push`, then `pnpm db:types` (the committed `database.types.ts` was written by hand to match; regenerating should change little).
3. Create the technician `tecnico.demo@ejemplo.com` in the panel, then load `supabase/seeds/demo-catalogs.sql`.

## How the pieces run

| Command (from the repo root) | What it does |
|---|---|
| `pnpm env:setup` | Creates the `.env` files from the linked Supabase project |
| `pnpm dev` | Starts both apps at once (Turborepo) |
| `pnpm mobile:android` | Opens the mobile app in the Android emulator |
| `pnpm mobile:ios` | Opens the mobile app in the iPad simulator (quick UI preview only) |
| `pnpm mobile` | Starts the Expo dev server (scan the QR code with Expo Go) |
| `pnpm admin` | Admin panel at http://localhost:5173 |
| `pnpm check` | Everything CI runs: format, lint, typecheck, build and database tests |
| `pnpm db:new <name>` | Creates a new migration file |
| `pnpm db:status` | Shows which migrations are applied in the cloud |
| `pnpm db:dry` | Previews pending migrations without applying them |
| `pnpm db:types` | Regenerates TypeScript types from the cloud database schema |

## Running the mobile app on a simulator

The app runs inside **Expo Go**, a free app that loads your code over the network. Expo installs it in the simulator automatically. No native build is needed until the app uses libraries that Expo Go doesn't include.

The app targets **Android tablets only**. Check every screen on an Android tablet, in landscape and portrait, before opening a PR.

### Option 1 — Android tablet emulator (recommended)

Requires Android Studio (about 10 GB).

1. Install [Android Studio](https://developer.android.com/studio).
2. In **Device Manager**, create a tablet device (for example *Pixel Tablet*) and start it.
3. Run:

   ```bash
   pnpm mobile:android
   ```

4. Expo starts the bundler (Metro), installs Expo Go in the emulator and opens the app on the login screen.

### Option 2 — a real Android tablet

1. Install **Expo Go** from Google Play.
2. Run `pnpm mobile` and scan the QR code shown in the terminal.
3. The tablet must be on the same Wi-Fi network as your computer.

### Option 3 — iPad simulator (quick preview on a Mac)

Requires Xcode. iOS is not a supported platform: use this only to preview UI quickly when no Android emulator is at hand, and confirm the result on Android.

```bash
pnpm mobile:ios
```

To pick an iPad, open **Simulator → File → Open Simulator** before running the command, or press `Shift + i` in the Expo terminal. Rotate with `⌘ ←` / `⌘ →`.

### While it runs

- Saving a file reloads the screen instantly (Fast Refresh).
- In the terminal: `r` reloads, `m` opens the developer menu, `j` opens the debugger.
- Edit `apps/mobile/src/app/index.tsx` and save to see your first change.
