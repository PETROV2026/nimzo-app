import { privacyNotice, privacyNoticeUpdatedAt } from '@nimzo/shared';
import { Modal, ScrollView, Text, View } from 'react-native';
import { Button } from '@/components/button';
import { DialogHeader } from '@/components/dialog-header';

const updatedAt = new Intl.DateTimeFormat('es-MX', {
  day: 'numeric',
  month: 'long',
  year: 'numeric',
}).format(new Date(`${privacyNoticeUpdatedAt}T12:00:00`));

type PrivacyNoticeDialogProps = {
  onClose: () => void;
};

export function PrivacyNoticeDialog({ onClose }: PrivacyNoticeDialogProps) {
  return (
    <Modal transparent animationType="fade" onRequestClose={onClose}>
      <View className="flex-1 items-center justify-center bg-foreground/40 p-6">
        <View className="max-h-full w-full max-w-[720px] gap-4 rounded-3xl bg-background p-8">
          <DialogHeader
            title="Aviso de privacidad"
            description={`Última actualización: ${updatedAt}`}
            onClose={onClose}
          />
          <ScrollView className="shrink" contentContainerClassName="gap-6 pb-2">
            {privacyNotice.map((section) => (
              <View key={section.title} className="gap-2">
                <Text
                  accessibilityRole="header"
                  className="font-sans-semibold text-lg text-foreground"
                >
                  {section.title}
                </Text>
                {section.paragraphs.map((paragraph) => (
                  <Text key={paragraph} className="font-sans text-base leading-6 text-muted">
                    {paragraph}
                  </Text>
                ))}
              </View>
            ))}
          </ScrollView>
          <Button variant="secondary" label="Cerrar" onPress={onClose} />
        </View>
      </View>
    </Modal>
  );
}
