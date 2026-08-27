import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const readPage = (pageId, locale) => JSON.parse(
  readFileSync(new URL(`../${pageId}/i18n/${locale}.json`, import.meta.url), 'utf8'),
).dictionary.page;

// Translations preserve the approved conditional Spanish copy, including
// the three locations and a case-specific review of the filing time limit.
const descriptions = {
  es: 'Si compraste una casa en Ciudad de México, Tulum o Los Cabos, revisamos si existe base legal y plazo vigente para solicitar la devolución del Impuesto sobre Adquisición de Inmuebles. Si el caso procede, te acompañamos durante el trámite.',
  en: 'If you bought a home in Mexico City, Tulum, or Los Cabos, we review whether there is a legal basis and you are still within the time limit to request a refund of the Real Estate Acquisition Tax. If your case qualifies, we support you throughout the process.',
  zh: '如果您在墨西哥城、图卢姆或洛斯卡沃斯购买了住宅，我们会审查是否有法律依据且仍在适用期限内，以申请退还不动产购置税。如果您的情况符合条件，我们会全程协助办理。',
};

for (const pageId of ['default', 'servicios']) {
  for (const [locale, expected] of Object.entries(descriptions)) {
    test(`QA-002 keeps the qualified ISAI service description in ${pageId}/${locale}`, () => {
      const page = readPage(pageId, locale);
      const cards = pageId === 'default' ? page.services.cards : page.services;
      const matches = cards.filter(({ href }) => href === '/recuperacion-impuestos-inmobiliarios');

      assert.equal(matches.length, 1);
      assert.equal(matches[0].description, expected);
    });
  }
}
