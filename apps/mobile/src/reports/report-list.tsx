import { formTitle } from '@nimzo/shared';
import { router } from 'expo-router';
import { useState } from 'react';
import { FlatList, Pressable, Text, View } from 'react-native';
import { announce } from '@/components/announcement-toast';
import { ConfirmDialog } from '@/components/confirm-dialog';
import { EmptyState } from '@/components/empty-state';
import { Icon, type IconName } from '@/components/icon';
import { canDeleteReport, type LocalReportStatus } from '@/reports/report-rules';
import { deleteDraft, type LocalReport, useReports } from '@/reports/reports-db';
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

function titleOf(form: LocalServiceForm | undefined) {
  return form ? formTitle(form) : 'Formato';
}

type ReportRowProps = {
  report: LocalReport;
  form?: LocalServiceForm;
  onDelete: () => void;
};

function ReportRow({ report, form, onDelete }: ReportRowProps) {
  const title = titleOf(form);
  return (
    <View className="flex-row items-center gap-2 overflow-hidden rounded-2xl border border-border bg-background">
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={title}
        onPress={() =>
          router.push({
            pathname: '/forms/[code]',
            params: { code: report.formCode, report: report.id },
          })
        }
        className="min-h-20 flex-1 flex-row items-center gap-4 p-4 active:bg-surface"
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
      {canDeleteReport(report.status) ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Eliminar ${title}`}
          onPress={onDelete}
          className="mr-3 size-14 items-center justify-center rounded-lg active:bg-destructive/10"
        >
          <Icon name="trash-outline" size={24} color={colors.destructive} />
        </Pressable>
      ) : null}
    </View>
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
  const [deleting, setDeleting] = useState<LocalReport | null>(null);

  function remove(report: LocalReport) {
    setDeleting(null);
    if (deleteDraft(report.id)) announce('Reporte eliminado');
  }

  return (
    <>
      <FlatList
        data={reports}
        keyExtractor={(report) => report.id}
        renderItem={({ item }) => (
          <ReportRow
            report={item}
            form={byCode.get(item.formCode)}
            onDelete={() => setDeleting(item)}
          />
        )}
        ListEmptyComponent={<EmptyState {...emptyStates[status]} />}
        contentContainerClassName="flex-grow gap-3 px-6 pb-6 pt-2"
      />
      {deleting ? (
        <ConfirmDialog
          title="¿Eliminar este reporte?"
          message={`${titleOf(byCode.get(deleting.formCode))}${deleting.snapshot ? `, ${deleting.snapshot.client.name}` : ''}. Se eliminarán sus respuestas, fotos y firmas de este dispositivo y no podrán recuperarse.`}
          confirmLabel="Eliminar"
          tone="destructive"
          onConfirm={() => remove(deleting)}
          onClose={() => setDeleting(null)}
        />
      ) : null}
    </>
  );
}
