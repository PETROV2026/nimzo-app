import { Modal, Pressable, Text, View } from 'react-native';
import { Icon } from '@/components/icon';
import { noteColors } from '@/notes/note-colors';
import type { NoteColor } from '@/notes/notes-db';
import { colors } from '@/theme';

type NoteMenuProps = {
  color: NoteColor;
  onColor: (color: NoteColor) => void;
  onDelete: () => void;
  onClose: () => void;
};

export function NoteMenu({ color, onColor, onDelete, onClose }: NoteMenuProps) {
  return (
    <Modal transparent animationType="fade" onRequestClose={onClose}>
      <Pressable
        className="absolute inset-0 bg-foreground/20"
        onPress={onClose}
        accessibilityLabel="Cerrar menú"
      />
      <View
        className="absolute right-3 top-20 w-[340px] overflow-hidden rounded-2xl bg-background"
        style={{ elevation: 8 }}
      >
        <View className="gap-2 px-4 pb-3 pt-4">
          <Text className="font-sans-semibold text-base text-foreground">Color de la nota</Text>
          <View
            accessibilityRole="radiogroup"
            accessibilityLabel="Color de la nota"
            className="flex-row justify-between"
          >
            {noteColors.map((option) => {
              const selected = color === option.value;
              return (
                <Pressable
                  key={option.value}
                  onPress={() => {
                    onColor(option.value);
                    onClose();
                  }}
                  accessibilityRole="radio"
                  accessibilityLabel={option.label}
                  accessibilityState={{ selected }}
                  className="min-h-14 min-w-14 items-center justify-center"
                >
                  <View
                    className={`h-10 w-10 items-center justify-center rounded-full ${option.className} ${selected ? 'border-[3px] border-foreground' : ''}`}
                  >
                    {selected ? (
                      <Icon
                        name="checkmark"
                        size={20}
                        color={
                          option.value === 'yellow' || option.value === 'none'
                            ? colors.foreground
                            : colors.background
                        }
                      />
                    ) : null}
                  </View>
                </Pressable>
              );
            })}
          </View>
        </View>
        <View className="h-px bg-border" />
        <Pressable
          onPress={() => {
            onClose();
            onDelete();
          }}
          accessibilityRole="button"
          className="min-h-16 flex-row items-center gap-3 px-4 active:bg-border"
        >
          <Icon name="trash-outline" size={24} color={colors['danger-strong']} />
          <Text className="font-sans-semibold text-lg text-danger-strong">Eliminar nota</Text>
        </Pressable>
      </View>
    </Modal>
  );
}
