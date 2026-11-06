export type TextPart = { text: string; match: boolean };

export type MatchRange = { start: number; end: number };

function fold(value: string) {
  return value.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
}

export function toSearchText(value: string) {
  return fold(value).trim();
}

export function matchesSearch(text: string, term: string) {
  const needle = toSearchText(term);
  return !needle || fold(text).includes(needle);
}

function foldWithOrigin(text: string) {
  let folded = '';
  const origin: number[] = [];
  for (let index = 0; index < text.length; index += 1) {
    const piece = fold(text.charAt(index));
    for (let offset = 0; offset < piece.length; offset += 1) {
      folded += piece.charAt(offset);
      origin.push(index);
    }
  }
  return { folded, origin };
}

export function findMatches(text: string, term: string): MatchRange[] {
  const needle = toSearchText(term);
  if (!needle) return [];
  const { folded, origin } = foldWithOrigin(text);
  const ranges: MatchRange[] = [];
  let from = folded.indexOf(needle);
  while (from !== -1) {
    const start = origin[from] ?? 0;
    const end = (origin[from + needle.length - 1] ?? start) + 1;
    ranges.push({ start, end });
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
