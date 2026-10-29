import { Modal, Text, View } from 'react-native';
import { Button } from '@/components/button';

type ConfirmDialogProps = {
  title: string;
  message: string;
  confirmLabel: string;
  onConfirm: () => void;
  onClose: () => void;
  loading?: boolean;
};

export function ConfirmDialog({
  title,
  message,
  confirmLabel,
  onConfirm,
  onClose,
  loading,
}: ConfirmDialogProps) {
  return (
    <Modal transparent animationType="fade" onRequestClose={loading ? undefined : onClose}>
      <View className="flex-1 items-center justify-center bg-foreground/40 p-8">
        <View className="w-full max-w-[480px] gap-4 rounded-2xl bg-background p-6">
          <Text accessibilityRole="header" className="font-sans-semibold text-xl text-foreground">
            {title}
          </Text>
          <Text className="font-sans text-lg text-muted">{message}</Text>
          <View className="mt-2 flex-row gap-4">
            <View className="flex-1">
              <Button variant="secondary" label="Cancelar" onPress={onClose} disabled={loading} />
            </View>
            <View className="flex-1">
              <Button label={confirmLabel} onPress={onConfirm} loading={loading} />
            </View>
          </View>
        </View>
      </View>
    </Modal>
  );
}
