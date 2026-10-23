#!/usr/bin/env node
/*
 * onmodel stage 1 - source garments from a Shopify storefront.
 *
 *   node scripts/fetch-garments.mjs <product-url> [more urls...] --out <workdir>
 *
 * For each product URL it pulls <origin>/products/<handle>.json, downloads
 * every image, scores each one for skin-pixel fraction, and proposes which
 * image is the flat lay (cloth) and which is the on-body reference.
 *
 * It PROPOSES. You confirm by looking at the contact sheet it writes, and
 * correct it by editing picks.json - never by re-running with different flags.
 * Picking the wrong reference is the most expensive mistake in this pipeline
 * because everything downstream inherits it and it presents as a model bug.
 *
 * Writes:
 *   <workdir>/garments/<handle>/raw/NN.jpg    every product image
 *   <workdir>/garments/<handle>/sheet.png     labelled candidates
 *   <workdir>/garments/products.json          real titles, prices, SKUs
 *   <workdir>/garments/picks.json             the proposal, for you to edit
 */

import { mkdir, writeFile, readFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const run = promisify(execFile);
const HERE = path.dirname(fileURLToPath(import.meta.url));
const MAGICK = path.resolve(HERE, '..', '..', 'imagemagick-skill', 'bin', 'magick.exe');

/* ------------------------------------------------------------------ args -- */

const argv = process.argv.slice(2);
const urls = [];
let outDir = process.cwd();

for (let i = 0; i < argv.length; i++) {
  if (argv[i] === '--out') { outDir = path.resolve(argv[++i]); continue; }
  if (argv[i].startsWith('-')) { die(`unknown flag: ${argv[i]}`); }
  urls.push(argv[i]);
}

if (!urls.length) {
  console.error(`
onmodel stage 1 - fetch garments

  node scripts/fetch-garments.mjs <product-url> [...] --out <workdir>

Example:
  node scripts/fetch-garments.mjs \\
    https://brando.no/products/nkfnilesss-grandad-top \\
    https://brando.no/products/nmnobir-knit-cardigan \\
    --out ./work
`);
  process.exit(2);
}

function die(msg) { console.error(`error: ${msg}`); process.exit(1); }

if (!existsSync(MAGICK)) {
  die(`ImageMagick not found at ${MAGICK}\n       The imagemagick-skill provides it; it is not on PATH.`);
}

/* --------------------------------------------------------------- fetching -- */

/** Turn any storefront product URL into { origin, handle, jsonUrl }. */
function parseProductUrl(raw) {
  let u;
  try { u = new URL(raw.startsWith('http') ? raw : `https://${raw}`); }
  catch { die(`not a URL: ${raw}`); }

  const m = u.pathname.match(/\/products\/([^/?#]+)/);
  if (!m) die(`not a Shopify product URL (no /products/<handle>): ${raw}`);

  const handle = decodeURIComponent(m[1]).replace(/\.json$/, '');
  return { origin: u.origin, handle, jsonUrl: `${u.origin}/products/${handle}.json` };
}

async function fetchProduct(jsonUrl) {
  const res = await fetch(jsonUrl, {
    headers: { 'accept': 'application/json', 'user-agent': 'onmodel/1.0' },
    redirect: 'follow',
  });
  if (!res.ok) {
    throw new Error(`${res.status} ${res.statusText} for ${jsonUrl}` +
      (res.status === 404 ? '\n       Either the handle is wrong, or this store is not Shopify.' : ''));
  }
  const body = await res.json();
  if (!body.product) throw new Error(`no "product" key in ${jsonUrl}`);
  return body.product;
}

async function download(url, dest) {
  const res = await fetch(url, { redirect: 'follow' });
  if (!res.ok) throw new Error(`${res.status} downloading ${url}`);
  await writeFile(dest, Buffer.from(await res.arrayBuffer()));
}

/* --------------------------------------------------------------- scoring -- */

/*
 * Skin-pixel fraction, as a proposal only.
 *
 * The image is downsampled hard and read as text pixels, then each pixel is
 * tested with the standard uniform-daylight skin rule. It is deliberately
 * simple: a beige garment scores as skin, a wooden hanger scores as skin, and
 * a dark-skinned model under warm light can score low. That is why the output
 * is a proposal in an editable file and not a decision.
 */
const SAMPLE = 96;

async function skinFraction(file) {
  const { stdout } = await run(MAGICK, [
    file, '-resize', `${SAMPLE}x${SAMPLE}!`, '-depth', '8', 'txt:-',
  ], { maxBuffer: 32 * 1024 * 1024 });

  let skin = 0, total = 0, light = 0;

  for (const line of stdout.split('\n')) {
    const hex = line.match(/#([0-9A-Fa-f]{6})\b/);
    if (!hex) continue;
    const v = parseInt(hex[1], 16);
    const r = (v >> 16) & 255, g = (v >> 8) & 255, b = v & 255;
    total++;

    if (r > 200 && g > 200 && b > 200) light++;

    const mx = Math.max(r, g, b), mn = Math.min(r, g, b);
    if (r > 95 && g > 40 && b > 20 && (mx - mn) > 15 &&
        Math.abs(r - g) > 15 && r > g && r > b) skin++;
  }

  if (!total) return { skin: 0, light: 0 };
  return { skin: skin / total, light: light / total };
}

/* ----------------------------------------------------------------- sheet -- */

async function contactSheet(files, labels, dest) {
  const args = [];
  for (let i = 0; i < files.length; i++) {
    args.push('(', files[i], '-resize', '260x340', '-background', 'white',
      '-gravity', 'south', '-splice', '0x28',
      '-pointsize', '15', '-fill', 'black', '-annotate', '+0+5', labels[i], ')');
  }
  args.push('-background', '#DDDDDD', '+append', dest);
  await run(MAGICK, args, { maxBuffer: 32 * 1024 * 1024 });
}

/* ------------------------------------------------------------------ main -- */

const garmentDir = path.join(outDir, 'garments');
await mkdir(garmentDir, { recursive: true });

const products = [];
const picks = {};

for (const raw of urls) {
  const { handle, jsonUrl } = parseProductUrl(raw);
  process.stdout.write(`\n${handle}\n  ${jsonUrl}\n`);

  let p;
  try { p = await fetchProduct(jsonUrl); }
  catch (e) { console.error(`  FAILED: ${e.message}`); continue; }

  const dir = path.join(garmentDir, handle);
  const rawDir = path.join(dir, 'raw');
  await mkdir(rawDir, { recursive: true });

  const variant = (p.variants && p.variants[0]) || {};
  const meta = {
    handle,
    title: p.title,
    vendor: p.vendor,
    type: p.product_type,
    // Shopify returns decimal strings. Norwegian storefronts display 429,95 kr
    // - format at presentation time, store what the API actually said.
    price: variant.price,
    sku: variant.sku,
    sizes: (p.variants || []).map(v => v.title),
    url: `${parseProductUrl(raw).origin}/products/${handle}`,
  };
  products.push(meta);
  console.log(`  ${meta.title}  |  ${meta.vendor}  |  ${meta.price}  |  ${meta.type || 'no type'}`);

  const images = (p.images || []).sort((a, b) => a.position - b.position);
  if (!images.length) { console.error('  no images on this product'); continue; }

  const files = [], labels = [], scores = [];

  for (let i = 0; i < images.length; i++) {
    const src = images[i].src.split('?')[0];
    const ext = (path.extname(src) || '.jpg').toLowerCase();
    const dest = path.join(rawDir, String(i + 1).padStart(2, '0') + ext);
    try { await download(images[i].src, dest); }
    catch (e) { console.error(`  image ${i + 1}: ${e.message}`); continue; }

    const s = await skinFraction(dest);
    files.push(dest);
    scores.push({ index: i + 1, file: dest, ...s });
    labels.push(`${i + 1}  skin ${(s.skin * 100).toFixed(0)}%`);
  }

  if (!files.length) { console.error('  nothing downloaded'); continue; }

  await contactSheet(files, labels, path.join(dir, 'sheet.png'));

  /*
   * The proposal. Highest skin fraction is the likeliest worn shot; lowest is
   * the likeliest flat lay. A reference below 3% skin is almost certainly not
   * a person, so it is left null rather than guessed - a wrong reference is
   * worse than none, because it transfers the wrong garment confidently.
   */
  const bySkin = [...scores].sort((a, b) => b.skin - a.skin);
  const worn = bySkin[0];

  /*
   * For the flat lay, low skin is necessary but not sufficient: a product with
   * no worn shot at all scores every image at 0%, and an arbitrary tie-break
   * cheerfully returns the BACK of the garment. Shopify position 1 is the
   * front hero shot on essentially every store, so among everything within a
   * point of the minimum, take the earliest position.
   */
  const minSkin = bySkin[bySkin.length - 1].skin;
  const flat = scores
    .filter(s => s.skin <= minSkin + 0.01)
    .sort((a, b) => a.index - b.index)[0];

  /*
   * Known bias, and it matters: skin fraction ranks the CLOSEST crop highest,
   * because a tight shot is mostly face and arms. Close crops are frequently
   * the worst references - they tend to be the ones with arms folded across
   * the garment, which is the single disqualifying fault in a reference. A
   * full-length shot scoring 6% is often a better reference than a chest crop
   * scoring 15%. Hence the runners-up are listed, not hidden.
   */
  const others = bySkin.filter(s => s.index !== worn.index && s.skin >= 0.03);

  picks[handle] = {
    cloth: path.relative(outDir, flat.file).replace(/\\/g, '/'),
    reference: worn.skin >= 0.03 ? path.relative(outDir, worn.file).replace(/\\/g, '/') : null,
    _proposal: {
      cloth_from: `image ${flat.index}, skin ${(flat.skin * 100).toFixed(0)}% (earliest position among the lowest-skin images, i.e. the front hero)`,
      reference_from: worn.skin >= 0.03
        ? `image ${worn.index}, skin ${(worn.skin * 100).toFixed(0)}%`
        : `none above 3% skin - highest was image ${worn.index} at ${(worn.skin * 100).toFixed(0)}%`,
      other_on_body_candidates: others.length
        ? others.map(s => `image ${s.index}, skin ${(s.skin * 100).toFixed(0)}%`)
        : 'none',
      check: 'Highest skin % is the closest crop, not the best reference. If the '
           + 'proposed one has arms folded across the garment, or the garment is '
           + 'partly hidden, switch to a runner-up that shows the whole garment '
           + 'with arms clear.',
      all: scores.map(s => `${s.index}: skin ${(s.skin * 100).toFixed(0)}%  light ${(s.light * 100).toFixed(0)}%`),
    },
  };

  console.log(`  ${files.length} images -> ${path.relative(process.cwd(), path.join(dir, 'sheet.png'))}`);
  console.log(`  proposed cloth: image ${flat.index}   reference: ${worn.skin >= 0.03 ? 'image ' + worn.index : 'NONE'}`);
  if (others.length) {
    console.log(`  other on-body candidates: ${others.map(s => s.index).join(', ')}` +
      `  <- prefer one of these if the proposal crops the garment or folds arms across it`);
  }
}

await writeFile(path.join(garmentDir, 'products.json'), JSON.stringify(products, null, 2) + '\n');

const picksPath = path.join(garmentDir, 'picks.json');
if (existsSync(picksPath)) {
  const prev = JSON.parse(await readFile(picksPath, 'utf8'));
  for (const k of Object.keys(prev)) {
    if (picks[k] && !prev[k]._proposal) picks[k] = prev[k];   // keep hand edits
  }
}
await writeFile(picksPath, JSON.stringify(picks, null, 2) + '\n');

/* ---------------------------------------------------------------- report -- */

const noRef = Object.entries(picks).filter(([, v]) => !v.reference).map(([k]) => k);

console.log(`
Wrote:
  ${path.relative(process.cwd(), path.join(garmentDir, 'products.json'))}   real titles, prices, SKUs
  ${path.relative(process.cwd(), picksPath)}      the proposal - EDIT THIS

Next, and do not skip it: open each sheet.png and check the proposal.
Delete the "_proposal" key from an entry once you have confirmed it by eye;
entries without that key are preserved across re-runs.`);

if (noRef.length) {
  console.log(`
WARNING - no on-body reference found for: ${noRef.join(', ')}
  A flat-lay-only run cannot know the print's real scale or how the fabric
  drapes, which is exactly what reads as "pasted on". Look at the sheet
  yourself before accepting this; if the store genuinely has no worn shot,
  see references/garments.md for what to do instead.`);
}

const types = products.map(p => `${p.handle}: ${p.type || 'unknown'}`);
console.log(`
Check the categories before planning anything around these:
  ${types.join('\n  ')}
A list of products from a kidswear site is very often not all tops - sort by
body region first. references/garments.md has the consequences.`);
