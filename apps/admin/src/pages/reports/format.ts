const dateTime = new Intl.DateTimeFormat('es-MX', { dateStyle: 'medium', timeStyle: 'short' });

export function formatSentAt(value: string) {
  return dateTime.format(new Date(value));
}
