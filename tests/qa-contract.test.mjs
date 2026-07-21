import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import test from 'node:test';

const readJson = (path) => JSON.parse(readFileSync(new URL(`../${path}`, import.meta.url), 'utf8'));
const readText = (path) => readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');

test('QA-001 uses the approved home proposition', () => {
  const page = readJson('default/i18n/es.json');
  assert.equal(page.dictionary.page.hero.subtitle, 'Claridad legal para mejorar tu vida');
});

test('QA-002 uses the qualified ISAI wording on every Spanish surface', () => {
  const approved = 'Si compraste una casa en Ciudad de México, Tulum o Los Cabos, revisamos si existe base legal y plazo vigente para solicitar la devolución del Impuesto sobre Adquisición de Inmuebles. Si el caso procede, te acompañamos durante el trámite.';
  const content = [
    'default/i18n/es.json',
    'servicios/i18n/es.json',
    'recuperacion-impuestos-inmobiliarios/i18n/es.json',
    'recuperacion-impuestos-inmobiliarios/page-config.json',
  ].map(readText).join('\n');

  assert.equal(content.includes('Revisión de pagos, contribuciones y actos de autoridad para recuperar importes cuando exista base legal.'), false);
  assert.equal(content.split(approved).length - 1, 7);
});

test('QA-003 uses the approved Spanish service categories', () => {
  const content = readText('variables.json');
  for (const label of ['Derecho Fiscal y Administrativo', 'Derecho Civil y Laboral', 'Gobierno y Política Pública']) {
    assert.equal(content.split(label).length - 1, 1);
  }
  for (const oldLabel of ['Autoridad, impuestos y defensa', 'Patrimonio y trabajo', 'Gobierno y proyectos públicos']) {
    assert.equal(content.includes(oldLabel), false);
  }
});

test('QA-004 positions soft landing for international companies', () => {
  const title = 'Soft landing para empresas internacionales';
  const summary = 'Te ayudamos a traer tu empresa a México. Nosotros nos encargamos de la creación, permisos y establecimiento desde 0 para que tú solo te enfoques en la operación y crecimiento.';
  const content = [
    'variables.json',
    'site-config.json',
    'default/i18n/es.json',
    'servicios/i18n/es.json',
    'soft-landing-empresas-chinas/i18n/es.json',
    'soft-landing-empresas-chinas/page-config.json',
  ].map(readText).join('\n');

  assert.equal(content.split(title).length - 1, 14);
  assert.equal(content.split(summary).length - 1, 7);
  assert.equal(content.includes('Soft landing para empresas chinas'), false);
  assert.equal(content.includes('Acompañamiento legal para entrar, operar y relacionarse con autoridades mexicanas con menos fricción.'), false);
});

test('QA-005 renames fiscal defense without changing its route', () => {
  const approved = 'Escudo vs SAT y Secretarías de Gobierno';
  const content = [
    'variables.json',
    'site-config.json',
    'default/i18n/es.json',
    'servicios/i18n/es.json',
    'defensa-fiscal-administrativa-amparo/i18n/es.json',
    'defensa-fiscal-administrativa-amparo/page-config.json',
  ].map(readText).join('\n');

  assert.equal(content.split(approved).length - 1, 14);
  assert.equal(content.includes('Defensa fiscal, administrativa y amparo'), false);
  assert.equal(content.includes('/defensa-fiscal-administrativa-amparo'), true);
});

test('QA-006 removes the government-fines service from every public surface', () => {
  const content = [
    'variables.json',
    'site-config.json',
    'default/i18n/es.json',
    'default/i18n/en.json',
    'default/i18n/zh.json',
    'servicios/i18n/es.json',
    'servicios/i18n/en.json',
    'servicios/i18n/zh.json',
  ].map(readText).join('\n');

  assert.equal(content.includes('/defensa-multas-gobierno'), false);
  assert.equal(content.includes('multas-gobierno'), false);
  assert.equal(existsSync(new URL('../defensa-multas-gobierno/page-config.json', import.meta.url)), false);
});

test('QA-007 uses the approved fiscal-defense description', () => {
  const approved = 'Si el SAT o cualquier otra Secretaría de gobierno quieren frenarte o multarte a ti o a tu empresa cuentas con nuestro escudo para protegerte.';
  const content = [
    'default/i18n/es.json',
    'servicios/i18n/es.json',
    'defensa-fiscal-administrativa-amparo/i18n/es.json',
    'defensa-fiscal-administrativa-amparo/page-config.json',
  ].map(readText).join('\n');

  assert.equal(content.split(approved).length - 1, 7);
  assert.equal(content.includes('Defensa frente a actos de autoridad con análisis de plazos, pruebas, recursos y amparo cuando corresponda.'), false);
});

