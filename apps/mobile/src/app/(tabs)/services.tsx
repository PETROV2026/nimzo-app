import { formTitle, matchesSearch } from '@nimzo/shared';
import { useState } from 'react';
import { router } from 'expo-router';
import { ScrollView, Text, View } from 'react-native';
import { EmptyState } from '@/components/empty-state';
import { HeaderSearchButton, useHeaderSearch } from '@/components/header-search';
import { type Segment, SegmentedControl } from '@/components/segmented-control';
import { useSession } from '@/auth/session-provider';
import { NewServiceDialog } from '@/components/service-forms/new-service-dialog';
import { ServiceFormCard } from '@/components/service-forms/service-form-card';
import { type LocalServiceForm, useServiceForms } from '@/service-forms/service-forms-db';

type Section = 'new' | 'active' | 'pending' | 'history';

const sections: Segment<Section>[] = [
  {
    value: 'new',
    label: 'Nuevo servicio',
    icon: 'add-circle',
  },
  {
    value: 'active',
    label: 'Activos',
    icon: 'play-circle-outline',
  },
  {
    value: 'pending',
    label: 'Pendientes',
    icon: 'hourglass-outline',
  },
  {
    value: 'history',
    label: 'Historial',
    icon: 'time-outline',
  },
];

type ServiceFormGridProps = {
  catalog: LocalServiceForm[];
  search: string;
  onPick: (form: LocalServiceForm) => void;
};

function ServiceFormGrid({ catalog, search, onPick }: ServiceFormGridProps) {
  if (catalog.length === 0) {
    return (
      <EmptyState
        icon="cloud-download-outline"
        title="Aún no hay formatos en este dispositivo"
        description="Conéctate a internet para descargarlos. Después podrás usarlos sin conexión."
      />
    );
  }

  const forms = catalog.filter((form) => matchesSearch(formTitle(form), search));

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
          <ServiceFormCard form={form} search={search} onPress={() => onPick(form)} />
        </View>
      ))}
    </View>
  );
}

export default function ServicesScreen() {
  const [current, setCurrent] = useState<Section>('new');
  const headerSearch = useHeaderSearch();
  const catalog = useServiceForms();
  const session = useSession();
  const technicianId = session.status === 'signed-in' ? session.session.user.id : '';
  const [starting, setStarting] = useState<LocalServiceForm | null>(null);

  return (
    <>
      <HeaderSearchButton
        search={headerSearch}
        label="Buscar formato"
        available={current === 'new'}
      />
      <View className="px-6 pb-3 pt-6">
        <SegmentedControl
          segments={sections}
          value={current}
          onChange={(next) => {
            setCurrent(next);
            headerSearch.close();
          }}
        />
      </View>
      <ScrollView
        keyboardShouldPersistTaps="handled"
        contentContainerClassName="flex-grow gap-5 px-6 pb-6 pt-2"
      >
        {current === 'new' ? (
          <ServiceFormGrid catalog={catalog} search={headerSearch.term} onPick={setStarting} />
        ) : (
          <EmptyState
            icon="clipboard-outline"
            title="Aún no tienes servicios"
            description="Crea un servicio para una sucursal de tus clientes y llena sus formatos, incluso sin conexión."
          />
        )}
      </ScrollView>
      {starting && technicianId ? (
        <NewServiceDialog
          form={starting}
          technicianId={technicianId}
          onClose={() => setStarting(null)}
          onStart={(service) => {
            setStarting(null);
            router.push({
              pathname: '/forms/[code]',
              params: {
                code: starting.code,
                client: service.clientId,
                branch: service.branchId,
                ...(service.systemId ? { system: service.systemId } : {}),
              },
            });
          }}
        />
      ) : null}
    </>
  );
}
