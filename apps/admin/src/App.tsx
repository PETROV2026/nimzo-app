import BusinessOutlined from '@mui/icons-material/BusinessOutlined';
import SpaceDashboardOutlined from '@mui/icons-material/SpaceDashboardOutlined';
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
import { BrowserRouter, Outlet, Route, Routes } from 'react-router';

import { AppLayout } from '@/components/layout/app-layout';
import { supabase } from '@/lib/supabase';
import { ClientCreate, ClientEdit, ClientList } from '@/pages/clients';
import { DashboardPage } from '@/pages/dashboard';
import { LoginPage } from '@/pages/login';
import { authProvider } from '@/providers/auth-provider';
import { i18nProvider } from '@/providers/i18n-provider';
import { theme } from '@/theme';

// Sidebar entries come from this list (useMenu). Add a resource here when its pages exist.
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
