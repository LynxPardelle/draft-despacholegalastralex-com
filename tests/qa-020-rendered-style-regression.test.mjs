import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
const read = (path) => JSON.parse(readFileSync(new URL(`../${path}`, import.meta.url), 'utf8'));
const components = read('soft-landing-china/components.json').components;
const component = (id) => components.find((entry) => entry.id === id);

test('campaign header shares free space between brand, navigation and CTA like the source', () => {
  const combos = read('soft-landing-china/angora-combos.json').combos;
  assert.match(combos.astraChinaHeaderInner.join(' '), /ank-justifyContent-spaceMINbetween/);
  assert.doesNotMatch(combos.astraChinaNav.join(' '), /ank-margin(?:Left|InlineStart|Inline)-auto/);
  assert.deepEqual(component('astraChinaHeaderInner').config.components, ['astraChinaBrandLink', 'astraChinaNav', 'astraChinaHeaderCta']);
});

test('campaign media dimensions beat the shared intrinsic-image selector', () => {
  assert.deepEqual(component('astraChinaLogo').config.styles, { height: '34px', width: 'auto' });
  assert.equal(component('astraChinaLogo').config.width, 1204);
  assert.equal(component('astraChinaLogo').config.height, 379);
  assert.equal(component('astraChinaAttorneyImage').config.styles?.height, '140px');
});

test('campaign style bindings resolve whole records, not discarded nested thunks', () => {
  for (const entry of components) {
    assert.doesNotMatch(entry.valueInstructions ?? '', /set:config\.(?:defaultItemButtonConfig\.)?styles\./, entry.id);
  }
  for (const locale of ['en', 'es', 'zh']) {
    const presentation = read(`soft-landing-china/i18n/${locale}.json`).dictionary.page.presentation;
    assert.equal(presentation.styles.body?.fontWeight, '400');
    assert.equal(presentation.styles.body?.lineHeight, locale === 'zh' ? '1.7' : '1.55');
    assert.match(presentation.styles.mono?.fontFamily ?? '', /IBM Plex Mono/);
  }
});
