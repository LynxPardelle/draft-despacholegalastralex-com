import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const read = (path) => JSON.parse(readFileSync(new URL(`../${path}`, import.meta.url), 'utf8'));
const route = '/defensa-fiscal-administrativa-amparo';
const descriptions = {
  es: 'Si el SAT o cualquier otra Secretaría de gobierno quieren frenarte o multarte a ti o a tu empresa cuentas con nuestro escudo para protegerte.',
  en: 'If SAT or another government ministry seeks to stop or fine you or your company, you can count on our shield to protect you.',
  zh: '如果 SAT 或其他政府部门试图阻碍您或您的企业，或对您或企业处以罚款，您可以依靠我们的法律护盾获得保护。',
};

for (const [locale, description] of Object.entries(descriptions)) {
  test(`QA-007 keeps the approved shield description consistent in ${locale}`, () => {
    const home = read(`default/i18n/${locale}.json`).dictionary.page.services.cards.find((item) => item.href === route);
    const listing = read(`servicios/i18n/${locale}.json`).dictionary.page.services.find((item) => item.href === route);
    for (const card of [home, listing]) assert.equal(card.description, description);
    assert.equal(read(`defensa-fiscal-administrativa-amparo/i18n/${locale}.json`).dictionary.page.summary, description);
    const { seo } = read('defensa-fiscal-administrativa-amparo/page-config.json');
    for (const metadata of [seo, seo.openGraph, seo.twitter]) {
      assert.equal(metadata.description[locale], description);
    }
  });
}
