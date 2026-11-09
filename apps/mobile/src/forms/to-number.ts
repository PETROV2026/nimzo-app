export function toNumber(text: string) {
  const number = Number(text);
  return text.trim() && !Number.isNaN(number) ? number : undefined;
}

export function cleanNumber(text: string, decimal: boolean) {
  const negative = text.trimStart().startsWith('-');
  const digits = text.replaceAll(',', '.').replace(decimal ? /[^\d.]/g : /\D/g, '');
  const [whole, ...rest] = digits.split('.');
  const number = rest.length ? `${whole}.${rest.join('')}` : whole;
  return negative ? `-${number}` : number;
}