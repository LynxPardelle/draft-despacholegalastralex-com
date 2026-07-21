import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const readJson = (path) => JSON.parse(readFileSync(new URL(`../${path}`, import.meta.url), 'utf8'));

test('QA-001 uses the approved home proposition', () => {
  const page = readJson('default/i18n/es.json');
  assert.equal(page.dictionary.page.hero.subtitle, 'Claridad legal para mejorar tu vida');
});
