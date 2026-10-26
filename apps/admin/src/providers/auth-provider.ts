import type { UserRole } from '@nimzo/shared';
import type { AuthProvider } from '@refinedev/core';
import { FunctionsHttpError } from '@supabase/supabase-js';

import { supabase } from '@/lib/supabase';

export type Identity = {
  id: string;
  email: string | undefined;
  fullName: string;
  role: UserRole;
};

const NO_ACCESS_MESSAGE = 'Tu cuenta no tiene acceso al panel de administración.';

const PROFILE_TTL_MS = 60_000;

type AdminProfile = { full_name: string; role: UserRole; is_active: boolean };

let profileCache: {
  userId: string;
  expiresAt: number;
  promise: Promise<AdminProfile | null>;
} | null = null;

async function fetchAdminProfile(userId: string) {
  const { data, error } = await supabase
    .from('profiles')
    .select('full_name, role, is_active')
    .eq('id', userId)
    .maybeSingle();
  if (error) throw error;
  return data?.is_active && data.role === 'admin' ? data : null;
}

function getAdminProfile(userId: string) {
  if (profileCache?.userId === userId && profileCache.expiresAt > Date.now()) {
    return profileCache.promise;
  }
  const promise = fetchAdminProfile(userId).catch(() => {
    profileCache = null;
    return null;
  });
  profileCache = { userId, expiresAt: Date.now() + PROFILE_TTL_MS, promise };
  return promise;
}

function clearProfileCache() {
  profileCache = null;
}

function loginError(message: string) {
  return { success: false, error: { name: 'Error', message } };
}

async function functionErrorMessage(error: unknown) {
  if (!(error instanceof FunctionsHttpError)) {
    return 'No se pudo conectar con el servidor. Revisa tu conexión a internet.';
  }
  try {
    const body = (await error.context.json()) as { error?: string };
    return body.error ?? 'No se pudo iniciar sesión. Intenta de nuevo.';
  } catch {
    return 'No se pudo iniciar sesión. Intenta de nuevo.';
  }
}

type LoginParams = { email: string; password: string; captchaToken: string };

type LoginSession = { access_token: string; refresh_token: string };

export const authProvider: AuthProvider = {
  login: async ({ email, password, captchaToken }: LoginParams) => {
    clearProfileCache();
    const { data: tokens, error: loginFailure } = await supabase.functions.invoke<LoginSession>(
      'admin-login',
      {
        body: { email, password, captcha_token: captchaToken },
      },
    );
    if (loginFailure || !tokens) return loginError(await functionErrorMessage(loginFailure));

    const { data, error } = await supabase.auth.setSession(tokens);
    if (error || !data.user) return loginError('No se pudo iniciar sesión. Intenta de nuevo.');

    if (!(await getAdminProfile(data.user.id))) {
      await supabase.auth.signOut();
      return loginError(NO_ACCESS_MESSAGE);
    }

    return { success: true, redirectTo: '/' };
  },

  logout: async () => {
    clearProfileCache();
    await supabase.auth.signOut();
    return { success: true, redirectTo: '/login' };
  },

  check: async () => {
    const { data } = await supabase.auth.getSession();
    const user = data.session?.user;

    if (!user) {
      return { authenticated: false, redirectTo: '/login' };
    }
    if (!(await getAdminProfile(user.id))) {
      await supabase.auth.signOut();
      return { authenticated: false, logout: true, redirectTo: '/login' };
    }
    return { authenticated: true };
  },

  onError: async (error) => {
    if (error?.statusCode === 401 || error?.code === 'PGRST301') {
      return { logout: true, redirectTo: '/login', error };
    }
    return { error };
  },

  getIdentity: async (): Promise<Identity | null> => {
    const { data } = await supabase.auth.getSession();
    const user = data.session?.user;
    if (!user) return null;

    const profile = await getAdminProfile(user.id);
    if (!profile) return null;

    return {
      id: user.id,
      email: user.email,
      fullName: profile.full_name || user.email || 'Administrador',
      role: profile.role,
    };
  },
};
