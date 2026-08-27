import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const categories = {
  'grupo-autoridad': { es: 'Derecho Fiscal y Administrativo', en: 'Tax and Administrative Law', zh: '税务与行政法' },
  'grupo-patrimonio-trabajo': { es: 'Derecho Civil y Laboral', en: 'Civil and Labor Law', zh: '民法与劳动法' },
  'grupo-gobierno': { es: 'Gobierno y Política Pública', en: 'Government and Public Policy', zh: '政府与公共政策' },
};

const menu = JSON.parse(readFileSync(new URL('../variables.json', import.meta.url), 'utf8')).variables.navMenus.servicesMenu;
for (const [id, labels] of Object.entries(categories)) {
  test(`QA-003 localizes the approved ${id} category in every language`, () => {
    assert.deepEqual(menu.find((item) => item.id === id).label, labels);
  });
}
