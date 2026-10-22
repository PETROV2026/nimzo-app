import {
  systemTypeLabels,
  userRoleLabels,
  type Branch,
  type Client,
  type Profile,
  type ServiceForm,
  type System,
  toSearchText,
} from '@nimzo/shared';
import { useList, type CrudFilter } from '@refinedev/core';

export type SearchKind = 'page' | 'client' | 'branch' | 'system' | 'form' | 'user';

export type SearchResult = {
  key: string;
  kind: SearchKind;
  label: string;
  detail?: string;
  to: string;
  inactive?: boolean;
};

export type SearchGroup = { kind: SearchKind; title: string; results: SearchResult[] };

type PageEntry = { label: string; to: string; keywords: string; quick?: boolean };

const pages: PageEntry[] = [
  { label: 'Escritorio', to: '/', keywords: 'inicio resumen' },
  { label: 'Clientes', to: '/clients', keywords: 'empresas lista' },
  { label: 'Agregar cliente', to: '/clients/create', keywords: 'nuevo crear empresa', quick: true },
  { label: 'Sucursales', to: '/branches', keywords: 'lugares sitios lista' },
  { label: 'Agregar sucursal', to: '/branches/create', keywords: 'nueva crear lugar', quick: true },
  { label: 'Sistemas', to: '/systems', keywords: 'rociadores hidrantes extintores lista' },
  { label: 'Formatos', to: '/forms', keywords: 'f-ser reportes catalogo' },
  { label: 'Agregar formato', to: '/forms/create', keywords: 'nuevo crear f-ser' },
  { label: 'Usuarios', to: '/users', keywords: 'cuentas tecnicos administradores equipo' },
  {
    label: 'Agregar usuario',
    to: '/users/create',
    keywords: 'nuevo crear cuenta tecnico',
    quick: true,
  },
  {
    label: 'Diagnóstico',
    to: '/tools',
    keywords: 'herramientas migraciones tablas estado',
    quick: true,
  },
  { label: 'Consultas SQL', to: '/tools/queries', keywords: 'herramientas sql base de datos' },
  {
    label: 'Accesos rápidos',
    to: '/tools/links',
    keywords: 'herramientas enlaces supabase github',
  },
];

const PAGE_SIZE = 5;
export const MIN_TERM_LENGTH = 2;

export function normalize(text: string) {
  return text.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
}

function searchFilter(term: string): CrudFilter[] {
  return [{ field: 'search_text', operator: 'contains', value: toSearchText(term) }];
}

function pageResults(term: string): SearchResult[] {
  const query = normalize(term);
  const matches = query
    ? pages.filter((page) => normalize(`${page.label} ${page.keywords}`).includes(query))
    : pages.filter((page) => page.quick);
  return matches.slice(0, PAGE_SIZE).map((page) => ({
    key: `page:${page.to}`,
    kind: 'page',
    label: page.label,
    to: page.to,
  }));
}

type BranchRow = Branch & { clients: { name: string } | null };
type SystemRow = System & { branches: { name: string } | null };

export function useGlobalSearch(term: string) {
  const enabled = term.length >= MIN_TERM_LENGTH;
  const common = { pagination: { pageSize: PAGE_SIZE }, queryOptions: { enabled } } as const;

  const clients = useList<Client>({
    resource: 'clients',
    filters: searchFilter(term),
    sorters: [{ field: 'name', order: 'asc' }],
    ...common,
  });
  const branches = useList<BranchRow>({
    resource: 'branches',
    filters: searchFilter(term),
    sorters: [{ field: 'name', order: 'asc' }],
    meta: { select: '*, clients(name)' },
    ...common,
  });
  const systems = useList<SystemRow>({
    resource: 'systems',
    filters: searchFilter(term),
    sorters: [{ field: 'name', order: 'asc' }],
    meta: { select: '*, branches(name)' },
    ...common,
  });
  const forms = useList<ServiceForm>({
    resource: 'service_forms',
    filters: searchFilter(term),
    sorters: [{ field: 'code', order: 'asc' }],
    ...common,
  });
  const users = useList<Profile>({
    resource: 'profiles',
    filters: searchFilter(term),
    sorters: [{ field: 'full_name', order: 'asc' }],
    ...common,
  });

  const groups: SearchGroup[] = [
    {
      kind: 'page',
      title: term ? 'Páginas y acciones' : 'Accesos rápidos',
      results: pageResults(term),
    },
  ];

  if (enabled) {
    groups.push(
      {
        kind: 'client',
        title: 'Clientes',
        results: clients.result.data.map((client) => ({
          key: `client:${client.id}`,
          kind: 'client',
          label: client.name,
          detail: client.tax_id ?? undefined,
          to: `/clients/${client.id}/edit`,
          inactive: !client.is_active,
        })),
      },
      {
        kind: 'branch',
        title: 'Sucursales',
        results: branches.result.data.map((branch) => ({
          key: `branch:${branch.id}`,
          kind: 'branch',
          label: branch.name,
          detail: [branch.clients?.name, branch.city].filter(Boolean).join(', ') || undefined,
          to: `/branches/${branch.id}/edit`,
          inactive: !branch.is_active,
        })),
      },
      {
        kind: 'system',
        title: 'Sistemas',
        results: systems.result.data.map((system) => ({
          key: `system:${system.id}`,
          kind: 'system',
          label: system.name,
          detail: [systemTypeLabels[system.system_type], system.branches?.name]
            .filter(Boolean)
            .join(', '),
          to: `/branches/${system.branch_id}/edit`,
          inactive: !system.is_active,
        })),
      },
      {
        kind: 'form',
        title: 'Formatos',
        results: forms.result.data.map((form) => ({
          key: `form:${form.id}`,
          kind: 'form',
          label: `${form.code} · ${form.name}`,
          detail: form.subtitle ?? undefined,
          to: `/forms/${form.id}/edit`,
          inactive: !form.is_active,
        })),
      },
      {
        kind: 'user',
        title: 'Usuarios',
        results: users.result.data.map((user) => ({
          key: `user:${user.id}`,
          kind: 'user',
          label: user.full_name || user.email || 'Sin nombre',
          detail: [user.email, userRoleLabels[user.role]].filter(Boolean).join(', '),
          to: `/users/${user.id}/edit`,
          inactive: !user.is_active,
        })),
      },
    );
  }

  const queries = [clients.query, branches.query, systems.query, forms.query, users.query];

  return {
    groups: groups.filter((group) => group.results.length > 0),
    loading: enabled && queries.some((query) => query.isFetching),
    failed: enabled && queries.some((query) => query.isError),
  };
}
