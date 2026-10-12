import { Refine } from '@refinedev/core';
import routerProvider from '@refinedev/react-router';
import { dataProvider, liveProvider } from '@refinedev/supabase';
import { BrowserRouter, Route, Routes } from 'react-router';

import { supabase } from '@/lib/supabase';
import { HomePage } from '@/pages/home';

export default function App() {
  return (
    <BrowserRouter>
      <Refine
        dataProvider={dataProvider(supabase)}
        liveProvider={liveProvider(supabase)}
        routerProvider={routerProvider}
        options={{ disableTelemetry: true }}
      >
        <Routes>
          <Route index element={<HomePage />} />
        </Routes>
      </Refine>
    </BrowserRouter>
  );
}
