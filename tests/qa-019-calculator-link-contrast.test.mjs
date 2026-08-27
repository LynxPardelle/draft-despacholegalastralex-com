import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const readJson = (path) => JSON.parse(readFileSync(new URL(`../${path}`, import.meta.url), 'utf8'));

test('QA-019 keeps the calculator WhatsApp foreground explicit for normal and visited links', () => {
  const payload = readJson('recuperacion-impuestos-inmobiliarios/components.json');
  const link = payload.components.find(({ id }) => id === 'calculatorContactLink');
  const combo = readJson('recuperacion-impuestos-inmobiliarios/angora-combos.json').combos.calculatorPrimaryAction.join(' ');

  assert.equal(link.type, 'link');
  assert.match(combo, /(?:^|\s)ank-color-bgColor(?:\s|$)/);
  assert.match(combo, /(?:^|\s)ank-bg-linkColor(?:\s|$)/);
  // GenericLink's normal/visited inherit selectors exclude only explicit color utilities, not combos.
  assert.match(link.config.classes, /(?:^|\s)ank-color-bgColor(?:\s|$)/);
  assert.match(link.config.classes, /(?:^|\s)calculatorPrimaryAction(?:\s|$)/);
});
