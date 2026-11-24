import { formTitle, matchesSearch, type ReportStatus } from '@nimzo/shared';
import { useState } from 'react';
import { FlatList, ScrollView, Text, useWindowDimensions, View } from 'react-native';
import { EmptyState } from '@/components/empty-state';
import { HeaderSearchButton, useHeaderSearch } from '@/components/header-search';
import type { IconName } from '@/components/icon';
import { Notice } from '@/components/notice';
import { type Segment, SegmentedControl } from '@/components/segmented-control';
import { ServiceFormCard } from '@/components/service-forms/service-form-card';
import { useOnline } from '@/lib/use-online';
import { mockReports } from '@/reports/mock-reports';
import { ReportCard } from '@/reports/report-card';
import { type LocalServiceForm, useServiceForms } from '@/service-forms/service-forms-db';

type Section = 'new' | ReportStatus;

const sections: Segment<Section>[] = [
  { value: 'new', label: 'Nuevo servicio', icon: 'add-circle' },
  { value: 'draft', label: 'Activos', icon: 'play-circle-outline' },
  { value: 'pending', label: 'Pendientes', icon: 'hourglass-outline' },
  { value: 'sent', label: 'Historial', icon: 'time-outline' },
];

const emptyStates: Record<ReportStatus, { icon: IconName; title: string; description: string }> = {
  draft: {
    icon: 'play-circle-outline',
    title: 'No tienes reportes activos',
    description:
      'Cuando empieces un servicio desde «Nuevo servicio», aparecerá aquí mientras llenas el reporte.',
  },
  pending: {
    icon: 'hourglass-outline',
    title: 'No tienes reportes pendientes',
    description:
      'Cuando termines de llenar un reporte, aparecerá aquí hasta que tenga las dos firmas.',
  },
  sent: {
    icon: 'time-outline',
    title: 'Aún no has enviado reportes',
    description: 'Cuando envíes un reporte, aparecerá aquí con su folio.',
  },
};

function ServiceFormGrid({ catalog, search }: { catalog: LocalServiceForm[]; search: string }) {
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
          <ServiceFormCard form={form} search={search} />
        </View>
      ))}
    </View>
  );
}

function ReportList({ status }: { status: ReportStatus }) {
  const { width } = useWindowDimensions();
  const online = useOnline();
  const columns = width >= 960 ? 2 : 1;
  const reports = mockReports.filter((report) => report.status === status);

  return (
    <FlatList
      key={columns}
      data={reports}
      numColumns={columns}
      keyExtractor={(report) => report.id}
      renderItem={({ item }) => (
        <View className={columns === 2 ? 'w-1/2 p-2' : 'p-2'}>
          <ReportCard report={item} />
        </View>
      )}
      ListHeaderComponent={
        status === 'sent' && !online ? (
          <View className="p-2">
            <Notice message="Sin conexión. Estás viendo los últimos reportes que se descargaron." />
          </View>
        ) : undefined
      }
      ListEmptyComponent={<EmptyState {...emptyStates[status]} />}
      contentContainerClassName="flex-grow px-4 pb-6"
    />
  );
}

export default function ServicesScreen() {
  const [current, setCurrent] = useState<Section>('new');
  const headerSearch = useHeaderSearch();
  const catalog = useServiceForms();

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
      {current === 'new' ? (
        <ScrollView
          keyboardShouldPersistTaps="handled"
          contentContainerClassName="flex-grow gap-5 px-6 pb-6 pt-2"
        >
          <ServiceFormGrid catalog={catalog} search={headerSearch.term} />
        </ScrollView>
      ) : (
        <ReportList status={current} />
      )}
    </>
  );
}
