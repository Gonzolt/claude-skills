#!/usr/bin/env node
// Generate a printable shot list for the shoot, from the sourced products.
// Usage: node shotlist.mjs ./work
import fs from 'fs';
import path from 'path';

const work = process.argv[2] ?? './work';
const products = JSON.parse(fs.readFileSync(path.join(work, 'products.json'), 'utf8'));

const lines = [];
lines.push('# Shot list\n');
lines.push(`${products.length} garments. One session, one location, one light.`);
lines.push('Read `references/shooting.md` before starting — the rules there are the ones');
lines.push('that cost a reshoot rather than a fix.\n');

lines.push('## Before the child is dressed\n');
lines.push('- [ ] All garments steamed or ironed, on hangers, in shooting order');
lines.push('- [ ] Location picked: window in front of the child, plain wall 1.5 m behind');
lines.push('- [ ] Phone: HDR **off**, highest resolution, 1× lens, lens wiped');
lines.push('- [ ] Constant styling decided (same bottoms + shoes throughout, hair fixed)');
lines.push('- [ ] Written parental consent for advertising use\n');

products.forEach((p, i) => {
  lines.push(`## ${i + 1}. ${p.shortTitle}`);
  lines.push('');
  lines.push(`- Product: ${p.title}`);
  lines.push(`- Price on screen: **${p.priceFormatted ?? 'MISSING — do not invent one'}**`);
  if (p.gender) lines.push(`- Tagged: ${p.gender}`);
  lines.push(`- ${p.url}`);
  lines.push('');
  lines.push('| # | Frame | Framing | Direction | Done |');
  lines.push('|---|---|---|---|---|');
  lines.push(`| 1 | Hero | Head to knee, square to camera | Arms slightly out, hands clear of the body | ☐ ☐ ☐ |`);
  lines.push(`| 2 | Detail | Chest to hip, slight angle | Closer — this is the fabric frame | ☐ ☐ ☐ |`);
  lines.push(`| 3 | Motion | Full body, room to move | "Jump and land" / "spin once" — burst it | ☐ ☐ ☐ |`);
  lines.push('');
  lines.push('Three boxes each because the keeper rate is about one in four.');
  lines.push('');
  lines.push('Save as:');
  lines.push('```text');
  lines.push(`raw/${p.slug}-hero-1.jpg     raw/${p.slug}-hero-2.jpg   ...`);
  lines.push(`raw/${p.slug}-detail-1.jpg`);
  lines.push(`raw/${p.slug}-motion-1.jpg`);
  lines.push('```');
  lines.push('');
});

lines.push('## Before you let the child go\n');
lines.push('- [ ] Every garment has at least one sharp hero, one detail, one motion frame');
lines.push('- [ ] No garment left creased in its keeper frames');
lines.push('- [ ] Nothing pre-cropped, filtered or "enhanced" — hand over originals\n');
lines.push('Then: `bash scripts/prep.sh ' + work + '`');

const dest = path.join(work, 'SHOTLIST.md');
fs.writeFileSync(dest, lines.join('\n'));
console.log(`shot list -> ${dest}`);
console.log(`${products.length} garments, ${products.length * 3} frames minimum (shoot each 3–5×).`);
const missing = products.filter((p) => !p.priceFormatted);
if (missing.length) {
  console.log(`\n! ${missing.length} product(s) have no price in the JSON:`);
  missing.forEach((p) => console.log(`   ${p.shortTitle}`));
  console.log('  Get the real price from the storefront. Never invent one.');
}
