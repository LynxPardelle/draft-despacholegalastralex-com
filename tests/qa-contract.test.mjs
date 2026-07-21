import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
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
