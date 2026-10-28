import { Image } from 'expo-image';
import { useEffect, useState, type ReactNode } from 'react';
import { ActivityIndicator, Text, View } from 'react-native';
import { Button } from '@/components/button';
import { SignatureDialog } from '@/components/signature-dialog';
import { supabase } from '@/lib/supabase';
import { colors } from '@/theme/colors';

const signedUrls = new Map<string, string>();

type SignatureSectionProps = {
  signaturePath: string | null;
  disabled: boolean;
};

export function SignatureSection({ signaturePath, disabled }: SignatureSectionProps) {
  const [signing, setSigning] = useState(false);
  const [fetched, setFetched] = useState<{ path: string; url: string | null } | null>(null);
  const [failedPath, setFailedPath] = useState<string | null>(null);

  useEffect(() => {
    if (!signaturePath || signedUrls.has(signaturePath)) return;
    let cancelled = false;
    supabase.storage
      .from('signatures')
      .createSignedUrl(signaturePath, 3600)
      .then(({ data }) => {
        if (data) signedUrls.set(signaturePath, data.signedUrl);
        if (!cancelled) setFetched({ path: signaturePath, url: data?.signedUrl ?? null });
      });
    return () => {
      cancelled = true;
    };
  }, [signaturePath]);

  const url = signaturePath
    ? (signedUrls.get(signaturePath) ?? (fetched?.path === signaturePath ? fetched.url : undefined))
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
      <Text className="font-sans text-base text-muted">
        No se pudo cargar tu firma. Revisa tu conexión.
      </Text>
    );
  } else if (url === undefined) {
    preview = <ActivityIndicator color={colors.muted} accessibilityLabel="Cargando firma" />;
  } else {
    preview = (
      <Image
        source={{ uri: url, cacheKey: signaturePath }}
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
      {signing ? <SignatureDialog onClose={() => setSigning(false)} /> : null}
    </View>
  );
}
