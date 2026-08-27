import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const readJson = (path) => JSON.parse(readFileSync(new URL(`../${path}`, import.meta.url), 'utf8'));

test('QA-009 removes the repeated hero wordmark while preserving the approved heading', () => {
  const home = readJson('default/components.json').components;
  const hero = home.find(({ id }) => id === 'heroCopy');
  const title = home.find(({ id }) => id === 'heroTitle');
  assert.equal(title.config.tag, 'h1');
  assert.equal(title.valueInstructions, 'set:config.text,i18n,page.hero.subtitle');
  assert.equal(hero.config.components[0], 'heroBrandLogo');
  assert.equal(hero.config.components.includes('heroSubtitle'), false);
});

test('QA-009 gives the white header mark a visible branded surface in both themes', () => {
  const logo = readJson('components.json').components.find(({ id }) => id === 'brandLogo');
  assert.equal(logo.config.width, 56);
  assert.equal(logo.config.height, 56);
  assert.equal(logo.config.styles.backgroundColor, '#B90F35');
  assert.equal(logo.config.styles.width, '56px');
  assert.equal(logo.config.styles.height, '56px');
  assert.match(logo.config.classes, /ank-width-56px/);
});

test('QA-009 gives the published logo non-placeholder alternative text in every locale', () => {
  for (const locale of ['es', 'en', 'zh']) {
    const alt = readJson(`i18n/${locale}.json`).dictionary.ui.logoAlt;
    assert.match(alt, /Astra Legal/);
    assert.doesNotMatch(alt, /temporal|temporary|临时/i);
  }
});
