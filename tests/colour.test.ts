// node --test tests/ — event pages' link and button colours (lib/colour.ts).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { channels, contrast, eventLineColours } from '../lib/colour.ts';

// Every board colour in lib/countdowns.ts, so a new event is checked too
const source = readFileSync(new URL('../lib/countdowns.ts', import.meta.url), 'utf8');
const boards = [...source.matchAll(/(?:board: |BOARD = )\{ color: '(#[0-9a-f]{6})'(?:, ink: '(#[0-9a-f]{6})')? \}/gi)].map((m) => ({
  color: m[1],
  ink: m[2] ?? '#ffffff',
}));

test('finds the boards', () => {
  assert.ok(boards.length >= 20, `only ${boards.length} boards found`);
});

test('every event page keeps its links and buttons readable', () => {
  for (const { color, ink } of boards) {
    const c = eventLineColours(color, ink);
    const label = `${color}/${ink}`;
    assert.ok(contrast(channels(c.text), [255, 255, 255]) >= 4.5, `${label} text on white`);
    assert.ok(contrast(channels(c.textDark), channels('#0f1216')) >= 4.5, `${label} text on the dark dial`);
    assert.ok(contrast(channels(c.button), channels(ink)) >= 4.5, `${label} dark-mode button`);
  }
});

test('a board colour that reads already is used as it is', () => {
  assert.equal(eventLineColours('#1f5f3f').text, '#1f5f3f'); // Christmas
  assert.equal(eventLineColours('#000000', '#ff8a1f').textDark, '#ff8a1f'); // Halloween's orange
  assert.equal(eventLineColours('#f3c64a', '#000000').text, '#000000'); // the weekend's yellow is too light
});
