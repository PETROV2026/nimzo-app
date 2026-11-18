import { useState, type ReactNode } from 'react';
import {
  KeyboardAvoidingView,
  Modal,
  Pressable,
  ScrollView,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import { Button } from '@/components/button';
import { DialogHeader } from '@/components/dialog-header';
import { Icon, type IconName } from '@/components/icon';
import { useKeyboardVisible } from '@/lib/use-keyboard-visible';
import { colors } from '@/theme';

type SecondaryAction = {
  label: string;
  icon: IconName;
  tone: 'destructive' | 'primary';
  onPress: () => void;
};

type FormDialogProps = {
  title: string;
  description?: string;
  dirty: boolean;
  discardQuestion?: string;
  submitLabel: string;
  submitIcon?: IconName;
  submitDisabled?: boolean;
  submitting?: boolean;
  error?: string | null;
  wide?: boolean;
  secondaryAction?: SecondaryAction;
  onSubmit: () => void;
  onClose: () => void;
  children: ReactNode;
};

export function FormDialog({
  title,
  description,
  dirty,
  discardQuestion = '¿Descartar los cambios que hiciste?',
  submitLabel,
  submitIcon,
  submitDisabled,
  submitting,
  error,
  wide,
  secondaryAction,
  onSubmit,
  onClose,
  children,
}: FormDialogProps) {
  const { height } = useWindowDimensions();
  const compact = height < 800;
  const keyboardVisible = useKeyboardVisible();
  const [discarding, setDiscarding] = useState<(() => void) | null>(null);

  function leave(then: () => void) {
    if (submitting) return;
    if (dirty) {
      setDiscarding(() => then);
      return;
    }
    then();
  }

  return (
    <Modal transparent animationType="fade" onRequestClose={() => leave(onClose)}>
      <KeyboardAvoidingView behavior="padding" className="flex-1 bg-foreground/40">
        <ScrollView
          className="flex-1"
          contentContainerClassName={`grow items-center p-8 ${keyboardVisible ? 'justify-start' : 'justify-center'}`}
          keyboardShouldPersistTaps="handled"
        >
          <View
            className={`w-full rounded-3xl bg-background ${wide ? 'max-w-[760px]' : 'max-w-[640px]'} ${compact ? 'gap-5 p-6' : 'gap-7 p-8'}`}
          >
            <DialogHeader
              title={title}
              description={description}
              onClose={() => leave(onClose)}
              disabled={submitting}
            />
            {children}
            {error ? (
              <View
                accessibilityRole="alert"
                className="flex-row items-start gap-3 rounded-lg border-2 border-destructive px-4 py-3"
              >
                <Icon name="alert-circle-outline" size={22} color={colors.destructive} />
                <Text className="flex-1 font-sans-medium text-base text-destructive">{error}</Text>
              </View>
            ) : null}
            {discarding ? (
              <View className="gap-4">
                <Text className="font-sans-medium text-lg text-foreground">{discardQuestion}</Text>
                <View className="flex-row gap-3">
                  <View className="flex-1">
                    <Button
                      variant="secondary"
                      label="Seguir editando"
                      onPress={() => setDiscarding(null)}
                    />
                  </View>
                  <View className="flex-1">
                    <Button variant="destructive" label="Descartar" onPress={discarding} />
                  </View>
                </View>
              </View>
            ) : (
              <View className="gap-4">
                <View className="flex-row gap-3">
                  <View className="flex-1">
                    <Button
                      variant="secondary"
                      label="Cancelar"
                      onPress={() => leave(onClose)}
                      disabled={submitting}
                    />
                  </View>
                  <View className="flex-1">
                    <Button
                      label={submitLabel}
                      variant="success"
                      icon={submitIcon}
                      onPress={onSubmit}
                      loading={submitting}
                      disabled={submitDisabled}
                    />
                  </View>
                </View>
                {secondaryAction ? (
                  <Pressable
                    onPress={() => leave(secondaryAction.onPress)}
                    accessibilityRole="button"
                    className="min-h-14 flex-row items-center justify-center gap-2 self-center rounded-lg px-4 active:bg-border"
                  >
                    <Icon
                      name={secondaryAction.icon}
                      size={22}
                      color={
                        secondaryAction.tone === 'destructive'
                          ? colors.destructive
                          : colors['primary-strong']
                      }
                    />
                    <Text
                      className={`font-sans-semibold text-base ${secondaryAction.tone === 'destructive' ? 'text-destructive' : 'text-primary-strong'}`}
                    >
                      {secondaryAction.label}
                    </Text>
                  </Pressable>
                ) : null}
              </View>
            )}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </Modal>
  );
}
