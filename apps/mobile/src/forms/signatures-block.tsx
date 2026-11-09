import { useState } from 'react';
import { View } from 'react-native';
import { useSession } from '@/auth/session-provider';
import { Button } from '@/components/button';
import { TextField } from '@/components/text-field';
import { copyProfileSignature } from '@/forms/signature-files';
import { SignaturePad } from '@/forms/signature-pad';

export type SignaturesValue = {
  supervisorName: string;
  supervisorSignature: string | null;
  technicianSignature: string | null;
};

export type SignaturesErrors = Partial<Record<keyof SignaturesValue, string>>;

export function validateSignatures(value: SignaturesValue): SignaturesErrors {
  return {
    supervisorName: value.supervisorName.trim() ? undefined : 'Escribe el nombre del supervisor.',
    supervisorSignature: value.supervisorSignature ? undefined : 'Falta firmar',
    technicianSignature: value.technicianSignature ? undefined : 'Falta firmar',
  };
}

type SignaturesBlockProps = {
  value: SignaturesValue;
  onChange: (value: SignaturesValue) => void;
  errors?: SignaturesErrors;
  onDrawingChange?: (drawing: boolean) => void;
};

const supervisorNameLabel = 'Nombre de quien supervisó y revisó el servicio';

export function SignaturesBlock({
  value,
  onChange,
  errors,
  onDrawingChange,
}: SignaturesBlockProps) {
  const session = useSession();
  const savedSignaturePath = session.status === 'signed-in' ? session.profile?.signaturePath : null;
  const [copying, setCopying] = useState(false);
  const [copyError, setCopyError] = useState<string>();
  const nameError = value.supervisorName.trim() ? undefined : errors?.supervisorName;

  async function handleUseSavedSignature() {
    if (!savedSignaturePath) return;
    setCopying(true);
    setCopyError(undefined);
    try {
      const technicianSignature = await copyProfileSignature(savedSignaturePath);
      onChange({ ...value, technicianSignature });
    } catch {
      setCopyError('No se pudo usar tu firma guardada. Revisa tu conexión e intenta de nuevo.');
    } finally {
      setCopying(false);
    }
  }

  return (
    <View className="gap-10">
      <View className="gap-5">
        <SignaturePad
          label="Firma del supervisor"
          value={value.supervisorSignature}
          onChange={(supervisorSignature) => onChange({ ...value, supervisorSignature })}
          error={errors?.supervisorSignature}
          onDrawingChange={onDrawingChange}
        />
        <TextField
          label={`${supervisorNameLabel} *`}
          accessibilityLabel={supervisorNameLabel}
          placeholder="Escribe el nombre completo"
          autoCapitalize="words"
          value={value.supervisorName}
          onChangeText={(supervisorName) => onChange({ ...value, supervisorName })}
          error={nameError}
        />
      </View>
      <SignaturePad
        label="Firma del técnico"
        value={value.technicianSignature}
        onChange={(technicianSignature) => onChange({ ...value, technicianSignature })}
        error={copyError ?? errors?.technicianSignature}
        onDrawingChange={onDrawingChange}
        extraAction={
          savedSignaturePath ? (
            <Button
              variant="outline"
              icon="person-outline"
              label="Usar mi firma guardada"
              onPress={handleUseSavedSignature}
              loading={copying}
            />
          ) : null
        }
      />
    </View>
  );
}
