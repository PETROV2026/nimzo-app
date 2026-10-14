import BusinessOutlined from '@mui/icons-material/BusinessOutlined';
import SpaceDashboardOutlined from '@mui/icons-material/SpaceDashboardOutlined';
import Box from '@mui/material/Box';
import CircularProgress from '@mui/material/CircularProgress';
import CssBaseline from '@mui/material/CssBaseline';
import { ThemeProvider } from '@mui/material/styles';
import { Authenticated, Refine } from '@refinedev/core';
import { ErrorComponent, RefineSnackbarProvider, useNotificationProvider } from '@refinedev/mui';
import routerProvider, {
  CatchAllNavigate,
  DocumentTitleHandler,
  NavigateToResource,
  UnsavedChangesNotifier,
} from '@refinedev/react-router';
import { dataProvider, liveProvider } from '@refinedev/supabase';
import { lazy, Suspense } from 'react';
import { BrowserRouter, Outlet, Route, Routes } from 'react-router';

import { supabase } from '@/lib/supabase';
import { authProvider } from '@/providers/auth-provider';
import { i18nProvider } from '@/providers/i18n-provider';
import { theme } from '@/theme';

const AppLayout = lazy(() =>
  import('@/components/layout/app-layout').then((module) => ({ default: module.AppLayout })),
);
const DashboardPage = lazy(() =>
  import('@/pages/dashboard').then((module) => ({ default: module.DashboardPage })),
);
const ClientList = lazy(() =>
  import('@/pages/clients').then((module) => ({ default: module.ClientList })),
);
const ClientCreate = lazy(() =>
  import('@/pages/clients').then((module) => ({ default: module.ClientCreate })),
);
const ClientEdit = lazy(() =>
  import('@/pages/clients').then((module) => ({ default: module.ClientEdit })),
);
const LoginPage = lazy(() =>
  import('@/pages/login').then((module) => ({ default: module.LoginPage })),
);

function PageLoader() {
  return (
    <Box sx={{ display: 'grid', placeItems: 'center', minHeight: '100vh' }}>
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
];

const titles: Record<string, string> = {
  dashboard: 'Escritorio',
  clients: 'Clientes',
};

export default function App() {
  return (
    <BrowserRouter>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <RefineSnackbarProvider>
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
            <Suspense fallback={<PageLoader />}>
              <Routes>
                <Route
                  element={
                    <Authenticated key="protected" fallback={<CatchAllNavigate to="/login" />}>
                      <Outlet />
                    </Authenticated>
                  }
                >
                  <Route element={<AppLayout />}>
                    <Route index element={<DashboardPage />} />
                    <Route path="/clients">
                      <Route index element={<ClientList />} />
                      <Route path="create" element={<ClientCreate />} />
                      <Route path=":id/edit" element={<ClientEdit />} />
                    </Route>
                    <Route path="*" element={<ErrorComponent />} />
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
            </Suspense>
            <UnsavedChangesNotifier />
            <DocumentTitleHandler
              handler={({ resource }) => {
                const title = resource?.name ? titles[resource.name] : undefined;
                return title ? `${title} | Nimzo` : 'Nimzo';
              }}
            />
          </Refine>
        </RefineSnackbarProvider>
      </ThemeProvider>
    </BrowserRouter>
  );
}
