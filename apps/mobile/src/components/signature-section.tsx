import { Image } from 'expo-image';
import { useEffect, useState } from 'react';
import { Text, View } from 'react-native';
import { Button } from '@/components/button';
import { SignatureDialog } from '@/components/signature-dialog';
import { supabase } from '@/lib/supabase';

type SignatureSectionProps = {
  signaturePath: string | null;
  disabled: boolean;
};

export function SignatureSection({ signaturePath, disabled }: SignatureSectionProps) {
  const [signing, setSigning] = useState(false);
  const [signatureUrl, setSignatureUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!signaturePath) return;
    let cancelled = false;
    supabase.storage
      .from('signatures')
      .createSignedUrl(signaturePath, 3600)
      .then(({ data }) => {
        if (!cancelled) setSignatureUrl(data?.signedUrl ?? null);
      });
    return () => {
      cancelled = true;
    };
  }, [signaturePath]);

  return (
    <View className="gap-6 rounded-md bg-background px-8 py-6">
      <Text accessibilityRole="header" className="font-sans-semibold text-lg text-foreground">
        Mi firma
      </Text>
      <View className="h-[160px] items-center justify-center rounded-md border-2 border-border bg-surface">
        {signaturePath && signatureUrl ? (
          <Image
            source={{ uri: signatureUrl }}
            style={{ width: '100%', height: '100%' }}
            contentFit="contain"
            accessibilityLabel="Tu firma"
          />
        ) : (
          <Text className="font-sans text-base text-muted">
            Aún no tienes una firma registrada. Toca “Firmar” para crearla.
          </Text>
        )}
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
