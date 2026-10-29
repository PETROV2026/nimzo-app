export function toNumber(text: string) {
  const number = Number(text.replace(',', '.'));
  return text.trim() && !Number.isNaN(number) ? number : undefined;
}
