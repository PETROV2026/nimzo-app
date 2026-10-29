import { MaterialIcons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import Constants from 'expo-constants';
import { useEffect, useState } from 'react';
import { Linking, Modal, Platform, Pressable, ScrollView, Text, View } from 'react-native';
import { Button } from '@/components/button';
import { colors } from '@/theme';

const supportEmail = String(Constants.expoConfig?.extra?.supportEmail ?? '');

const appVersion = Constants.expoConfig?.version ?? '';

function mailtoUrl(accountEmail: string | null) {
  const subject = 'Soporte Nimzo';
  const body = [
    'Describe qué pasó y qué estabas haciendo:',
    '',
    '',
    '',
    '---',
    `Versión de la app: ${appVersion}`,
    `Cuenta: ${accountEmail ?? 'sin sesión'}`,
    `Android: ${Platform.Version}`,
  ].join('\n');
  return `mailto:${supportEmail}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}

type SupportDialogProps = {
  accountEmail: string | null;
  onClose: () => void;
};

export function SupportDialog({ accountEmail, onClose }: SupportDialogProps) {
  const [copied, setCopied] = useState(false);
  const [noMailApp, setNoMailApp] = useState(false);

  useEffect(() => {
    if (!copied) return;
    const timer = setTimeout(() => setCopied(false), 2000);
    return () => clearTimeout(timer);
  }, [copied]);

  async function handleWrite() {
    try {
      await Linking.openURL(mailtoUrl(accountEmail));
      setNoMailApp(false);
    } catch {
      setNoMailApp(true);
    }
  }

  async function handleCopy() {
    await Clipboard.setStringAsync(supportEmail);
    setCopied(true);
  }

  return (
    <Modal transparent animationType="fade" onRequestClose={onClose}>
      <ScrollView
        className="flex-1 bg-foreground/40"
        contentContainerClassName="grow items-center justify-center p-8"
      >
        <View className="w-full max-w-[520px] overflow-hidden rounded-2xl bg-background">
          <View className="items-center gap-3 bg-canvas px-6 pb-6 pt-8">
            <Pressable
              onPress={onClose}
              hitSlop={8}
              accessibilityRole="button"
              accessibilityLabel="Cerrar"
              className="absolute right-2 top-2 min-h-14 min-w-14 items-center justify-center rounded-full active:bg-background"
            >
              <MaterialIcons name="close" size={24} color={colors.muted} />
            </Pressable>
            <View className="h-20 w-20 items-center justify-center rounded-full bg-primary-strong">
              <MaterialIcons name="support-agent" size={44} color={colors['on-primary']} />
            </View>
            <Text
              accessibilityRole="header"
              className="text-center font-sans-bold text-2xl text-foreground"
            >
              ¿Necesitas ayuda?
            </Text>
            <Text className="max-w-[400px] text-center font-sans text-base leading-6 text-muted">
              Escríbenos y te respondemos lo antes posible. Cuéntanos qué estabas haciendo y, si
              puedes, agrega una captura de pantalla.
            </Text>
          </View>

          <View className="gap-5 p-6">
            <View className="flex-row items-center gap-4 rounded-xl border border-border px-4 py-4">
              <View className="h-11 w-11 items-center justify-center rounded-full bg-canvas">
                <MaterialIcons name="mail-outline" size={22} color={colors['primary-strong']} />
              </View>
              <View className="flex-1 gap-0.5">
                <Text className="font-sans text-sm text-muted">Correo de soporte</Text>
                <Text selectable className="font-sans-semibold text-lg text-foreground">
                  {supportEmail}
                </Text>
              </View>
              <Pressable
                onPress={handleCopy}
                hitSlop={8}
                accessibilityRole="button"
                accessibilityLabel={copied ? 'Correo copiado' : 'Copiar correo'}
                className="min-h-14 flex-row items-center gap-1.5 rounded-full px-4 active:bg-surface"
              >
                <MaterialIcons
                  name={copied ? 'check' : 'content-copy'}
                  size={20}
                  color={colors['primary-strong']}
                />
                <Text className="font-sans-semibold text-base text-primary-strong">
                  {copied ? 'Copiado' : 'Copiar'}
                </Text>
              </Pressable>
            </View>

            {noMailApp ? (
              <View
                accessibilityRole="alert"
                className="flex-row items-start gap-3 rounded-lg bg-accent px-4 py-3"
              >
                <MaterialIcons name="info-outline" size={22} color={colors['on-accent']} />
                <Text className="flex-1 font-sans-medium text-base leading-6 text-on-accent">
                  No encontramos una app de correo en esta tablet. Copia el correo y escríbenos
                  desde tu teléfono o computadora.
                </Text>
              </View>
            ) : null}

            <Button label="Escribir correo" onPress={handleWrite} />
            <Text className="text-center font-sans text-sm leading-5 text-muted">
              El correo ya incluye la versión de la app y tu cuenta para ayudarte más rápido.
            </Text>
          </View>
        </View>
      </ScrollView>
    </Modal>
  );
}
