import { signatureBucket } from '@nimzo/shared';
import { Image } from 'expo-image';
import { useEffect, useState, type ReactNode } from 'react';
import { ActivityIndicator, Text, View } from 'react-native';
import { useSession } from '@/auth/session-provider';
import { Button } from '@/components/button';
import { SectionHeader } from '@/components/section-header';
import { SignatureDialog } from '@/components/signature-dialog';
import { supabase } from '@/lib/supabase';
import { useOnline } from '@/lib/use-online';
import { colors } from '@/theme';

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
  name: string;
  role: string;
  className?: string;
};

export function SignatureSection({
  signaturePath,
  disabled,
  name,
  role,
  className,
}: SignatureSectionProps) {
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
  const holder = [role, 'Titular de la firma'].filter(Boolean).join(' · ');

  let preview: ReactNode;
  if (signaturePath === undefined) {
    preview = (
      <Text className="text-center font-sans text-sm text-muted">
        Tu firma se mostrará cuando se cargue tu perfil.
      </Text>
    );
  } else if (signaturePath === null) {
    preview = (
      <Text className="text-center font-sans text-sm text-muted">
        Aún no tienes firma. Créala una vez y se usará en todos tus reportes.
      </Text>
    );
  } else if (!current) {
    preview = <ActivityIndicator color={colors.muted} accessibilityLabel="Cargando firma" />;
  } else if (!current.uri) {
    preview = (
      <View className="items-center gap-1">
        <Text className="text-center font-sans text-sm text-muted">
          {online
            ? 'No se pudo cargar tu firma.'
            : 'Tu firma se mostrará cuando vuelvas a tener conexión.'}
        </Text>
        {online ? (
          <Button variant="ghost" icon="refresh" label="Reintentar" onPress={handleRetry} />
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
        accessibilityLabel={`Firma de ${name}`}
        onError={() => setResolved({ path: signaturePath, uri: null })}
      />
    );
  }

  return (
    <View className={`gap-5 rounded-2xl border border-border bg-background p-6 ${className ?? ''}`}>
      <SectionHeader title="Tu firma" description="Así aparece en cada reporte que envías." />

      <View className="h-[120px] rounded-lg border border-border px-6 pb-5 pt-3">
        <View className="flex-1 items-center justify-center">{preview}</View>
        <View className="h-px bg-border" />
      </View>

      <View className="gap-0.5">
        <Text numberOfLines={1} className="font-sans-semibold text-base text-muted">
          {name}
        </Text>
        <Text className="font-sans text-sm text-muted">{holder}</Text>
      </View>

      <View className="mt-auto">
        <Button
          variant={signaturePath ? 'outline' : 'primary'}
          icon="brush-outline"
          label={signaturePath ? 'Cambiar firma' : 'Crear firma'}
          onPress={() => setSigning(true)}
          disabled={disabled}
        />
      </View>

      {signing ? (
        <SignatureDialog
          title="Tu firma"
          name={name}
          role={role}
          onSave={saveSignature}
          onClose={() => setSigning(false)}
        />
      ) : null}
    </View>
  );
}
