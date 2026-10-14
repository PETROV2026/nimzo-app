import { Ionicons } from '@expo/vector-icons';
import { loginSchema } from '@nimzo/shared';
import { Image } from 'expo-image';
import { useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button } from '@/components/button';
import { TextField } from '@/components/text-field';
import { colors } from '@/theme/colors';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, Text, View } from 'react-native';

type FieldErrors = Partial<Record<'email' | 'password', string>>;

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<FieldErrors>({});
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  function handleEmailChange(text: string) {
    setEmail(text);
    setErrors((previous) => ({ ...previous, email: undefined }));
  }

  function handlePasswordChange(text: string) {
    setPassword(text);
    setErrors((previous) => ({ ...previous, password: undefined }));
  }

  function handleSubmit() {
    const trimmedEmail = email.trim();
    const result = loginSchema.safeParse({ email: trimmedEmail, password });

    if (!result.success) {
      const fieldErrors: FieldErrors = {};
      for (const issue of result.error.issues) {
        const field = issue.path[0] as 'email' | 'password';
        fieldErrors[field] ??= issue.message;
      }
      setErrors(fieldErrors);
      return;
    }

    setErrors({});
    setLoading(true);
    // TODO: connect to Supabase Auth.
  }

  return (
    <SafeAreaView className="flex-1 bg-background">
      <KeyboardAvoidingView 
        className="flex-1"
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          contentContainerClassName="flex-1 items-center justify-center gap-6 p-8"
          keyboardShouldPersistTaps="handled"
        >
          <Image
          source={require('@nimzo/brand/logos/logo-horizontal-color.webp')}
          style={{ width: 240, height: 93 }}
          contentFit="contain"
          accessibilityLabel="Nimzo"
        />

        <Text className="text-base text-muted">Inicia sesión para continuar</Text>
        <View className="w-full max-w-sm gap-4">
          <TextField
            label="Correo electrónico"
            value={email}
            onChangeText={handleEmailChange}
            error={errors.email}
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="email-address"
            placeholder="ejemplo@tucorreo.com"
            editable={!loading}
          />
          <TextField
            label="Contraseña"
            value={password}
            onChangeText={handlePasswordChange}
            error={errors.password}
            secureTextEntry={!showPassword}
            placeholder="Escribe tu contraseña"
            editable={!loading}
            rightAccessory={
              <Pressable
                onPress={() => setShowPassword((previous) => !previous)}
                className="px-3"
                accessibilityRole="button"
                accessibilityLabel={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
              >
                <Ionicons
                  name={showPassword ? 'eye-off' : 'eye'}
                  size={20}
                  color={colors.muted}
                />
              </Pressable>
            }
          />
          <Text className="self-end text-sm text-primary-strong">¿Olvidaste tu contraseña?</Text>
          <Button label="Iniciar sesión" onPress={handleSubmit} loading={loading} />
        </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}