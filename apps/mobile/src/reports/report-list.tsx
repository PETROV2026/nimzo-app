import { formTitle, matchesSearch } from '@nimzo/shared';
import { router } from 'expo-router';
import { useState } from 'react';
import { FlatList, Pressable, Text, View } from 'react-native';
import { announce } from '@/components/announcement-toast';
import { ConfirmDialog } from '@/components/confirm-dialog';
import { EmptyState } from '@/components/empty-state';
import { HighlightedText } from '@/components/highlighted-text';
import { Icon, type IconName } from '@/components/icon';
import {
  canDeleteReport,
  type LocalReportStatus,
  type ReportSnapshot,
} from '@/reports/report-rules';
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

function placeOf(snapshot: ReportSnapshot | null) {
  if (!snapshot) return '';
  return [snapshot.client.name, snapshot.branch.name, snapshot.system?.name]
    .filter(Boolean)
    .join(', ');
}

type ReportRowProps = {
  report: LocalReport;
  form?: LocalServiceForm;
  search: string;
  onDelete: () => void;
};

function ReportRow({ report, form, search, onDelete }: ReportRowProps) {
  const title = titleOf(form);
  const place = placeOf(report.snapshot);
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
          <HighlightedText
            text={title}
            term={search}
            className="font-sans-bold text-lg text-foreground"
          />
          {place ? (
            <HighlightedText
              text={place}
              term={search}
              className="font-sans text-base text-muted"
            />
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
  search = '',
}: {
  technicianId: string;
  status: LocalReportStatus;
  search?: string;
}) {
  const reports = useReports(technicianId, status);
  const forms = useServiceForms();
  const byCode = new Map(forms.map((form) => [form.code, form]));
  const [deleting, setDeleting] = useState<LocalReport | null>(null);
  const shown = reports.filter((report) =>
    matchesSearch(`${titleOf(byCode.get(report.formCode))}\n${placeOf(report.snapshot)}`, search),
  );

  function remove(report: LocalReport) {
    setDeleting(null);
    if (deleteDraft(report.id)) announce('Reporte eliminado');
  }

  return (
    <>
      <FlatList
        data={shown}
        keyExtractor={(report) => report.id}
        keyboardShouldPersistTaps="handled"
        renderItem={({ item }) => (
          <ReportRow
            report={item}
            form={byCode.get(item.formCode)}
            search={search}
            onDelete={() => setDeleting(item)}
          />
        )}
        ListEmptyComponent={
          reports.length === 0 ? (
            <EmptyState {...emptyStates[status]} />
          ) : (
            <Text className="py-10 text-center font-sans text-base text-muted">
              Ningún reporte coincide con «{search.trim()}». Revisa cómo lo escribiste.
            </Text>
          )
        }
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
