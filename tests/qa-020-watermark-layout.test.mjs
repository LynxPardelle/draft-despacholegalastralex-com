import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

test('decorative contact watermark resolves its percentage against the full slot', () => {
  const { combos } = JSON.parse(readFileSync(new URL('../soft-landing-china/angora-combos.json', import.meta.url), 'utf8'));
  const slot = combos.astraChinaContactWatermarkSlot.join(' ').split(/\s+/);
  const image = combos.astraChinaContactWatermark.join(' ').split(/\s+/);
  for (const token of ['ank-display-grid', 'ank-gridTemplateColumns-1fr', 'ank-alignItems-center', 'ank-width-50per']) assert.ok(slot.includes(token), token);
  assert.ok(!slot.includes('ank-justifyContent-center'));
  for (const token of ['ank-marginInline-auto', 'ank-width-minSD300pxCOM60perED', 'ank-height-auto', 'ank-transform-translateXSD120pxED']) assert.ok(image.includes(token), token);
});
