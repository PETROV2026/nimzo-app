import { signatureBucket } from '@nimzo/shared';
import { Image } from 'expo-image';
import { useEffect, useState, type ReactNode } from 'react';
import { ActivityIndicator, Text, View } from 'react-native';
import { useSession } from '@/auth/session-provider';
import { Button } from '@/components/button';
import { SignatureDialog } from '@/components/signature-dialog';
import { supabase } from '@/lib/supabase';
import { useOnline } from '@/lib/use-online';
import { colors } from '@/theme/colors';

const signedUrlSeconds = 300;
const signedUrls = new Map<string, { url: string; expiresAt: number }>();

function memoryUrl(path: string) {
  const cached = signedUrls.get(path);
  return cached && cached.expiresAt > Date.now() ? cached.url : null;
}

async function resolveSignatureUri(path: string) {
  const fromMemory = memoryUrl(path);
  if (fromMemory) return fromMemory;
  const diskPath = await Image.getCachePathAsync(path);
  if (diskPath) return diskPath.startsWith('file://') ? diskPath : `file://${diskPath}`;
  const { data, error } = await supabase.storage
    .from(signatureBucket)
    .createSignedUrl(path, signedUrlSeconds);
  if (error) {
    console.warn('Could not create the signature URL.', error);
    return null;
  }
  signedUrls.set(path, {
    url: data.signedUrl,
    expiresAt: Date.now() + (signedUrlSeconds - 30) * 1000,
  });
  return data.signedUrl;
}

type SignatureSectionProps = {
  signaturePath: string | null | undefined;
  disabled: boolean;
};

export function SignatureSection({ signaturePath, disabled }: SignatureSectionProps) {
  const { saveSignature } = useSession();
  const online = useOnline();
  const [signing, setSigning] = useState(false);
  const [resolved, setResolved] = useState<{ path: string; uri: string | null } | null>(null);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    if (!signaturePath) return;
    let cancelled = false;
    resolveSignatureUri(signaturePath).then((uri) => {
      if (!cancelled) setResolved({ path: signaturePath, uri });
    });
    return () => {
      cancelled = true;
    };
  }, [signaturePath, attempt, online]);

  function handleRetry() {
    if (signaturePath) signedUrls.delete(signaturePath);
    setResolved(null);
    setAttempt((previous) => previous + 1);
  }

  const current = resolved?.path === signaturePath ? resolved : null;

  let preview: ReactNode;
  if (signaturePath === undefined) {
    preview = (
      <Text className="px-6 text-center font-sans text-base text-muted">
        Tu firma se mostrará cuando se cargue tu perfil.
      </Text>
    );
  } else if (signaturePath === null) {
    preview = (
      <Text className="px-6 text-center font-sans text-base text-muted">
        Aún no tienes una firma registrada. Toca “Firmar” para crearla.
      </Text>
    );
  } else if (!current) {
    preview = <ActivityIndicator color={colors.muted} accessibilityLabel="Cargando firma" />;
  } else if (!current.uri) {
    preview = (
      <View className="items-center gap-4 px-6">
        <Text className="text-center font-sans text-base text-muted">
          {online
            ? 'No se pudo cargar tu firma.'
            : 'Tu firma se mostrará cuando vuelvas a tener conexión.'}
        </Text>
        {online ? (
          <View className="w-[190px]">
            <Button variant="secondary" label="Reintentar" onPress={handleRetry} />
          </View>
        ) : null}
      </View>
    );
  } else {
    preview = (
      <Image
        source={{ uri: current.uri, cacheKey: signaturePath }}
        cachePolicy="memory-disk"
        transition={120}
        style={{ width: '100%', height: '100%' }}
        contentFit="contain"
        accessibilityLabel="Tu firma"
        onError={() => setResolved({ path: signaturePath, uri: null })}
      />
    );
  }

  return (
    <View className="gap-6 rounded-md bg-background px-8 py-6">
      <Text accessibilityRole="header" className="font-sans-semibold text-lg text-foreground">
        Mi firma
      </Text>
      <View className="h-[160px] items-center justify-center rounded-md border-2 border-border bg-surface">
        {preview}
      </View>
      <View className="w-[232px] self-end">
        <Button
          label={signaturePath ? 'Cambiar firma' : 'Firmar'}
          onPress={() => setSigning(true)}
          disabled={disabled}
        />
      </View>
      {signing ? (
        <SignatureDialog
          title="Mi firma"
          onSave={saveSignature}
          onClose={() => setSigning(false)}
        />
      ) : null}
    </View>
  );
}
