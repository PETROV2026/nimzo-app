# Independent Technicians and Reports Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Every client, branch, system and service package belongs to one technician, technicians only see their own rows, and a new immutable `reports` table with a private `report-files` bucket receives sent reports.

**Architecture:** Two migrations. The first rebuilds the five catalog tables (they hold only demo data) with `uuid` ids, a `technician_id` on every row and owner-based RLS, and makes profiles private. The second adds `reports` and the `report-files` bucket. The admin panel is updated to pick a technician when creating a client, show and filter by technician, and use uuid ids.

**Tech Stack:** Postgres (Supabase), PGlite tests with `node:test`, Refine 5 + MUI v6 admin panel, Zod 4 schemas in `@nimzo/shared`.

**Spec:** `docs/superpowers/specs/2026-10-26-independent-technicians-and-reports-design.md`

## Global Constraints

- Follow `docs/ai/supabase/` (SQL style, migrations, functions, RLS) and the `supabase-postgres-best-practices` skill. Create migrations with `pnpm db:new <name>`.
- Role checks only through `private.is_admin()` and `(select auth.uid())`.
- Everything stored is English: table, column, enum and code values. Spanish only in UI labels and user-facing errors.
- No code comments (toolchain directives and SQL migration headers excepted, matching existing migrations).
- Never run `supabase db push`, `db reset` or SQL against the cloud project. `database.types.ts` is edited by hand in Task 4 to match the migrations; the software lead regenerates it with `pnpm db:types` after pushing.
- Admin UI follows `docs/ai/material-ui.md`; `apps/admin/src/pages/clients/` is the reference implementation.
- `pnpm check` passes at the end of every task.

## Review Focus

- A technician passes another technician's `technician_id` explicitly on insert: must be rejected (Task 1 test `technicians cannot create rows for someone else`).
- A technician links their package form to another technician's system, or their report to another technician's branch, by guessing a uuid: must be rejected (Task 1 test `children must share the parent's technician`, Task 3 test `report references must belong to the technician`).
- An admin creates a client for an admin or an inactive technician: must be rejected (Task 1 test `owners must be active technicians`).
- The service role updates a sent report's `answers`: must be rejected (Task 3 test `sent reports cannot change, even for the service role`).
- A technician reads another technician's file in `report-files` by path: must return no rows (Task 3 test `technicians only touch their own report files`).

---

### Task 1: Ownership migration

**Files:**
- Create: `supabase/migrations/<timestamp>_independent_technicians.sql` (via `pnpm db:new independent_technicians`)
- Create: `supabase/tests/independent-technicians.test.mjs`
- Modify: `supabase/tests/harness.mjs` (add helpers below)
- Modify: `supabase/tests/foundation.test.mjs`, `service-packages.test.mjs`, `accent-insensitive-search.test.mjs`, `catalog-codes.test.mjs`, `admin-diagnostics.test.mjs` (insert catalog rows with a technician owner; replace expectations that technicians can read every row)

