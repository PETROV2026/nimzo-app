export function cleanNumber(text: string) {
  const negative = text.trimStart().startsWith('-');
  const [whole = '', ...rest] = text
    .replaceAll(',', '.')
    .replace(/[^\d.]/g, '')
    .split('.');
  const number = rest.length ? `${whole}.${rest.join('')}` : whole;
  return negative ? `-${number}` : number;
}

export function toNumber(text: string, decimal = true) {
  const number = Number(text);
  const valid = text.trim() !== '' && !Number.isNaN(number) && (decimal || !text.includes('.'));
  return valid ? number : undefined;
}

export function numberError(text: string, decimal: boolean) {
  return decimal || !text.includes('.') ? undefined : 'Escribe un número entero, sin punto ni coma';
}
