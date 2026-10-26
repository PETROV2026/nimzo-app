# Independent technicians and the reports table

Date: 2026-10-26. Status: draft for review.

## Why

Nimzo changes from an internal tool for one fire-protection company into an app for **independent technicians**. Each technician works for themselves: they register their own clients, branches, systems and service packages, fill service forms in the field (often without internet) and send finished reports to their clients. A technician must never see another technician's data. The platform owners (role `admin`) see everything from the web panel, create technician accounts, and can register clients, branches, systems and packages on behalf of a specific technician.

This document covers the database layer that the rest depends on:

1. **Ownership**: every client, branch, system and service package belongs to one technician.
2. **Reports**: the cloud table that receives sent reports, with their photos and signatures.

Sending (PDF generation and email), the report history page in the panel and the mobile app are separate projects that build on this one (see "Next projects").

## Decisions made by the software lead

- Each technician only sees what they created or what an admin registered for them. Admins see everything.
- If two technicians serve the same company, each has their own copy. Duplicates are expected and fine.
- Admins can still create clients, branches, systems and packages from the panel, but always for a chosen technician. Nothing is global, except the service form catalog and the form definitions.
- Accounts are still created by admins. Public sign-up stays disabled.
- Report lifecycle on the device: **Activo** (form not fully filled), **Pendiente** (filled, missing one or both signatures: supervisor and technician), **Enviado** (in the cloud). Activo and Pendiente live only on the device.
- The technician presses **Enviar**. Without internet, the app says the report cannot be sent until there is a connection and the report stays Pendiente. Everything else the technician creates is saved on the device and uploaded when there is a connection.
- A sent report never changes: not by the technician, not by an admin.
- On send, the report is emailed to the **branch's contact email**, with copies to **Nimzo** (a platform address) and to **the technician**. Branches get a contact email for this.
- Reports have a **folio** (report number) that is unique across the whole platform.

## Goals

- Row-level security makes cross-technician access impossible, whatever the client sends.
- Technicians can create catalog rows while offline and upload them later without duplicates.
- A sent report is stored once, completely and immutably, with everything needed to show it and render its PDF later, even if the client or branch is edited afterwards.
- Every new table and policy is covered by tests in `supabase/tests/` (who can and cannot read and write).

## Non-goals

- PDF generation and email delivery (next project). This project only leaves room for them.
- The panel's report history page (next project).
- Anything in the mobile app.
- Self sign-up, plans or payments, per-technician branding on the PDF.
- Moving a client from one technician to another.
- Annulling or deleting sent reports.

## Anti-goals

- Any query path, view, function or storage path through which a technician can read or infer another technician's rows (including names and emails in `profiles`).
- Sent reports that can be altered after the fact, even by an admin.
- A report whose content depends on catalog rows that may change later.

## Current state

- `clients`, `branches`, `systems`, `service_packages`, `service_package_forms` have `bigint` identity ids and policies of the form "authenticated users can view; admins can write".
- `profiles` are readable by every authenticated user.
- `branches` have `contact_name` and `contact_phone`, no email. `clients` have `contact_email`.
- The cloud database holds only fake demo catalogs (`supabase/seeds/demo-catalogs.sql`, 25 clients marked `Datos de ejemplo`) and no real data.

## Design

### 1. Ids generated on the device

Technicians create clients, branches, systems, packages and reports offline, and children reference parents that do not exist in the cloud yet. To make this possible, `clients`, `branches`, `systems`, `service_packages`, `service_package_forms` and `reports` use **`uuid` primary keys** (`default gen_random_uuid()`, so the panel can omit them; the mobile app generates its own). Foreign keys referencing them become `uuid`. Uploads are idempotent: inserting a row whose id already exists is an upsert of the same row, not a duplicate.

The existing tables hold only demo data, so the migration converts them in place. `service_forms` keeps its `bigint` id; it is a platform catalog that is never created offline.

### 2. Ownership

