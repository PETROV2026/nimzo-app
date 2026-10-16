const dateTime = new Intl.DateTimeFormat('es-MX', { dateStyle: 'medium', timeStyle: 'short' });

export function formatLastSignIn(value: string | null | undefined) {
  return value ? dateTime.format(new Date(value)) : 'Nunca';
}
