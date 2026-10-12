# Material UI guidelines (admin panel)

Rules for building `apps/admin` with Material UI (MUI) and Refine. They apply to people and to AI assistants. When a rule here conflicts with a generic MUI tutorial, this document wins.

## Versions

| Package | Version | Why |
|---|---|---|
| `@mui/material`, `@mui/icons-material` | **v6** | `@refinedev/mui` 8 requires MUI v6. Do not upgrade to v7+ until Refine supports it. |
| `@mui/x-data-grid` | v8 | Required by `@refinedev/mui` 8. |
| `@mui/lab` | `6.0.1-beta.x` | Required by `@refinedev/mui` 8. |
| `@refinedev/mui` | v8 | CRUD components and hooks on top of MUI. |

MUI APIs change between majors. Check the **v6** documentation (https://v6.mui.com/material-ui/), not the latest site, before using an API you are not sure about.

## 1. Use Refine's MUI building blocks for CRUD

Every resource page (list, create, edit, show) starts from Refine's components, not from a blank page.

| Need | Use |
|---|---|
| List page with table | `<List>` + `useDataGrid()` + `<DataGrid {...dataGridProps}>` |
| Create / edit form | `<Create>` / `<Edit>` + `useForm()` from `@refinedev/react-hook-form` |
| Detail page | `<Show>` + `useShow()` |
| Row actions | `<EditButton>`, `<ShowButton>`, `<CreateButton>`, `<SaveButton>` |
| Notifications | `useNotificationProvider` (already wired in `App.tsx`) |

```tsx
// List with server-side pagination, sorting and filtering.
import { DataGrid, type GridColDef } from '@mui/x-data-grid';
import { EditButton, List, useDataGrid } from '@refinedev/mui';
import { useMemo } from 'react';

export function ClientList() {
  const { dataGridProps } = useDataGrid({ resource: 'clients' });

  const columns = useMemo<GridColDef[]>(
    () => [
      { field: 'name', headerName: 'Nombre', flex: 1, minWidth: 200 },
      { field: 'tax_id', headerName: 'RFC', minWidth: 140 },
      {
        field: 'actions',
        headerName: 'Acciones',
        sortable: false,
        renderCell: ({ row }) => <EditButton hideText recordItemId={row.id} />,
      },
    ],
    [],
  );

  return (
    <List title="Clientes">
      <DataGrid {...dataGridProps} columns={columns} />
    </List>
  );
}
```

```tsx
// Form: react-hook-form via Refine. Errors come from the Zod schema in @nimzo/shared.
import TextField from '@mui/material/TextField';
import { Create } from '@refinedev/mui';
import { useForm } from '@refinedev/react-hook-form';

export function ClientCreate() {
  const {
    saveButtonProps,
    register,
    formState: { errors },
  } = useForm({ refineCoreProps: { resource: 'clients' } });

  return (
    <Create saveButtonProps={saveButtonProps} title="Nuevo cliente">
      <TextField
        {...register('name', { required: 'El nombre es obligatorio' })}
        label="Nombre"
        error={!!errors.name}
        helperText={errors.name?.message as string}
        fullWidth
        margin="normal"
      />
    </Create>
  );
}
```

- **Data goes through Refine hooks** (`useDataGrid`, `useForm`, `useList`, `useUpdate`…). Never call `supabase.from(...)` from a component.
- **DataGrid stays server-side**: pass `dataGridProps` as-is so pagination, sorting and filtering run in Supabase. Don't load whole tables into the browser.
- **Wrap `columns` in `useMemo`.** A new array on every render makes the DataGrid recompute everything.
- For `Select`, `Autocomplete`, `Switch` and date pickers use react-hook-form's `Controller` (they are controlled components); `register` is only for plain inputs.
- Validate with the **Zod schemas in `packages/shared`** through `zodResolver` (add `@hookform/resolvers` to `apps/admin` the first time it's needed), so the mobile app can reuse the same rules.

## 2. Theme first, never hardcode

The only theme lives in `apps/admin/src/theme.ts`.

- **No hex colors, pixel spacing or font sizes in components.** Use theme tokens:
  - colors: `color: 'text.secondary'`, `bgcolor: 'background.paper'`, `color: 'error.main'`
  - spacing: `p: 2`, `mt: 3`, `gap: 1` (multiples of 8 px)
  - typography: `<Typography variant="h5">`, not `fontSize: 22`
- **Change a component everywhere through the theme**, not per instance:

  ```ts
  // theme.ts
  createTheme(base, {
    components: {
      MuiTextField: { defaultProps: { size: 'small' } },
      MuiButton: { defaultProps: { disableElevation: true } },
    },
  });
  ```
- Brand colors, once we have them, go in `palette.primary` / `palette.secondary` in `theme.ts`.
- Spanish texts for MUI and the DataGrid come from the `esES` locales already added to the theme. Don't override them by hand.

## 3. Styling: `sx` for one-offs, `styled()` for reuse

| Case | Use |
|---|---|
| Small layout tweak on one element | `sx` prop |
| Same styles reused in several places | `styled()` component in `src/components/` |
| Change every instance of a component | `theme.components` (see above) |

- **Never** use inline `style={{…}}`, CSS files, Tailwind or `!important`.
- Keep `sx` short. If it grows past ~5 properties or appears twice, extract a `styled()` component.
- Responsive values use breakpoints: `sx={{ flexDirection: { xs: 'column', md: 'row' } }}`.

## 4. Layout

- Page layout: Refine's `<ThemedLayout>` (sidebar + header) for every authenticated route.
- Inside a page: `Stack` for one-dimensional layouts, `Grid2` (`@mui/material/Grid2`) for two-dimensional ones, `Box` only as a last resort.
- Prefer `Grid2` over the legacy `Grid` (`@mui/material/Grid`), which is being phased out (renamed `GridLegacy` in v7). Using `Grid2` now makes the future upgrade trivial.
- The panel is used on desktop, but must still work on a laptop at 1280 px and on a tablet.

## 5. Imports

```ts
// ✅ one component per path import (faster dev server, consistent with the codebase)
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import EditIcon from '@mui/icons-material/Edit';

// ❌ barrel imports
import { Button, TextField } from '@mui/material';
import { Edit } from '@mui/icons-material';
```

- Icons come from `@mui/icons-material` only. Don't add another icon library.
- Don't add other UI libraries (shadcn/ui, Ant Design, Chakra, Tailwind…). One design system.

## 6. Accessibility (WCAG 2.1, see `docs/ux-principles.es.md`)

- Every input has a visible `label`. Placeholders are not labels.
- Every `IconButton` has an `aria-label` (`<IconButton aria-label="Editar cliente">`).
- Page titles use the right heading level: `<Typography variant="h4" component="h1">`.
- Never communicate state with color alone: an inactive client shows a `Chip` with the text "Inactivo", not just grey text.
- Keep MUI's focus styles. Don't remove outlines.
- Dialogs (`Dialog`) need a `DialogTitle`; destructive actions ask for confirmation.

## 7. UX states

Every data view handles three states besides the happy path:

| State | How |
|---|---|
| Loading | DataGrid `loading` (from `dataGridProps`), `Skeleton` for cards, disabled `SaveButton` while saving |
| Empty | DataGrid `slots.noRowsOverlay` with a short message and the primary action ("Aún no hay clientes" + "Crear cliente") |
| Error | Refine notifications for mutations; an `Alert severity="error"` for failed loads |

One primary action per screen (`variant="contained"`); secondary actions are `outlined` or `text`.

## 8. Performance

- Lazy-load each resource's pages so the first load stays small:

  ```tsx
  const ClientList = lazy(() => import('@/pages/clients/list'));
  ```
- Don't create objects or functions inside `sx` in large lists; hoist them or use `styled()`.
- `useMemo` for DataGrid `columns`; `useCallback` for handlers passed to rows.

## 9. File layout

```
apps/admin/src/
├── theme.ts                 single MUI theme
├── components/              reusable components (styled(), shared widgets)
├── pages/<resource>/        list.tsx, create.tsx, edit.tsx, show.tsx per resource
└── providers/               auth provider and other Refine providers
```

Component and file names are English (`ClientList`, `clients/list.tsx`); every text the user sees is Spanish.
