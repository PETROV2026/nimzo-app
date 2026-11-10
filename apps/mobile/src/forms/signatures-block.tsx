import { View } from 'react-native';
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

export function createSignatures(profileSignaturePath: string | null): SignaturesValue {
  return {
    supervisorName: '',
    supervisorSignature: null,
    technicianSignature: profileSignaturePath ? copyProfileSignature(profileSignaturePath) : null,
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
  const nameError = value.supervisorName.trim() ? undefined : errors?.supervisorName;

  return (
    <View className="gap-10">
      <View className="gap-5">
        <TextField
          label={`${supervisorNameLabel} *`}
          accessibilityLabel={supervisorNameLabel}
          placeholder="Escribe el nombre completo"
          autoCapitalize="words"
          surface="canvas"
          value={value.supervisorName}
          onChangeText={(supervisorName) => onChange({ ...value, supervisorName })}
          error={nameError}
        />
        <SignaturePad
          label="Firma del supervisor"
          value={value.supervisorSignature}
          onChange={(supervisorSignature) => onChange({ ...value, supervisorSignature })}
          error={errors?.supervisorSignature}
          onDrawingChange={onDrawingChange}
        />
      </View>
      <SignaturePad
        label="Firma del técnico"
        value={value.technicianSignature}
        onChange={(technicianSignature) => onChange({ ...value, technicianSignature })}
        error={errors?.technicianSignature}
        onDrawingChange={onDrawingChange}
      />
    </View>
  );
}
