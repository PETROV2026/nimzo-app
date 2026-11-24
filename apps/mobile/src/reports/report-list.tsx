import { formTitle } from '@nimzo/shared';
import { router } from 'expo-router';
import { FlatList, Pressable, Text, View } from 'react-native';
import { EmptyState } from '@/components/empty-state';
import { Icon, type IconName } from '@/components/icon';
import type { LocalReportStatus } from '@/reports/report-rules';
import { type LocalReport, useReports } from '@/reports/reports-db';
import { type LocalServiceForm, useServiceForms } from '@/service-forms/service-forms-db';
import { colors } from '@/theme';

const dateTime = new Intl.DateTimeFormat('es-MX', { dateStyle: 'medium', timeStyle: 'short' });

const emptyStates: Record<
  LocalReportStatus,
  { icon: IconName; title: string; description: string }
> = {
  draft: {
    icon: 'play-circle-outline',
    title: 'No tienes reportes activos',
    description: 'Cuando empieces un servicio, aparecerá aquí mientras llenas el formato.',
  },
  pending: {
    icon: 'hourglass-outline',
    title: 'No tienes reportes pendientes',
    description: 'Los reportes terminados y firmados aparecen aquí, listos para enviar.',
  },
};

function ReportRow({ report, form }: { report: LocalReport; form?: LocalServiceForm }) {
  const title = form ? formTitle(form) : 'Formato';
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={title}
      onPress={() =>
        router.push({
          pathname: '/forms/[code]',
          params: { code: report.formCode, report: report.id },
        })
      }
      className="min-h-20 flex-row items-center gap-4 rounded-2xl border border-border bg-background p-4 active:bg-surface"
    >
      <View className="flex-1 gap-1">
        <Text className="font-sans-bold text-lg text-foreground">{title}</Text>
        {report.snapshot ? (
          <Text className="font-sans text-base text-muted">
            {report.snapshot.client.name}, {report.snapshot.branch.name}
          </Text>
        ) : null}
        <Text className="font-sans text-sm text-muted">
          Modificado el {dateTime.format(new Date(report.updatedAt))}
        </Text>
      </View>
      <Icon name="arrow-forward" size={24} color={colors.foreground} />
    </Pressable>
  );
}

export function ReportList({
  technicianId,
  status,
}: {
  technicianId: string;
  status: LocalReportStatus;
}) {
  const reports = useReports(technicianId, status);
  const forms = useServiceForms();
  const byCode = new Map(forms.map((form) => [form.code, form]));

  return (
    <FlatList
      data={reports}
      keyExtractor={(report) => report.id}
      renderItem={({ item }) => <ReportRow report={item} form={byCode.get(item.formCode)} />}
      ListEmptyComponent={<EmptyState {...emptyStates[status]} />}
      contentContainerClassName="flex-grow gap-3 px-6 pb-6 pt-2"
    />
  );
}
