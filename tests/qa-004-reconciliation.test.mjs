import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const read = (path) => JSON.parse(readFileSync(new URL(`../${path}`, import.meta.url), 'utf8'));
const route = '/soft-landing-empresas-chinas';
const approved = {
  es: {
    title: 'Soft landing para empresas internacionales',
    summary: 'Te ayudamos a traer tu empresa a México. Nosotros nos encargamos de la creación, permisos y establecimiento desde 0 para que tú solo te enfoques en la operación y crecimiento.',
  },
  en: {
    title: 'Soft landing for international companies',
    summary: 'We help you bring your company to Mexico. We handle incorporation, permits, and setup from the ground up so you can focus on operations and growth.',
  },
  zh: {
    title: '国际企业在墨西哥落地',
    summary: '我们帮助您的企业进入墨西哥。从公司设立、许可办理到落地筹备，我们全程负责，让您专注于运营和发展。',
  },
};

for (const [locale, { title, summary }] of Object.entries(approved)) {
  test(`QA-004 uses international-company copy on every existing ${locale} surface`, () => {
    const menus = Object.values(read('variables.json').variables.navMenus).flat().filter((item) => item.href === route);
    assert.equal(menus.length, 3);
    for (const item of menus) {
      assert.equal(item.label[locale], title);
      assert.equal(item.ariaLabel[locale], title);
    }
    const home = read(`default/i18n/${locale}.json`).dictionary.page.services.cards.find((item) => item.href === route);
    const listing = read(`servicios/i18n/${locale}.json`).dictionary.page.services.find((item) => item.href === route);
    for (const card of [home, listing]) {
      assert.equal(card.title, title);
      assert.equal(card.description, summary);
    }
    const page = read(`soft-landing-empresas-chinas/i18n/${locale}.json`).dictionary.page;
    assert.equal(page.title, title);
    assert.equal(page.summary, summary);
    const { seo } = read('soft-landing-empresas-chinas/page-config.json');
    for (const metadata of [seo, seo.openGraph, seo.twitter]) {
      assert.equal(metadata.title[locale], `${title} | Astra Legal`);
      assert.equal(metadata.description[locale], summary);
    }
  });
}
