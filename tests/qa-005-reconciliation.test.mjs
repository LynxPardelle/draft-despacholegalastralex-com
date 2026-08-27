import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const read = (path) => JSON.parse(readFileSync(new URL(`../${path}`, import.meta.url), 'utf8'));
const route = '/defensa-fiscal-administrativa-amparo';
const titles = {
  es: 'Escudo vs SAT y Secretarías de Gobierno',
  en: 'Shield against SAT and government ministries',
  zh: '应对 SAT 及政府部门的法律护盾',
};

for (const [locale, title] of Object.entries(titles)) {
  test(`QA-005 retains the approved shield name throughout ${locale}`, () => {
    const menus = Object.values(read('variables.json').variables.navMenus).flat().filter((item) => item.href === route);
    assert.equal(menus.length, 3);
    for (const item of menus) {
      assert.equal(item.label[locale], title);
      assert.equal(item.ariaLabel[locale], title);
    }
    const home = read(`default/i18n/${locale}.json`).dictionary.page.services.cards.find((item) => item.href === route);
    const listing = read(`servicios/i18n/${locale}.json`).dictionary.page.services.find((item) => item.href === route);
    for (const card of [home, listing]) assert.equal(card.title, title);
    assert.equal(read(`defensa-fiscal-administrativa-amparo/i18n/${locale}.json`).dictionary.page.title, title);
    const { seo } = read('defensa-fiscal-administrativa-amparo/page-config.json');
    for (const metadata of [seo, seo.openGraph, seo.twitter]) {
      assert.equal(metadata.title[locale], `${title} | Astra Legal`);
    }
  });
}
