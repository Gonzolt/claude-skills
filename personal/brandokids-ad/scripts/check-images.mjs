#!/usr/bin/env node
// Sort catalogue imagery into people / garment-only, and flag AI watermarks.
// It PROPOSES. You confirm from the contact sheet — see references/sourcing.md.
// Usage: node check-images.mjs ./work
import { execFileSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import os from 'os';

const MAG = path.join(os.homedir(), '.claude/skills/imagemagick-skill/bin/magick.exe');
const work = process.argv[2] ?? './work';
const products = JSON.parse(fs.readFileSync(path.join(work, 'products.json'), 'utf8'));

if (!fs.existsSync(MAG)) {
  console.error(`ImageMagick not found at ${MAG}`);
  process.exit(1);
}

// Pixels of a downsampled image as [r,g,b] triples.
function pixels(file, size) {
  const txt = execFileSync(MAG, [file, '-resize', `${size}x${size}!`, '-colorspace', 'sRGB', 'txt:-'],
    { maxBuffer: 5e7 }).toString();
  const out = [];
  for (const line of txt.split('\n')) {
    const m = line.match(/\((\d+),(\d+),(\d+)/);
    if (m) out.push([+m[1], +m[2], +m[3]]);
  }
  return out;
}

// Weak signal only — warm garments false-positive hard. Never auto-trust.
function skinFraction(file) {
  const px = pixels(file, 48);
  let skin = 0;
  for (const [R, G, B] of px) {
    if (R > 95 && R > G && G > B && R - B > 25 && R - B < 130 && Math.abs(R - G) < 70) skin++;
  }
  return px.length ? skin / px.length : 0;
}

// Vendors known to ship AI-generated or customer-submitted imagery.
// Corner pixel statistics do NOT separate the badge from ordinary garment
// detail — measured, and a detector that flags everything trains you to
// ignore it. Vendor is the reliable signal; the corner strip is the check.
const WATERMARK_VENDORS = ['27 KIDS'];

// Bottom-right corner at 100%, where the badge sits, for visual confirmation.
function cornerCrop(file, dest) {
  try {
    execFileSync(MAG, [file, '-gravity', 'southeast', '-crop', '38%x28%+0+0', '+repage',
      '-resize', '220x160^', '-gravity', 'center', '-extent', '220x160', dest]);
    return true;
  } catch { return false; }
}

const rows = [];
for (const p of products) {
  for (const im of p.images) {
    const f = path.join(work, im.file);
    if (!fs.existsSync(f)) continue;
    const skin = skinFraction(f);
    const wm = WATERMARK_VENDORS.includes(p.vendor);
    rows.push({
      product: p.shortTitle, vendor: p.vendor, file: im.file, f,
      skin, watermarkRisk: wm,
      proposed: skin > 0.12 ? 'people?' : 'garment-only',
    });
  }
}

// contact sheet, labelled, so the proposal can be confirmed by eye
const review = path.join(work, 'review');
fs.mkdirSync(review, { recursive: true });
const tiles = [], corners = [];
rows.forEach((r, i) => {
  const t = path.join(review, `t${String(i).padStart(3, '0')}.png`);
  const label = r.proposed === 'people?' ? 'PERSON?' : 'garment';
  try {
    execFileSync(MAG, [r.f, '-resize', '220x293^', '-gravity', 'center', '-extent', '220x293',
      '-background', '#111', '-gravity', 'south',
      '-fill', r.proposed === 'people?' ? '#ff6b6b' : '#ffd93d',
      '-pointsize', '17', '-annotate', '+0+3', label, t]);
    tiles.push(t);
  } catch { /* skip unreadable */ }

  if (r.watermarkRisk) {
    const c = path.join(review, `c${String(i).padStart(3, '0')}.png`);
    if (cornerCrop(r.f, c)) corners.push(c);
  }
});

if (tiles.length) {
  const sheet = path.join(review, 'images.png');
  execFileSync(MAG, ['montage', ...tiles, '-tile', '6x', '-geometry', '+4+4',
    '-background', '#222', sheet]);
  tiles.forEach((t) => fs.unlinkSync(t));
  console.log(`contact sheet   -> ${sheet}`);
}

if (corners.length) {
  const sheet = path.join(review, 'watermark-check.png');
  execFileSync(MAG, ['montage', ...corners, '-tile', '4x', '-geometry', '+4+4',
    '-background', '#222', sheet]);
  corners.forEach((c) => fs.unlinkSync(c));
  console.log(`watermark check -> ${sheet}   (bottom-right corners at 100%)`);
}

fs.writeFileSync(path.join(work, 'image-review.json'), JSON.stringify(rows, null, 2));

const people = rows.filter((r) => r.proposed === 'people?');
const wm = rows.filter((r) => r.watermarkRisk);
console.log(`\n${rows.length} images: ${rows.length - people.length} proposed garment-only, ${people.length} may contain a person`);
if (wm.length) {
  console.log(`\n${wm.length} image(s) from a vendor known to ship AI-generated or`);
  console.log(`customer-submitted imagery (${[...new Set(wm.map((r) => r.vendor))].join(', ')}).`);
  console.log(`Check watermark-check.png for the "GENERATED WITH AI" badge, then crop or drop:`);
  wm.forEach((r) => console.log(`   ${r.file}`));
}
if (people.length) {
  console.log(`\nImages that may show a person — confirm each on the sheet:`);
  people.forEach((r) => console.log(`   ${r.file}  skin=${r.skin.toFixed(2)}  (${r.vendor})`));
  console.log(`\nA person in catalogue imagery is someone else's model or someone's child.`);
  console.log(`Do not use them in the ad. Garment-only frames are safe — see references/sourcing.md.`);
}
console.log(`\nSkin scoring is a weak signal; warm garments false-positive. Read the sheet.`);
