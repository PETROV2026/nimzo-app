# Project structure

How the Nimzo repository is organized, what lives where, and how to run the mobile app on a simulator.

For the product overview see the [README](../README.md). For the Git workflow see [CONTRIBUTING.md](../CONTRIBUTING.md).

## The big picture

Nimzo is a **monorepo**: one Git repository that holds every piece of the system. Three apps share one Supabase backend and one package of shared code.

```
                ┌──────────────────────┐
                │   packages/shared    │  types, Zod schemas, form definitions
                └──────────┬───────────┘
          imported by all three │
     ┌──────────────────┬───────┴─────────┬──────────────────┐
     ▼                  ▼                 ▼                  │
┌─────────────┐  ┌──────────────┐  ┌──────────────┐          │
│ apps/mobile │  │  apps/admin  │  │ services/pdf │          │
│ technicians │  │ administrators│ │ PDF reports  │          │
│ (tablet)    │  │ (web)        │  │ (server)     │          │
└──────┬──────┘  └──────┬───────┘  └──────┬───────┘          │
       └────────────────┼─────────────────┘                  │
                        ▼                                    │
              ┌───────────────────┐   schema defined in      │
              │ Supabase (cloud)  │◄── supabase/migrations ──┘
              │ Postgres · Auth · │
              │ Storage · RLS     │
              └───────────────────┘
```

The key idea: **anything two apps need to agree on lives in `packages/shared`**. The report statuses are the first example: the mobile app, the admin panel and the PDF service all import the same `reportStatusSchema`, so they cannot drift apart.

## Folder by folder

```
nimzo-app/
├── apps/
│   ├── mobile/               Field app for technicians and supervisors
│   └── admin/                Web panel for administrators
├── packages/
│   └── shared/               Code shared by every app
├── services/
│   └── pdf/                  PDF generation service
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

Expo (React Native) app for Android tablets. This is where technicians fill in service forms, offline.

```
apps/mobile/
├── src/
│   ├── app/                  Screens. Every file is a route (Expo Router)
│   │   ├── _layout.tsx       Root layout: wraps every screen
│   │   └── index.tsx         First screen shown when the app opens
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
- **Install packages with `npx expo install <pkg>`** from `apps/mobile`, so versions match the Expo SDK.

### `apps/admin` — admin panel

React web app built with Vite. Administrators manage users, clients, branches, systems and service packages, and browse report history.

```
apps/admin/
├── src/
│   ├── App.tsx               Refine setup: router, Supabase data provider, routes
│   ├── main.tsx              Entry point
│   ├── pages/                One file per page (home.tsx today)
│   ├── lib/
│   │   ├── supabase.ts       Supabase client (public anon key only)
│   │   └── utils.ts          cn() helper for class names
│   └── index.css             Tailwind + shadcn/ui theme
├── components.json           shadcn/ui settings
└── vite.config.ts            Vite config (`@/` alias → src/)
```

- **Refine** provides data hooks (`useList`, `useCreate`…) that read and write Supabase tables directly.
- **shadcn/ui** components are added with `npx shadcn@latest add <component>` from `apps/admin`; they are copied into `src/components/ui/`.

### `services/pdf` — report PDFs

Small Node server (Hono). It will generate the PDF when a report is submitted. Today it only has a `/health` route.

```
services/pdf/
├── src/
│   ├── index.ts              Server and routes
│   └── env.ts                Validates environment variables at startup
└── tsup.config.ts            Build config (bundles @nimzo/shared)
```

It is the **only** place allowed to use `SUPABASE_SERVICE_ROLE_KEY`, which bypasses all security rules.

### `packages/shared` — shared code

```
packages/shared/
├── src/
│   ├── index.ts              Public exports
│   ├── report.ts             Report statuses + labels
│   └── roles.ts              User roles + labels
└── formatos/                 Service form definitions (F-SER-XXX), coming next
```

Import it from any app with `import { reportStatusSchema } from '@nimzo/shared'`. There is no build step: each app compiles it directly.

Values stored in the database are short codes (`activo`, `autorizacion`); the labels next to them (`Activo`, `Autorización`) are what users see.

### `supabase/` — database

```
supabase/
├── migrations/
│   └── 20261012210319_database_foundation.sql   profiles, roles, clients, branches, systems
├── tests/
│   ├── harness.mjs           Runs all migrations on an in-memory Postgres
│   └── foundation.test.mjs   Who can read and write each table
└── config.toml
```

- **The database only changes through migrations.** Create one with `pnpm supabase migration new <name>`, write the SQL, add tests in `supabase/tests/`, and open a PR.
- `pnpm test:db` checks every migration and permission rule locally, without touching the cloud database. CI runs it on every PR.
- Only the software lead applies migrations to the cloud project, after review.

## How the pieces run

| Command (from the repo root) | What it does |
|---|---|
| `pnpm env:setup` | Creates the `.env` files from the linked Supabase project |
| `pnpm dev` | Starts every app at once (Turborepo) |
| `pnpm mobile:ios` | Opens the mobile app in the iOS/iPad simulator |
| `pnpm mobile:android` | Opens the mobile app in the Android emulator |
| `pnpm mobile` | Starts the Expo dev server (scan the QR code with Expo Go) |
| `pnpm admin` | Admin panel at http://localhost:5173 |
| `pnpm pdf` | PDF service at http://localhost:3001 |
| `pnpm check` | Everything CI runs: format, lint, typecheck, build and database tests |
| `pnpm db:new <name>` | Creates a new migration file |
| `pnpm db:status` | Shows which migrations are applied in the cloud |
| `pnpm db:dry` | Previews pending migrations without applying them |
| `pnpm db:types` | Regenerates TypeScript types from the cloud database schema |

## Running the mobile app on a simulator

The app runs inside **Expo Go**, a free app that loads your code over the network. Expo installs it in the simulator automatically. No native build is needed until the app uses libraries that Expo Go doesn't include.

### Option 1 — iPad simulator (fastest on a Mac)

Requires Xcode.

```bash
pnpm mobile:ios
```

1. Expo starts the bundler (Metro), boots a simulator and installs Expo Go.
2. The first time, Expo Go shows a developer menu card. Press **Continue**.
3. The home screen (`src/app/index.tsx`) appears: "Nimzo" and the report statuses.

To use an iPad instead of an iPhone, open **Simulator → File → Open Simulator** and pick an iPad before running the command, or press `Shift + i` in the Expo terminal to choose a device. Rotate with `⌘ ←` / `⌘ →`.

The production app targets Android, but the code is the same on both platforms, so the iPad simulator is fine for day-to-day UI work.

### Option 2 — Android emulator (matches production)

Requires Android Studio (about 10 GB).

1. Install [Android Studio](https://developer.android.com/studio).
2. In **Device Manager**, create a tablet device (for example *Pixel Tablet*) and start it.
3. Run:

   ```bash
   pnpm mobile:android
   ```

### Option 3 — a real tablet or phone

1. Install **Expo Go** from Google Play or the App Store.
2. Run `pnpm mobile` and scan the QR code shown in the terminal.
3. The device must be on the same Wi-Fi network as your computer.

### While it runs

- Saving a file reloads the screen instantly (Fast Refresh).
- In the terminal: `r` reloads, `m` opens the developer menu, `j` opens the debugger.
- Edit `apps/mobile/src/app/index.tsx` and save to see your first change.
