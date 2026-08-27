import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const readJson = (path) => JSON.parse(readFileSync(new URL(`../${path}`, import.meta.url), 'utf8'));
const names = { es: 'Materiales de Trabajo', en: 'Work Materials', zh: '工作资料' };
const path = '/recursos-legales';
const canonical = `https://grupoastralegal.com${path}`;

test('QA-012 uses the localized work-materials name in desktop and mobile navigation', () => {
  const { navigation, navMenus } = readJson('variables.json').variables;
  for (const [surface, items] of [['desktop', navigation], ['mobile', navMenus.mobileMenu]]) {
    const entries = items.filter((item) => item.href === path);
    assert.equal(entries.length, 1, `${surface} retains one existing resource destination`);
    assert.equal(entries[0].id, 'recursos', `${surface} retains its navigation identity`);
    assert.equal(entries[0].value, path, `${surface} retains its navigation target`);
    assert.deepEqual(entries[0].label, names, `${surface} localized name`);
  }
});

test('QA-012 uses the same localized page and preview titles without changing the public route', () => {
  const { seo } = readJson('recursos-legales/page-config.json');
  for (const [locale, name] of Object.entries(names)) {
    assert.equal(readJson(`recursos-legales/i18n/${locale}.json`).dictionary.page.title, name, `${locale} page heading`);
    for (const metadata of [seo, seo.openGraph, seo.twitter]) {
      assert.equal(metadata.title[locale], `${name} | Astra Legal`, `${locale} preview title`);
    }
  }
  assert.deepEqual(readJson('site-config.json').routes.filter((route) => route.pageId === 'recursos-legales'), [
    { path, pageId: 'recursos-legales', label: names.es },
  ]);
  assert.equal(seo.canonical, canonical);
  assert.equal(seo.openGraph.url, canonical);
});
