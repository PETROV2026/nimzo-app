import BuildOutlined from '@mui/icons-material/BuildOutlined';
import BusinessOutlined from '@mui/icons-material/BusinessOutlined';
import DescriptionOutlined from '@mui/icons-material/DescriptionOutlined';
import GroupOutlined from '@mui/icons-material/GroupOutlined';
import LocalFireDepartmentOutlined from '@mui/icons-material/LocalFireDepartmentOutlined';
import PlaceOutlined from '@mui/icons-material/PlaceOutlined';
import SpaceDashboardOutlined from '@mui/icons-material/SpaceDashboardOutlined';
import Box from '@mui/material/Box';
import CircularProgress from '@mui/material/CircularProgress';
import CssBaseline from '@mui/material/CssBaseline';
import { ThemeProvider } from '@mui/material/styles';
import Typography from '@mui/material/Typography';
import { Authenticated, Refine } from '@refinedev/core';
import routerProvider, {
  CatchAllNavigate,
  DocumentTitleHandler,
  NavigateToResource,
  UnsavedChangesNotifier,
} from '@refinedev/react-router';
import { liveProvider } from '@refinedev/supabase';
import { lazy, Suspense, useEffect } from 'react';
import { BrowserRouter, Outlet, Route, Routes } from 'react-router';

import { AppLayout } from '@/components/layout/app-layout';
import { SnackbarProvider } from '@/components/snackbar-provider';
import { dataProvider } from '@/lib/data-provider';
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

const loadForms = () => import('@/pages/forms');

const ServiceFormList = lazy(() =>
  loadForms().then((module) => ({ default: module.ServiceFormList })),
);
const ServiceFormCreate = lazy(() =>
  loadForms().then((module) => ({ default: module.ServiceFormCreate })),
);
const ServiceFormEdit = lazy(() =>
  loadForms().then((module) => ({ default: module.ServiceFormEdit })),
);

const loadPackages = () => import('@/pages/packages');

const PackageEdit = lazy(() => loadPackages().then((module) => ({ default: module.PackageEdit })));

const loadUsers = () => import('@/pages/users');

const UserList = lazy(() => loadUsers().then((module) => ({ default: module.UserList })));
const UserCreate = lazy(() => loadUsers().then((module) => ({ default: module.UserCreate })));
const UserEdit = lazy(() => loadUsers().then((module) => ({ default: module.UserEdit })));

const loadTools = () => import('@/pages/tools');

const ToolsDiagnostics = lazy(() =>
  loadTools().then((module) => ({ default: module.ToolsDiagnostics })),
);
const ToolsQueries = lazy(() => loadTools().then((module) => ({ default: module.ToolsQueries })));
const ToolsLinks = lazy(() => loadTools().then((module) => ({ default: module.ToolsLinks })));

function ProtectedLayout() {
  useEffect(() => {
    const id = setTimeout(() => {
      void loadClients();
      void loadBranches();
      void loadSystems();
      void loadForms();
      void loadPackages();
    }, 1500);
    return () => clearTimeout(id);
  }, []);
  return <AppLayout />;
}

