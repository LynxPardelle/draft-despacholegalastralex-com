import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const readJson = (path) => JSON.parse(readFileSync(new URL(`../${path}`, import.meta.url), 'utf8'));
const shell = readJson('components.json').components;
const component = (id) => {
  const entry = shell.find((candidate) => candidate.id === id);
  assert.ok(entry, `Missing shared component: ${id}`);
  return entry;
};

test('QA-009 encodes hyphenated CSS keyword values in the shared shell and combos', () => {
  for (const path of ['components.json', 'angora-combos.json']) {
    assert.doesNotMatch(
      JSON.stringify(readJson(path)),
      /ank-(?:display|justifyContent|width)-(?:[a-z]+-)?(?:inlineFlex|inlineBlock|spaceBetween|fitContent)(?=[\s"])/,
      `${path} must use MIN for hyphens in CSS values`,
    );
  }
  assert.match(component('headerInner').config.classes, /\bank-justifyContent-spaceMINbetween\b/);
  assert.match(component('brandLink').config.classes, /\bank-display-inlineMINflex\b/);
});

test('QA-009 isolates CTA visibility from page-specific primaryAction display rules', () => {
  const guard = component('headerCtaVisibility');
  assert.equal(guard.type, 'container');
  assert.equal(guard.config.tag, 'div');
  assert.equal(guard.config.classes, 'ank-display-none ank-display-sm-flex');
  assert.deepEqual(guard.config.components, ['headerCtaLink']);
  const actions = component('headerActions').config.components;
  assert.ok(actions.includes(guard.id));
  assert.equal(actions.includes('headerCtaLink'), false);
  const cta = component('headerCtaLink');
  assert.match(cta.config.classes, /\bprimaryAction\b/);
  assert.doesNotMatch(cta.config.classes, /\bank-display-(?:none|sm-)/);
  assert.equal(cta.config.target, '_blank');
  assert.equal(cta.config.rel, 'noopener noreferrer');
});

test('QA-009 isolates mobile trigger visibility while preserving the inline menu portal', () => {
  const guard = component('mobileNavVisibility');
  assert.equal(guard.type, 'container');
  assert.equal(guard.config.tag, 'div');
  assert.equal(guard.config.classes, 'ank-display-md-none');
  assert.deepEqual(guard.config.components, ['mobileNav']);
  const actions = component('headerActions').config.components;
  assert.ok(actions.includes(guard.id));
  assert.equal(actions.includes('mobileNav'), false);
  const menu = component('mobileNav').config.dropdownConfig;
  assert.match(menu.buttonClasses, /\butilityButton\b/);
  assert.doesNotMatch(menu.buttonClasses, /\bank-display-md-none\b/);
  assert.equal(menu.renderMode, 'inline');
  assert.equal(menu.menuContainerId, 'mobile-primary-navigation');
  assert.equal(menu.inlinePortalTargetSelector, '#mobile-primary-navigation-anchor');
  assert.equal(menu.closeOnSelect, true);
  assert.equal(component('mobileMenuMount').config.id, 'mobile-primary-navigation-anchor');
});

test('QA-009 gives shared actions a valid display utility independent of page combo overrides', () => {
  for (const id of ['servicesDropdown', 'brandDropdown', 'mobileNav', 'languageMenu']) {
    assert.match(component(id).config.dropdownConfig.buttonClasses, /\bank-display-inlineMINflex\b/, id);
  }
  for (const id of ['toggleThemeBtn', 'headerCtaLink', 'footerPhone', 'footerEmail', 'footerCalendly', 'footerWhatsapp']) {
    assert.match(component(id).config.classes, /\bank-display-inlineMINflex\b/, id);
  }
});
