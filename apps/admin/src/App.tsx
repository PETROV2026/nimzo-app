import CssBaseline from '@mui/material/CssBaseline';
import GlobalStyles from '@mui/material/GlobalStyles';
import { ThemeProvider } from '@mui/material/styles';
import { Refine } from '@refinedev/core';
import { RefineSnackbarProvider, useNotificationProvider } from '@refinedev/mui';
import routerProvider from '@refinedev/react-router';
import { dataProvider, liveProvider } from '@refinedev/supabase';
import { BrowserRouter, Route, Routes } from 'react-router';

import { supabase } from '@/lib/supabase';
import { HomePage } from '@/pages/home';
import { theme } from '@/theme';

export default function App() {
  return (
    <BrowserRouter>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <GlobalStyles styles={{ html: { WebkitFontSmoothing: 'auto' } }} />
        <RefineSnackbarProvider>
          <Refine
            dataProvider={dataProvider(supabase)}
            liveProvider={liveProvider(supabase)}
            routerProvider={routerProvider}
            notificationProvider={useNotificationProvider}
            options={{ disableTelemetry: true }}
          >
            <Routes>
              <Route index element={<HomePage />} />
            </Routes>
          </Refine>
        </RefineSnackbarProvider>
      </ThemeProvider>
    </BrowserRouter>
  );
}
