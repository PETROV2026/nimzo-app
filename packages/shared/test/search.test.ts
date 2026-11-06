import assert from 'node:assert/strict';
import { test } from 'node:test';

import { excerptAround, matchesSearch, splitByMatches } from '../src/search.ts';

function marked(text: string, term: string) {
  return splitByMatches(text, term)
    .map((part) => (part.match ? `[${part.text}]` : part.text))
    .join('');
}

test('matches ignore accents and case', () => {
  assert.equal(marked('Revisar la Válvula', 'valvula'), 'Revisar la [Válvula]');
  assert.equal(marked('Bomba diésel', 'DIESEL'), 'Bomba [diésel]');
  assert.equal(marked('Planta norte y PLANTA sur', 'planta'), '[Planta] norte y [PLANTA] sur');
});

test('phrases are matched as a whole', () => {
  assert.equal(marked('Cuarto de máquinas', 'de maquinas'), 'Cuarto [de máquinas]');
});

test('an empty term marks nothing', () => {
  assert.deepEqual(splitByMatches('Hola', '  '), [{ text: 'Hola', match: false }]);
});

test('matchesSearch agrees with the highlight', () => {
  assert.equal(matchesSearch('Extintor CO₂', 'extintor'), true);
  assert.equal(matchesSearch('Extintor', 'hidrante'), false);
  assert.equal(matchesSearch('Extintor', ''), true);
});

test('long texts are cut before the first match', () => {
  const text =
    'Llevar mangueras nuevas y revisar primero el cuarto de máquinas antes de la planta norte.';
  assert.equal(
    excerptAround(text, 'planta'),
    '…primero el cuarto de máquinas antes de la planta norte.',
  );
  assert.equal(excerptAround('Planta norte', 'planta'), 'Planta norte');
});
