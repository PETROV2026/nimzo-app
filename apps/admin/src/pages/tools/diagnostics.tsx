import Refresh from '@mui/icons-material/Refresh';
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import Grid from '@mui/material/Grid2';
import Skeleton from '@mui/material/Skeleton';
import Stack from '@mui/material/Stack';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Typography from '@mui/material/Typography';
import { userRoleLabels, type UserRole } from '@nimzo/shared';
import { useCustom } from '@refinedev/core';
import type { ReactNode } from 'react';

import { CatalogTable } from '@/components/catalog-table';
import { ExternalLink } from '@/components/external-link';
import { Notice } from '@/components/notice';
import { PageHeader } from '@/components/page-header';
import { Postbox } from '@/components/postbox';
import { build, githubUrl, supabaseProjectRef } from '@/lib/project-info';

type Diagnostics = {
  generated_at: string;
  postgres_version: string;
  tables: { name: string; rows: number; rls_enabled: boolean; policies: number }[];
  migrations: { version: string; name?: string }[];
  users: { role: UserRole; active: number; inactive: number }[];
};

const tableLabels: Record<string, string> = {
  clients: 'Clientes',
  branches: 'Sucursales',
  systems: 'Sistemas',
  profiles: 'Perfiles de usuario',
};

const dateTime = new Intl.DateTimeFormat('es-MX', { dateStyle: 'medium', timeStyle: 'short' });
const number = new Intl.NumberFormat('es-MX');

function migrationDate(version: string) {
  const match = /^(\d{4})(\d{2})(\d{2})(\d{2})(\d{2})/.exec(version);
  if (!match) return version;
  const [, year, month, day, hour, minute] = match;
  return dateTime.format(new Date(Date.UTC(+year, +month - 1, +day, +hour, +minute)));
}

function Fact({ label, children }: { label: string; children: ReactNode }) {
  return (
    <Box component="div" sx={{ display: 'grid', gap: 0.25 }}>
      <Typography variant="body2" color="text.secondary" component="dt">
        {label}
      </Typography>
      <Typography component="dd" sx={{ m: 0 }}>
        {children}
      </Typography>
    </Box>
  );
}

function MigrationStatus({ applied }: { applied: Diagnostics['migrations'] }) {
  const appliedVersions = new Set(applied.map((migration) => migration.version));
  const localVersions = new Set(build.migrations.map((file) => file.split('_')[0]));
  const pending = build.migrations.filter((file) => !appliedVersions.has(file.split('_')[0]));
  const unknown = applied.filter((migration) => !localVersions.has(migration.version));

  if (applied.length === 0) {
    return (
      <Notice severity="warning" title="No se pudo leer el historial de migraciones">
        La base no devolvió migraciones aplicadas. Revisa el proyecto en Supabase.
      </Notice>
    );
  }
  if (pending.length > 0) {
    return (
      <Notice
        severity="warning"
        title={
          pending.length === 1
            ? 'Hay 1 migración del código que todavía no está en la base'
            : `Hay ${pending.length} migraciones del código que todavía no están en la base`
        }
      >
        {pending.join(', ')}. Después de revisar el PR, el líder de software las aplica con{' '}
        <code>pnpm supabase db push</code>.
      </Notice>
    );
  }
  if (unknown.length > 0) {
    return (
      <Notice severity="info" title="La base tiene migraciones que este panel no conoce">
        Probablemente esta versión del panel es anterior a la última migración:{' '}
        {unknown.map((m) => m.version).join(', ')}.
      </Notice>
    );
  }
  return (
    <Notice severity="success" title="La base y el código están al día">
      Las {applied.length} migraciones del código están aplicadas.
    </Notice>
  );
}

