import { Tabs } from 'expo-router';
import { useState, useSyncExternalStore } from 'react';
import { HeaderIconButton } from '@/components/header-icon-button';
import { SearchField } from '@/components/search-field';

type SearchState = { open: boolean; term: string };

function createSearchStore() {
  let state: SearchState = { open: false, term: '' };
  const listeners = new Set<() => void>();
  return {
    get: () => state,
    set(next: SearchState) {
      state = next;
      for (const listener of listeners) listener();
    },
    subscribe(listener: () => void) {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
  };
}

type SearchStore = ReturnType<typeof createSearchStore>;

export type HeaderSearch = {
  open: boolean;
  term: string;
  setTerm: (term: string) => void;
  toggle: () => void;
  close: () => void;
  store: SearchStore;
};

export function useHeaderSearch(): HeaderSearch {
  const [store] = useState(createSearchStore);
  const state = useSyncExternalStore(store.subscribe, store.get);

  return {
    open: state.open,
    term: state.open ? state.term : '',
    setTerm: (term) => store.set({ ...store.get(), term }),
    toggle: () => store.set({ open: !store.get().open, term: '' }),
    close: () => store.set({ open: false, term: '' }),
    store,
  };
}

function HeaderSearchInput({
  store,
  placeholder,
  accessibilityLabel,
}: {
  store: SearchStore;
  placeholder: string;
  accessibilityLabel: string;
}) {
  const { term } = useSyncExternalStore(store.subscribe, store.get);
  return (
    <SearchField
      value={term}
      onChangeText={(next) => store.set({ open: true, term: next })}
      placeholder={placeholder}
      accessibilityLabel={accessibilityLabel}
      autoFocus
      tone="header"
    />
  );
}

type HeaderSearchButtonProps = {
  search: HeaderSearch;
  label: string;
  placeholder?: string;
  available?: boolean;
};

export function HeaderSearchButton({
  search,
  label,
  placeholder = label,
  available = true,
}: HeaderSearchButtonProps) {
  const { open, store, toggle } = search;
  const visible = available || open;
  return (
    <Tabs.Screen
      options={{
        headerTitle: open
          ? () => (
              <HeaderSearchInput
                store={store}
                placeholder={placeholder}
                accessibilityLabel={label}
              />
            )
          : undefined,
        headerRight: () =>
          visible ? (
            <HeaderIconButton
              icon={open ? 'close' : 'search'}
              label={open ? 'Cerrar búsqueda' : label}
              onPress={toggle}
            />
          ) : null,
      }}
    />
  );
}
