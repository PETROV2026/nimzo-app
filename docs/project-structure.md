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
│   ├── mobile/               Field app for technicians and supervisors
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

Expo (React Native) app for Android tablets. This is where technicians fill in service forms, offline.

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

React web app built with Vite. Administrators manage users, clients, branches, systems and service packages, and browse report history.

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
│   ├── report.ts             Report statuses + labels
│   └── roles.ts              User roles + labels
└── formatos/                 Service form definitions (F-SER-XXX), coming next
```

Import it from either app with `import { reportStatusSchema } from '@nimzo/shared'`. There is no build step: each app compiles it directly.

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
| `pnpm dev` | Starts both apps at once (Turborepo) |
| `pnpm mobile:ios` | Opens the mobile app in the iOS/iPad simulator |
| `pnpm mobile:android` | Opens the mobile app in the Android emulator |
| `pnpm mobile` | Starts the Expo dev server (scan the QR code with Expo Go) |
| `pnpm admin` | Admin panel at http://localhost:5173 |
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
