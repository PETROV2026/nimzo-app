import { loginSchema } from '@nimzo/shared';
import { Image } from 'expo-image';
import { useState } from 'react';
import { Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button } from '../components/Button';
import { TextField } from '../components/TextField';

type FieldErrors = Partial<Record<'email' | 'password', string>>;

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<FieldErrors>({});

  function handleEmailChange(text: string) {
    setEmail(text);
    setErrors((previous) => ({ ...previous, email: undefined }));
  }

  function handlePasswordChange(text: string) {
    setPassword(text);
    setErrors((previous) => ({ ...previous, password: undefined }));
  }

  function handleSubmit() {
    const result = loginSchema.safeParse({ email, password });

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
    // TODO: connect to Supabase Auth.
  }

  return (
    <SafeAreaView className="flex-1 bg-background">
      <View className="flex-1 items-center justify-center gap-6 p-8">
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
            keyboardType="email-address"
          />
          <TextField
            label="Contraseña"
            value={password}
            onChangeText={handlePasswordChange}
            error={errors.password}
            secureTextEntry
          />
          <Text className="self-end text-sm text-primary-strong">¿Olvidaste tu contraseña?</Text>
          <Button label="Iniciar sesión" onPress={handleSubmit} />
        </View>
      </View>
    </SafeAreaView>
  );
}
