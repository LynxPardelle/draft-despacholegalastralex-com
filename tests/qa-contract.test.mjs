import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { existsSync, readFileSync } from 'node:fs';
import test from 'node:test';

const readJson = (path) => JSON.parse(readFileSync(new URL(`../${path}`, import.meta.url), 'utf8'));
const readText = (path) => readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');
const componentById = (payload, id) => payload.components.find((component) => component.id === id);
// Canonical CRLF preserves the recorded baselines across Windows and LF checkouts.
const baselineHash = (text) => createHash('sha256').update(text.replace(/\r?\n/g, '\r\n')).digest('hex');

const evaluateComputation = (definition, values) => {
  const sourceValue = (source) => source.source === 'field' ? Number(values[source.fieldId]) : Number(source.value);
  let result = sourceValue(definition.initial);
  for (const step of definition.steps ?? []) {
    if (step.op === 'add') result += sourceValue(step.value);
    if (step.op === 'subtract') result -= sourceValue(step.value);
    if (step.op === 'multiply') result *= sourceValue(step.value);
    if (step.op === 'divide') result /= sourceValue(step.value);
    if (step.op === 'min') result = Math.min(result, sourceValue(step.value));
    if (step.op === 'max') result = Math.max(result, sourceValue(step.value));
    if (step.op === 'abs') result = Math.abs(result);
    if (step.op === 'floor') result = Math.floor(result);
    if (step.op === 'ceil') result = Math.ceil(result);
    if (step.op === 'round') {
      const scale = 10 ** Number(step.precision ?? 0);
      result = Math.round(result * scale) / scale;
    }
  }
  return result;
};

const stringLeafPaths = (value, prefix = '') => {
  if (typeof value === 'string') return [prefix];
  if (Array.isArray(value)) {
    return value.flatMap((entry, index) => stringLeafPaths(entry, `${prefix}[${index}]`));
  }
  if (!value || typeof value !== 'object') return [];
  return Object.entries(value).flatMap(([key, entry]) => stringLeafPaths(entry, prefix ? `${prefix}.${key}` : key));
};
const stringLeafValues = (value) => {
  if (typeof value === 'string') return [value];
  if (Array.isArray(value)) return value.flatMap(stringLeafValues);
  if (!value || typeof value !== 'object') return [];
  return Object.values(value).flatMap(stringLeafValues);
};

const relativeLuminance = (hex) => {
  const channels = hex.slice(1).match(/.{2}/g).map((channel) => Number.parseInt(channel, 16) / 255);
  const [red, green, blue] = channels.map((channel) => channel <= 0.04045
    ? channel / 12.92
    : ((channel + 0.055) / 1.055) ** 2.4);
  return (0.2126 * red) + (0.7152 * green) + (0.0722 * blue);
};

const contrastRatio = (foreground, background) => {
  const foregroundLuminance = relativeLuminance(foreground);
  const backgroundLuminance = relativeLuminance(background);
  return (Math.max(foregroundLuminance, backgroundLuminance) + 0.05)
    / (Math.min(foregroundLuminance, backgroundLuminance) + 0.05);
};

const literalComboColorPair = (combo) => {
  const tokens = combo.join(' ');
  const foreground = tokens.match(/(?:^|\s)ank-color-HASH([0-9a-f]{6})(?=\s|$)/i)?.[1];
  const background = tokens.match(/(?:^|\s)ank-bg-HASH([0-9a-f]{6})(?=\s|$)/i)?.[1];
  return {
    foreground: foreground ? `#${foreground.toUpperCase()}` : null,
    background: background ? `#${background.toUpperCase()}` : null,
  };
};

const literalComboColor = (combos, comboName, property = 'color') => {
  const tokens = combos[comboName].join(' ');
  const match = tokens.match(new RegExp(`(?:^|\\s)ank-${property}-HASH([0-9a-f]{6})(?=\\s|$)`, 'i'));
  return match ? `#${match[1].toUpperCase()}` : null;
};

test('QA-001 uses the approved home proposition', () => {
  const page = readJson('default/i18n/es.json');
  assert.equal(page.dictionary.page.hero.subtitle, 'Claridad legal para mejorar tu vida');
});

