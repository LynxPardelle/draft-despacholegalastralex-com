import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
const read = (path) => JSON.parse(readFileSync(new URL(`../${path}`, import.meta.url), 'utf8'));
const components = read('soft-landing-china/components.json').components;
const component = (id) => components.find((entry) => entry.id === id);

test('campaign FAQ uses static class fields accepted by the native accordion renderer', () => {
  const faq = component('astraChinaFaqAccordion');
  assert.doesNotMatch(faq.valueInstructions ?? '', /set:config\.(?:detailContentClasses|defaultItemButtonConfig\.styles),/);
  assert.equal(faq.config.detailContentClasses, 'astraChinaFaqAnswer');
  for (const locale of ['en', 'es', 'zh']) {
    const items = read(`soft-landing-china/i18n/${locale}.json`).dictionary.page.faq.items;
    const expected = locale === 'zh' ? 'astraChinaFaqPanel astraChinaFaqAnswerZh' : 'astraChinaFaqPanel';
    assert.equal(items.every((item) => item.panelClasses === expected), true);
  }
});

test('campaign FAQ inherits the localized body font instead of the button UA font', () => {
  const combos = read('soft-landing-china/angora-combos.json').combos;
  assert.match(combos.astraChinaFaqButton.join(' '), /(?:^|\s)ank-fontFamily-inherit(?:\s|$)/);
});

test('mobile header leaves no phantom gaps around hidden navigation links', () => {
  const combos = read('soft-landing-china/angora-combos.json').combos;
  assert.match(combos.astraChinaNav.join(' '), /(?:^|\s)ank-gap-0(?:\s|$)/);
  assert.match(combos.astraChinaNav.join(' '), /(?:^|\s)ank-gap-px821-32px(?:\s|$)/);
  assert.doesNotMatch(combos.astraChinaNav.join(' '), /(?:^|\s)ank-gap-32px(?:\s|$)/);
  assert.match(combos.astraChinaHeaderInner.join(' '), /ank-flexWrap-wrap/);
  // At 320/390px the 108px brand, 104px switch and 24px parent gap fit
  // within the wrap's 28px gutters; the consultation action wraps below.
  for (const viewport of [320, 390]) assert.ok(108 + 104 + 24 <= viewport - 56);
  assert.deepEqual(component('astraChinaHeaderInner').config.components, ['astraChinaBrandLink', 'astraChinaNav', 'astraChinaHeaderCta']);
});

test('campaign header shares free space between brand, navigation and CTA like the source', () => {
  const combos = read('soft-landing-china/angora-combos.json').combos;
  assert.match(combos.astraChinaHeaderInner.join(' '), /ank-justifyContent-spaceMINbetween/);
  assert.doesNotMatch(combos.astraChinaNav.join(' '), /ank-margin(?:Left|InlineStart|Inline)-auto/);
  assert.deepEqual(component('astraChinaHeaderInner').config.components, ['astraChinaBrandLink', 'astraChinaNav', 'astraChinaHeaderCta']);
});

test('campaign main return target reuses the sticky-header clearance of its sections', () => {
  const combos = read('soft-landing-china/angora-combos.json').combos;
  const clearance = combos.astraChinaSection.join(' ').match(/\bank-scrollMarginTop-\S+/)?.[0];
  assert.ok(clearance, 'campaign sections must define their sticky-header clearance');
  assert.ok(combos.astraChinaMain.join(' ').split(/\s+/).includes(clearance), 'the main anchor must retain that clearance so the mobile header does not cover its title');
  assert.equal(component('astraChinaBrandLink').config.href, `#${component('astraChinaMain').config.id}`);
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
