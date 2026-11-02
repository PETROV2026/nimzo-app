const time = new Intl.DateTimeFormat('es-MX', { hour: 'numeric', minute: '2-digit' });
const shortDate = new Intl.DateTimeFormat('es-MX', { day: 'numeric', month: 'short' });
const weekday = new Intl.DateTimeFormat('es-MX', {
  weekday: 'short',
  day: 'numeric',
  month: 'short',
});

function sameDay(a: Date, b: Date) {
  return a.toDateString() === b.toDateString();
}

function dayLabel(date: Date, now: Date) {
  const tomorrow = new Date(now);
  tomorrow.setDate(now.getDate() + 1);
  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  if (sameDay(date, now)) return 'Hoy';
  if (sameDay(date, tomorrow)) return 'Mañana';
  if (sameDay(date, yesterday)) return 'Ayer';
  return null;
}

export function formatReminder(value: string, now = new Date()) {
  const date = new Date(value);
  const day = dayLabel(date, now) ?? weekday.format(date);
  return `${day}, ${time.format(date)}`;
}

export function formatUpdated(value: string, now = new Date()) {
  const date = new Date(value);
  const day = dayLabel(date, now);
  if (day === 'Hoy') return time.format(date);
  return day ?? shortDate.format(date);
}

export function isOverdue(value: string | null, now = new Date()) {
  return value !== null && new Date(value).getTime() < now.getTime();
}

export function formatSaved(value: string, now = new Date()) {
  const date = new Date(value);
  return sameDay(date, now)
    ? `Guardada a las ${time.format(date)}`
    : `Guardada el ${shortDate.format(date)} a las ${time.format(date)}`;
}
