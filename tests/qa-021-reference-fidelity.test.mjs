import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const json = (path) => JSON.parse(readFileSync(new URL(`../${path}`, import.meta.url), 'utf8'));
const page = json('soft-landing-china/i18n/zh.json').dictionary.page;

test('QA-021 loads the original Chinese font families without replacing English fonts', () => {
  const fonts = json('soft-landing-china/page-config.json').googleFontsStylesheet;
  assert.equal(typeof fonts.zh, 'string');
  assert.match(new URL(fonts.zh).searchParams.getAll('family').join(' '), /Noto Serif SC/);
  assert.match(new URL(fonts.zh).searchParams.getAll('family').join(' '), /Noto Sans SC/);
  assert.doesNotMatch(fonts.en, /Noto/);
  assert.match(page.presentation.bodyFont, /Noto Sans SC/);
  assert.match(page.presentation.headingFont, /Noto Serif SC/);
});

test('QA-021 preserves the exact Chinese title and its source emphasis', () => {
  assert.equal(page.hero.titleHtml.replace(/<[^>]+>/g, ''), page.hero.title);
  assert.match(page.hero.titleHtml, /<em class="astraChinaHeroEmphasis">手续完备<\/em>/);
  assert.equal(page.presentation.styles.heroTitle.fontSize, 'clamp(2.1rem, 4.2vw, 3.2rem)');
  assert.equal(page.presentation.styles.heroTitle.lineHeight, '1.35');
  assert.equal(page.presentation.styles.heroTitle.letterSpacing, '0.01em');
});

test('QA-021 restores Chinese text measures and its distinct source seal', () => {
  assert.equal(page.presentation.styles.lead.maxWidth, '34em');
  assert.equal(page.presentation.styles.serviceDescription.maxWidth, '34em');
  assert.equal(page.presentation.styles.contactTitle.maxWidth, '16em');
  assert.equal(page.presentation.styles.processBanner.fontStyle, 'normal');
  assert.equal(page.presentation.styles.processBanner.fontWeight, '600');
  assert.match(page.presentation.sealUrl, /astra-source-seal-zh-fonts-v2\.svg$/);
  assert.equal(page.nav.zhAriaCurrent, 'page');
});

test('campaign seals use the versioned font-embedded assets in every locale', () => {
  const base = 'https://assets.zoolandingpage.com.mx/grupoastralegal.com/soft-landing-china/images/';
  for (const locale of ['en', 'es', 'zh']) {
    const expected = locale === 'zh' ? 'zh' : 'eng';
    assert.equal(json(`soft-landing-china/i18n/${locale}.json`).dictionary.page.presentation.sealUrl, `${base}astra-source-seal-${expected}-fonts-v2.svg`);
  }
});

test('QA-021 lets auxiliary text inherit the localized source line height', () => {
  assert.equal(page.presentation.bodyLineHeight, '1.7');
  assert.equal(json('soft-landing-china/i18n/en.json').dictionary.page.presentation.bodyLineHeight, '1.55');
  const components = json('soft-landing-china/components.json').components;
  for (const id of ['astraChinaMain', 'astraChinaHeader', 'astraChinaFooter']) {
    assert.match(components.find((entry) => entry.id === id).valueInstructions, /set:config.styles,i18n,page.presentation.styles.body/);
  }
  const combos = json('soft-landing-china/angora-combos.json').combos;
  for (const name of ['astraChinaAudienceDescription', 'astraChinaFaqQuestion', 'astraChinaFaqAnswer', 'astraChinaEyebrow']) {
    assert.doesNotMatch(combos[name].join(' '), /ank-lineHeight-1_55/);
  }
});
