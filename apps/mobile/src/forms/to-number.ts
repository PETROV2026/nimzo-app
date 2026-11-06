export function toNumber(text: string) {
  const number = Number(text.replace(',', '.'));
  return text.trim() && !Number.isNaN(number) ? number : undefined;
}

export function cleanNumber(text: string, decimal: boolean) {
  const digits = text.replaceAll(',', '.').replace(decimal ? /[^\d.]/g : /\D/g, '');
  const [whole, ...rest] = digits.split('.');
  return rest.length ? `${whole}.${rest.join('')}` : whole;
}
