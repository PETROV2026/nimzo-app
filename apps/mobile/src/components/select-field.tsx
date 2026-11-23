import { matchesSearch } from '@nimzo/shared';
import { useState } from 'react';
import { FlatList, Modal, Pressable, Text, View } from 'react-native';
import { HighlightedText } from '@/components/highlighted-text';
import { Icon } from '@/components/icon';
import { SearchField } from '@/components/search-field';
import { colors } from '@/theme/colors';

type SelectOption<T extends string> = { value: T; label: string; description?: string };

type SelectFieldProps<T extends string> = {
  label: string;
  value: T | null;
  options: readonly SelectOption<T>[];
  onChange: (value: T) => void;
  placeholder?: string;
  disabled?: boolean;
  error?: string;
  searchPlaceholder?: string;
};

export function SelectField<T extends string>({
  label,
  value,
  options,
  onChange,
  placeholder = 'Selecciona una opción',
  disabled,
  error,
  searchPlaceholder,
}: SelectFieldProps<T>) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const selected = options.find((option) => option.value === value);
  const shown = searchPlaceholder
    ? options.filter((option) =>
        matchesSearch([option.label, option.description ?? ''].join('\n'), search),
      )
    : options;

  function close() {
    setOpen(false);
    setSearch('');
  }

  return (
    <View className="gap-2">
      <Text className="font-sans-medium text-lg text-foreground">{label}</Text>
      <Pressable
        onPress={() => setOpen(true)}
        disabled={disabled}
        accessibilityRole="button"
        accessibilityLabel={label}
        accessibilityValue={{ text: selected?.label ?? placeholder }}
        accessibilityHint={error}
        accessibilityState={{ disabled }}
        className={`min-h-14 flex-row items-center justify-between gap-3 rounded-lg border-2 ${error ? 'border-danger' : 'border-border-strong'} bg-background px-4 py-2 ${disabled ? 'opacity-50' : ''}`}
      >
        <View className="flex-1">
          <Text
            numberOfLines={1}
            className={`font-sans text-lg ${selected ? 'text-foreground' : 'text-muted'}`}
          >
            {selected?.label ?? placeholder}
          </Text>
          {selected?.description ? (
            <Text numberOfLines={1} className="font-sans text-sm text-muted">
              {selected.description}
            </Text>
          ) : null}
        </View>
        <Icon name="chevron-down" size={24} color={colors.muted} />
      </Pressable>
      {error ? (
        <Text accessibilityLiveRegion="polite" className="font-sans text-sm text-destructive">
          {error}
        </Text>
      ) : null}

      <Modal visible={open} transparent animationType="fade" onRequestClose={close}>
        <View className="flex-1 items-center justify-center p-8">
          <Pressable
            className="absolute inset-0 bg-foreground/40"
            onPress={close}
            accessibilityLabel="Cerrar"
          />
          <View className="max-h-[520px] w-full max-w-[480px] gap-2 rounded-2xl bg-background py-2">
            <Text className="px-6 pt-3 font-sans-semibold text-xl text-foreground">{label}</Text>
            {searchPlaceholder ? (
              <View className="px-4 pb-1">
                <SearchField
                  value={search}
                  onChangeText={setSearch}
                  placeholder={searchPlaceholder}
                />
              </View>
            ) : null}
            <FlatList
              data={shown}
              keyExtractor={(option) => option.value}
              keyboardShouldPersistTaps="handled"
              ListEmptyComponent={
                <Text className="px-6 py-4 font-sans text-base text-muted">
                  No hay opciones que coincidan con «{search.trim()}».
                </Text>
              }
              renderItem={({ item: option }) => {
                const checked = option.value === value;
                return (
                  <Pressable
                    onPress={() => {
                      onChange(option.value);
                      close();
                    }}
                    accessibilityRole="button"
                    accessibilityState={{ selected: checked }}
                    className={`min-h-14 flex-row items-center gap-3 px-6 py-2 ${checked ? 'bg-surface' : 'active:bg-surface'}`}
                  >
                    <View className="flex-1">
                      <HighlightedText
                        text={option.label}
                        term={search}
                        className="font-sans text-lg text-foreground"
                      />
                      {option.description ? (
                        <HighlightedText
                          text={option.description}
                          term={search}
                          className="font-sans text-sm text-muted"
                        />
                      ) : null}
                    </View>
                    {checked ? (
                      <Icon name="checkmark" size={22} color={colors['primary-strong']} />
                    ) : null}
                  </Pressable>
                );
              }}
            />
          </View>
        </View>
      </Modal>
    </View>
  );
}
