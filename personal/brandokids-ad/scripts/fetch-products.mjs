#!/usr/bin/env node
// Pull real product data + imagery from a Shopify storefront (brando.no).
// Usage: node fetch-products.mjs <product-url> [more...] --out ./work
import fs from 'fs';
import path from 'path';

const args = process.argv.slice(2);
const outIdx = args.findIndex((a) => a === '--out');
const out = outIdx === -1 ? './work' : args[outIdx + 1];
const urls = args.filter((a, i) => a.startsWith('http') && i !== outIdx + 1);

if (!urls.length) {
  console.error('usage: node fetch-products.mjs <product-url> [...] --out ./work');
  process.exit(1);
}

// "359.95" -> "359,95 kr"  (storefront's own Norwegian format)
const nok = (p) => `${Number(p).toFixed(2).replace('.', ',')} kr`;

const slugify = (s) =>
  s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
   .replace(/[æ]/g, 'ae').replace(/[ø]/g, 'o').replace(/[å]/g, 'a')
   .replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 40);

fs.mkdirSync(out, { recursive: true });
const products = [];

for (const url of urls) {
  const u = new URL(url);
  const handle = u.pathname.split('/products/')[1]?.split(/[/?#]/)[0];
  if (!handle) { console.error(`  ! not a product URL: ${url}`); continue; }

  const api = `${u.origin}/products/${handle}.json`;
  let json;
  try {
    const r = await fetch(api);
    if (!r.ok) throw new Error(`HTTP ${r.status}`);
    json = (await r.json()).product;
  } catch (e) {
    console.error(`  ! ${handle}: ${e.message}`);
    continue;
  }

  const variant = json.variants?.[0] ?? {};
  const slug = slugify(json.title);
  const dir = path.join(out, 'garments', slug);
  fs.mkdirSync(path.join(dir, 'images'), { recursive: true });

  const images = [];
  for (const [i, im] of (json.images ?? []).entries()) {
    const src = im.src.split('?')[0];
    const ext = (src.match(/\.(jpe?g|png|webp)$/i)?.[1] ?? 'jpg').toLowerCase();
    const file = path.join(dir, 'images', `${String(i + 1).padStart(2, '0')}.${ext}`);
    try {
      const res = await fetch(src);
      fs.writeFileSync(file, Buffer.from(await res.arrayBuffer()));
      images.push({ file: path.relative(out, file).replace(/\\/g, '/'),
                    src, width: im.width, height: im.height });
    } catch (e) {
      console.error(`  ! image ${i + 1} of ${slug}: ${e.message}`);
    }
  }

  const p = {
    slug,
    handle,
    title: json.title,
    shortTitle: json.title.split(' - ')[0],
    vendor: json.vendor,
    type: json.product_type,
    price: variant.price ?? null,
    priceFormatted: variant.price ? nok(variant.price) : null,
    url: `${u.origin}/products/${handle}`,
    tags: json.tags ?? [],
    gender: (json.tags ?? []).includes('Jente') ? 'jente'
          : (json.tags ?? []).includes('Gutt') ? 'gutt' : null,
    images,
  };
  products.push(p);
  console.log(`  ✓ ${p.shortTitle}  ${p.priceFormatted ?? '(no price)'}  ${images.length} images  [${p.vendor}]`);
}

fs.writeFileSync(path.join(out, 'products.json'), JSON.stringify(products, null, 2));
fs.mkdirSync(path.join(out, 'raw'), { recursive: true });

console.log(`\n${products.length} product(s) -> ${path.join(out, 'products.json')}`);
console.log(`Put the shoot's photographs in ${path.join(out, 'raw')}/`);
console.log('Next: node scripts/check-images.mjs ' + out);
