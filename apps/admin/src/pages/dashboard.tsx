import ApartmentOutlined from '@mui/icons-material/ApartmentOutlined';
import BusinessOutlined from '@mui/icons-material/BusinessOutlined';
import CloseIcon from '@mui/icons-material/Close';
import GroupOutlined from '@mui/icons-material/GroupOutlined';
import LocalFireDepartmentOutlined from '@mui/icons-material/LocalFireDepartmentOutlined';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Grid from '@mui/material/Grid2';
import Link from '@mui/material/Link';
import Paper from '@mui/material/Paper';
import Skeleton from '@mui/material/Skeleton';
import Typography from '@mui/material/Typography';
import iconWhite from '@nimzo/brand/logos/icon-white.webp';
import type { Client } from '@nimzo/shared';
import { useList } from '@refinedev/core';
import { useState, type ReactNode } from 'react';
import { Link as RouterLink } from 'react-router';

import { Notice } from '@/components/notice';
import { PageHeader } from '@/components/page-header';
import { Postbox } from '@/components/postbox';
import { tokens } from '@/theme';

const WELCOME_DISMISSED_KEY = 'nimzo.dashboard.welcomeDismissed';

function readDismissed() {
  try {
    return localStorage.getItem(WELCOME_DISMISSED_KEY) === '1';
  } catch {
    return false;
  }
}

function useCount(resource: string) {
  const { result, query } = useList({ resource, pagination: { pageSize: 1 } });
  return { total: result.total ?? 0, loading: query.isLoading, error: query.isError };
}

type Step = { icon: ReactNode; title: string; description: string; action: ReactNode };

const comingSoon = (
  <Typography variant="body2" color="text.secondary">
    Disponible próximamente
  </Typography>
);

function WelcomePanel({ onDismiss }: { onDismiss: () => void }) {
  const steps: Step[] = [
    {
      icon: <BusinessOutlined />,
      title: 'Registra a tus clientes',
      description: 'Las empresas a las que les das servicio, con su RFC y su persona de contacto.',
      action: (
        <Link component={RouterLink} to="/clients/create">
          Agregar un cliente
        </Link>
      ),
    },
    {
      icon: <LocalFireDepartmentOutlined />,
      title: 'Agrega sucursales y sistemas',
      description:
        'Cada sucursal tiene los sistemas contra incendio que los técnicos inspeccionan.',
      action: (
        <Link component={RouterLink} to="/clients">
          Elegir un cliente
        </Link>
      ),
    },
    {
      icon: <GroupOutlined />,
      title: 'Crea las cuentas del equipo',
      description: 'Técnicos y supervisores entran a la app móvil con la cuenta que les crees.',
      action: comingSoon,
    },
  ];

  return (
    <Paper variant="outlined" sx={{ overflow: 'hidden', mb: 2.5 }}>
      <Box
        sx={{
          position: 'relative',
          overflow: 'hidden',
          bgcolor: tokens.adminBar,
          color: tokens.white,
          px: { xs: 3, md: 6 },
          py: { xs: 4, md: 6 },
        }}
      >
        <Box
          component="img"
          src={iconWhite}
          alt=""
          aria-hidden
          sx={{
            position: 'absolute',
            right: { xs: -60, md: 48 },
            top: '50%',
            transform: 'translateY(-50%)',
            height: '150%',
            opacity: 0.06,
            pointerEvents: 'none',
          }}
        />
        <Button
          onClick={onDismiss}
          startIcon={<CloseIcon fontSize="small" />}
          sx={{
            position: 'absolute',
            top: 12,
            right: 12,
            color: tokens.white,
            '&:hover': { color: tokens.yellow },
          }}
        >
          Descartar
        </Button>
        <Typography variant="h4" component="h2" sx={{ position: 'relative', maxWidth: 640 }}>
          Bienvenido a Nimzo
        </Typography>
        <Typography
          sx={{
            position: 'relative',
            mt: 1.5,
            maxWidth: 560,
            color: 'rgba(255,255,255,0.8)',
            fontSize: 16,
          }}
        >
          Desde aquí preparas todo lo que los técnicos necesitan para inspeccionar, probar y dar
          mantenimiento a los sistemas contra incendio.
        </Typography>
      </Box>

      <Grid
        component="ol"
        container
        spacing={4}
        sx={{ listStyle: 'none', m: 0, px: { xs: 3, md: 6 }, py: 4 }}
      >
        {steps.map((step) => (
          <Grid
            key={step.title}
            component="li"
            size={{ xs: 12, md: 4 }}
            sx={{ display: 'flex', gap: 2 }}
          >
            <Box
              sx={{
                flexShrink: 0,
                display: 'grid',
                placeItems: 'center',
                width: 44,
                height: 44,
                borderRadius: 1,
                bgcolor: tokens.sidebar,
                color: tokens.white,
              }}
            >
              {step.icon}
            </Box>
            <Box>
              <Typography variant="h3">{step.title}</Typography>
              <Typography color="text.secondary" sx={{ mt: 0.75, mb: 1.25 }}>
                {step.description}
              </Typography>
              {step.action}
            </Box>
          </Grid>
        ))}
      </Grid>
    </Paper>
  );
}

