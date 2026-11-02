export type TextPart = { text: string; match: boolean };

function foldChar(char: string) {
  return char.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
}

function fold(text: string) {
  let folded = '';
  const origin: number[] = [];
  for (let index = 0; index < text.length; index += 1) {
    const piece = foldChar(text[index]);
    for (let offset = 0; offset < piece.length; offset += 1) {
      folded += piece[offset];
      origin.push(index);
    }
  }
  return { folded, origin };
}

export function normalizeTerm(term: string) {
  return foldChar(term).trim();
}

export function findMatches(text: string, term: string) {
  const needle = normalizeTerm(term);
  if (!needle) return [];
  const { folded, origin } = fold(text);
  const ranges: { start: number; end: number }[] = [];
  let from = folded.indexOf(needle);
  while (from !== -1) {
    const last = from + needle.length - 1;
    ranges.push({ start: origin[from], end: origin[last] + 1 });
    from = folded.indexOf(needle, from + needle.length);
  }
  return ranges;
}

export function splitByMatches(text: string, term: string): TextPart[] {
  const ranges = findMatches(text, term);
  if (ranges.length === 0) return [{ text, match: false }];
  const parts: TextPart[] = [];
  let cursor = 0;
  for (const { start, end } of ranges) {
    if (start > cursor) parts.push({ text: text.slice(cursor, start), match: false });
    parts.push({ text: text.slice(start, end), match: true });
    cursor = end;
  }
  if (cursor < text.length) parts.push({ text: text.slice(cursor), match: false });
  return parts;
}

export function excerptAround(text: string, term: string, before = 40) {
  const flat = text.replace(/\s+/g, ' ').trim();
  const [first] = findMatches(flat, term);
  if (!first || first.start <= before) return flat;
  const cut = flat.lastIndexOf(' ', first.start - before);
  return `…${flat.slice(cut === -1 ? first.start - before : cut + 1)}`;
}
