import { formTitle, matchesSearch } from '@nimzo/shared';
import { useState } from 'react';
import { router } from 'expo-router';
import { ScrollView, Text, useWindowDimensions, View } from 'react-native';
import { EmptyState } from '@/components/empty-state';
import { HeaderSearchButton, useHeaderSearch } from '@/components/header-search';
import { type Segment, SegmentedControl } from '@/components/segmented-control';
import { ServiceFormCard } from '@/components/service-forms/service-form-card';
import { useSession } from '@/auth/session-provider';
import { ReportList } from '@/reports/report-list';
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
  columns: number;
  onPick: (form: LocalServiceForm) => void;
};

function ServiceFormGrid({ catalog, search, columns, onPick }: ServiceFormGridProps) {
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

  const rows = Array.from({ length: Math.ceil(forms.length / columns) }, (_, index) =>
    forms.slice(index * columns, index * columns + columns),
  );

  return (
    <View className="gap-3">
      {rows.map((row) => (
        <View key={row[0].code} className="flex-row gap-3">
          {row.map((form) => (
            <ServiceFormCard
              key={form.code}
              form={form}
              search={search}
              onPress={() => onPick(form)}
            />
          ))}
          {Array.from({ length: columns - row.length }, (_, index) => (
            <View key={index} className="flex-1" />
          ))}
        </View>
      ))}
    </View>
  );
}

export default function ServicesScreen() {
  const [current, setCurrent] = useState<Section>('new');
  const headerSearch = useHeaderSearch();
  const catalog = useServiceForms();
  const { width } = useWindowDimensions();
  const columns = width >= 1000 ? 4 : 3;
  const session = useSession();
  const technicianId = session.status === 'signed-in' ? session.session.user.id : '';

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
      {current === 'active' || current === 'pending' ? (
        <ReportList
          technicianId={technicianId}
          status={current === 'active' ? 'draft' : 'pending'}
        />
      ) : (
        <ScrollView
          keyboardShouldPersistTaps="handled"
          contentContainerClassName="flex-grow gap-5 px-6 pb-6 pt-2"
        >
          {current === 'new' ? (
            <ServiceFormGrid
              catalog={catalog}
              search={headerSearch.term}
              columns={columns}
              onPick={(form) =>
                router.push({ pathname: '/forms/[code]', params: { code: form.code } })
              }
            />
          ) : (
            <EmptyState
              icon="time-outline"
              title="Aún no has enviado reportes"
              description="Cuando envíes un reporte, aparecerá aquí con su folio."
            />
          )}
        </ScrollView>
      )}
    </>
  );
}
