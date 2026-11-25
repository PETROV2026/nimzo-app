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
import {
  feedbackKindLabels,
  formatFolio,
  type Client,
  type FeedbackMessage,
  type Report,
} from '@nimzo/shared';
import { useList } from '@refinedev/core';
import { useState, type ReactNode } from 'react';
import { Link as RouterLink } from 'react-router';

import { Notice } from '@/components/notice';
import { PageHeader } from '@/components/page-header';
import { Postbox } from '@/components/postbox';
import { RecentBox } from '@/components/recent-box';
import { tokens } from '@/theme';

const RECENT_COUNT = 5;
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

function WelcomePanel({ onDismiss }: { onDismiss: () => void }) {
  const steps: Step[] = [
    {
      icon: <BusinessOutlined />,
      title: 'Registra a tus clientes',
      description: 'Las empresas a las que les das servicio, con su RFC y su persona de contacto.',
      action: (
        <Link component={RouterLink} to="/clients/create" className="touch-target">
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
        <Link component={RouterLink} to="/clients" className="touch-target">
          Elegir un cliente
        </Link>
      ),
    },
    {
      icon: <GroupOutlined />,
      title: 'Crea las cuentas del equipo',
      description: 'Los técnicos entran a la app móvil con la cuenta que les crees.',
      action: (
        <Link component={RouterLink} to="/users/create" className="touch-target">
          Agregar un usuario
        </Link>
      ),
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
          to="/branches"
        />
        <SummaryRow
          icon={<LocalFireDepartmentOutlined />}
          resource="systems"
          singular="sistema"
          plural="sistemas"
          to="/systems"
        />
        <SummaryRow
          icon={<GroupOutlined />}
          resource="profiles"
          singular="usuario"
          plural="usuarios"
          to="/users"
        />
      </Box>
    </Postbox>
  );
}

type RecentReport = Pick<Report, 'id' | 'folio' | 'sent_at'> & {
  client: { name: string } | null;
  technician: { full_name: string } | null;
};

function RecentReportsBox() {
  const { result, query } = useList<RecentReport>({
    resource: 'reports',
    meta: {
      select: 'id, folio, sent_at, client:clients(name), technician:profiles(full_name)',
    },
    sorters: [{ field: 'sent_at', order: 'desc' }],
    pagination: { pageSize: RECENT_COUNT },
  });

  return (
    <RecentBox
      title="Últimos reportes"
      allTo="/reports"
      items={result.data.map((report) => ({
        id: report.id,
        label: `Folio ${formatFolio(report.folio)} · ${report.client?.name ?? '—'}`,
        to: `/reports?folio=${report.folio}`,
        detail: report.technician?.full_name,
        date: report.sent_at,
      }))}
      loading={query.isLoading}
      failed={query.isError}
      failedText="No se pudieron cargar los reportes. Recarga la página."
      emptyText="Aún no hay reportes. Aparecerán aquí cuando un técnico los envíe desde la app."
    />
  );
}

type RecentMessage = Pick<FeedbackMessage, 'id' | 'kind' | 'message' | 'created_at'> & {
  technician: { full_name: string } | null;
};

function RecentMessagesBox() {
  const { result, query } = useList<RecentMessage>({
    resource: 'feedback_messages',
    meta: { select: 'id, kind, message, created_at, technician:profiles(full_name)' },
    sorters: [{ field: 'created_at', order: 'desc' }],
    pagination: { pageSize: RECENT_COUNT },
  });

  return (
    <RecentBox
      title="Últimos mensajes"
      allTo="/messages"
      items={result.data.map((message) => ({
        id: message.id,
        label: message.message,
        to: `/messages/${message.id}`,
        detail: [feedbackKindLabels[message.kind], message.technician?.full_name]
          .filter(Boolean)
          .join(' · '),
        date: message.created_at,
      }))}
      loading={query.isLoading}
      failed={query.isError}
      failedText="No se pudieron cargar los mensajes. Recarga la página."
      emptyText="Aún no hay mensajes. Aparecerán aquí cuando un técnico envíe un comentario."
    />
  );
}

function RecentClientsBox() {
  const { result, query } = useList<Client>({
    resource: 'clients',
    sorters: [{ field: 'created_at', order: 'desc' }],
    pagination: { pageSize: RECENT_COUNT },
  });

  return (
    <RecentBox
      title="Clientes recientes"
      allTo="/clients"
      items={result.data.map((client) => ({
        id: client.id,
        label: client.name,
        to: `/clients/${client.id}/edit`,
        date: client.created_at,
      }))}
      loading={query.isLoading}
      failed={query.isError}
      failedText="No se pudieron cargar los clientes. Recarga la página."
      emptyText="Aún no hay clientes. Los que agregues aparecerán aquí."
    />
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
          <RecentReportsBox />
        </Grid>
        <Grid size={{ xs: 12, lg: 6 }}>
          <RecentMessagesBox />
        </Grid>
        <Grid size={{ xs: 12, lg: 6 }}>
          <RecentClientsBox />
        </Grid>
      </Grid>
    </>
  );
}
