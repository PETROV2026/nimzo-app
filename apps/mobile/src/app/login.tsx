import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { loginSchema } from '@nimzo/shared';
import Constants from 'expo-constants';
import { Image } from 'expo-image';
import { useRef, useState } from 'react';
import {
  KeyboardAvoidingView,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  useWindowDimensions,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { z } from 'zod';
import { useSession } from '@/auth/session-provider';
import { Button } from '@/components/button';
import { TextField } from '@/components/text-field';
import { readLastEmail } from '@/lib/last-email';
import { useOnline } from '@/lib/use-online';
import { colors } from '@/theme/colors';

type FieldErrors = Partial<Record<'email' | 'password', string>>;

const logo = require('@nimzo/brand/logos/logo-horizontal-color.webp');
const appVersion = Constants.expoConfig?.version;
const twoColumnMinWidth = 900;

export default function LoginScreen() {
  const passwordRef = useRef<TextInput>(null);
  const [rememberedEmail] = useState(readLastEmail);
  const [email, setEmail] = useState(rememberedEmail);
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<FieldErrors>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const { status, accessError, signIn } = useSession();
  const online = useOnline();
  const { width, height } = useWindowDimensions();
  const twoColumns = width > height && width >= twoColumnMinWidth;

  const loading = submitting || status === 'checking';
  const formError = submitError ?? accessError;

  function handleEmailChange(text: string) {
    setEmail(text);
    setErrors((previous) => ({ ...previous, email: undefined }));
    setSubmitError(null);
  }

  function handlePasswordChange(text: string) {
    setPassword(text);
    setErrors((previous) => ({ ...previous, password: undefined }));
    setSubmitError(null);
  }

  async function handleSubmit() {
    if (loading || !online) return;
    const result = loginSchema.safeParse({ email, password });

    if (!result.success) {
      const { fieldErrors } = z.flattenError(result.error);

      setErrors({
        email: fieldErrors.email?.[0],
        password: fieldErrors.password?.[0],
      });

      return;
    }

    setErrors({});
    setSubmitError(null);
    setSubmitting(true);
    const error = await signIn(result.data.email, result.data.password);
    setSubmitting(false);
    setSubmitError(error);
  }

  const form = (
    <View className="w-full max-w-md gap-8">
      <View className="gap-2">
        <Text accessibilityRole="header" className="font-sans-bold text-3xl text-foreground">
          Inicia sesión
        </Text>
        <Text className="font-sans text-base leading-6 text-muted">
          Usa el correo y la contraseña que te dio tu administrador.
        </Text>
      </View>

      <View className="gap-5">
        <TextField
          label="Correo electrónico"
          value={email}
          onChangeText={handleEmailChange}
          error={errors.email}
          autoCapitalize="none"
          autoCorrect={false}
          autoComplete="email"
          keyboardType="email-address"
          returnKeyType="next"
          submitBehavior="submit"
          onSubmitEditing={() => passwordRef.current?.focus()}
          placeholder="nombre@empresa.com"
          editable={!loading}
        />
        <TextField
          ref={passwordRef}
          placeholder="Escribe tu contraseña"
          label="Contraseña"
          value={password}
          onChangeText={handlePasswordChange}
          error={errors.password}
          secureTextEntry={!showPassword}
          autoCapitalize="none"
          autoCorrect={false}
          autoComplete="current-password"
          autoFocus={rememberedEmail !== ''}
          returnKeyType="go"
          onSubmitEditing={handleSubmit}
          editable={!loading}
          rightAccessory={
            <Pressable
              onPress={() => setShowPassword((previous) => !previous)}
              hitSlop={8}
              className="min-h-14 min-w-14 items-center justify-center"
              accessibilityRole="button"
              accessibilityLabel={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
            >
              <Ionicons
                name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                size={24}
                color={colors.muted}
              />
            </Pressable>
          }
        />
      </View>

      <View className="gap-4">
        {online ? null : (
          <View
            accessibilityRole="alert"
            accessibilityLiveRegion="polite"
            className="flex-row items-start gap-3 rounded-lg bg-accent px-4 py-3"
          >
            <MaterialIcons name="cloud-off" size={24} color={colors['on-accent']} />
            <Text className="flex-1 font-sans-medium text-base leading-6 text-on-accent">
              Sin conexión a internet. Necesitas conexión para iniciar sesión.
            </Text>
          </View>
        )}
        {formError ? (
          <View
            accessibilityRole="alert"
            accessibilityLiveRegion="assertive"
            className="flex-row items-start gap-3 rounded-lg border-2 border-danger px-4 py-3"
          >
            <Ionicons name="alert-circle-outline" size={24} color={colors['danger-strong']} />
            <Text className="flex-1 font-sans-medium text-base leading-6 text-danger-strong">
              {formError}
            </Text>
          </View>
        ) : null}
        <Button
          label="Iniciar sesión"
          onPress={handleSubmit}
          loading={loading}
          disabled={!online}
        />
        <Text className="font-sans text-sm leading-5 text-muted">
          ¿No puedes entrar? Tu administrador puede restablecer tu contraseña.
        </Text>
      </View>
    </View>
  );

  const version = appVersion ? (
    <Text className="font-sans text-sm text-muted">Versión {appVersion}</Text>
  ) : null;

  return (
    <SafeAreaView className="flex-1 bg-background">
      <KeyboardAvoidingView className="flex-1" behavior="padding">
        {twoColumns ? (
          <View className="flex-1 flex-row">
            <View className="flex-1 items-center justify-center gap-6 bg-canvas px-12">
              <Image
                source={logo}
                style={{ width: 280, height: 108 }}
                contentFit="contain"
                accessibilityLabel="Nimzo"
              />
              <Text className="max-w-sm text-center font-sans-medium text-lg leading-7 text-muted">
                Inspección, prueba y mantenimiento de sistemas contra incendio.
              </Text>
              <View className="absolute bottom-8">{version}</View>
            </View>
            <ScrollView
              className="flex-1"
              contentContainerClassName="grow items-center justify-center px-12 py-12"
              keyboardShouldPersistTaps="handled"
            >
              {form}
            </ScrollView>
          </View>
        ) : (
          <ScrollView
            contentContainerClassName="grow items-center justify-center gap-10 px-8 py-12"
            keyboardShouldPersistTaps="handled"
          >
            <Image
              source={logo}
              style={{ width: 240, height: 93 }}
              contentFit="contain"
              accessibilityLabel="Nimzo"
            />
            {form}
            {version}
          </ScrollView>
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