function PageLoader({ label }: { label: string }) {
  return (
    <Box
      role="status"
      sx={{ display: 'grid', placeItems: 'center', gap: 1.5, py: 12, color: 'text.secondary' }}
    >
      <CircularProgress aria-hidden />
      <Typography>{label}</Typography>
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
  {
    name: 'service_forms',
    list: '/forms',
    create: '/forms/create',
    edit: '/forms/:id/edit',
    meta: {
      label: 'Formatos',
      icon: <DescriptionOutlined />,
      canDelete: false,
      submenu: [
        { label: 'Todos los formatos', to: '/forms' },
        { label: 'Agregar formato', to: '/forms/create' },
      ],
    },
  },
  {
    name: 'service_packages',
    edit: '/packages/:id',
    meta: { label: 'Paquetes de servicio', hide: true, canDelete: false },
  },
  {
    name: 'service_package_forms',
    meta: { label: 'Formatos del paquete', hide: true },
  },
  {
    name: 'profiles',
    list: '/users',
    create: '/users/create',
    edit: '/users/:id/edit',
    meta: {
      label: 'Usuarios',
      icon: <GroupOutlined />,
      canDelete: false,
      submenu: [
        { label: 'Todos los usuarios', to: '/users' },
        { label: 'Agregar usuario', to: '/users/create' },
      ],
    },
  },
  {
    name: 'tools',
    list: '/tools',
    meta: {
      label: 'Herramientas',
      icon: <BuildOutlined />,
      submenu: [
        { label: 'Diagnóstico', to: '/tools' },
        { label: 'Consultas SQL', to: '/tools/queries' },
        { label: 'Accesos rápidos', to: '/tools/links' },
      ],
    },
  },
];

const titles: Record<string, Partial<Record<'list' | 'create' | 'edit', string>>> = {
  dashboard: { list: 'Escritorio' },
  clients: { list: 'Clientes', create: 'Agregar cliente', edit: 'Editar cliente' },
  branches: { list: 'Sucursales', create: 'Agregar sucursal', edit: 'Editar sucursal' },
  systems: { list: 'Sistemas' },
  service_forms: { list: 'Formatos', create: 'Agregar formato', edit: 'Editar formato' },
  service_packages: { edit: 'Paquete de servicio' },
  profiles: { list: 'Usuarios', create: 'Agregar usuario', edit: 'Editar usuario' },
  tools: { list: 'Herramientas' },
};

const toolTitles: Record<string, string> = {
  '/tools': 'Diagnóstico',
  '/tools/queries': 'Consultas SQL',
  '/tools/links': 'Accesos rápidos',
};

export default function App() {
  return (
    <BrowserRouter>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <SnackbarProvider>
          <Refine
            dataProvider={dataProvider}
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
                      <Suspense fallback={<PageLoader label="Cargando clientes…" />}>
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
                      <Suspense fallback={<PageLoader label="Cargando sucursales…" />}>
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
                      <Suspense fallback={<PageLoader label="Cargando sistemas…" />}>
                        <SystemList />
                      </Suspense>
                    }
                  />
                  <Route
                    path="/forms"
                    element={
                      <Suspense fallback={<PageLoader label="Cargando formatos…" />}>
                        <Outlet />
                      </Suspense>
                    }
                  >
                    <Route index element={<ServiceFormList />} />
                    <Route path="create" element={<ServiceFormCreate />} />
                    <Route path=":id/edit" element={<ServiceFormEdit />} />
                  </Route>
                  <Route
                    path="/packages/:id"
                    element={
                      <Suspense fallback={<PageLoader label="Cargando paquete…" />}>
                        <PackageEdit />
                      </Suspense>
                    }
                  />
                  <Route
                    path="/users"
                    element={
                      <Suspense fallback={<PageLoader label="Cargando usuarios…" />}>
                        <Outlet />
                      </Suspense>
                    }
                  >
                    <Route index element={<UserList />} />
                    <Route path="create" element={<UserCreate />} />
                    <Route path=":id/edit" element={<UserEdit />} />
                  </Route>
                  <Route
                    path="/tools"
                    element={
                      <Suspense fallback={<PageLoader label="Cargando herramientas…" />}>
                        <Outlet />
                      </Suspense>
                    }
                  >
                    <Route index element={<ToolsDiagnostics />} />
                    <Route path="queries" element={<ToolsQueries />} />
                    <Route path="links" element={<ToolsLinks />} />
                  </Route>
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
              handler={({ resource, action, pathname }) => {
                const toolTitle = pathname ? toolTitles[pathname] : undefined;
                if (toolTitle) return `${toolTitle} | Nimzo`;
                const pages = resource?.name ? titles[resource.name] : undefined;
                const title = pages?.[action as 'list' | 'create' | 'edit'] ?? pages?.list;
                return title ? `${title} | Nimzo` : 'Nimzo';
              }}
            />
          </Refine>
        </SnackbarProvider>
      </ThemeProvider>
    </BrowserRouter>
  );
}