test('QA-002 keeps the superseding Recupera ISAI claims qualified', () => {
  const page = readJson('recuperacion-impuestos-inmobiliarios/i18n/es.json').dictionary.page;
  const pageConfig = readJson('recuperacion-impuestos-inmobiliarios/page-config.json');

  assert.match(page.intro, /plazos vigentes/);
  assert.match(page.intro, /estimación general, no una garantía/i);
  assert.equal(page.calculator.disclaimer, 'Estimación general con base en tu ciudad y el valor declarado. El monto final depende de tu caso específico.');
  assert.equal(pageConfig.structuredData, undefined);
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

test('QA-014 allows the approved www production alias', () => {
  const site = readJson('site-config.json');

  assert.deepEqual(site.aliases, ['www.grupoastralegal.com']);
});

test('QA-018 implements the explicit, uncapped Recupera ISAI calculator contract', () => {
  const payload = readJson('recuperacion-impuestos-inmobiliarios/components.json');
  const scope = componentById(payload, 'calculatorScope');
  const propertyInput = componentById(payload, 'calculatorPropertyValue');
  const cityInput = componentById(payload, 'calculatorCity');
  const yearInput = componentById(payload, 'calculatorPurchaseYear');
  const calculateButton = componentById(payload, 'calculatorSubmit');
  const result = componentById(payload, 'calculatorResult');
  const resetButton = componentById(payload, 'calculatorReset');
  const whatsapp = componentById(payload, 'calculatorContactLink');

  assert.equal(scope.type, 'interaction-scope');
  assert.equal(scope.config.scopeId, 'isaiCalculator');
  assert.equal(scope.config.tag, 'form');
  assert.deepEqual(scope.config.initialValues, {
    cityRateCode: 8,
    propertyValue: null,
    purchaseYear: null,
    hasCalculated: false,
  });
  assert.equal(scope.config.autoSubmit, undefined);
  assert.match(scope.config.submitEventInstructions, /setScopeValue:hasCalculated,event\.eventData\.valid/);
  assert.equal(scope.config.submitEventInstructions, 'setScopeValue:hasCalculated,event.eventData.valid;focusElementById:propertyValue,event.eventData.fields.propertyValue.valid,false;focusElementById:purchaseYear-option-0,event.eventData.fields.propertyValue.valid,true,event.eventData.fields.purchaseYear.valid,false;focusElementById:isai-calculator-result,event.eventData.valid,true');

  assert.equal(cityInput.config.controlType, 'button-group');
  assert.equal(cityInput.config.fieldId, 'cityRateCode');
  assert.equal(cityInput.config.multiple, false);
  assert.deepEqual(cityInput.config.options, { source: 'i18n', path: 'page.calculator.cityOptions' });
  assert.deepEqual(readJson('recuperacion-impuestos-inmobiliarios/i18n/es.json').dictionary.page.calculator.cityOptions.map(({ value }) => value), [8, 3, -3]);
  assert.match(cityInput.eventInstructions, /setScopeValue:hasCalculated,false/);

  assert.equal(propertyInput.config.controlType, 'number');
  assert.equal(propertyInput.config.value, null);
  assert.equal(propertyInput.config.min, 1000000);
  assert.equal(propertyInput.config.max, undefined);
  assert.equal(propertyInput.config.required, true);
  assert.match(propertyInput.eventInstructions, /setScopeValue:hasCalculated,false/);

  assert.equal(yearInput.config.controlType, 'button-group');
  assert.equal(yearInput.config.fieldId, 'purchaseYear');
  assert.equal(yearInput.config.multiple, false);
  assert.deepEqual(yearInput.config.options, { source: 'i18n', path: 'page.calculator.yearOptions' });
  assert.deepEqual(readJson('recuperacion-impuestos-inmobiliarios/i18n/es.json').dictionary.page.calculator.yearOptions.map(({ value }) => value), [2021, 2022, 2023, 2024]);
  for (const locale of ['es', 'en', 'zh']) {
    const rules = readJson(`recuperacion-impuestos-inmobiliarios/i18n/${locale}.json`).dictionary.page.calculator.yearValidation;
    assert.ok(rules.some((rule) => rule.type === 'pattern' && rule.value === '^(2021|2022|2023|2024)$'), `${locale} supported years`);
  }
  assert.match(yearInput.eventInstructions, /setScopeValue:hasCalculated,false/);
  assert.equal(payload.components.some(({ config }) => config?.controlType === 'select'), false);

  const calculatorCombos = readJson('recuperacion-impuestos-inmobiliarios/angora-combos.json').combos;
  for (const combo of ['calculatorChoice', 'calculatorNumberInput', 'calculatorPrimaryAction', 'calculatorSecondaryAction']) {
    assert.match(calculatorCombos[combo].join(' '), /ank-outlineFocus-/, combo);
  }

  assert.equal(calculateButton.config.type, 'submit');
  assert.match(calculateButton.valueInstructions, /page\.calculator\.action/);
  assert.equal(result.condition, 'all:scopeEq,meta.submitted,true;all:scopeEq,meta.valid,true;all:scopeEq,values.hasCalculated,true');
  assert.equal(result.config.role, 'status');
  assert.equal(result.config.ariaLive, 'polite');
  assert.equal(result.config.tabindex, -1);
  assert.equal(result.config.id, 'isai-calculator-result');
  assert.match(resetButton.eventInstructions, /resetScope/);
  assert.match(resetButton.eventInstructions, /focusElementById:propertyValue/);
  assert.match(whatsapp.valueInstructions, /ctaTargets\.whatsappUrl/);

  const definitions = Object.fromEntries(scope.config.computations.map((item) => [item.resultId, item]));
  const assertFormula = (cityRateCode, propertyValue, recoveryMin, recoveryMax) => {
    const values = { cityRateCode, propertyValue };
    assert.equal(evaluateComputation(definitions.recoveryMin, values), recoveryMin);
    assert.equal(evaluateComputation(definitions.recoveryMax, values), recoveryMax);
  };
  assertFormula(8, 1000000, 80000, 90000);
  assertFormula(8, 5000000, 400000, 450000);
  assertFormula(3, 5000000, 150000, 250000);
  assertFormula(-3, 8000000, 240000, 400000);
  assertFormula(8, 1234567, 98765, 111111);
  assertFormula(8, 10000000, 800000, 900000);

  for (const id of ['calculatorRangeMinValue', 'calculatorRangeMaxValue', 'calculatorInvestmentLowValue', 'calculatorInvestmentMidLowValue', 'calculatorInvestmentMidHighValue', 'calculatorInvestmentHighValue']) {
    const cell = componentById(payload, id);
    assert.equal(cell.type, 'generic-cell', id);
    assert.deepEqual({
      format: cell.config.format,
      currency: cell.config.currency,
      currencyDisplay: cell.config.currencyDisplay,
      maximumFractionDigits: cell.config.maximumFractionDigits,
      showCurrencyCode: cell.config.showCurrencyCode,
    }, {
      format: 'currency',
      currency: 'MXN',
      currencyDisplay: 'narrowSymbol',
      maximumFractionDigits: 0,
      showCurrencyCode: true,
    }, id);
  }

  assert.deepEqual([
    [componentById(payload, 'calculatorInvestmentLowValue').condition, componentById(payload, 'calculatorInvestmentLowValue').config.value],
    [componentById(payload, 'calculatorInvestmentMidLowValue').condition, componentById(payload, 'calculatorInvestmentMidLowValue').config.value],
    [componentById(payload, 'calculatorInvestmentMidHighValue').condition, componentById(payload, 'calculatorInvestmentMidHighValue').config.value],
    [componentById(payload, 'calculatorInvestmentHighValue').condition, componentById(payload, 'calculatorInvestmentHighValue').config.value],
  ], [
    ['all:scopeLt,computed.recoveryMin,185000', 12500],
    ['all:scopeGte,computed.recoveryMin,185000;all:scopeLt,computed.recoveryMin,200000', 15000],
    ['all:scopeGte,computed.recoveryMin,200000;all:scopeLt,computed.recoveryMin,250000', 20000],
    ['all:scopeGte,computed.recoveryMin,250000', 25000],
  ]);

  const calculatorText = [
    'recuperacion-impuestos-inmobiliarios/components.json',
    'recuperacion-impuestos-inmobiliarios/page-config.json',
    'recuperacion-impuestos-inmobiliarios/variables.json',
    'recuperacion-impuestos-inmobiliarios/i18n/es.json',
    'recuperacion-impuestos-inmobiliarios/i18n/en.json',
    'recuperacion-impuestos-inmobiliarios/i18n/zh.json',
  ].map(readText).join('\n');
  assert.equal(/700,000|\bISR\b|fixed 8%|8% fijo|net gain|ganancia neta|success fee|honorarios de éxito|litigation duration|duración del litigio/i.test(calculatorText), false);
});

test('QA-019 uses the approved calculator copy, validation, SEO, and destinations in all locales', () => {
  const expected = {
    es: {
      eyebrow: 'Calculadora de Recupera ISAI',
      title: 'Estima cuánto podrías recuperar',
      description: 'Tres preguntas. Sin registrarte, sin compromiso.',
      cityLabel: '¿Dónde compraste tu propiedad?',
      propertyLabel: '¿Cuál fue el valor de la propiedad al comprarla?',
      yearLabel: '¿En qué año compraste la propiedad?',
      action: 'Ver resultado',
      resultTitle: 'Podrías tener derecho a recuperar entre',
      investmentLabel: 'Inversión inicial',
      disclaimer: 'Estimación general con base en tu ciudad y el valor declarado. El monto final depende de tu caso específico.',
      resultCta: 'Hablar por WhatsApp con Astra Legal',
      reset: 'Calcular de nuevo',
      heroTitle: 'Explora si puedes recuperar el ISAI que pagaste de más',
      heroSummary: 'Si compraste una casa o departamento en Ciudad de México, Los Cabos o Tulum, obtén una estimación orientativa en tres preguntas, sin registro y sin compromiso.',
      ctaDescription: 'Revisamos tu caso y los plazos aplicables para confirmar si existe una vía de recuperación.',
      calendlyLabel: 'Agenda una valoración inicial',
      contactLabel: 'Ver opciones de contacto',
      propertyRequired: 'Ingresa el valor de la propiedad.',
      propertyMinimum: 'Ingresa un valor de al menos $1,000,000 MXN.',
      yearRequired: 'Selecciona el año de compra.',
      seoTitle: 'Recuperación de ISAI | Astra Legal',
    },
    en: {
      eyebrow: 'Recupera ISAI calculator',
      title: 'Estimate how much you could recover',
      description: 'Three questions. No registration, no obligation.',
      cityLabel: 'Where did you purchase your property?',
      propertyLabel: "What was the property's purchase value?",
      yearLabel: 'In what year did you purchase the property?',
      action: 'View result',
      resultTitle: 'You may be entitled to recover between',
      investmentLabel: 'Initial investment',
      disclaimer: 'General estimate based on your city and the value provided. The final amount depends on your specific case.',
      resultCta: 'Chat with Astra Legal on WhatsApp',
      reset: 'Calculate again',
      heroTitle: 'Explore whether you could recover overpaid ISAI',
      heroSummary: 'If you purchased a house or apartment in Mexico City, Los Cabos, or Tulum, get an indicative estimate in three questions, with no registration or obligation.',
      ctaDescription: 'We review your case and the applicable time limits to confirm whether a recovery path exists.',
      calendlyLabel: 'Schedule an initial assessment',
      contactLabel: 'View contact options',
      propertyRequired: "Enter the property's purchase value.",
      propertyMinimum: 'Enter a value of at least $1,000,000 MXN.',
      yearRequired: 'Select the purchase year.',
      seoTitle: 'ISAI recovery estimate | Astra Legal',
    },
    zh: {
      eyebrow: 'Recupera ISAI 计算器',
      title: '估算您可能追回的金额',
      description: '三个问题。无需注册，无任何承诺。',
      cityLabel: '您的房产购买于哪里？',
      propertyLabel: '购买房产时的价格是多少？',
      yearLabel: '您在哪一年购买了该房产？',
      action: '查看结果',
      resultTitle: '您可能有权追回',
      investmentLabel: '前期投入',
      disclaimer: '此为根据城市和申报房产价值得出的一般估算。最终金额取决于您的具体情况。',
      resultCta: '通过 WhatsApp 联系 Astra Legal',
      reset: '重新计算',
      heroTitle: '了解您是否可以追回多缴的 ISAI',
      heroSummary: '如果您在墨西哥城、洛斯卡沃斯或图卢姆购买了住宅或公寓，只需回答三个问题，即可获得参考估算，无需注册，也无需承诺。',
      ctaDescription: '我们会审查您的具体情况和适用时限，以确认是否存在可行的追回途径。',
      calendlyLabel: '预约初步评估',
      contactLabel: '查看联系方式',
      propertyRequired: '请输入房产购买价格。',
      propertyMinimum: '请输入至少 $1,000,000 MXN 的金额。',
      yearRequired: '请选择购买年份。',
      seoTitle: 'ISAI 追回金额估算 | Astra Legal',
    },
  };
  const pageConfig = readJson('recuperacion-impuestos-inmobiliarios/page-config.json');
  for (const [locale, copy] of Object.entries(expected)) {
    const page = readJson(`recuperacion-impuestos-inmobiliarios/i18n/${locale}.json`).dictionary.page;
    assert.deepEqual({
      eyebrow: page.calculator.eyebrow,
      title: page.calculator.title,
      description: page.calculator.description,
      cityLabel: page.calculator.cityLabel,
      propertyLabel: page.calculator.propertyLabel,
      yearLabel: page.calculator.yearLabel,
      action: page.calculator.action,
      resultTitle: page.calculator.resultTitle,
      investmentLabel: page.calculator.investmentLabel,
      disclaimer: page.calculator.disclaimer,
      resultCta: page.calculator.resultCta,
      reset: page.calculator.reset,
      heroTitle: page.title,
      heroSummary: page.summary,
      ctaDescription: page.ctaDescription,
      calendlyLabel: page.primaryLabel,
      contactLabel: page.secondaryLabel,
      propertyRequired: page.calculator.errors.propertyRequired,
      propertyMinimum: page.calculator.errors.propertyMinimum,
      yearRequired: page.calculator.errors.yearRequired,
      seoTitle: pageConfig.seo.title[locale],
    }, copy, locale);
    assert.equal(page.calculator.propertyPlaceholder, locale === 'es' ? 'Ej. 5,000,000' : locale === 'en' ? 'E.g. 5,000,000' : '例如 5,000,000', locale);
    assert.deepEqual(page.calculator.propertyValidation.map(({ message }) => message), [copy.propertyRequired, copy.propertyMinimum], `${locale} visible property errors`);
    assert.equal(page.calculator.yearValidation.every(({ message }) => message === copy.yearRequired), true, `${locale} visible year errors`);
    assert.equal(pageConfig.seo.description[locale], copy.heroSummary, locale);
    assert.equal(pageConfig.seo.openGraph.title[locale], copy.seoTitle, locale);
    assert.equal(pageConfig.seo.openGraph.description[locale], copy.heroSummary, locale);
    assert.equal(pageConfig.seo.twitter.title[locale], copy.seoTitle, locale);
    assert.equal(pageConfig.seo.twitter.description[locale], copy.heroSummary, locale);
  }
  assert.equal(pageConfig.structuredData, undefined);
  const sharedVariables = readJson('variables.json').variables;
  assert.equal(sharedVariables.ctaTargets.whatsappUrl, sharedVariables.contact.whatsappUrl);
  assert.equal(sharedVariables.ctaTargets.calendlyUrl, sharedVariables.contact.calendlyUrl);
});

test('QA-020 and QA-021 expose only the exact fixed-language campaign routes', () => {
  const site = readJson('site-config.json');
  const campaignRoutes = site.routes.filter(({ pageId }) => pageId === 'soft-landing-china');
  assert.deepEqual(campaignRoutes, [
    { path: '/soft-landing-china/eng', pageId: 'soft-landing-china', language: 'en' },
    { path: '/soft-landing-china/zh', pageId: 'soft-landing-china', language: 'zh' },
  ]);

  const pageConfig = readJson('soft-landing-china/page-config.json');
  const payload = readJson('soft-landing-china/components.json');
  const campaignCombos = readJson('soft-landing-china/angora-combos.json').combos;
  assert.deepEqual(pageConfig.rootIds, ['astraChinaSkip', 'astraChinaHeader', 'astraChinaMain', 'astraChinaFooter']);
  assert.equal(pageConfig.rootIds.includes('siteHeader'), false);
  assert.equal(pageConfig.rootIds.includes('siteFooter'), false);
  assert.equal(pageConfig.structuredData, undefined);
  for (const component of payload.components) {
    assert.match(component.id, /^astraChina/, component.id);
    if (typeof component.config?.id === 'string') assert.match(component.config.id, /^astra-china/, `${component.id} DOM id`);
  }
  for (const combo of Object.keys(campaignCombos)) assert.match(combo, /^astraChina/, combo);
  const campaignStyles = JSON.stringify(campaignCombos);
  for (const fixedPaletteToken of ['HASHFBF8F2', 'HASHF7EFDD', 'HASH231B16', 'HASHE00322', 'HASHE6AE01']) {
    assert.match(campaignStyles, new RegExp(fixedPaletteToken), fixedPaletteToken);
  }
  assert.equal(/(?:bg|text|title|link|accent)Color/.test(campaignStyles), false);
  assert.match(campaignCombos.astraChinaServiceLabel.join(' '), /ank-m-0/);
  assert.match(campaignCombos.astraChinaProcessWhen.join(' '), /ank-m-0/);
  for (const combo of ['astraChinaSkipLink', 'astraChinaBrand', 'astraChinaNavLink', 'astraChinaLanguageLink', 'astraChinaPrimaryAction', 'astraChinaSecondaryAction', 'astraChinaFaqButton', 'astraChinaOnDarkAction', 'astraChinaFooterLink']) {
    assert.match(campaignCombos[combo].join(' '), /ank-outlineFocus-/, combo);
  }

  const enSwitch = componentById(payload, 'astraChinaLanguageEn');
  const zhSwitch = componentById(payload, 'astraChinaLanguageZh');
  assert.equal(enSwitch.config.href, '/soft-landing-china/eng');
  assert.equal(zhSwitch.config.href, '/soft-landing-china/zh');
  assert.equal(enSwitch.config.preserveLanguageQueryParam, false);
  assert.equal(zhSwitch.config.preserveLanguageQueryParam, false);
  assert.match(enSwitch.valueInstructions, /page\.nav\.enClasses/);
  assert.match(enSwitch.valueInstructions, /page\.nav\.enAriaCurrent/);
  assert.match(zhSwitch.valueInstructions, /page\.nav\.zhClasses/);
  assert.match(zhSwitch.valueInstructions, /page\.nav\.zhAriaCurrent/);
  const expectedLanguageState = {
    es: ['page', 'false'],
    en: ['page', 'false'],
    zh: ['false', 'page'],
  };
  for (const [locale, expected] of Object.entries(expectedLanguageState)) {
    const nav = readJson(`soft-landing-china/i18n/${locale}.json`).dictionary.page.nav;
    assert.deepEqual([nav.enAriaCurrent, nav.zhAriaCurrent], expected, `${locale} current language`);
    assert.equal(nav.enClasses.includes('astraChinaLanguageLinkActive'), expected[0] === 'page', `${locale} EN active style`);
    assert.equal(nav.zhClasses.includes('astraChinaLanguageLinkActive'), expected[1] === 'page', `${locale} ZH active style`);
  }
  for (const id of ['astraChinaSkip', 'astraChinaServices', 'astraChinaProcess', 'astraChinaFaqSection', 'astraChinaBook']) {
    assert.ok(componentById(payload, id), id);
  }
  const skipLink = componentById(payload, 'astraChinaSkip');
  assert.equal(skipLink.config.href, '#astra-china-main');
  assert.equal(skipLink.eventInstructions, 'skipToMain:astra-china-main');
  const audienceHeading = componentById(payload, 'astraChinaAudienceEyebrow');
  assert.equal(audienceHeading.config.tag, 'h2');
  assert.ok(audienceHeading.valueInstructions.split(';').includes('set:config.text,i18n,page.audience.eyebrow'));
  assert.deepEqual({
    en: readJson('soft-landing-china/i18n/en.json').dictionary.page.audience.eyebrow,
    zh: readJson('soft-landing-china/i18n/zh.json').dictionary.page.audience.eyebrow,
    es: readJson('soft-landing-china/i18n/es.json').dictionary.page.audience.eyebrow,
  }, {
    en: 'Who this is for',
    zh: '适合谁',
    es: 'Para quién es',
  });
  assert.deepEqual(componentById(payload, 'astraChinaAudienceGrid').loopConfig.bindings, [
    { to: 'config.title', sources: ['description'] },
    { to: 'config.description', sources: ['number'] },
  ]);
  const audienceTemplate = componentById(payload, 'astraChinaAudienceCardTemplate');
  assert.equal(audienceTemplate.config.featureTitleClasses, 'astraChinaAudienceDescription');
  assert.equal(audienceTemplate.config.featureDescriptionClasses, 'astraChinaCardNumber');
  assert.match(campaignCombos.astraChinaCardNumber.join(' '), /ank-order-MIN1/);
  for (const locale of ['en', 'zh']) {
    const audienceItems = readJson(`soft-landing-china/i18n/${locale}.json`).dictionary.page.audience.items;
    const h3Names = audienceItems.map(({ description }) => description);
    assert.equal(h3Names.every((name) => typeof name === 'string' && name.trim().length > 0 && !/^\d+$/.test(name)), true, `${locale} audience h3 names`);
    assert.deepEqual(audienceItems.map(({ number }) => number), ['01', '02', '03', '04'], `${locale} decorative audience indices`);
  }
  assert.deepEqual([
    componentById(payload, 'astraChinaNavServices').config.href,
    componentById(payload, 'astraChinaNavProcess').config.href,
    componentById(payload, 'astraChinaNavFaq').config.href,
    componentById(payload, 'astraChinaHeaderCta').config.href,
  ], ['#astra-china-services', '#astra-china-process', '#astra-china-faq', '#astra-china-book']);
  assert.deepEqual(componentById(payload, 'astraChinaBookInner').config.components, [
    'astraChinaContactCopy',
    'astraChinaContactActions',
  ]);
  assert.deepEqual(componentById(payload, 'astraChinaContactCopy').config.components, [
    'astraChinaContactEyebrowRow',
    'astraChinaContactTitle',
    'astraChinaContactDescription',
  ]);

  const canonical = {
    es: 'https://grupoastralegal.com/soft-landing-china/eng',
    en: 'https://grupoastralegal.com/soft-landing-china/eng',
    zh: 'https://grupoastralegal.com/soft-landing-china/zh',
  };
  assert.deepEqual(pageConfig.seo.canonical, canonical);
  assert.deepEqual(pageConfig.seo.openGraph.url, canonical);
  for (const field of [pageConfig.seo.title, pageConfig.seo.description, pageConfig.seo.openGraph.title, pageConfig.seo.openGraph.description, pageConfig.seo.twitter.title, pageConfig.seo.twitter.description]) {
    assert.deepEqual(Object.keys(field).sort(), ['en', 'es', 'zh']);
    assert.equal(Object.values(field).every((value) => typeof value === 'string' && value.trim().length > 0), true);
  }
});

test('QA-020 and QA-021 retain complete EN/ZH reference content and contact parity', () => {
  const dictionaries = Object.fromEntries(['es', 'en', 'zh'].map((locale) => [locale, readJson(`soft-landing-china/i18n/${locale}.json`).dictionary.page]));
  for (const [locale, page] of Object.entries(dictionaries)) {
    assert.equal(page.audience.items.length, 4, `${locale} audience`);
    assert.equal(page.services.items.length, 8, `${locale} services`);
    assert.equal(page.process.items.length, 4, `${locale} process`);
    assert.equal(typeof page.attorney.name, 'string', `${locale} attorney`);
    assert.equal(page.proofs.length, 3, `${locale} proofs`);
    assert.equal(page.faq.items.length, 8, `${locale} FAQ`);
    assert.equal(stringLeafValues(page).every((value) => value.trim().length > 0), true, `${locale} complete strings`);
  }
  assert.deepEqual(stringLeafPaths(dictionaries.es), stringLeafPaths(dictionaries.en));
  assert.deepEqual(stringLeafPaths(dictionaries.en), stringLeafPaths(dictionaries.zh));
  assert.equal(dictionaries.en.hero.title, 'Bring your business into Mexico — fully documented, no gaps left behind.');
  assert.equal(dictionaries.en.services.title, 'Eight deliverables. One legal team.');
  assert.equal(dictionaries.en.process.title, 'A predictable timeline, not a black box.');
  assert.equal(dictionaries.en.attorney.name, 'Lic. José Luis Ortega Ochoa');
  assert.equal(dictionaries.en.contact.title, 'Ready to bring your business into Mexico the right way?');
  assert.equal(dictionaries.zh.hero.title, '助力企业稳健进入墨西哥市场——手续完备，滴水不漏。');
  assert.equal(dictionaries.zh.services.title, '八项核心服务，一支专业法律团队');
  assert.equal(dictionaries.zh.process.title, '流程透明，进度可控');
  assert.equal(dictionaries.zh.attorney.name, 'José Luis Ortega Ochoa 律师');
  assert.equal(dictionaries.zh.contact.title, '准备以稳健的方式，将您的业务带入墨西哥市场？');
  // The approved copy hash excludes only the new visual presentation fields.
  const referenceCopy = (page) => {
    const copy = structuredClone(page);
    delete copy.presentation;
    delete copy.hero.titleHtml;
    copy.process.items.forEach((item) => { delete item.classes; });
    copy.faq.items.forEach((item) => { delete item.panelClasses; });
    for (const language of ['en', 'zh']) {
      copy.nav[`${language}Classes`] = `astraChinaLanguageLink${copy.nav[`${language}AriaCurrent`] === 'page' ? ' astraChinaLanguageLinkActive' : ''} ank-color-HASH231B16`;
    }
    return copy;
  };
  assert.deepEqual(Object.fromEntries(['en', 'zh'].map((locale) => [
    locale,
    createHash('sha256').update(JSON.stringify(referenceCopy(dictionaries[locale]))).digest('hex'),
  ])), {
    en: '1dfa9414db69d795878557b8fff1669fa4500f504b6510032f35e87881968474',
    zh: 'c85890c7900bed4c1530203fe5c35417f4710c80909593754a517680424f6c27',
  });

  const variables = readJson('soft-landing-china/variables.json').variables;
  if (variables.astraChinaAssets.wechatQrUrl) {
    assert.match(variables.astraChinaAssets.wechatQrUrl, /^https:\/\/assets\.zoolandingpage\.com\.mx\/grupoastralegal\.com\/soft-landing-china\/images\/wechat-qr\.jpe?g$/);
    assert.equal(variables.astraChinaAssets.wechatQrStatus, 'verified-public-asset');
  } else {
    assert.equal(variables.astraChinaAssets.wechatQrStatus, 'blocked-pending-authorized-upload');
  }
  assert.equal(variables.astraChinaAssets.logoUrl, 'https://assets.zoolandingpage.com.mx/grupoastralegal.com/soft-landing-china/images/astra-legal-wordmark.png');
  assert.equal(variables.astraChinaAssets.attorneyPortraitUrl, readJson('variables.json').variables.heroAssets.heroImageUrl);
  assert.equal(variables.astraChinaContact.emailHref, 'mailto:grupoastralegal@gmail.com');
  assert.equal(variables.astraChinaContact.phoneHref, 'tel:+523319937983');
  const payload = readJson('soft-landing-china/components.json');
  assert.match(componentById(payload, 'astraChinaWechatImage').valueInstructions, /astraChinaAssets\.wechatQrUrl/);
  if (!variables.astraChinaAssets.wechatQrUrl) {
    assert.equal(componentById(payload, 'astraChinaWechatImage').condition, 'all:var,astraChinaAssets.wechatQrUrl');
    assert.equal(componentById(payload, 'astraChinaWechatCard').condition, 'all:var,astraChinaAssets.wechatQrUrl');
    assert.equal(componentById(payload, 'astraChinaHeroSecondary').condition, 'all:var,astraChinaAssets.wechatQrUrl');
  }
  assert.match(componentById(payload, 'astraChinaEmailLink').valueInstructions, /astraChinaContact\.emailHref/);
  assert.match(componentById(payload, 'astraChinaFooterPhone').valueInstructions, /astraChinaContact\.phoneHref/);
  assert.match(componentById(payload, 'astraChinaFooterEmail').valueInstructions, /astraChinaContact\.emailHref/);
});

test('landing baselines ignore platform line endings but still detect content changes', () => {
  assert.equal(baselineHash('first\nsecond\n'), baselineHash('first\r\nsecond\r\n'));
  assert.notEqual(baselineHash('first\nsecond\n'), baselineHash('first\nchanged\n'));
});

test('QA-020 and QA-021 stay absent from every pre-existing site surface and preserve the old landing bytes', () => {
  const newPaths = ['/soft-landing-china/eng', '/soft-landing-china/zh'];
  const existingSurfaceFiles = [
    'components.json',
    'variables.json',
    'i18n/es.json',
    'i18n/en.json',
    'i18n/zh.json',
    ...readJson('site-config.json').routes
      .map(({ pageId }) => pageId)
      .filter((pageId) => pageId !== 'soft-landing-china')
      .flatMap((pageId) => [`${pageId}/components.json`, `${pageId}/variables.json`, `${pageId}/i18n/es.json`, `${pageId}/i18n/en.json`, `${pageId}/i18n/zh.json`])
      .filter((path) => existsSync(new URL(`../${path}`, import.meta.url))),
  ];
  for (const path of existingSurfaceFiles) {
    const content = readText(path);
    for (const campaignPath of newPaths) assert.equal(content.includes(campaignPath), false, `${path}: ${campaignPath}`);
  }

  // QA-004's approved international-company translations supersede only EN, ZH, and SEO baselines.
  const expectedHashes = {
    'soft-landing-empresas-chinas/angora-combos.json': '4eb85d2a78e09c7f5e9ca2d884df5d2027e00e1215593454a0c4b48680af9282',
    'soft-landing-empresas-chinas/components.json': 'f9f582e879c156b4ee82673087abe86fb16a59714cb1bfca476894e9caddd830',
    'soft-landing-empresas-chinas/i18n/en.json': '95c2287c678f284a1ba6c9afa4440ff95bf024ca1c50b35109cce067460708cd',
    'soft-landing-empresas-chinas/i18n/es.json': '3046749be6b1241ddf9e62137028743fb6f9b6b6d2ae7316e09e63c6aac5771e',
    'soft-landing-empresas-chinas/i18n/zh.json': 'fa024237465c4b4c2ac48110a949a39f1bb2715348752ffa3324f941d7b703ef',
    'soft-landing-empresas-chinas/page-config.json': 'a42e8fc92b4b05c12f89801fdca9282d7e406174cd9309a2f4ec5c29b8bbaf56',
    'soft-landing-empresas-chinas/variables.json': '53e83983035e65d617c7e255d2975b30ca1cb1903d86a6982c0aa32301fde4ff',
  };
  for (const [path, hash] of Object.entries(expectedHashes)) {
    assert.equal(baselineHash(readText(path)), hash, path);
  }
});

test('PASS1 uses only valid page-scoped display values with desktop campaign intent and 44px controls', () => {
  const calculatorCombos = readJson('recuperacion-impuestos-inmobiliarios/angora-combos.json').combos;
  const campaignCombos = readJson('soft-landing-china/angora-combos.json').combos;
  const pageScopedStyles = `${JSON.stringify(calculatorCombos)}${JSON.stringify(campaignCombos)}`;
  assert.equal(pageScopedStyles.includes('inlineFlex'), false);

  const navLink = campaignCombos.astraChinaNavLink.join(' ');
  const headerAction = campaignCombos.astraChinaHeaderAction.join(' ');
  const languageSwitch = campaignCombos.astraChinaLanguageSwitch.join(' ');
  assert.match(navLink, /(?:^|\s)ank-display-none(?:\s|$)/);
  assert.match(navLink, /(?:^|\s)ank-display-px821-flex(?:\s|$)/);
  assert.doesNotMatch(headerAction, /(?:^|\s)ank-display-none(?:\s|$)/);
  assert.match(headerAction, /(?:^|\s)ank-display-inlineMINflex(?:\s|$)/);
  assert.match(languageSwitch, /(?:^|\s)ank-display-flex(?:\s|$)/);
  assert.doesNotMatch(languageSwitch, /(?:^|\s)ank-display-none(?:\s|$)/);

  for (const combo of ['astraChinaNavLink', 'astraChinaLanguageLink', 'astraChinaPrimaryAction']) {
    const tokens = campaignCombos[combo].join(' ');
    assert.match(tokens, /(?:^|\s)ank-minHeight-44px(?:\s|$)/, `${combo} height`);
    assert.match(tokens, /(?:^|\s)ank-boxSizing-borderMINbox(?:\s|$)/, `${combo} box sizing`);
  }
});

test('PASS1 page-scoped selected and emphasis colors meet WCAG AA', () => {
  const calculatorCombos = readJson('recuperacion-impuestos-inmobiliarios/angora-combos.json').combos;
  const campaignCombos = readJson('soft-landing-china/angora-combos.json').combos;
  const pairs = [
    ['selected city', literalComboColorPair(calculatorCombos.calculatorChoiceActive), { foreground: '#231B16', background: '#E6AE01' }],
    ['active language', literalComboColorPair(campaignCombos.astraChinaLanguageLinkActive), { foreground: '#FBF8F2', background: '#231B16' }],
    ['hero primary', literalComboColorPair(campaignCombos.astraChinaPrimaryAction), { foreground: '#FBF8F2', background: '#231B16' }],
    ['process banner', literalComboColorPair(campaignCombos.astraChinaProcessBanner), { foreground: '#231B16', background: '#F7EFDD' }],
  ];
  for (const [name, actual, expected] of pairs) {
    assert.deepEqual(actual, expected, `${name} palette`);
    assert.ok(contrastRatio(actual.foreground, actual.background) >= 4.5, `${name} contrast`);
  }
});

test('PASS1 all applied campaign text contexts meet their WCAG contrast threshold', () => {
  const payload = readJson('soft-landing-china/components.json');
  const combos = readJson('soft-landing-china/angora-combos.json').combos;
  const paper = '#FBF8F2';
  const raisedPaper = '#F7EFDD';
  const ink = '#231B16';
  const ownBackground = (comboName) => literalComboColor(combos, comboName, 'bg');
  const contexts = [
    ['skip link', 'astraChinaSkipLink', ownBackground('astraChinaSkipLink')],
    ['desktop navigation', 'astraChinaNavLink', paper],
    ['inactive language', 'astraChinaLanguageLinkInactive', paper],
    ['active language', 'astraChinaLanguageLinkActive', ownBackground('astraChinaLanguageLinkActive')],
    ['primary action', 'astraChinaPrimaryAction', ownBackground('astraChinaPrimaryAction')],
    ['hero eyebrow', 'astraChinaEyebrow', paper],
    ['hero title', 'astraChinaHeroTitle', paper],
    ['hero lead', 'astraChinaLead', paper],
    ['hero secondary action', 'astraChinaSecondaryAction', paper],
    ['hero trust text', 'astraChinaTrustText', paper],
    ['certification seal title', 'astraChinaSealTitle', raisedPaper],
    ['certification seal subtitle', 'astraChinaSealSubtitle', raisedPaper],
    ['audience heading', 'astraChinaEyebrow', raisedPaper],
    ['audience card inherited text', 'astraChinaAudienceCard', paper],
    ['audience profile title', 'astraChinaAudienceDescription', raisedPaper],
    ['audience decorative number', 'astraChinaCardNumber', raisedPaper],
    ['services eyebrow', 'astraChinaEyebrow', paper],
    ['services title', 'astraChinaSectionTitle', paper],
    ['services description', 'astraChinaSectionDescription', paper],
    ['service number', 'astraChinaServiceNumber', paper, 3],
    ['service title', 'astraChinaServiceTitle', paper],
    ['service description', 'astraChinaServiceDescription', paper],
    ['service card title', 'astraChinaCardTitle', paper],
    ['service card description', 'astraChinaCardDescription', paper],
    ['service card label', 'astraChinaServiceLabel', paper],
    ['process banner', 'astraChinaProcessBanner', ownBackground('astraChinaProcessBanner')],
    ['process eyebrow', 'astraChinaEyebrow', raisedPaper],
    ['process title', 'astraChinaSectionTitle', raisedPaper],
    ['process description', 'astraChinaSectionDescription', raisedPaper],
    ['process stamp', 'astraChinaProcessStamp', raisedPaper],
    ['process step title', 'astraChinaProcessTitle', raisedPaper],
    ['process step description', 'astraChinaProcessDescription', raisedPaper],
    ['process card title', 'astraChinaCardTitle', raisedPaper],
    ['process card description', 'astraChinaCardDescription', raisedPaper],
    ['process timing label', 'astraChinaProcessWhen', raisedPaper],
    ['why eyebrow', 'astraChinaEyebrow', paper],
    ['why title', 'astraChinaSectionTitle', paper],
    ['attorney name', 'astraChinaCardTitle', paper],
    ['attorney title', 'astraChinaAttorneyTitle', paper],
    ['attorney description', 'astraChinaCardDescription', paper],
    ['proof native title', 'astraChinaProofTitle', paper],
    ['proof native description', 'astraChinaProofDescription', paper],
    ['proof title', 'astraChinaCardTitle', raisedPaper],
    ['proof description', 'astraChinaCardDescription', raisedPaper],
    ['FAQ eyebrow', 'astraChinaEyebrow', raisedPaper],
    ['FAQ title', 'astraChinaSectionTitle', raisedPaper],
    ['FAQ button', 'astraChinaFaqButton', paper],
    ['FAQ index', 'astraChinaFaqIndex', paper],
    ['FAQ question', 'astraChinaFaqQuestion', paper],
    ['FAQ panel', 'astraChinaFaqPanel', paper],
    ['FAQ answer', 'astraChinaFaqAnswer', paper],
    ['contact eyebrow', 'astraChinaEyebrowOnDark', '#7A0510'],
    ['contact title', 'astraChinaContactTitle', '#7A0510'],
    ['contact description', 'astraChinaContactDescription', '#7A0510'],
    ['contact action', 'astraChinaOnDarkAction', '#7A0510'],
    ['WeChat label', 'astraChinaWechatLabel', paper],
    ['footer text', 'astraChinaFooterText', paper],
    ['footer link', 'astraChinaFooterLink', paper],
  ];

  const failures = contexts.flatMap(([name, comboName, background, threshold = 4.5]) => {
    const foreground = literalComboColor(combos, comboName);
    const ratio = foreground && background ? contrastRatio(foreground, background) : 0;
    return ratio >= threshold ? [] : [{ name, comboName, foreground, background, ratio: Number(ratio.toFixed(3)), threshold }];
  });
  assert.deepEqual(failures, []);

  const classFields = [
    'classes', 'featureTitleClasses', 'featureDescriptionClasses', 'linkClasses',
    'indexLabelClasses', 'titleClasses', 'detailContentClasses', 'defaultItemPanelClasses',
  ];
  const appliedTextColorCombos = new Set();
  for (const component of payload.components) {
    if (!['text', 'link', 'generic-card', 'accordion'].includes(component.type)) continue;
    for (const field of classFields) {
      const value = component.config?.[field];
      if (typeof value !== 'string') continue;
      for (const comboName of value.split(/\s+/)) {
        if (combos[comboName] && literalComboColor(combos, comboName)) appliedTextColorCombos.add(comboName);
      }
    }
    const buttonClasses = component.config?.defaultItemButtonConfig?.classes;
    if (typeof buttonClasses === 'string' && literalComboColor(combos, buttonClasses)) appliedTextColorCombos.add(buttonClasses);
  }
  const coveredColorCombos = new Set(contexts.map(([, comboName]) => comboName));
  assert.deepEqual([...appliedTextColorCombos].filter((comboName) => !coveredColorCombos.has(comboName)), []);
});

test('PASS1 uses the accessible deep-red text token on raised-paper campaign contexts', () => {
  const combos = readJson('soft-landing-china/angora-combos.json').combos;
  assert.deepEqual(Object.fromEntries([
    'astraChinaEyebrow',
    'astraChinaSealTitle',
    'astraChinaProcessWhen',
  ].map((comboName) => [comboName, literalComboColor(combos, comboName)])), {
    astraChinaEyebrow: '#A80119',
    astraChinaSealTitle: '#A80119',
    astraChinaProcessWhen: '#735600',
  });
});

test('published WeChat QR is verified while the certification seal remains decorative', () => {
  const payload = readJson('soft-landing-china/components.json');
  const variables = readJson('soft-landing-china/variables.json').variables;
  assert.equal(componentById(payload, 'astraChinaSealLogo').config.alt, '');
  assert.equal(
    variables.astraChinaAssets.wechatQrUrl,
    'https://assets.zoolandingpage.com.mx/grupoastralegal.com/soft-landing-china/images/wechat-qr.jpeg',
  );
  assert.equal(variables.astraChinaAssets.wechatQrStatus, 'verified-public-asset');
  for (const id of ['astraChinaWechatImage', 'astraChinaWechatCard', 'astraChinaHeroSecondary']) {
    assert.equal(componentById(payload, id).condition, 'all:var,astraChinaAssets.wechatQrUrl', id);
  }
});

test('PASS2 preserves every authored campaign link color through an exact GenericLink marker', () => {
  const payload = readJson('soft-landing-china/components.json');
  const combos = readJson('soft-landing-china/angora-combos.json').combos;
  const missingMarkers = [];
  const checkMarkers = (id, classes) => {
    const classNames = classes.trim().split(/\s+/);
    const authoredColors = new Set(classNames
      .filter((className) => combos[className])
      .map((comboName) => literalComboColor(combos, comboName))
      .filter(Boolean));
    for (const color of authoredColors) {
      const marker = `ank-color-HASH${color.slice(1)}`;
      if (!classNames.includes(marker)) missingMarkers.push({ id, color, marker });
    }
  };

  for (const component of payload.components.filter(({ type }) => type === 'link')) {
    checkMarkers(component.id, component.config.classes);
  }
  for (const locale of ['en', 'es', 'zh']) {
    const nav = readJson(`soft-landing-china/i18n/${locale}.json`).dictionary.page.nav;
    checkMarkers(`astraChinaLanguageEn:${locale}`, nav.enClasses);
    checkMarkers(`astraChinaLanguageZh:${locale}`, nav.zhClasses);
  }
  assert.deepEqual(missingMarkers, []);

  const languageBaseColor = literalComboColor(combos, 'astraChinaLanguageLinkInactive');
  const languageActive = literalComboColorPair(combos.astraChinaLanguageLinkActive);
  assert.equal(languageBaseColor, '#231B16');
  assert.deepEqual(languageActive, { foreground: '#FBF8F2', background: '#231B16' });
  assert.ok(contrastRatio(languageBaseColor, '#F7EFDD') >= 4.5, 'unselected language contrast');
  assert.ok(contrastRatio(languageActive.foreground, languageActive.background) >= 4.5, 'selected language contrast');
  for (const locale of ['en', 'es', 'zh']) {
    const nav = readJson(`soft-landing-china/i18n/${locale}.json`).dictionary.page.nav;
    const states = [nav.enClasses, nav.zhClasses];
    assert.equal(states.filter((classes) => classes.includes('astraChinaLanguageLinkActive')).length, 1, `${locale} selected language`);
    assert.equal(states.every((classes) => classes.includes(classes.includes('astraChinaLanguageLinkActive') ? 'ank-color-HASHFBF8F2' : 'ank-color-HASH231B16')), true, `${locale} compatible language marker`);
  }

  for (const id of ['astraChinaSkip', 'astraChinaHeaderCta', 'astraChinaHeroPrimary']) {
    assert.match(componentById(payload, id).config.classes, /(?:^|\s)ank-color-HASHFBF8F2(?:\s|$)/, id);
  }

  const skipTokens = combos.astraChinaSkipLink.join(' ');
  const skipPair = literalComboColorPair(combos.astraChinaSkipLink);
  assert.deepEqual(skipPair, { foreground: '#FBF8F2', background: '#E00322' });
  assert.match(skipTokens, /(?:^|\s)ank-transformFocus-translateYSD0ED(?:\s|$)/);
  assert.match(skipTokens, /(?:^|\s)ank-outlineFocus-3px__solid__HASHE00322(?:\s|$)/);
  assert.ok(contrastRatio(skipPair.foreground, skipPair.background) >= 4.5, 'focused skip text contrast');
  assert.ok(contrastRatio('#E00322', '#FBF8F2') >= 4.5, 'focused skip outline contrast');
});

test('PASS2 gives campaign navigation and action links stable 44px boxes', () => {
  const combos = readJson('soft-landing-china/angora-combos.json').combos;
  for (const comboName of ['astraChinaNavLink', 'astraChinaPrimaryAction', 'astraChinaSecondaryAction']) {
    const tokens = combos[comboName].join(' ');
    assert.match(tokens, /(?:^|\s)ank-minWidth-44px(?:\s|$)/, `${comboName} width`);
    assert.match(tokens, /(?:^|\s)ank-minHeight-44px(?:\s|$)/, `${comboName} height`);
    assert.match(tokens, /(?:^|\s)ank-boxSizing-borderMINbox(?:\s|$)/, `${comboName} box sizing`);
  }
});

test('PASS3 keeps every campaign icon on the supported GenericIcon SVG path', () => {
  const payload = readJson('soft-landing-china/components.json');
  const supportedCampaignSvgIcons = new Set(['add', 'fact_check', 'translate', 'verified']);
  const configuredIcons = [];
  const collectConfiguredIcons = (value, path = '$') => {
    if (Array.isArray(value)) {
      value.forEach((entry, index) => collectConfiguredIcons(entry, `${path}[${index}]`));
      return;
    }
    if (!value || typeof value !== 'object') return;
    for (const [key, entry] of Object.entries(value)) {
      const entryPath = `${path}.${key}`;
      if ((key === 'icon' || key.endsWith('IconName')) && typeof entry === 'string' && entry) {
        configuredIcons.push({ path: entryPath, iconName: entry });
      }
      collectConfiguredIcons(entry, entryPath);
    }
  };

  collectConfiguredIcons(payload);
  for (const locale of ['en', 'es', 'zh']) {
    collectConfiguredIcons(readJson(`soft-landing-china/i18n/${locale}.json`), `$i18n.${locale}`);
  }

  assert.deepEqual(
    configuredIcons.filter(({ iconName }) => !supportedCampaignSvgIcons.has(iconName)),
    [],
  );
  assert.deepEqual(
    [...new Set(configuredIcons.map(({ iconName }) => iconName))].sort(),
    [...supportedCampaignSvgIcons].sort(),
  );
  assert.equal(configuredIcons.some(({ iconName }) => iconName === 'remove'), false);

  const faq = componentById(payload, 'astraChinaFaqAccordion').config;
  assert.equal(faq.toggleIconName, 'add');
  assert.equal(faq.mode, 'single');
  assert.equal(faq.allowToggle, true);
});
