const accessNote =
  'Para volver a acceder necesitarás tu correo, tu contraseña y conexión a internet.';

type ReportCounts = { draft: number; pending: number };

type SignOutChanges = { pending: string; rejected: string; reports: ReportCounts };

function plural(count: number, word: string) {
  return count === 1 ? word : `${word}s`;
}

export function describeReports({ draft, pending }: ReportCounts) {
  const [first, second] = [
    { count: draft, label: 'activo' },
    { count: pending, label: 'pendiente' },
  ].filter(({ count }) => count > 0);
  if (!first) return '';
  const head = `${first.count} ${plural(first.count, 'reporte')} ${plural(first.count, first.label)}`;
  return second ? `${head} y ${second.count} ${plural(second.count, second.label)}` : head;
}

function reportsNote(counts: ReportCounts, short: boolean) {
  const reports = describeReports(counts);
  if (!reports) return null;
  const one = counts.draft + counts.pending === 1;
  if (short) return `También tienes ${reports}, que ${one ? 'seguirá' : 'seguirán'} aquí.`;
  return `Tienes ${reports} en este dispositivo. ${one ? 'Seguirá' : 'Seguirán'} aquí cuando vuelvas a iniciar sesión con esta cuenta.`;
}

export function signOutNote({ pending, rejected, reports }: SignOutChanges) {
  return [
    pending
      ? `Tienes ${pending} sin sincronizar en este dispositivo. La sincronización continuará cuando vuelvas a iniciar sesión con esta cuenta.`
      : null,
    rejected
      ? `El servidor rechazó cambios en ${rejected}. Siguen guardados en este dispositivo, pero debes revisar sus datos para sincronizar.`
      : null,
    reportsNote(reports, Boolean(pending || rejected)),
    accessNote,
  ]
    .filter((part) => part !== null)
    .join(' ');
}
