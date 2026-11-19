import { formTitle, matchesSearch } from '@nimzo/shared';
import { Tabs } from 'expo-router';
import { useState } from 'react';
import { ScrollView, Text, View } from 'react-native';
import { EmptyState } from '@/components/empty-state';
import { HeaderIconButton } from '@/components/header-icon-button';
import { SearchField } from '@/components/search-field';
import { type Segment, SegmentedControl } from '@/components/segmented-control';
import { ServiceFormCard } from '@/components/service-forms/service-form-card';
import { mockServiceForms, type ServiceFormSummary } from '@/service-forms/mock-service-forms';

type Section = 'new' | 'active' | 'pending' | 'history';

const sections: (Segment<Section> & { title: string; description: string })[] = [
  {
    value: 'new',
    label: 'Nuevo servicio',
    icon: 'add-circle',
    title: '¿Qué servicio vas a realizar?',
    description: 'Elige el formato que vas a llenar.',
  },
  {
    value: 'active',
    label: 'Activos',
    icon: 'play-circle-outline',
    title: 'Servicios activos',
    description: 'Retoma los servicios que tienes en progreso.',
  },
  {
    value: 'pending',
    label: 'Pendientes',
    icon: 'hourglass-outline',
    title: 'Servicios pendientes',
    description: 'Ya los terminaste; solo falta enviarlos al cliente.',
  },
  {
    value: 'history',
    label: 'Historial',
    icon: 'time-outline',
    title: 'Historial de servicios',
    description: 'Consulta y descarga los reportes que ya enviaste.',
  },
];

function ServiceFormGrid({ forms, search }: { forms: ServiceFormSummary[]; search: string }) {
  if (forms.length === 0) {
    return (
      <Text className="py-10 text-center font-sans text-base text-muted">
        No hay formatos que coincidan con «{search.trim()}». Revisa cómo lo escribiste.
      </Text>
    );
  }

  return (
    <View className="-m-2 flex-row flex-wrap">
      {forms.map((form) => (
        <View key={form.code} className="w-1/2 p-2">
          <ServiceFormCard form={form} search={search} />
        </View>
      ))}
    </View>
  );
}

export default function ServicesScreen() {
  const [current, setCurrent] = useState<Section>('new');
  const [searchOpen, setSearchOpen] = useState(false);
  const [search, setSearch] = useState('');
  const section = sections.find((item) => item.value === current) ?? sections[0];
  const forms = mockServiceForms.filter((form) => matchesSearch(formTitle(form), search));

  function toggleSearch() {
    setSearchOpen((open) => !open);
    setSearch('');
  }

  return (
    <>
      <Tabs.Screen
        options={{
          headerRight: () =>
            current === 'new' ? (
              <HeaderIconButton
                icon={searchOpen ? 'close' : 'search'}
                label={searchOpen ? 'Cerrar búsqueda' : 'Buscar formato'}
                onPress={toggleSearch}
              />
            ) : null,
        }}
      />
      <ScrollView
        keyboardShouldPersistTaps="handled"
        contentContainerClassName="flex-grow gap-5 p-6"
      >
        <View className="gap-1">
          <Text className="font-sans-bold text-2xl text-foreground">{section.title}</Text>
          <Text className="font-sans text-base text-muted">{section.description}</Text>
        </View>
        <SegmentedControl segments={sections} value={current} onChange={setCurrent} />
        {current === 'new' ? (
          <>
            {searchOpen ? (
              <SearchField
                value={search}
                onChangeText={setSearch}
                placeholder="Buscar formato"
                autoFocus
              />
            ) : null}
            <ServiceFormGrid forms={forms} search={search} />
          </>
        ) : (
          <EmptyState
            icon="clipboard-outline"
            title="Aún no tienes servicios"
            description="Crea un servicio para una sucursal de tus clientes y llena sus formatos, incluso sin conexión."
          />
        )}
      </ScrollView>
    </>
  );
}
