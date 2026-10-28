import { signatureBucket } from '@nimzo/shared';
import { Image } from 'expo-image';
import { useEffect, useState, type ReactNode } from 'react';
import { ActivityIndicator, Text, View } from 'react-native';
import { useSession } from '@/auth/session-provider';
import { Button } from '@/components/button';
import { SignatureDialog } from '@/components/signature-dialog';
import { supabase } from '@/lib/supabase';
import { colors } from '@/theme/colors';

const signedUrlSeconds = 300;
const signedUrls = new Map<string, { url: string; expiresAt: number }>();

type SignatureSectionProps = {
  signaturePath: string | null;
  disabled: boolean;
};

export function SignatureSection({ signaturePath, disabled }: SignatureSectionProps) {
  const { saveSignature } = useSession();
  const [signing, setSigning] = useState(false);
  const [fetched, setFetched] = useState<{ path: string; url: string | null } | null>(null);
  const [failedPath, setFailedPath] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    if (!signaturePath) return;
    const cached = signedUrls.get(signaturePath);
    if (cached && cached.expiresAt > Date.now()) return;
    let cancelled = false;
    supabase.storage
      .from(signatureBucket)
      .createSignedUrl(signaturePath, signedUrlSeconds)
      .then(({ data, error }) => {
        if (error) {
          console.warn('No se pudo obtener el enlace de la firma.', error);
        } else {
          signedUrls.set(signaturePath, {
            url: data.signedUrl,
            expiresAt: Date.now() + (signedUrlSeconds - 30) * 1000,
          });
        }
        if (!cancelled) setFetched({ path: signaturePath, url: error ? null : data.signedUrl });
      });
    return () => {
      cancelled = true;
    };
  }, [signaturePath, attempt]);

    function handleRetry() {
    if (!signaturePath) return;
    signedUrls.delete(signaturePath);
    setFailedPath(null);
    setFetched(null);
    setAttempt((previous) => previous + 1);
  }

  const url = signaturePath
    ? (signedUrls.get(signaturePath)?.url ??
      (fetched?.path === signaturePath ? fetched.url : undefined))
    : undefined;

  let preview: ReactNode;
  if (!signaturePath) {
    preview = (
      <Text className="font-sans text-base text-muted">
        Aún no tienes una firma registrada. Toca “Firmar” para crearla.
      </Text>
    );
    } else if (url === null || failedPath === signaturePath) {
    preview = (
      <View className="items-center gap-4">
        <Text className="font-sans text-base text-muted">
          No se pudo cargar tu firma. Revisa tu conexión.
        </Text>
        <View className="w-[190px]">
          <Button variant="secondary" label="Reintentar" onPress={handleRetry} />
        </View>
      </View>
    );
  } else if (url === undefined) {
    preview = <ActivityIndicator color={colors.muted} accessibilityLabel="Cargando firma" />;
  } else {
    preview = (
      <Image
        source={{ uri: url, cacheKey: signaturePath }}
        cachePolicy="memory-disk"
        transition={120}
        style={{ width: '100%', height: '100%' }}
        contentFit="contain"
        accessibilityLabel="Tu firma"
        onError={() => setFailedPath(signaturePath)}
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
          variant="brand"
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