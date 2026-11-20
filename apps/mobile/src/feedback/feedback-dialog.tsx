import { zodResolver } from '@hookform/resolvers/zod';
import { type FeedbackKind, feedbackKindLabels, feedbackSchema } from '@nimzo/shared';
import Constants from 'expo-constants';
import { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { Platform, Pressable, Text, View } from 'react-native';
import { FormDialog } from '@/components/form-dialog';
import { FormTextField } from '@/components/form-text-field';
import { Icon, type IconName } from '@/components/icon';
import { queueFeedback } from '@/feedback/feedback-db';
import { FeedbackPhotos } from '@/feedback/feedback-photos';
import { deletePhoto } from '@/lib/save-photo';
import { colors } from '@/theme';

const kindIcons: Record<FeedbackKind, IconName> = {
  bug: 'bug-outline',
  idea: 'bulb-outline',
};

const kindHints: Record<FeedbackKind, string> = {
  bug: 'Algo no funcionó como esperabas',
  idea: 'Algo que mejorarías o agregarías',
};

const kinds = Object.keys(feedbackKindLabels) as FeedbackKind[];

type FeedbackDialogProps = {
  technicianId: string;
  screen: string;
  onSent: () => void;
  onClose: () => void;
};

export function FeedbackDialog({ technicianId, screen, onSent, onClose }: FeedbackDialogProps) {
  const [photoUris, setPhotoUris] = useState<string[]>([]);
  const {
    control,
    handleSubmit,
    formState: { isDirty, errors },
  } = useForm({
    resolver: zodResolver(feedbackSchema),
    defaultValues: { kind: undefined, message: '' },
  });

  function close() {
    photoUris.forEach(deletePhoto);
    onClose();
  }

  const send = handleSubmit(({ kind, message }) => {
    queueFeedback(technicianId, {
      kind,
      message,
      screen,
      appVersion: Constants.expoConfig?.version ?? '',
      osVersion: String(Platform.Version),
      photoUris,
    });
    onSent();
  });

  return (
    <FormDialog
      title="Enviar comentarios"
      description="Cuéntanos qué falló o qué mejorarías. Lo leerá el equipo de Nimzo."
      dirty={isDirty || photoUris.length > 0}
      discardQuestion="¿Descartar este comentario?"
      submitLabel="Enviar"
      submitIcon="send"
      onSubmit={send}
      onClose={close}
    >
      <Controller
        control={control}
        name="kind"
        render={({ field: { value, onChange } }) => (
          <View className="gap-3">
            <Text className="font-sans-medium text-lg text-foreground">
              ¿Qué quieres contarnos?
            </Text>
            <View accessibilityRole="radiogroup" className="flex-row gap-3">
              {kinds.map((kind) => {
                const selected = value === kind;
                return (
                  <Pressable
                    key={kind}
                    accessibilityRole="radio"
                    accessibilityState={{ checked: selected }}
                    accessibilityHint={kindHints[kind]}
                    onPress={() => onChange(kind)}
                    className={`min-h-16 flex-1 flex-row items-center gap-3 rounded-xl border-2 px-4 py-3 ${selected ? 'border-primary-strong bg-primary-strong' : 'border-border-strong bg-background active:bg-surface'}`}
                  >
                    <Icon
                      name={kindIcons[kind]}
                      size={28}
                      color={selected ? colors['on-primary'] : colors.foreground}
                    />
                    <View className="flex-1">
                      <Text
                        className={`font-sans-semibold text-lg ${selected ? 'text-on-primary' : 'text-foreground'}`}
                      >
                        {feedbackKindLabels[kind]}
                      </Text>
                      <Text
                        className={`font-sans text-sm ${selected ? 'text-on-primary' : 'text-muted'}`}
                      >
                        {kindHints[kind]}
                      </Text>
                    </View>
                  </Pressable>
                );
              })}
            </View>
            {errors.kind?.message ? (
              <Text
                accessibilityRole="alert"
                className="font-sans-medium text-base text-destructive"
              >
                {errors.kind.message}
              </Text>
            ) : null}
          </View>
        )}
      />
      <FormTextField
        control={control}
        name="message"
        label="Tu comentario"
        placeholder="Ej. Al guardar la firma del supervisor la app se cerró."
        multiline
        textAlignVertical="top"
        style={{ minHeight: 128, paddingTop: 12 }}
      />
      <FeedbackPhotos uris={photoUris} onChange={setPhotoUris} />
    </FormDialog>
  );
}
