export type DevQuery = {
  id: string;
  title: string;
  description: string;
  sql: string;
  supabaseOnly?: boolean;
};

export type DevQueryGroup = {
  title: string;
  queries: DevQuery[];
};

export const devQueryGroups: DevQueryGroup[] = [
  {
    title: 'Clientes y sucursales',
    queries: [
      {
        id: 'clients-without-branches',
        title: 'Clientes activos sin sucursales',
        description:
          'Clientes dados de alta a los que todavía no se les registró ningún lugar de servicio.',
        sql: `select c.id, c.name, c.created_at
from public.clients c
where c.is_active
  and not exists (select 1 from public.branches b where b.client_id = c.id)
order by c.name;`,
      },
      {
        id: 'branches-without-systems',
        title: 'Sucursales activas sin sistemas',
        description: 'Sucursales en las que un técnico no tendría nada que inspeccionar.',
        sql: `select c.name as client, b.name as branch, b.city, b.state
from public.branches b
join public.clients c on c.id = b.client_id
where b.is_active
  and not exists (select 1 from public.systems s where s.branch_id = b.id)
order by c.name, b.name;`,
      },
      {
        id: 'branches-by-state',
        title: 'Sucursales por estado',
        description:
          'Cuántas sucursales activas e inactivas hay en cada estado (código ISO, por ejemplo NLE).',
        sql: `select coalesce(b.state, 'none') as state,
  count(*) filter (where b.is_active) as active,
  count(*) filter (where not b.is_active) as inactive
from public.branches b
group by b.state
order by active desc, state;`,
      },
      {
        id: 'top-clients-by-systems',
        title: 'Clientes con más sistemas',
        description: 'Los 10 clientes con más sistemas registrados, con su número de sucursales.',
        sql: `select c.name as client,
  count(distinct b.id) as branches,
  count(s.id) as systems
from public.clients c
left join public.branches b on b.client_id = c.id
left join public.systems s on s.branch_id = b.id
group by c.id, c.name
order by systems desc, c.name
limit 10;`,
      },
    ],
  },
  {
    title: 'Sistemas',
    queries: [
      {
        id: 'systems-by-type',
        title: 'Sistemas por tipo',
        description: 'Cuántos sistemas activos e inactivos hay de cada tipo.',
        sql: `select s.system_type,
  count(*) filter (where s.is_active) as active,
  count(*) filter (where not s.is_active) as inactive
from public.systems s
group by s.system_type
order by active desc;`,
      },
      {
        id: 'systems-of-client',
        title: 'Sistemas de un cliente',
        description:
          "Todos los sistemas de un cliente, por sucursal. Cambia 'Aceros' por parte del nombre del cliente.",
        sql: `select b.name as branch, s.system_type, s.name as system, s.location, s.is_active
from public.systems s
join public.branches b on b.id = s.branch_id
join public.clients c on c.id = b.client_id
where c.name ilike '%Aceros%'
order by b.name, s.name;`,
      },
      {
        id: 'active-systems-in-inactive-parents',
        title: 'Sistemas activos en sucursales o clientes inactivos',
        description:
          'Inconsistencias: el sistema sigue activo aunque su sucursal o su cliente se desactivó.',
        sql: `select c.name as client, c.is_active as client_active,
  b.name as branch, b.is_active as branch_active,
  s.name as system
from public.systems s
join public.branches b on b.id = s.branch_id
join public.clients c on c.id = b.client_id
where s.is_active
  and (not b.is_active or not c.is_active)
order by c.name, b.name, s.name;`,
      },
      {
        id: 'recent-catalog-changes',
        title: 'Últimos cambios en catálogos',
        description: 'Los 20 clientes, sucursales o sistemas modificados más recientemente.',
        sql: `select 'client' as kind, name, updated_at from public.clients
union all
select 'branch', name, updated_at from public.branches
union all
select 'system', name, updated_at from public.systems
order by updated_at desc
limit 20;`,
      },
    ],
  },
  {
    title: 'Usuarios',
    queries: [
      {
        id: 'users-by-role',
        title: 'Usuarios por rol',
        description: 'Cuántas cuentas activas e inactivas hay de cada rol.',
        sql: `select p.role,
  count(*) filter (where p.is_active) as active,
  count(*) filter (where not p.is_active) as inactive
from public.profiles p
group by p.role
order by p.role;`,
      },
      {
        id: 'recent-sign-ins',
        title: 'Últimos inicios de sesión',
        description: 'Las 20 cuentas que entraron más recientemente, en la app o en el panel.',
        sql: `select u.email, p.full_name, p.role, u.last_sign_in_at
from auth.users u
join public.profiles p on p.id = u.id
where u.last_sign_in_at is not null
order by u.last_sign_in_at desc
limit 20;`,
      },
      {
        id: 'users-never-signed-in',
        title: 'Cuentas que nunca han entrado',
        description:
          'Cuentas creadas que todavía no inician sesión: quizá falta entregarles su contraseña.',
        sql: `select u.email, p.full_name, p.role, u.created_at
from auth.users u
join public.profiles p on p.id = u.id
where u.last_sign_in_at is null
order by u.created_at desc;`,
      },
    ],
  },
  {
    title: 'Base de datos',
    queries: [
      {
        id: 'table-sizes',
        title: 'Tamaño de cada tabla',
        description: 'Espacio que ocupa cada tabla del esquema public, con sus índices.',
        sql: `select c.relname as table_name,
  pg_size_pretty(pg_total_relation_size(c.oid)) as total_size
from pg_class c
join pg_namespace n on n.oid = c.relnamespace
where n.nspname = 'public' and c.relkind = 'r'
order by pg_total_relation_size(c.oid) desc;`,
      },
      {
        id: 'rls-policies',
        title: 'Políticas de seguridad (RLS)',
        description: 'Quién puede leer y escribir cada tabla: una fila por política.',
        sql: `select tablename, policyname, cmd, roles
from pg_policies
where schemaname = 'public'
order by tablename, cmd, policyname;`,
      },
      {
        id: 'enum-values',
        title: 'Valores permitidos (enums)',
        description:
          'Los códigos en inglés que aceptan las columnas con lista fija, como roles y tipos de sistema.',
        sql: `select t.typname as enum_name, e.enumlabel as value
from pg_type t
join pg_enum e on e.enumtypid = t.oid
join pg_namespace n on n.oid = t.typnamespace
where n.nspname = 'public'
order by t.typname, e.enumsortorder;`,
      },
      {
        id: 'applied-migrations',
        title: 'Migraciones aplicadas',
        description:
          'Las migraciones que ya están en la base, de la más reciente a la más antigua.',
        supabaseOnly: true,
        sql: `select version, name
from supabase_migrations.schema_migrations
order by version desc;`,
      },
      {
        id: 'demo-data',
        title: 'Datos de ejemplo cargados',
        description: "Cuántos clientes de ejemplo hay (los que tienen la nota 'Datos de ejemplo').",
        sql: `select count(*) as demo_clients
from public.clients
where notes = 'Datos de ejemplo';`,
      },
    ],
  },
];
