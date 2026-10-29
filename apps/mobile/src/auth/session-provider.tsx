import {
  mexicanStateSchema,
  signatureBucket,
  signatureMaxBytes,
  type MexicanState,
  type UserRole,
} from '@nimzo/shared';
import { isAuthRetryableFetchError, type Session } from '@supabase/supabase-js';
import { createContext, use, useEffect, useState, type ReactNode } from 'react';
import { AppState } from 'react-native';
import { writeLastEmail } from '@/lib/last-email';
import { clearCachedProfile, readCachedProfile, writeCachedProfile } from '@/lib/profile-cache';
import { supabase } from '@/lib/supabase';
import { useOnline } from '@/lib/use-online';

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

function cachedProfile(userId: string): Profile | null {
  const cached = readCachedProfile<Profile>(userId);
  return cached && typeof cached.fullName === 'string' && mobileRoles.includes(cached.role)
    ? cached
    : null;
}

async function removeOtherSignatures(userId: string, keepPath: string) {
  const signatures = supabase.storage.from(signatureBucket);
  const { data: files, error } = await signatures.list(userId);
  if (error) {
    console.warn('Could not list previous signatures.', error);
    return;
  }
  const oldPaths = files
    .map((file) => `${userId}/${file.name}`)
    .filter((filePath) => filePath !== keepPath);
  if (oldPaths.length === 0) return;
  const { error: removeError } = await signatures.remove(oldPaths);
  if (removeError) console.warn('Could not remove previous signatures.', removeError);
}

const signInTimeoutMs = 20000;

const slowConnectionMessage = 'La conexión está muy lenta. Intenta de nuevo.';

function signInErrorMessage(error: { code?: string; name: string; status?: number }) {
  if (error.code === 'invalid_credentials') {
    return 'El correo o la contraseña no son correctos.';
  }
  if (error.code === 'user_banned') {
    return 'Tu cuenta está desactivada. Contacta a tu administrador.';
  }
  if (error.code === 'over_request_rate_limit' || error.status === 429) {
    return 'Hiciste muchos intentos. Espera unos minutos y vuelve a intentarlo.';
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
  const [refreshKey, setRefreshKey] = useState(0);
  const online = useOnline();

  useEffect(() => {
    const { data } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
    });
    return () => data.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') setRefreshKey((previous) => previous + 1);
    });
    return () => subscription.remove();
  }, []);

  const userId = session?.user.id ?? null;
  const checked = userId !== null && checkedUserId === userId && profile !== undefined;
  const cached = userId && !checked ? cachedProfile(userId) : null;
  const currentProfile = checked ? (profile ?? null) : cached;

  useEffect(() => {
    if (!userId || !online) return;
    let cancelled = false;

    fetchMobileProfile(userId)
      .then(async (nextProfile) => {
        if (cancelled) return;
        if (!nextProfile) {
          clearCachedProfile(userId);
          setAccessError(noAccessMessage);
          await supabase.auth.signOut();
          return;
        }
        writeCachedProfile(userId, nextProfile);
        setProfile(nextProfile);
        setCheckedUserId(userId);
      })
      .catch(() => {
        if (cancelled) return;
        setProfile((previous) => previous ?? cachedProfile(userId));
        setCheckedUserId(userId);
      });

    return () => {
      cancelled = true;
    };
  }, [userId, online, refreshKey]);

  async function signIn(email: string, password: string) {
    setAccessError(null);
    let timer: ReturnType<typeof setTimeout> | undefined;
    const timeout = new Promise<'timeout'>((resolve) => {
      timer = setTimeout(() => resolve('timeout'), signInTimeoutMs);
    });
    const result = await Promise.race([
      supabase.auth.signInWithPassword({ email, password }),
      timeout,
    ]);
    clearTimeout(timer);
    if (result === 'timeout') return slowConnectionMessage;
    if (result.error) return signInErrorMessage(result.error);
    writeLastEmail(email);
    return null;
  }

  async function signOut() {
    if (userId) clearCachedProfile(userId);
    setAccessError(null);
    setProfile(undefined);
    setCheckedUserId(null);
    await supabase.auth.signOut();
  }

  async function updateProfile({ fullName, ...changes }: ProfileChanges) {
    if (!userId || !currentProfile)
      return 'No se pudo cargar tu perfil. Revisa tu conexión e intenta de nuevo.';
    const { data, error } = await supabase
      .from('profiles')
      .update({ full_name: fullName, ...changes })
      .eq('id', userId)
      .select('full_name, phone, state, city')
      .single();
    if (error) return 'No se pudieron guardar los cambios. Intenta de nuevo.';
    keepProfile({
      ...currentProfile,
      fullName: data.full_name,
      phone: data.phone,
      state: mexicanStateSchema.nullable().catch(null).parse(data.state),
      city: data.city,
    });
    return null;
  }

  async function saveSignature(png: Uint8Array) {
    if (!userId || !currentProfile)
      return 'No se pudo cargar tu perfil. Revisa tu conexión e intenta de nuevo.';
    if (png.byteLength > signatureMaxBytes) {
      return 'La firma es demasiado grande. Bórrala y vuelve a firmar.';
    }
    const signatures = supabase.storage.from(signatureBucket);
    const date = new Date().toISOString().replace(/[:.]/g, '-');
    const path = `${userId}/signature-${date}.png`;
    const { error: uploadError } = await signatures.upload(path, png, { contentType: 'image/png' });
    if (uploadError) return 'No se pudo guardar la firma. Intenta de nuevo.';
    const { error } = await supabase
      .from('profiles')
      .update({ signature_path: path })
      .eq('id', userId)
      .select('id')
      .single();

    if (error) {
      if (error.code === 'PGRST116') await signatures.remove([path]);
      return 'No se pudo guardar la firma. Intenta de nuevo.';
    }
    keepProfile({ ...currentProfile, signaturePath: path });
    void removeOtherSignatures(userId, path);
    return null;
  }

  function keepProfile(nextProfile: Profile) {
    if (!userId) return;
    writeCachedProfile(userId, nextProfile);
    setProfile(nextProfile);
    setCheckedUserId(userId);
  }

  let authStatus: AuthStatus;
  if (session === undefined) {
    authStatus = { status: 'initializing' };
  } else if (session === null) {
    authStatus = { status: 'signed-out' };
  } else if (checked || cached || !online) {
    authStatus = { status: 'signed-in', session, profile: currentProfile };
  } else {
    authStatus = { status: 'checking' };
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
