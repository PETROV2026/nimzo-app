import { useState } from 'react';
import { Modal, Pressable, ScrollView, Text, View } from 'react-native';
import { Button } from '@/components/button';
import { DialogHeader } from '@/components/dialog-header';
import { Icon } from '@/components/icon';
import { useFormReadOnly } from '@/forms/form-context';
import { colors } from '@/theme';
import { type Option, optionToneStyles } from './option-buttons';

type OptionsInfoProps = {
  label: string;
  options: (Option<string> & { description?: string })[];
};

export function OptionsInfo({ label, options }: OptionsInfoProps) {
  const [open, setOpen] = useState(false);
  const readOnly = useFormReadOnly();
  const described = options.filter((option) => option.description);
  if (readOnly || described.length === 0) return null;

  return (
    <>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`Qué significa cada opción de ${label}`}
        onPress={() => setOpen(true)}
        className="-my-3.5 size-14 items-center justify-center rounded-full active:bg-primary/10"
      >
        <Icon name="information-circle-outline" size={26} color={colors['primary-strong']} />
      </Pressable>
      {open ? (
        <Modal transparent animationType="fade" onRequestClose={() => setOpen(false)}>
          <View className="flex-1 items-center justify-center bg-foreground/40 p-8">
            <View className="max-h-full w-full max-w-[560px] gap-6 rounded-3xl bg-background p-8">
              <DialogHeader
                title={label}
                description="Qué significa cada opción."
                onClose={() => setOpen(false)}
              />
              <ScrollView className="shrink" contentContainerClassName="gap-5">
                {described.map((option) => {
                  const tone = optionToneStyles[option.tone ?? 'primary'];
                  return (
                    <View key={option.value} className="gap-2">
                      <View className={`self-start rounded-lg px-4 py-2 ${tone.box}`}>
                        <Text className={`font-sans-semibold text-base ${tone.text}`}>
                          {option.label}
                        </Text>
                      </View>
                      <Text className="font-sans text-base text-foreground">
                        {option.description}
                      </Text>
                    </View>
                  );
                })}
              </ScrollView>
              <Button label="Entendido" onPress={() => setOpen(false)} />
            </View>
          </View>
        </Modal>
      ) : null}
    </>
  );
}
