import BusinessOutlined from '@mui/icons-material/BusinessOutlined';
import LocalFireDepartmentOutlined from '@mui/icons-material/LocalFireDepartmentOutlined';
import PlaceOutlined from '@mui/icons-material/PlaceOutlined';
import SpaceDashboardOutlined from '@mui/icons-material/SpaceDashboardOutlined';
import Box from '@mui/material/Box';
import CircularProgress from '@mui/material/CircularProgress';
import CssBaseline from '@mui/material/CssBaseline';
import { ThemeProvider } from '@mui/material/styles';
import { Authenticated, Refine } from '@refinedev/core';
import routerProvider, {
  CatchAllNavigate,
  DocumentTitleHandler,
  NavigateToResource,
  UnsavedChangesNotifier,
} from '@refinedev/react-router';
import { dataProvider, liveProvider } from '@refinedev/supabase';
import { lazy, Suspense, useEffect } from 'react';
import { BrowserRouter, Outlet, Route, Routes } from 'react-router';

import { AppLayout } from '@/components/layout/app-layout';
import { SnackbarProvider } from '@/components/snackbar-provider';
import { supabase } from '@/lib/supabase';
import { DashboardPage } from '@/pages/dashboard';
import { LoginPage } from '@/pages/login';
import { NotFoundPage } from '@/pages/not-found';
import { authProvider } from '@/providers/auth-provider';
import { i18nProvider } from '@/providers/i18n-provider';
import { useNotificationProvider } from '@/providers/notification-provider';
import { theme } from '@/theme';

const loadClients = () => import('@/pages/clients');

const ClientList = lazy(() => loadClients().then((module) => ({ default: module.ClientList })));
const ClientCreate = lazy(() => loadClients().then((module) => ({ default: module.ClientCreate })));
const ClientEdit = lazy(() => loadClients().then((module) => ({ default: module.ClientEdit })));

const loadBranches = () => import('@/pages/branches');

const BranchCreate = lazy(() =>
  loadBranches().then((module) => ({ default: module.BranchCreate })),
);
const BranchEdit = lazy(() => loadBranches().then((module) => ({ default: module.BranchEdit })));
const BranchList = lazy(() => loadBranches().then((module) => ({ default: module.BranchList })));

const loadSystems = () => import('@/pages/systems');

const SystemList = lazy(() => loadSystems().then((module) => ({ default: module.SystemList })));

function ProtectedLayout() {
  useEffect(() => {
    const id = setTimeout(() => {
      void loadClients();
      void loadBranches();
      void loadSystems();
    }, 1500);
    return () => clearTimeout(id);
  }, []);
  return <AppLayout />;
}

function PageLoader() {
  return (
    <Box sx={{ display: 'grid', placeItems: 'center', py: 12 }}>
      <CircularProgress aria-label="Cargando" />
    </Box>
  );
}

const resources = [
  {
    name: 'dashboard',
    list: '/',
    meta: { label: 'Escritorio', icon: <SpaceDashboardOutlined /> },
  },
  {
    name: 'clients',
    list: '/clients',
    create: '/clients/create',
    edit: '/clients/:id/edit',
    meta: {
      label: 'Clientes',
      icon: <BusinessOutlined />,
      canDelete: false,
      submenu: [
        { label: 'Todos los clientes', to: '/clients' },
        { label: 'Agregar cliente', to: '/clients/create' },
      ],
    },
  },
  {
    name: 'branches',
    list: '/branches',
    create: '/branches/create',
    edit: '/branches/:id/edit',
    meta: {
      label: 'Sucursales',
      icon: <PlaceOutlined />,
      canDelete: false,
      submenu: [
        { label: 'Todas las sucursales', to: '/branches' },
        { label: 'Agregar sucursal', to: '/branches/create' },
      ],
    },
  },
  {
    name: 'systems',
    list: '/systems',
    meta: { label: 'Sistemas', icon: <LocalFireDepartmentOutlined />, canDelete: false },
  },
];

const titles: Record<string, string> = {
  dashboard: 'Escritorio',
  clients: 'Clientes',
  branches: 'Sucursales',
  systems: 'Sistemas',
};

export default function App() {
  return (
    <BrowserRouter>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <SnackbarProvider>
          <Refine
            dataProvider={dataProvider(supabase)}
            liveProvider={liveProvider(supabase)}
            authProvider={authProvider}
            i18nProvider={i18nProvider}
            routerProvider={routerProvider}
            notificationProvider={useNotificationProvider}
            resources={resources}
            options={{
              disableTelemetry: true,
              syncWithLocation: false,
              warnWhenUnsavedChanges: true,
            }}
          >
            <Routes>
              <Route
                element={
                  <Authenticated key="protected" fallback={<CatchAllNavigate to="/login" />}>
                    <Outlet />
                  </Authenticated>
                }
              >
                <Route element={<ProtectedLayout />}>
                  <Route index element={<DashboardPage />} />
                  <Route
                    path="/clients"
                    element={
                      <Suspense fallback={<PageLoader />}>
                        <Outlet />
                      </Suspense>
                    }
                  >
                    <Route index element={<ClientList />} />
                    <Route path="create" element={<ClientCreate />} />
                    <Route path=":id/edit" element={<ClientEdit />} />
                  </Route>
                  <Route
                    path="/branches"
                    element={
                      <Suspense fallback={<PageLoader />}>
                        <Outlet />
                      </Suspense>
                    }
                  >
                    <Route index element={<BranchList />} />
                    <Route path="create" element={<BranchCreate />} />
                    <Route path=":id/edit" element={<BranchEdit />} />
                  </Route>
                  <Route
                    path="/systems"
                    element={
                      <Suspense fallback={<PageLoader />}>
                        <SystemList />
                      </Suspense>
                    }
                  />
                  <Route path="*" element={<NotFoundPage />} />
                </Route>
              </Route>

              <Route
                element={
                  <Authenticated key="public" fallback={<Outlet />}>
                    <NavigateToResource resource="dashboard" />
                  </Authenticated>
                }
              >
                <Route path="/login" element={<LoginPage />} />
              </Route>
            </Routes>
            <UnsavedChangesNotifier />
            <DocumentTitleHandler
              handler={({ resource }) => {
                const title = resource?.name ? titles[resource.name] : undefined;
                return title ? `${title} | Nimzo` : 'Nimzo';
              }}
            />
          </Refine>
        </SnackbarProvider>
      </ThemeProvider>
    </BrowserRouter>
  );
}
