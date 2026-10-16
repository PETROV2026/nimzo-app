const letters = 'abcdefghjkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ';
const digits = '23456789';

function pick(alphabet: string, random: number) {
  return alphabet[random % alphabet.length];
}

export function generatePassword(length = 12) {
  const values = crypto.getRandomValues(new Uint32Array(length));
  const chars = Array.from(values, (value, index) =>
    index % 4 === 3 ? pick(digits, value) : pick(letters, value),
  );
  return chars.join('');
}
