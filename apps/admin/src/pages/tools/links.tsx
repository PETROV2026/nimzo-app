import Box from '@mui/material/Box';
import Grid from '@mui/material/Grid2';
import Typography from '@mui/material/Typography';

import { ExternalLink } from '@/components/external-link';
import { PageHeader } from '@/components/page-header';
import { Postbox } from '@/components/postbox';
import { githubUrl, supabaseDashboardUrl, supabaseProjectRef } from '@/lib/project-info';

type QuickLink = { label: string; description: string; href: string };
type LinkGroup = { title: string; links: QuickLink[] };

const docsUrl = `${githubUrl}/blob/develop`;

const groups: LinkGroup[] = [
  {
    title: `Supabase · proyecto ${supabaseProjectRef}`,
    links: [
      {
        label: 'SQL Editor',
        description: 'Ejecutar las consultas de la biblioteca.',
        href: `${supabaseDashboardUrl}/sql/new`,
      },
      {
        label: 'Editor de tablas',
        description: 'Ver y filtrar registros tabla por tabla.',
        href: `${supabaseDashboardUrl}/editor`,
      },
      {
        label: 'Usuarios (Auth)',
        description: 'Crear cuentas y restablecer contraseñas.',
        href: `${supabaseDashboardUrl}/auth/users`,
      },
      {
        label: 'Logs',
        description: 'Errores de la base, de Auth y de la API.',
        href: `${supabaseDashboardUrl}/logs/explorer`,
      },
      {
        label: 'Asesor de seguridad',
        description: 'Avisos de RLS y permisos que revisar.',
        href: `${supabaseDashboardUrl}/advisors/security`,
      },
    ],
  },
  {
    title: 'GitHub',
    links: [
      { label: 'Repositorio', description: 'Código del monorepo.', href: githubUrl },
      {
        label: 'Pull requests abiertos',
        description: 'Cambios esperando revisión.',
        href: `${githubUrl}/pulls`,
      },
      { label: 'Issues', description: 'Tareas del equipo.', href: `${githubUrl}/issues` },
      {
        label: 'Actions (CI)',
        description: 'Resultado de las verificaciones de cada PR.',
        href: `${githubUrl}/actions`,
      },
    ],
  },
  {
    title: 'Documentación del proyecto',
    links: [
      {
        label: 'Estructura del proyecto',
        description: 'Qué hay en cada carpeta y cómo correr cada app.',
        href: `${docsUrl}/docs/project-structure.md`,
      },
      {
        label: 'Cómo contribuir',
        description: 'Ramas, commits, PRs y migraciones.',
        href: `${docsUrl}/CONTRIBUTING.md`,
      },
      {
        label: 'Principios de UX',
        description: 'Reglas para diseñar pantallas.',
        href: `${docsUrl}/docs/ux-principles.es.md`,
      },
      {
        label: 'Guía de Material UI',
        description: 'Cómo se construye este panel.',
        href: `${docsUrl}/docs/ai/material-ui.md`,
      },
    ],
  },
  {
    title: 'Documentación externa',
    links: [
      {
        label: 'Refine',
        description: 'Hooks de datos y formularios del panel.',
        href: 'https://refine.dev/docs/',
      },
      {
        label: 'Material UI v6',
        description: 'Componentes del panel (versión 6).',
        href: 'https://v6.mui.com/material-ui/',
      },
      {
        label: 'Supabase',
        description: 'Base de datos, Auth y RLS.',
        href: 'https://supabase.com/docs',
      },
      {
        label: 'Expo SDK 57',
        description: 'App móvil.',
        href: 'https://docs.expo.dev/versions/v57.0.0/',
      },
    ],
  },
];

export function ToolsLinks() {
  return (
    <>
      <PageHeader
        title="Accesos rápidos"
        description="Las herramientas externas que más usamos para administrar y desarrollar Nimzo."
      />
      <Grid container spacing={2.5}>
        {groups.map((group) => (
          <Grid key={group.title} size={{ xs: 12, lg: 6 }}>
            <Postbox title={group.title}>
              <Box
                component="ul"
                sx={{ listStyle: 'none', m: 0, p: 0, display: 'grid', gap: 1.75 }}
              >
                {group.links.map((link) => (
                  <li key={link.href}>
                    <ExternalLink href={link.href}>{link.label}</ExternalLink>
                    <Typography variant="body2" color="text.secondary">
                      {link.description}
                    </Typography>
                  </li>
                ))}
              </Box>
            </Postbox>
          </Grid>
        ))}
      </Grid>
    </>
  );
}
