import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const propositions = {
  es: 'Claridad legal para mejorar tu vida',
  en: 'Legal clarity to improve your life',
  zh: '清晰的法律指引，让生活更美好',
};

for (const [locale, proposition] of Object.entries(propositions)) {
  test(`QA-001 presents the approved proposition in ${locale}`, () => {
    const page = JSON.parse(readFileSync(new URL(`../default/i18n/${locale}.json`, import.meta.url), 'utf8'));
    assert.equal(page.dictionary.page.hero.subtitle, proposition);
  });
}
