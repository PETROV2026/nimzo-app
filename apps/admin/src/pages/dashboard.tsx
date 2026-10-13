import AddIcon from '@mui/icons-material/Add';
import ApartmentOutlined from '@mui/icons-material/ApartmentOutlined';
import BusinessOutlined from '@mui/icons-material/BusinessOutlined';
import GroupOutlined from '@mui/icons-material/GroupOutlined';
import LocalFireDepartmentOutlined from '@mui/icons-material/LocalFireDepartmentOutlined';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import CardActionArea from '@mui/material/CardActionArea';
import Grid from '@mui/material/Grid2';
import Skeleton from '@mui/material/Skeleton';
import Typography from '@mui/material/Typography';
import { useGetIdentity, useList } from '@refinedev/core';
import type { ReactNode } from 'react';
import { Link } from 'react-router';

import type { Identity } from '@/providers/auth-provider';
import { tokens } from '@/theme';

function useCount(resource: string) {
  const { result, query } = useList({ resource, pagination: { pageSize: 1 } });
  return { total: result.total ?? 0, loading: query.isLoading, error: query.isError };
}

type SummaryProps = { label: string; icon: ReactNode; resource: string; to?: string };

function SummaryCard({ label, icon, resource, to }: SummaryProps) {
  const { total, loading, error } = useCount(resource);

  const content = (
    <Box sx={{ p: 3, display: 'flex', alignItems: 'center', gap: 2.5 }}>
      <Box
        sx={{
          display: 'grid',
          placeItems: 'center',
          width: 48,
          height: 48,
          borderRadius: '10px',
          bgcolor: tokens.stone,
          color: 'primary.main',
        }}
      >
        {icon}
      </Box>
      <Box>
        <Typography variant="h2" component="p" sx={{ lineHeight: 1 }}>
          {loading ? <Skeleton width={40} /> : error ? '—' : total}
        </Typography>
        <Typography color="text.secondary">{label}</Typography>
      </Box>
    </Box>
  );

  return (
    <Card sx={{ height: '100%' }}>
      {to ? (
        <CardActionArea component={Link} to={to} sx={{ height: '100%' }}>
          {content}
        </CardActionArea>
      ) : (
        content
      )}
    </Card>
  );
}

export function DashboardPage() {
  const { data: identity } = useGetIdentity<Identity>();
  const clients = useCount('clients');
  const firstName = identity?.fullName.split(' ')[0];

  return (
    <>
      <Box sx={{ mb: 5 }}>
        <Typography variant="h1" component="h1" gutterBottom>
          {firstName ? `Hola, ${firstName}` : 'Inicio'}
        </Typography>
        <Typography color="text.secondary">Resumen de lo que está registrado en Nimzo.</Typography>
      </Box>

      <Grid container spacing={2}>
        <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
          <SummaryCard
            label="Clientes"
            icon={<BusinessOutlined />}
            resource="clients"
            to="/clients"
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
          <SummaryCard label="Sucursales" icon={<ApartmentOutlined />} resource="branches" />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
          <SummaryCard label="Sistemas" icon={<LocalFireDepartmentOutlined />} resource="systems" />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
          <SummaryCard label="Usuarios" icon={<GroupOutlined />} resource="profiles" />
        </Grid>
      </Grid>

      {!clients.loading && !clients.error && clients.total === 0 && (
        <Card sx={{ mt: 3, p: { xs: 3, sm: 4 } }}>
          <Typography variant="h5" component="h2" gutterBottom>
            Empieza registrando a tu primer cliente
          </Typography>
          <Typography color="text.secondary" sx={{ mb: 3, maxWidth: 560 }}>
            Cada cliente tendrá sus sucursales y los sistemas contra incendio que se inspeccionan en
            cada una.
          </Typography>
          <Button component={Link} to="/clients/create" variant="contained" startIcon={<AddIcon />}>
            Agregar cliente
          </Button>
        </Card>
      )}
    </>
  );
}
