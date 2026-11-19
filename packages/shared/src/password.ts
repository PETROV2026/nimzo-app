const lower = 'abcdefghjkmnpqrstuvwxyz';
const upper = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
const digits = '23456789';
const letters = lower + upper;

export function passwordProblem(value: string): string | null {
  if (value.length < 8) return 'La contraseña debe tener al menos 8 caracteres';
  if (value.length > 72) return 'La contraseña no puede tener más de 72 caracteres';
  if (!/[a-z]/.test(value) || !/[A-Z]/.test(value) || !/[0-9]/.test(value)) {
    return 'Usa mayúsculas, minúsculas y números';
  }
  return null;
}

function pick(alphabet: string, random: number) {
  return alphabet[random % alphabet.length];
}

type RandomSource = { getRandomValues(array: Uint32Array): Uint32Array };

export function generatePassword(length = 12) {
  const { crypto } = globalThis as unknown as { crypto: RandomSource };
  const values = crypto.getRandomValues(new Uint32Array(length));
  return Array.from(values, (value, index) => {
    if (index === 0) return pick(upper, value);
    if (index === 1) return pick(lower, value);
    return index % 4 === 3 ? pick(digits, value) : pick(letters, value);
  }).join('');
}