export function ToolsDiagnostics() {
  const { result, query } = useCustom<Diagnostics>({
    url: 'admin_diagnostics',
    method: 'post',
    errorNotification: false,
  });
  const diagnostics = query.isSuccess ? result.data : undefined;

  return (
    <>
      <PageHeader
        title="Diagnóstico"
        description="Estado de la base de datos y de la versión publicada del panel."
        action={
          <Button
            variant="outlined"
            size="small"
            startIcon={<Refresh fontSize="small" />}
            onClick={() => query.refetch()}
            loading={query.isFetching}
          >
            Actualizar
          </Button>
        }
      />

      {query.isError ? (
        <Alert severity="error">
          No se pudo obtener el diagnóstico: {query.error?.message ?? 'error desconocido'}. Si la
          migración <code>admin_diagnostics</code> todavía no está aplicada, aplícala primero.
        </Alert>
      ) : !diagnostics ? (
        <Stack spacing={2.5}>
          <Skeleton variant="rounded" height={120} />
          <Skeleton variant="rounded" height={240} />
        </Stack>
      ) : (
        <Grid container spacing={2.5}>
          <Grid size={12}>
            <MigrationStatus applied={diagnostics.migrations} />
          </Grid>

          <Grid size={{ xs: 12, lg: 5 }}>
            <Stack spacing={2.5}>
              <Postbox title="Versión">
                <Box
                  component="dl"
                  sx={{ m: 0, display: 'grid', gap: 1.5, gridTemplateColumns: { sm: '1fr 1fr' } }}
                >
                  <Fact label="Panel (commit)">
                    {build.commit === 'unknown' ? (
                      'Desconocido'
                    ) : (
                      <ExternalLink href={`${githubUrl}/commit/${build.commit}`}>
                        {build.commit}
                      </ExternalLink>
                    )}
                  </Fact>
                  <Fact label="Panel compilado">{dateTime.format(new Date(build.builtAt))}</Fact>
                  <Fact label="PostgreSQL">{diagnostics.postgres_version}</Fact>
                  <Fact label="Proyecto de Supabase">{supabaseProjectRef}</Fact>
                  <Fact label="Consultado">
                    {dateTime.format(new Date(diagnostics.generated_at))}
                  </Fact>
                </Box>
              </Postbox>

              <Postbox title="Usuarios por rol" flush>
                <TableContainer>
                  <CatalogTable aria-label="Usuarios por rol">
                    <TableHead>
                      <TableRow>
                        <TableCell>Rol</TableCell>
                        <TableCell align="right">Activos</TableCell>
                        <TableCell align="right">Inactivos</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {diagnostics.users.map((row) => (
                        <TableRow key={row.role}>
                          <TableCell>{userRoleLabels[row.role] ?? row.role}</TableCell>
                          <TableCell align="right">{number.format(row.active)}</TableCell>
                          <TableCell align="right">{number.format(row.inactive)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </CatalogTable>
                </TableContainer>
              </Postbox>
            </Stack>
          </Grid>

          <Grid size={{ xs: 12, lg: 7 }}>
            <Stack spacing={2.5}>
              <Postbox title="Tablas" flush>
                <TableContainer>
                  <CatalogTable aria-label="Tablas de la base de datos">
                    <TableHead>
                      <TableRow>
                        <TableCell>Tabla</TableCell>
                        <TableCell align="right">Registros</TableCell>
                        <TableCell>Seguridad (RLS)</TableCell>
                        <TableCell align="right">Políticas</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {diagnostics.tables.map((table) => (
                        <TableRow key={table.name}>
                          <TableCell>
                            {tableLabels[table.name] ?? table.name}
                            <Typography variant="body2" color="text.secondary" component="div">
                              <code>{table.name}</code>
                            </Typography>
                          </TableCell>
                          <TableCell align="right">{number.format(table.rows)}</TableCell>
                          <TableCell>
                            {table.rls_enabled ? (
                              <Chip size="small" color="primary" label="Activada" />
                            ) : (
                              <Chip size="small" color="error" label="Desactivada" />
                            )}
                          </TableCell>
                          <TableCell align="right">{table.policies}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </CatalogTable>
                </TableContainer>
              </Postbox>

              <Postbox title="Migraciones aplicadas" flush collapsible>
                <TableContainer>
                  <CatalogTable aria-label="Migraciones aplicadas">
                    <TableHead>
                      <TableRow>
                        <TableCell>Migración</TableCell>
                        <TableCell>Fecha</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {diagnostics.migrations.map((migration) => (
                        <TableRow key={migration.version}>
                          <TableCell>
                            <code>{migration.name ?? migration.version}</code>
                            <Typography variant="body2" color="text.secondary" component="div">
                              {migration.version}
                            </Typography>
                          </TableCell>
                          <TableCell>{migrationDate(migration.version)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </CatalogTable>
                </TableContainer>
              </Postbox>
            </Stack>
          </Grid>
        </Grid>
      )}
    </>
  );
}
