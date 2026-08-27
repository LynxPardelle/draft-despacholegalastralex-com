import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const json = (path) => JSON.parse(readFileSync(new URL(`../${path}`, import.meta.url), 'utf8'));
const components = json('soft-landing-china/components.json').components;
const component = (id) => components.find((entry) => entry.id === id);
const combos = json('soft-landing-china/angora-combos.json').combos;
const classes = (name) => combos[name].join(' ');

test('QA-020 restores source wrap and English serif hierarchy without a global restyle', () => {
  assert.match(classes('astraChinaWrap'), /ank-maxWidth-1120px/);
  assert.match(classes('astraChinaWrap'), /ank-paddingInline-28px/);
  assert.match(classes('astraChinaHeroTitle'), /3_6rem/);
  assert.match(classes('astraChinaHeroTitle'), /ank-fontWeight-600/);
  assert.match(component('astraChinaMain').valueInstructions, /page\.presentation\.styles\.body/);
});

test('QA-020 uses opt-in source fonts and exact source responsive thresholds', () => {
  const page = json('soft-landing-china/page-config.json');
  const font = new URL(page.googleFontsStylesheet.en);
  assert.equal(font.origin, 'https://fonts.googleapis.com');
  assert.equal(font.pathname, '/css2');
  assert.equal(font.searchParams.get('display'), 'swap');
  assert.match(font.searchParams.getAll('family').join(' '), /Source Serif 4/);
  assert.match(classes('astraChinaHeroGrid'), /ank-gridTemplateColumns-px901-minmaxSD0COM1_15frED__minmaxSD0COM0_85frED/);
  assert.match(classes('astraChinaAudienceGrid'), /ank-gridTemplateColumns-px561-/);
  assert.match(classes('astraChinaServiceCard'), /ank-gridTemplateColumns-px641-/);
  assert.match(classes('astraChinaTimeline'), /ank-gridTemplateColumns-px821-/);
  assert.match(classes('astraChinaNavLink'), /ank-display-px821-flex/);
  assert.equal(component('astraChinaFaqAccordion').config.toggleIconName, 'add');
  assert.match(classes('astraChinaFaqToggleOpen'), /rotateSD45degED/);
});

test('QA-020 native loop children retain every source field and unique item identity', () => {
  const ids = new Set(components.map(({ id }) => id));
  assert.equal(ids.size, components.length);
  for (const [prefix, path, fields] of [
    ['Service', 'services.items', ['number', 'label', 'title', 'description']],
    ['Process', 'process.items', ['number', 'when', 'title', 'description']],
  ]) {
    const templates = components.filter((entry) => entry.id.startsWith(`astraChina${prefix}`) && entry.type === 'text' && entry.loopConfig);
    assert.deepEqual(templates.map((entry) => entry.loopConfig.bindings[0].sources[0]).sort(), fields.sort());
    assert.equal(templates.every((entry) => entry.loopConfig.path === `page.${path}` && entry.loopConfig.templateId === entry.id), true);
  }
  assert.deepEqual(component('astraChinaMain').config.components, ['astraChinaHero', 'astraChinaAudience', 'astraChinaServices', 'astraChinaProcess', 'astraChinaWhy', 'astraChinaFaqSection', 'astraChinaBook']);
});

test('QA-020 renders services as native dossier rows rather than two-column cards', () => {
  assert.equal(component('astraChinaServiceCardTemplate').type, 'container');
  assert.deepEqual(component('astraChinaServiceCardTemplate').config.components, [
    'astraChinaServiceIndex__{{index}}', 'astraChinaServiceBody__{{index}}',
  ]);
  assert.match(classes('astraChinaServicesList'), /ank-gridTemplateColumns-1fr/);
  assert.match(classes('astraChinaServiceCard'), /90px/);
  assert.equal(component('astraChinaServiceTitleTemplate').loopConfig.path, 'page.services.items');
});

test('QA-020 restores circular timeline indices and the square source portrait', () => {
  assert.equal(component('astraChinaProcessCardTemplate').type, 'container');
  assert.match(classes('astraChinaProcessStamp'), /ank-borderRadius-50per/);
  assert.match(classes('astraChinaAttorneyImage'), /ank-width-140px/);
  assert.match(classes('astraChinaAttorneyImage'), /ank-borderRadius-6px/);
  assert.doesNotMatch(classes('astraChinaAttorneyImage'), /50per/);
});

test('QA-020 restores centered red contact composition and the light footer', () => {
  assert.match(classes('astraChinaContactSection'), /ank-bg-HASH7A0510/);
  assert.match(classes('astraChinaContactInner'), /ank-textAlign-center/);
  assert.match(classes('astraChinaFooter'), /ank-bg-HASHFBF8F2/);
  assert.match(classes('astraChinaWechatImage'), /ank-width-140px/);
  assert.match(component('astraChinaContactTexture').valueInstructions, /astraChinaAssets\.textureUrl/);
  assert.match(component('astraChinaContactWatermark').valueInstructions, /astraChinaAssets\.whiteIconUrl/);
});

test('QA-020 preserves source English title emphasis through sanitized inline text', () => {
  const page = json('soft-landing-china/i18n/en.json').dictionary.page;
  assert.equal(typeof page.hero.titleHtml, 'string');
  assert.equal(page.hero.titleHtml.replace(/<[^>]+>/g, ''), page.hero.title);
  assert.match(page.hero.titleHtml, /<em class="astraChinaHeroEmphasis">fully documented<\/em>/);
  assert.doesNotMatch(page.hero.titleHtml, /<(?:script|style|iframe)|\bon\w+=/i);
  assert.match(component('astraChinaHeroTitle').valueInstructions, /set:config\.html,i18n,page\.hero\.titleHtml/);
});

test('QA-020 retains fixed route isolation, mobile language access and the verified QR', () => {
  const routes = json('site-config.json').routes.filter((entry) => entry.pageId === 'soft-landing-china');
  assert.deepEqual(routes.map(({ path, language }) => [path, language]), [['/soft-landing-china/eng', 'en'], ['/soft-landing-china/zh', 'zh']]);
  assert.doesNotMatch(classes('astraChinaLanguageSwitch'), /ank-display-(?:none|\w+-none)/);
  assert.equal(component('astraChinaLanguageEn').config.preserveLanguageQueryParam, false);
  assert.equal(component('astraChinaLanguageZh').config.preserveLanguageQueryParam, false);
  const assets = json('soft-landing-china/variables.json').variables.astraChinaAssets;
  assert.equal(assets.wechatQrStatus, 'verified-public-asset');
  assert.equal(assets.wechatQrUrl, 'https://assets.zoolandingpage.com.mx/grupoastralegal.com/soft-landing-china/images/wechat-qr.jpeg');
  assert.equal(component('astraChinaFaqAccordion').config.mode, 'single');
});
