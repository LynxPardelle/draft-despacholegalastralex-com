import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

test('campaign raised sections do not compete with a base paper background', () => {
  const { combos } = JSON.parse(readFileSync(new URL('../soft-landing-china/angora-combos.json', import.meta.url), 'utf8'));
  assert.doesNotMatch(combos.astraChinaSection.join(' '), /(?:^|\s)ank-bg-/);
  assert.match(combos.astraChinaMain.join(' '), /ank-bg-HASHFBF8F2/);
  assert.match(combos.astraChinaRaisedSection.join(' '), /ank-bg-HASHF7EFDD/);
});
