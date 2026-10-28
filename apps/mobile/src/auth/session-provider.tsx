import { mexicanStateSchema, type MexicanState, type UserRole } from '@nimzo/shared';
import { isAuthRetryableFetchError, type Session } from '@supabase/supabase-js';
import { createContext, use, useEffect, useState, type ReactNode } from 'react';
import { supabase } from '@/lib/supabase';

export type Profile = {
  fullName: string;
  role: UserRole;
  phone: string | null;
  state: MexicanState | null;
  city: string | null;
  signaturePath: string | null;
};

type ProfileChanges = Pick<Profile, 'fullName' | 'phone' | 'state' | 'city'>;

type AuthStatus =
  | { status: 'initializing' }
  | { status: 'signed-out' }
  | { status: 'checking' }
  | { status: 'signed-in'; session: Session; profile: Profile | null };

type SessionContextValue = AuthStatus & {
  accessError: string | null;
  signIn: (email: string, password: string) => Promise<string | null>;
  signOut: () => Promise<void>;
  updateProfile: (changes: ProfileChanges) => Promise<string | null>;
  saveSignature: (png: Uint8Array) => Promise<string | null>;
};

const mobileRoles: readonly UserRole[] = ['technician'];

const noAccessMessage =
  'Tu cuenta no tiene acceso a la app. Si eres administrador, entra desde el panel web.';

const SessionContext = createContext<SessionContextValue | null>(null);

async function fetchMobileProfile(userId: string): Promise<Profile | null> {
  const { data, error } = await supabase
    .from('profiles')
    .select('full_name, role, is_active, phone, state, city, signature_path')
    .eq('id', userId)
    .maybeSingle();
  if (error) throw error;
  if (!data?.is_active || !mobileRoles.includes(data.role)) return null;
  return {
    fullName: data.full_name,
    role: data.role,
    phone: data.phone,
    state: mexicanStateSchema.nullable().catch(null).parse(data.state),
    city: data.city,
    signaturePath: data.signature_path,
  };
}

function signInErrorMessage(error: { code?: string; name: string }) {
  if (error.code === 'invalid_credentials') {
    return 'El correo o la contraseña no son correctos.';
  }
  if (isAuthRetryableFetchError(error)) {
    return 'No se pudo conectar con el servidor. Revisa tu conexión a internet.';
  }
  return 'No se pudo iniciar sesión. Intenta de nuevo.';
}

export function SessionProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null | undefined>(undefined);
  const [profile, setProfile] = useState<Profile | null | undefined>(undefined);
  const [checkedUserId, setCheckedUserId] = useState<string | null>(null);
  const [accessError, setAccessError] = useState<string | null>(null);

  useEffect(() => {
    const { data } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
    });
    return () => data.subscription.unsubscribe();
  }, []);

  const userId = session?.user.id ?? null;

  useEffect(() => {
    if (!userId) return;
    let cancelled = false;

    fetchMobileProfile(userId)
      .then(async (nextProfile) => {
        if (cancelled) return;
        if (!nextProfile) {
          setAccessError(noAccessMessage);
          await supabase.auth.signOut();
          return;
        }
        setProfile(nextProfile);
        setCheckedUserId(userId);
      })
      .catch(() => {
        if (cancelled) return;
        setProfile(null);
        setCheckedUserId(userId);
      });

    return () => {
      cancelled = true;
    };
  }, [userId]);

  async function signIn(email: string, password: string) {
    setAccessError(null);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return error ? signInErrorMessage(error) : null;
  }

  async function signOut() {
    setAccessError(null);
    setProfile(undefined);
    setCheckedUserId(null);
    await supabase.auth.signOut();
  }

  async function updateProfile({ fullName, ...changes }: ProfileChanges) {
    if (!userId || !profile)
      return 'No se pudo cargar tu perfil. Revisa tu conexión e intenta de nuevo.';
    const { error } = await supabase
      .from('profiles')
      .update({ full_name: fullName, ...changes })
      .eq('id', userId);
    if (error) return 'No se pudieron guardar los cambios. Intenta de nuevo.';
    setProfile((previous) => (previous ? { ...previous, fullName, ...changes } : previous));
    return null;
  }

  async function saveSignature(png: Uint8Array) {
    if (!userId || !profile)
      return 'No se pudo cargar tu perfil. Revisa tu conexión e intenta de nuevo.';
    const signatures = supabase.storage.from('signatures');
    const path = `${userId}/${Date.now()}.png`;
    const { error: uploadError } = await signatures.upload(path, png, { contentType: 'image/png' });
    if (uploadError) return 'No se pudo guardar la firma. Intenta de nuevo.';
    const { error } = await supabase
      .from('profiles')
      .update({ signature_path: path })
      .eq('id', userId);
    if (error) {
      await signatures.remove([path]);
      return 'No se pudo guardar la firma. Intenta de nuevo.';
    }
    if (profile.signaturePath) await signatures.remove([profile.signaturePath]);
    setProfile((previous) => (previous ? { ...previous, signaturePath: path } : previous));
    return null;
  }

  let authStatus: AuthStatus;
  if (session === undefined) {
    authStatus = { status: 'initializing' };
  } else if (session === null) {
    authStatus = { status: 'signed-out' };
  } else if (checkedUserId !== session.user.id || profile === undefined) {
    authStatus = { status: 'checking' };
  } else {
    authStatus = { status: 'signed-in', session, profile };
  }

  return (
    <SessionContext
      value={{ ...authStatus, accessError, signIn, signOut, updateProfile, saveSignature }}
    >
      {children}
    </SessionContext>
  );
}

export function useSession() {
  const value = use(SessionContext);
  if (!value) {
    throw new Error('useSession must be used inside SessionProvider.');
  }
  return value;
}