type SummaryRowProps = {
  icon: ReactNode;
  resource: string;
  singular: string;
  plural: string;
  to?: string;
};

function SummaryRow({ icon, resource, singular, plural, to }: SummaryRowProps) {
  const { total, loading, error } = useCount(resource);
  const text = error ? `${plural}: no disponible` : `${total} ${total === 1 ? singular : plural}`;

  return (
    <Box component="li" sx={{ display: 'flex', alignItems: 'center', gap: 1.25, minHeight: 36 }}>
      <Box sx={{ display: 'flex', color: 'text.secondary', '& svg': { fontSize: 20 } }}>{icon}</Box>
      {loading ? (
        <Skeleton width={110} />
      ) : to ? (
        <Link component={RouterLink} to={to}>
          {text}
        </Link>
      ) : (
        <Typography>{text}</Typography>
      )}
    </Box>
  );
}

function SummaryBox() {
  return (
    <Postbox title="Resumen" collapsible>
      <Box
        component="ul"
        sx={{
          listStyle: 'none',
          m: 0,
          p: 0,
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: 0.5,
        }}
      >
        <SummaryRow
          icon={<BusinessOutlined />}
          resource="clients"
          singular="cliente"
          plural="clientes"
          to="/clients"
        />
        <SummaryRow
          icon={<ApartmentOutlined />}
          resource="branches"
          singular="sucursal"
          plural="sucursales"
        />
        <SummaryRow
          icon={<LocalFireDepartmentOutlined />}
          resource="systems"
          singular="sistema"
          plural="sistemas"
        />
        <SummaryRow
          icon={<GroupOutlined />}
          resource="profiles"
          singular="usuario"
          plural="usuarios"
        />
      </Box>
    </Postbox>
  );
}

const dateFormat = new Intl.DateTimeFormat('es-MX', {
  day: 'numeric',
  month: 'short',
  year: 'numeric',
});

function RecentClientsBox() {
  const { result, query } = useList<Client>({
    resource: 'clients',
    sorters: [{ field: 'created_at', order: 'desc' }],
    pagination: { pageSize: 5 },
  });

  let content: ReactNode;
  if (query.isLoading) {
    content = (
      <>
        <Skeleton />
        <Skeleton />
        <Skeleton />
      </>
    );
  } else if (query.isError) {
    content = (
      <Typography color="error">No se pudieron cargar los clientes. Recarga la página.</Typography>
    );
  } else if (result.data.length === 0) {
    content = (
      <Typography color="text.secondary">
        Aún no hay clientes. Los que agregues aparecerán aquí.
      </Typography>
    );
  } else {
    content = (
      <Box component="ul" sx={{ listStyle: 'none', m: 0, p: 0 }}>
        {result.data.map((client) => (
          <Box
            component="li"
            key={client.id}
            sx={{
              display: 'flex',
              justifyContent: 'space-between',
              gap: 2,
              py: 1,
              borderBottom: 1,
              borderColor: 'divider',
              '&:last-of-type': { borderBottom: 0 },
            }}
          >
            <Link component={RouterLink} to={`/clients/${client.id}/edit`} noWrap>
              {client.name}
            </Link>
            <Typography variant="body2" color="text.secondary" sx={{ flexShrink: 0 }}>
              {dateFormat.format(new Date(client.created_at))}
            </Typography>
          </Box>
        ))}
      </Box>
    );
  }

  return (
    <Postbox
      title="Clientes recientes"
      collapsible
      action={
        <Link component={RouterLink} to="/clients" variant="body2">
          Ver todos
        </Link>
      }
    >
      {content}
    </Postbox>
  );
}

export function DashboardPage() {
  const [welcomeDismissed, setWelcomeDismissed] = useState(readDismissed);
  const clients = useCount('clients');

  function dismissWelcome() {
    setWelcomeDismissed(true);
    try {
      localStorage.setItem(WELCOME_DISMISSED_KEY, '1');
    } catch {}
  }

  return (
    <>
      <PageHeader title="Escritorio" />

      {!clients.loading && !clients.error && clients.total === 0 && (
        <Box sx={{ mb: 2.5 }}>
          <Notice
            severity="warning"
            title="Aún no hay clientes registrados"
            actions={
              <Button component={RouterLink} to="/clients/create" variant="contained">
                Agregar cliente
              </Button>
            }
          >
            Registra al primero para empezar a organizar sus sucursales y sistemas.
          </Notice>
        </Box>
      )}

      {!welcomeDismissed && <WelcomePanel onDismiss={dismissWelcome} />}

      <Grid container spacing={2.5}>
        <Grid size={{ xs: 12, lg: 6 }}>
          <SummaryBox />
        </Grid>
        <Grid size={{ xs: 12, lg: 6 }}>
          <RecentClientsBox />
        </Grid>
      </Grid>
    </>
  );
}
