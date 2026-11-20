import { formatFolio, formTitle } from '@nimzo/shared';
import { Text, View } from 'react-native';
import { FormIcon } from '@/components/service-forms/form-icon';
import type { ReportListItem } from '@/reports/mock-reports';

const dateTime = new Intl.DateTimeFormat('es-MX', {
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
  hour: 'numeric',
  minute: '2-digit',
});

const formatDate = (iso: string) => dateTime.format(new Date(iso));

function reportDetails(report: ReportListItem) {
  switch (report.status) {
    case 'draft':
      return {
        date: `Modificado el ${formatDate(report.updatedAt)}`,
        detail:
          report.missingFields === 1 ? 'Falta 1 campo' : `Faltan ${report.missingFields} campos`,
      };
    case 'pending':
      return {
        date: `Modificado el ${formatDate(report.updatedAt)}`,
        detail:
          report.missingSignatures.length > 1
            ? 'Faltan las dos firmas'
            : report.missingSignatures.includes('supervisor')
              ? 'Falta la firma del supervisor'
              : 'Falta la firma del técnico',
      };
    case 'sent':
      return {
        date: `Enviado el ${formatDate(report.sentAt)}`,
        detail: `Folio ${formatFolio(report.folio)}`,
      };
  }
}

export function ReportCard({ report }: { report: ReportListItem }) {
  const { date, detail } = reportDetails(report);
  const sent = report.status === 'sent';

  return (
    <View className="min-h-20 flex-row items-center gap-4 rounded-2xl bg-background p-4 shadow-sm">
      <FormIcon form={report.form} />
      <View className="flex-1 gap-1">
        <Text className="font-sans-bold text-lg text-foreground">{formTitle(report.form)}</Text>
        <Text className="font-sans text-sm text-muted">
          {report.client} | {report.branch}
        </Text>
        {report.system ? (
          <Text className="font-sans text-sm text-muted">Sistema: {report.system}</Text>
        ) : null}
        <Text className="font-sans-medium text-sm text-danger-strong">{date}</Text>
        <View
          className={`mt-1 self-start rounded-full px-3 py-1 ${sent ? 'bg-surface' : 'bg-accent'}`}
        >
          <Text
            className={`font-sans-semibold text-sm ${sent ? 'text-foreground' : 'text-on-accent'}`}
          >
            {detail}
          </Text>
        </View>
      </View>
    </View>
  );
}
