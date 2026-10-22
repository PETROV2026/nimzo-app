import { Ionicons } from '@expo/vector-icons';
import { loginSchema } from '@nimzo/shared';
import { Image } from 'expo-image';
import { useRef, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useSession } from '@/auth/session-provider';
import { Button } from '@/components/button';
import { TextField } from '@/components/text-field';
import { colors } from '@/theme/colors';
import { z } from 'zod';

type FieldErrors = Partial<Record<'email' | 'password', string>>;

export default function LoginScreen() {
  const passwordRef = useRef<TextInput>(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<FieldErrors>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const { status, accessError, signIn } = useSession();

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
    if (loading) return;
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
        <Button label="Iniciar sesión" onPress={handleSubmit} loading={loading} />
        <Text className="font-sans text-sm leading-5 text-muted">
          ¿No puedes entrar? Tu administrador puede restablecer tu contraseña.
        </Text>
      </View>
    </View>
  );

  return (
    <SafeAreaView className="flex-1 bg-background">
      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerClassName="grow items-center justify-center gap-10 px-8 py-12"
          keyboardShouldPersistTaps="handled"
        >
          <Image
            source={require('@nimzo/brand/logos/logo-horizontal-color.webp')}
            style={{ width: 240, height: 93 }}
            contentFit="contain"
            accessibilityLabel="Nimzo"
          />
          {form}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
