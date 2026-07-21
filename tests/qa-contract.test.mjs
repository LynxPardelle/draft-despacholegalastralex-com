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