test('QA-008 removes the trust block from every service route', () => {
  const services = [
    'soft-landing-empresas-chinas',
    'proteccion-patrimonial-matrimonio-divorcio',
    'recuperacion-impuestos-inmobiliarios',
    'defensa-fiscal-administrativa-amparo',
    'registro-de-marca',
    'registro-de-patentes',
    'despido-injustificado',
    'consultoria-legal-gobiernos',
  ];

  for (const service of services) {
    const page = readJson(`${service}/components.json`);
    const roots = page.components.find(({ id }) => id === 'contentPage').config.components;
    assert.equal(roots.includes('detailTrust'), false, service);
  }
});

test('QA-009 uses the A mark in the header and the full logo atop the home hero', () => {
  const variables = readJson('variables.json').variables;
  const shared = readJson('components.json').components;
  const home = readJson('default/components.json').components;
  const brandLogo = shared.find(({ id }) => id === 'brandLogo');
  const heroCopy = home.find(({ id }) => id === 'heroCopy');
  const heroBrandLogo = home.find(({ id }) => id === 'heroBrandLogo');

  assert.equal(variables.brand.headerIconUrl, 'https://assets.zoolandingpage.com.mx/grupoastralegal.com/shared/logos/astra-legal-mark-a.png');
  assert.notEqual(variables.brand.headerIconUrl, variables.brand.logoUrl);
  assert.equal(brandLogo.valueInstructions.includes('brand.headerIconUrl'), true);
  assert.equal(brandLogo.config.width, brandLogo.config.height);
  assert.equal(heroCopy.config.components[0], 'heroBrandLogo');
  assert.equal(heroBrandLogo.valueInstructions.includes('brand.logoUrl'), true);
});

test('QA-010 removes the redundant service module from every service route', () => {
  const services = [
    'soft-landing-empresas-chinas',
    'proteccion-patrimonial-matrimonio-divorcio',
    'recuperacion-impuestos-inmobiliarios',
    'defensa-fiscal-administrativa-amparo',
    'registro-de-marca',
    'registro-de-patentes',
    'despido-injustificado',
    'consultoria-legal-gobiernos',
  ];

  for (const service of services) {
    const page = readJson(`${service}/components.json`);
    const roots = page.components.find(({ id }) => id === 'contentPage').config.components;
    assert.equal(roots.includes('detailServiceModule'), false, service);
  }
});

test('QA-011 gives every service a distinct semantic icon in every locale', () => {
  const approvedIcons = [
    'flight_land',
    'security',
    'account_balance_wallet',
    'gavel',
    'verified',
    'lightbulb',
    'work_off',
    'account_balance',
  ];

  for (const locale of ['es', 'en', 'zh']) {
    const homeCards = readJson(`default/i18n/${locale}.json`).dictionary.page.services.cards;
    const serviceCards = readJson(`servicios/i18n/${locale}.json`).dictionary.page.services;
    assert.deepEqual(homeCards.map(({ icon }) => icon), approvedIcons, `home ${locale}`);
    assert.deepEqual(serviceCards.map(({ icon }) => icon), approvedIcons, `services ${locale}`);
    assert.equal(new Set(approvedIcons).size, approvedIcons.length);
  }
});

test('QA-012 renames legal resources without changing its public route', () => {
  const approved = 'Materiales de Trabajo';
  const content = [
    'site-config.json',
    'recursos-legales/i18n/es.json',
    'recursos-legales/page-config.json',
  ].map(readText).join('\n');

  assert.equal(content.split(approved).length - 1, 6);
  assert.equal(/recursos legales/i.test(content), false);
  assert.equal(content.includes('/recursos-legales'), true);
});

test('QA-013 adds an accessible international soft-landing hero image', () => {
  const pageVariables = readJson('soft-landing-empresas-chinas/variables.json').variables;
  const components = readJson('soft-landing-empresas-chinas/components.json').components;
  const heroContent = components.find(({ id }) => id === 'detailHeroContent');
  const heroImage = components.find(({ id }) => id === 'detailHeroImage');

  assert.equal(pageVariables.pageAssets.heroImageUrl, 'https://assets.zoolandingpage.com.mx/grupoastralegal.com/soft-landing-empresas-chinas/hero-images/international-soft-landing.png');
  assert.deepEqual(heroContent.config.components, ['detailHeroCopy', 'detailHeroImage']);
  assert.equal(heroImage.valueInstructions.includes('pageAssets.heroImageUrl'), true);
  for (const locale of ['es', 'en', 'zh']) {
    const alt = readJson(`soft-landing-empresas-chinas/i18n/${locale}.json`).dictionary.page.heroImageAlt;
    assert.equal(typeof alt === 'string' && alt.length > 0, true, locale);
  }
});
