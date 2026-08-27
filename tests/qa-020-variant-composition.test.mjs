import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
const read = (file) => JSON.parse(readFileSync(new URL(`../soft-landing-china/${file}`, import.meta.url), 'utf8'));

test('campaign source variants are self-contained without competing base declarations', () => {
  const { combos } = read('angora-combos.json');
  const { components } = read('components.json');
  for (const [id, variant, base, required] of [
    ['astraChinaHeaderCta', 'astraChinaHeaderAction', 'astraChinaPrimaryAction', ['ank-display-inlineMINflex', 'ank-minHeight-44px', 'ank-paddingInline-18px', 'ank-paddingBlock-10px', 'ank-bg-HASHE00322']],
    ['astraChinaContactEyebrow', 'astraChinaEyebrowOnDark', 'astraChinaEyebrow', ['ank-m-0', 'ank-fontSize-0_72rem', 'ank-color-HASHF0C34D']],
    ['astraChinaEyebrowLineOnDark', 'astraChinaEyebrowLineOnDark', 'astraChinaEyebrowLine', ['ank-width-22px', 'ank-height-1px', 'ank-bg-HASHF0C34D']],
  ]) {
    const classes = components.find((entry) => entry.id === id).config.classes.split(/\s+/);
    assert.ok(classes.includes(variant));
    assert.ok(!classes.includes(base));
    const tokens = combos[variant].join(' ').split(/\s+/);
    for (const token of required) assert.ok(tokens.includes(token), `${id}: ${token}`);
    for (const property of ['bg', 'border', 'paddingInline', 'paddingBlock', 'fontSize', 'color']) {
      assert.ok(tokens.filter((token) => token.startsWith(`ank-${property}-`)).length <= 1, `${id}: conflicting ${property}`);
    }
  }
});
