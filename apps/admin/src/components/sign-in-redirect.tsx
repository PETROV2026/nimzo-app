import { CatchAllNavigate } from '@refinedev/react-router';
import { useEffect, useState } from 'react';
import { Navigate } from 'react-router';

import { supabase } from '@/lib/supabase';

export function SignInRedirect() {
  const [hasSession, setHasSession] = useState<boolean | null>(null);

  useEffect(() => {
    void supabase.auth.getSession().then(({ data }) => setHasSession(Boolean(data.session)));
  }, []);

  if (hasSession === null) return null;
  return hasSession ? <Navigate to="/two-factor" replace /> : <CatchAllNavigate to="/login" />;
}
