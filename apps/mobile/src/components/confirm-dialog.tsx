import { Feather } from '@expo/vector-icons';
import { Modal, Text, View } from 'react-native';
import { Button } from '@/components/button';
import { DialogHeader } from '@/components/dialog-header';
import { colors } from '@/theme/colors';

type ConfirmDialogProps = {
  title: string;
  message: string;
  note?: string;
  confirmLabel: string;
  tone?: 'primary' | 'danger';
  onConfirm: () => void;
  onClose: () => void;
  loading?: boolean;
};

export function ConfirmDialog({
  title,
  message,
  note,
  confirmLabel,
  tone = 'primary',
  onConfirm,
  onClose,
  loading,
}: ConfirmDialogProps) {
  return (
    <Modal transparent animationType="fade" onRequestClose={loading ? undefined : onClose}>
      <View className="flex-1 items-center justify-center bg-foreground/40 p-8">
        <View className="w-full max-w-[560px] gap-6 rounded-3xl bg-background p-8">
          <DialogHeader title={title} onClose={onClose} disabled={loading} />
          <Text className="font-sans text-lg text-foreground">{message}</Text>
          {note ? (
            <View className="flex-row items-start gap-3 rounded-xl bg-canvas p-[18px]">
              <Feather name="info" size={22} color={colors.muted} />
              <Text className="flex-1 font-sans text-base text-muted">{note}</Text>
            </View>
          ) : null}
          <View className="flex-row gap-3">
            <View className="flex-1">
              <Button variant="secondary" label="Cancelar" onPress={onClose} disabled={loading} />
            </View>
            <View className="flex-1">
              <Button variant={tone} label={confirmLabel} onPress={onConfirm} loading={loading} />
            </View>
          </View>
        </View>
      </View>
    </Modal>
  );
}