- `clients.technician_id uuid not null references profiles (id) on delete restrict`.
- `branches`, `systems`, `service_packages` and `service_package_forms` also get `technician_id`, a copy of their parent's. It is filled by a trigger on insert from the parent row and can never change. Storing it on every table keeps each policy a simple equality instead of a chain of joins, and makes the "same technician" rule checkable.
- A trigger rejects:
  - on insert, a `technician_id` whose profile is not an active `technician`;
  - any change to `technician_id` after insert;
  - a child whose parent has a different technician (for example a package form whose system belongs to another technician's branch).
- `technician_id` is indexed on every table.
- When a technician is deactivated, their rows stay as they are and remain visible to admins; the technician only loses access.

### 3. Access rules

For `clients`, `branches`, `systems`, `service_packages`, `service_package_forms`:

| Who | Select | Insert | Update | Delete |
|---|---|---|---|---|
| Technician | own rows (`technician_id = auth.uid()`) | own rows only | own rows; cannot change `technician_id` | none (deactivate with `is_active`), except `service_package_forms`, which can be removed from own packages, as today for admins |
| Admin | all | any row, for any active technician | all | as today |

`service_forms` stays readable by every authenticated user and writable by admins only.

`profiles`: a technician can read only their own profile. Admins read all. This replaces "Authenticated users can view profiles".

All role checks go through `private.is_admin()` and `(select auth.uid())`, as the existing policies do.

### 4. Branch contact email

`branches.contact_email text`, optional, with the same basic format check used elsewhere. It is where sent reports are emailed. The panel's branch form and the demo seed include it.

### 5. Reports table

`public.reports` holds **sent** reports only.

| Column | Type | Notes |
|---|---|---|
| `id` | `uuid` primary key | generated on the device when the report is created, so a retried upload cannot create a second report |
| `folio` | `bigint` generated always as identity, unique | platform-wide report number, assigned when the row reaches the cloud |
| `technician_id` | `uuid` not null → `profiles` | must equal `auth.uid()` on insert |
| `client_id` | `uuid` not null → `clients` | must belong to the same technician |
| `branch_id` | `uuid` not null → `branches` | must belong to the client |
| `system_id` | `uuid` null → `systems` | must belong to the branch |
| `service_package_id` | `uuid` null → `service_packages` | set when the report was created from a package, so one visit's reports can be grouped |
| `service_form_id` | `bigint` not null → `service_forms` | |
| `form_code` | `text` not null | copy of the code, e.g. `F-SER-014` |
| `form_version` | `int` not null | version of the JSON definition used to fill it |
| `answers` | `jsonb` not null | values keyed by field id, as defined by the form definition |
| `snapshot` | `jsonb` not null | client, branch and system data as they were when the report was filled (names, address, contact, email); the report and its PDF show this, not the live catalog rows |
| `supervisor_name` | `text` not null | name of the client's supervisor who signed |
| `supervisor_signature_path` | `text` not null | path in the `report-files` bucket |
| `technician_signature_path` | `text` not null | path in the `report-files` bucket |
| `started_at` | `timestamptz` not null | when the technician created the report on the device |
| `signed_at` | `timestamptz` not null | when the last signature was captured |
| `sent_at` | `timestamptz` not null default `now()` | server time of arrival |
| `created_at` | `timestamptz` not null default `now()` | |

There is no status column: a row in this table is, by definition, Enviado.

Rules:

- **Insert:** technicians only, for themselves, through a single insert of the full row. Admins do not create reports.
- **Select:** technicians read their own reports (the app's history); admins read all.
- **Update and delete:** no policies, so neither technicians nor admins can change or remove a report. A trigger also blocks updates of every column listed above for any role, including the service role, so that the next project can only add delivery data in new columns or tables.
- A trigger checks on insert that the client, branch, system, package and form fit together and belong to the technician, and that both signature paths are inside the report's own storage folder.
- Indexes: `technician_id`, `client_id`, `branch_id`, `service_form_id`, `sent_at`.

The folio is shown zero-padded to six digits (`000123`). Formatting happens in the apps; the column stores the number. An identity column can skip numbers when an insert fails, so folios are unique and increasing but not guaranteed to be consecutive; that is acceptable.

If an upload is retried after the report already arrived, the insert fails on the primary key. The app treats that conflict on its own report id as a successful send.

### 6. Photos and signatures

A private bucket `report-files`. Paths: `{technician_id}/{report_id}/{file}`. Photos referenced in `answers` and both signatures live there.

- Technicians can upload only under their own `{technician_id}/` prefix and read only their own files.
- Admins can read all files.
- Nobody can overwrite or delete files through the API. The device uploads files first and inserts the report row last, so a report row never points at missing files. Files uploaded for a report that never arrives are orphans; cleaning them up is out of scope.
- The apps show files through short-lived signed URLs.

### 7. Existing demo data

The ownership migration needs an owner for every existing row. Because the shared cloud database holds only demo data, the migration **stops with a clear error if any catalog rows exist**. Before pushing it, the software lead runs `supabase/seeds/remove-demo-catalogs.sql`. The demo seed and its generator are updated to create the 25 demo clients for the demo technician `tecnico.demo@ejemplo.com` (the seed runs through `supabase db query`, which takes no parameters, so the email is fixed); the seed stops with a clear error if that account does not exist. The demo technician account is created from the panel.

### 8. Panel changes needed to keep working

The panel must keep working after the migration, so this project includes the minimum changes:

- Creating a client asks for its technician: a required select of active technicians. Branches, systems and packages inherit it from their parent.
- The client, branch and system lists show a "Técnico" column and can be filtered by technician.
- The branch form gets "Correo de contacto".
- Ids in routes and queries move from numbers to uuids.

`database.types.ts` is regenerated after the migration is pushed.

### 9. Documentation

- `CLAUDE.md`: describe the independent-technician model under Architecture and Security; update the offline-first rule. Sync becomes: download the technician's own catalogs and the form catalog; upload the technician's own catalog changes; upload sent reports with their files.
- `docs/project-structure.md`: new migration, tables and bucket.

## Next projects

1. **Sending:** an Edge Function triggered after a report arrives. It renders the PDF from the report row and the form definition, stores it, and emails it to the branch with copies to Nimzo and the technician. It needs an email provider, a sending domain and the Nimzo copy address. It records delivery attempts so failures can be retried. If the branch has no contact email, it falls back to the client's; if neither exists, the app warns the technician before sending, and the report is still sent with copies to Nimzo and the technician.
2. **Report history in the panel:** list with filters (technician, client, branch, form, date), search by folio, and a detail view with answers, photos and signatures.
3. **Mobile app:** local storage, sync and the form engine.

## Left to the builder

- Migration file names, trigger and function names, and the exact order of steps in the migration.
- Whether "same technician" checks live in one shared trigger function or one per table.
- The exact email format check.
- Test layout in `supabase/tests/`, following `harness.mjs`.
