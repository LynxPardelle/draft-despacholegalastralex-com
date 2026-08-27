import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const page = 'recuperacion-impuestos-inmobiliarios';
const read = (file) => JSON.parse(readFileSync(new URL(`../${page}/${file}`, import.meta.url), 'utf8'));
const payload = read('components.json');
const component = (id) => payload.components.find((item) => item.id === id);
const combos = read('angora-combos.json').combos;

test('QA-018 keeps selected city and year colors above theme-replayed base rules', () => {
  for (const id of ['calculatorCity', 'calculatorPurchaseYear']) {
    assert.equal(component(id).config.optionClasses, 'calculatorChoice');
    assert.equal(component(id).config.activeOptionClasses, 'calculatorChoiceActive');
  }
  // :is([aria-checked=true]) adds state specificity without relying on insertion order.
  assert.deepEqual(combos.calculatorChoiceActive.join(' ').split(/\s+/), [
    'ank-borderColorIsSDSEariaMINcheckedEQtrueEEED-HASHE6AE01',
    'ank-backgroundColorIsSDSEariaMINcheckedEQtrueEEED-HASHE6AE01',
    'ank-colorIsSDSEariaMINcheckedEQtrueEEED-HASH231B16',
  ]);
});

test('QA-018 reuses a native, separately identified price slider without limiting manual prices', () => {
  const slider = component('calculatorPropertySlider');
  assert.ok(slider, 'the reference price slider is present');
  assert.equal(slider.type, 'input');
  assert.deepEqual({
    fieldId: slider.config.fieldId, controlType: slider.config.controlType,
    value: slider.config.value, min: slider.config.min, max: slider.config.max, step: slider.config.step,
  }, { fieldId: 'propertyValueSlider', controlType: 'range', value: null, min: 1000000, max: 20000000, step: 100000 });
  assert.equal(slider.config.required, undefined);
  assert.equal(component('calculatorPropertyValue').config.max, undefined);
  assert.equal(component('calculatorPropertyValue').config.step, 1);
  assert.equal(component('calculatorScope').config.initialValues.propertyValueSlider, null);
  assert.equal(new Set(payload.components.filter((item) => item.type === 'input').map((item) => item.config.fieldId)).size, 4);
});

test('QA-018 synchronizes only actual value changes and preserves the explicit calculation action', () => {
  assert.equal(component('calculatorScope').config.noValidate, true, 'custom localized validation owns the form, including exact fractional prices');
  assert.equal(component('calculatorPropertySlider')?.eventInstructions,
    'setScopeValue:propertyValue,event.eventData.value,event.eventName,valueChanged;setScopeValue:hasCalculated,false,event.eventName,valueChanged');
  assert.equal(component('calculatorPropertyValue').eventInstructions,
    'setScopeValue:propertyValueSlider,event.eventData.value,event.eventName,valueChanged;setScopeValue:hasCalculated,false,event.eventName,valueChanged');
  for (const id of ['calculatorCity', 'calculatorPurchaseYear']) {
    assert.equal(component(id).eventInstructions, 'setScopeValue:hasCalculated,false,event.eventName,valueChanged');
  }
  assert.equal(component('calculatorSubmit').config.type, 'submit');
  assert.equal(component('calculatorReset').eventInstructions, 'resetScope;focusElementById:propertyValue');
  for (const definition of component('calculatorScope').config.computations) {
    assert.equal(JSON.stringify(definition).includes('propertyValueSlider'), false);
  }
});

test('QA-018 preserves the compact reference card and prominent editable monetary row', () => {
  assert.match(combos.calculatorCard.join(' '), /ank-maxWidth-500px/);
  assert.match(combos.calculatorCard.join(' '), /ank-borderRadius-20px/);
  assert.match(combos.calculatorHeader.join(' '), /ank-textAlign-center/);
  assert.deepEqual(component('calculatorPriceRow').config.components,
    ['calculatorCurrencySymbol', 'calculatorPropertyValue', 'calculatorCurrencyCode']);
  assert.equal(component('calculatorCurrencySymbol').config.text, '$');
  assert.equal(component('calculatorCurrencyCode').config.text, 'MXN');
  assert.match(component('calculatorPropertyValue').valueInstructions, /set:config\.ariaLabel,i18n,page\.calculator\.propertyLabel/);
  assert.match(combos.calculatorSlider.join(' '), /ank-minHeight-44px/);
  assert.match(combos.calculatorSlider.join(' '), /ank-outlineFocus-/);
  assert.equal(combos.calculatorResultActions.join(' ').includes('repeatSD2'), false, 'contact and reset are full-width');
  assert.match(component('calculatorContactLink').config.classes, /ank-color-bgColor/);
});

test('QA-018 gives every locale an accessible slider label and honest out-of-scale guidance', () => {
  assert.match(component('calculatorPropertySlider')?.valueInstructions ?? '', /set:config\.ariaLabel,i18n,page\.calculator\.sliderLabel/);
  assert.match(component('calculatorPropertySlider')?.valueInstructions ?? '', /set:config\.helperText,i18n,page\.calculator\.sliderHint/);
  assert.equal(component('calculatorSliderOutOfScale')?.condition, 'all:scopeGt,values.propertyValue,20000000');
  for (const locale of ['es', 'en', 'zh']) {
    const copy = read(`i18n/${locale}.json`).dictionary.page.calculator;
    for (const key of ['sliderLabel', 'sliderHint', 'sliderOutOfScale']) {
      assert.ok(typeof copy[key] === 'string' && copy[key].length > 10, `${locale} ${key}`);
    }
  }
  const fonts = read('page-config.json').googleFontsStylesheet;
  assert.match(fonts.es, /family=Playfair\+Display/);
  assert.match(fonts.zh, /family=Noto\+Serif\+SC/);
});
