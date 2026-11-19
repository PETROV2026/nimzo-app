import { Tabs } from 'expo-router';
import { useState } from 'react';
import { HeaderIconButton } from '@/components/header-icon-button';
import { SearchField } from '@/components/search-field';

export type HeaderSearch = {
  open: boolean;
  term: string;
  setTerm: (term: string) => void;
  toggle: () => void;
  close: () => void;
};

export function useHeaderSearch(): HeaderSearch {
  const [open, setOpen] = useState(false);
  const [term, setTerm] = useState('');

  return {
    open,
    term: open ? term : '',
    setTerm,
    toggle: () => {
      setOpen((value) => !value);
      setTerm('');
    },
    close: () => {
      setOpen(false);
      setTerm('');
    },
  };
}

type HeaderSearchButtonProps = {
  search: HeaderSearch;
  label: string;
  available?: boolean;
};

export function HeaderSearchButton({ search, label, available = true }: HeaderSearchButtonProps) {
  const visible = available || search.open;
  return (
    <Tabs.Screen
      options={{
        headerRight: () =>
          visible ? (
            <HeaderIconButton
              icon={search.open ? 'close' : 'search'}
              label={search.open ? 'Cerrar búsqueda' : label}
              onPress={search.toggle}
            />
          ) : null,
      }}
    />
  );
}

type HeaderSearchFieldProps = {
  search: HeaderSearch;
  placeholder: string;
  accessibilityLabel?: string;
};

export function HeaderSearchField({
  search,
  placeholder,
  accessibilityLabel,
}: HeaderSearchFieldProps) {
  if (!search.open) return null;
  return (
    <SearchField
      value={search.term}
      onChangeText={search.setTerm}
      placeholder={placeholder}
      accessibilityLabel={accessibilityLabel}
      autoFocus
    />
  );
}