**Interfaces:**
- Produces (SQL):
  - `public.clients`, `public.branches`, `public.systems`, `public.service_packages`, `public.service_package_forms`: `id uuid primary key default gen_random_uuid()`, all foreign keys between them `uuid`, plus `technician_id uuid not null references public.profiles (id) on delete restrict`, indexed. Every other column, constraint, enum, unique index, `search_text` generated column, trigram index and `updated_at` trigger is kept as it is today.
  - `public.branches.contact_email text` with `check (contact_email is null or contact_email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$')`.
  - `private.check_catalog_owner()` trigger function (or one per table; builder's choice) enforcing the three rules in the spec, section 2.
  - `private.check_package_form_system()` redefined for uuid ids.
- Produces (tests): `harness.mjs` exports `createTechnicianCatalog(db, technicianId, { prefix }) => Promise<{ client: string, branch: string, system: string }>` that inserts one client, branch and system as superuser for that technician.

- [ ] **Step 1: Write the failing tests** in `independent-technicians.test.mjs` with users `ADMIN` (admin), `TECH_A`, `TECH_B` (technicians), `INACTIVE` (technician, `is_active = false`):
  - `technicians see only their own catalog rows`: TECH_A selects from each of the five tables and gets only rows with `technician_id = TECH_A`; ADMIN gets both technicians' rows.
  - `a technician creates a full catalog offline-style`: TECH_A inserts a client with an id it generated (`gen_random_uuid()` from the test), then a branch, system, package and package form referencing those ids, without passing `technician_id` on the children; each child's `technician_id` equals TECH_A.
  - `technicians cannot create rows for someone else`: TECH_A inserting a client with `technician_id = TECH_B` fails.
  - `children must share the parent's technician`: TECH_A inserting a branch under TECH_B's client fails; ADMIN inserting a package form whose system belongs to another technician's branch fails.
  - `owners must be active technicians`: ADMIN inserting a client with `technician_id` = ADMIN, or = INACTIVE, fails; with TECH_A succeeds.
  - `the owner never changes`: ADMIN updating `clients.technician_id` fails; TECH_A updating its own client name succeeds; TECH_A updating TECH_B's client affects 0 rows.
  - `technicians cannot delete catalogs but can remove forms from their packages`: TECH_A delete on its client affects 0 rows / fails; delete on its own `service_package_forms` row succeeds.
  - `profiles are private`: TECH_A selecting `profiles` gets only its own row; ADMIN gets all.
  - `branches have a contact email`: insert with `'sucursal@ejemplo.com'` succeeds, with `'no-es-correo'` fails.
  - `the migration refuses to run over existing catalogs`: `createTestDb({ before: '<timestamp>_independent_technicians.sql' })`, insert one client, then `applyMigrationsFrom` rejects with a message containing `remove-demo-catalogs.sql`.

- [ ] **Step 2: Run** `node --test supabase/tests/independent-technicians.test.mjs` — expected: FAIL (`technician_id` does not exist).

- [ ] **Step 3: Write the migration.** Start with a `do` block that raises `'Catalog tables are not empty. Run supabase/seeds/remove-demo-catalogs.sql first.'` if any of the five tables has rows. Then drop the five tables (dependents first) and recreate them with the shape in Interfaces, re-creating every index, trigger and policy. Policies per spec section 3, one policy per operation and role. Replace the profiles select policy with own-row-or-admin. `technician_id` default for children comes from the trigger (fill from parent on insert when null); for `clients` the default is `(select auth.uid())` when the caller is not an admin.

- [ ] **Step 4: Update `harness.mjs` and the existing tests** so every catalog insert goes through `createTechnicianCatalog` or passes `technician_id`. Keep each existing test's intent; where a test asserted that any authenticated user can read catalogs or profiles, change it to the owner rule.

- [ ] **Step 5: Run** `pnpm test:db` — expected: all pass except `demo-seeds` and `dev-queries` (fixed in Task 2).

- [ ] **Step 6: Commit** `feat(db): give every catalog row a technician owner`.

### Task 2: Demo seeds for a demo technician

**Files:**
- Modify: `supabase/seeds/generate_demo_catalogs.py`, then regenerate `supabase/seeds/demo-catalogs.sql`
- Modify: `supabase/seeds/remove-demo-catalogs.sql` (uuid ids; delete children first)
- Modify: `supabase/tests/demo-seeds.test.mjs`, `supabase/tests/dev-queries.test.mjs`
- Modify: `docs/project-structure.md` (seed instructions)

**Interfaces:**
- Consumes: Task 1 tables.
- Produces: the seed resolves the owner with `select id from public.profiles where email = 'tecnico.demo@ejemplo.com' and role = 'technician' and is_active` and raises `'Create the demo technician tecnico.demo@ejemplo.com in the panel first.'` when missing. Branches get fake `contact_email` values on `ejemplo.com` (some null).

- [ ] **Step 1: Update the tests:** `demo-seeds` creates the demo technician user (email `tecnico.demo@ejemplo.com`) before running the seed and asserts all 25 clients and their children belong to it; a new test runs the seed without that user and expects the error above; running the seed twice inserts nothing the second time; the remove script leaves zero demo rows. `dev-queries` creates the demo technician before loading the seed.
- [ ] **Step 2: Run** `node --test supabase/tests/demo-seeds.test.mjs` — expected: FAIL.
- [ ] **Step 3: Update the generator and regenerate** with `python3 supabase/seeds/generate_demo_catalogs.py supabase/seeds/demo-catalogs.sql`; update the remove script.
- [ ] **Step 4: Run** `pnpm test:db` — expected: all pass.
- [ ] **Step 5: Commit** `feat(db): load demo catalogs for a demo technician`.

### Task 3: Reports table and report files

**Files:**
- Create: `supabase/migrations/<timestamp>_reports.sql` (via `pnpm db:new reports`)
- Create: `supabase/tests/reports.test.mjs`

**Interfaces:**
- Consumes: Task 1 tables, `createTechnicianCatalog`.
- Produces: `public.reports` exactly as the table in spec section 5 (column names and types verbatim); `private.check_report()` before-insert trigger; `private.keep_report()` before-update trigger raising `'Sent reports cannot be changed.'` (errcode `42501`) when any spec column changes; storage bucket `report-files` (private) with policies on `storage.objects` per spec section 6, where the owner prefix is `(storage.foldername(name))[1]`.

- [ ] **Step 1: Write the failing tests** (`ADMIN`, `TECH_A`, `TECH_B`, each technician with a catalog from `createTechnicianCatalog`, a helper `reportRow(technician, catalog, overrides)` returning a valid row with id `gen_random_uuid()`, `form_code 'F-SER-014'`, `form_version 1`, signature paths `<tech>/<report id>/supervisor.png` and `.../technician.png`):
  - `a technician sends a report and gets a folio`: insert succeeds; `folio` is not null; a second report gets a larger folio; `sent_at` is set by the server.
  - `retrying the same report does not duplicate it`: inserting the same id again fails; count stays 1.
  - `technicians only see their own reports`: TECH_B sees 0 of TECH_A's; ADMIN sees all.
  - `report references must belong to the technician`: TECH_A with TECH_B's branch fails; with a system from another branch fails; with a `form_code` that does not match `service_form_id` fails.
  - `reports are sent by their own technician only`: TECH_A inserting `technician_id = TECH_B` fails; ADMIN inserting any report fails.
  - `signatures must live in the report's folder`: a signature path under another report id or technician fails.
  - `sent reports cannot change, even for the service role`: TECH_A update and delete affect 0 rows; running `update public.reports set answers = '{}'` as superuser raises `Sent reports cannot be changed.`.
  - `technicians only touch their own report files`: TECH_A inserts into `storage.objects` with bucket `report-files` and name `<TECH_A>/<id>/photo-1.jpg` (succeeds) and `<TECH_B>/<id>/photo-1.jpg` (fails); TECH_B selects TECH_A's object and gets 0 rows; ADMIN gets it; TECH_A update and delete on its own object affect 0 rows.

  The PGlite storage stub has no `storage.foldername`; add to the `supabaseStub` in `harness.mjs`: `create function storage.foldername(name text) returns text[] language sql immutable as $$ select (string_to_array(name, '/'))[1:array_length(string_to_array(name, '/'), 1) - 1] $$;`

- [ ] **Step 2: Run** `node --test supabase/tests/reports.test.mjs` — expected: FAIL (relation `public.reports` does not exist).
- [ ] **Step 3: Write the migration** per spec sections 5 and 6, including the five indexes.
- [ ] **Step 4: Run** `pnpm test:db` — expected: all pass.
- [ ] **Step 5: Commit** `feat(db): add the reports table and report files bucket`.

### Task 4: Shared types and schemas

**Files:**
- Modify: `packages/shared/src/database.types.ts` (hand edit to match Tasks 1 and 3; same shape `pnpm db:types` produces)
- Modify: `packages/shared/src/branches.ts`, `packages/shared/src/clients.ts`, `packages/shared/src/systems.ts`, `packages/shared/src/service-packages.ts`
- Create: `packages/shared/src/reports.ts` additions (`Report` type and `formatFolio`), exported from `index.ts`

**Interfaces:**
- Produces:
  - `branchFormSchema` gains `contact_email` (optional, same email rule and Spanish message as `clientFormSchema.contact_email`); `branchCreateSchema.client_id: z.uuid({ error: 'Elige el cliente' })`.
  - `clientCreateSchema = clientFormSchema.extend({ technician_id: z.uuid({ error: 'Elige el técnico' }) })` with `ClientCreateInput`.
  - Every `*_id` in shared schemas that pointed at a catalog row becomes `z.uuid()`.
  - `export type Report = Tables<'reports'>;` and `export function formatFolio(folio: number): string` returning six-digit zero padding (`formatFolio(123) === '000123'`, `formatFolio(1234567) === '1234567'`).

- [ ] **Step 1:** Add `formatFolio` cases to `packages/shared/test/` (new `reports.test.ts`) and run `pnpm test:forms` — expected: FAIL.
- [ ] **Step 2:** Implement the type, schema and helper changes.
- [ ] **Step 3: Run** `pnpm test:forms && pnpm --filter @nimzo/shared typecheck` — expected: pass. `pnpm typecheck` at the root now fails in `apps/admin` (fixed in Task 5).
- [ ] **Step 4: Commit** `feat(shared): types and schemas for technician-owned catalogs and reports`.

### Task 5: Admin panel

**Files:**
- Modify: `apps/admin/src/pages/clients/` (`client-form.tsx`, `create.tsx`, `list.tsx`), `apps/admin/src/pages/branches/` (`branch-form.tsx`, `list.tsx`, `edit.tsx`, `use-branch-crumbs.ts`, `systems-box.tsx`), `apps/admin/src/pages/systems/` (`list.tsx`, `system-dialog.tsx`), `apps/admin/src/pages/packages/` (all files using numeric ids)
- Create: `apps/admin/src/components/technician-field.tsx`
- Modify: `apps/admin/src/pages/tools/queries.ts` only if a query breaks under uuid ids (covered by `dev-queries.test.mjs`)

**Interfaces:**
- Consumes: Task 4 schemas.
- Produces: `TechnicianField` — a required select of active technicians (`profiles` where `role = 'technician'` and `is_active`), labeled "Técnico", built on `RecordAutocomplete`. A list filter "Técnico" on the clients, branches and systems lists using the same source, as a `CrudFilter` on `technician_id`.

- [ ] **Step 1:** Replace every `Number(id)` and `number` id type for clients, branches, systems and packages with `string`. Run `pnpm typecheck` until it passes.
- [ ] **Step 2:** Client create: add `TechnicianField` (required, validated by `clientCreateSchema`). Client edit shows the technician read-only.
- [ ] **Step 3:** Clients, branches and systems lists: add a "Técnico" column (`technician:profiles(full_name)` via `meta.select`) and the technician filter next to the search field.
- [ ] **Step 4:** Branch form: add "Correo de contacto".
- [ ] **Step 5: Run** `pnpm check` — expected: pass. Browser verification needs the migration in the cloud project, so it happens after the software lead pushes (order in Task 6).
- [ ] **Step 6: Commit** `feat(admin): technician owner on clients, branches and systems`.

### Task 6: Documentation

**Files:**
- Modify: `CLAUDE.md`, `docs/project-structure.md`

- [ ] **Step 1:** `CLAUDE.md`: describe the independent-technician model (owner per row, admins see all and create for a technician, form catalog shared); replace the offline-first sync rule with the one in spec section 9; update the Security paragraph (profiles private, `report-files` private bucket, sent reports immutable).
- [ ] **Step 2:** `docs/project-structure.md`: new migrations, `reports`, `report-files`, seed instructions, and the push order for the software lead: run `remove-demo-catalogs.sql`, `pnpm supabase db push`, `pnpm db:types`, create `tecnico.demo@ejemplo.com` in the panel, load `demo-catalogs.sql`.
- [ ] **Step 3: Run** `pnpm check` — expected: pass.
- [ ] **Step 4: Commit** `docs: independent technicians and reports`.
