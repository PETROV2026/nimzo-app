import { Feather } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import Constants from 'expo-constants';
import { useEffect, useState } from 'react';
import {
  Linking,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import { Button } from '@/components/button';
import { DialogHeader } from '@/components/dialog-header';
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
  const { height } = useWindowDimensions();
  const compact = height < 800;
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
        <View
          className={`w-full rounded-3xl bg-background ${compact ? 'max-w-[560px] gap-4 p-6' : 'max-w-[640px] gap-6 p-8'}`}
        >
          <DialogHeader title="Ayuda y soporte" onClose={onClose} />

          <View className="flex-row items-center gap-4">
            <View
              className={`items-center justify-center rounded-2xl bg-danger ${compact ? 'h-12 w-12' : 'h-16 w-16'}`}
            >
              <Feather name="headphones" size={compact ? 24 : 30} color={colors['on-danger']} />
            </View>
            <Text
              className={`flex-1 font-sans-bold text-foreground ${compact ? 'text-xl' : 'text-[23px]'}`}
            >
              ¿Necesitas ayuda?
            </Text>
          </View>

          <Text className={`font-sans text-muted ${compact ? 'text-base' : 'text-[17px] leading-6'}`}>
            Escríbenos y cuéntanos qué estabas haciendo y qué ocurrió. Si puedes, agrega una
            captura de pantalla al correo.
          </Text>

          <View className="flex-row items-center gap-4 rounded-xl border border-border p-5">
            <View className="flex-1 gap-2">
              <Text className="font-sans text-[13px] text-muted">Correo de soporte</Text>
              <Text
                selectable
                className={`font-sans text-foreground ${compact ? 'text-lg' : 'text-[21px]'}`}
              >
                {supportEmail}
              </Text>
            </View>
            <Pressable
              onPress={handleCopy}
              hitSlop={8}
              accessibilityRole="button"
              accessibilityLabel={copied ? 'Correo copiado' : 'Copiar correo'}
              className="min-h-[52px] flex-row items-center gap-2 rounded-lg px-4 active:bg-surface"
            >
              <Feather name={copied ? 'check' : 'copy'} size={22} color={colors.muted} />
              <Text
                className={`font-sans-semibold text-muted ${compact ? 'text-base' : 'text-lg'}`}
              >
                {copied ? 'Copiado' : 'Copiar'}
              </Text>
            </Pressable>
          </View>

          {noMailApp ? (
            <View
              accessibilityRole="alert"
              className="flex-row items-start gap-3 rounded-lg bg-accent px-4 py-3"
            >
              <Feather name="info" size={22} color={colors['on-accent']} />
              <Text className="flex-1 font-sans-medium text-base leading-6 text-on-accent">
                No encontramos una app de correo en esta tablet. Copia el correo y escríbenos
                desde tu teléfono o computadora.
              </Text>
            </View>
          ) : null}

          <Button variant="danger" icon="mail" label="Escribir correo" onPress={handleWrite} />

          <View className="flex-row items-start gap-3 rounded-[10px] bg-canvas p-4">
            <Feather name="info" size={20} color={colors['primary-strong']} />
            <Text className="flex-1 font-sans text-sm leading-5 text-muted">
              Al abrir el correo se incluyen tu cuenta y la versión de la app para ayudarnos a
              revisar el problema. No compartas tu contraseña.
            </Text>
          </View>
        </View>
      </ScrollView>
    </Modal>
  );
}
