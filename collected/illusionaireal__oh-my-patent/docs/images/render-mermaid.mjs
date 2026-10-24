#!/usr/bin/env node
/**
 * render-mermaid.mjs
 *
 * Renders all .mmd files in docs/images/mermaid/ to SVG and PNG
 * using mmdc (must be installed globally: npm i -g @mermaid-js/mermaid-cli).
 */

import { readdirSync, existsSync, mkdirSync } from "fs";
import { join, dirname, basename, extname } from "path";
import { fileURLToPath } from "url";
import { spawnSync } from "child_process";

const __dirname = dirname(fileURLToPath(import.meta.url));
const SRC_DIR = join(__dirname, "mermaid");
const OUT_DIR = join(__dirname, "svg");
const PNG_DIR = join(__dirname, "png");
const PUPPETEER_CONFIG = join(__dirname, "puppeteer-config.json");

if (!existsSync(OUT_DIR)) mkdirSync(OUT_DIR, { recursive: true });
if (!existsSync(PNG_DIR)) mkdirSync(PNG_DIR, { recursive: true });

// On Windows, mmdc is mmdc.cmd
const MMC = process.platform === "win32" ? "mmdc.cmd" : "mmdc";

const files = readdirSync(SRC_DIR)
  .filter((f) => extname(f) === ".mmd")
  .sort();

console.log(`Found ${files.length} mermaid source files.\n`);

let ok = 0;
let fail = 0;

for (const file of files) {
  const src = join(SRC_DIR, file);
  const base = basename(file, ".mmd");
  const svgOut = join(OUT_DIR, `${base}.svg`);
  const pngOut = join(PNG_DIR, `${base}.png`);

  console.log(`▶ Rendering ${file}`);

  // SVG
  const svgRes = spawnSync(
    MMC,
    ["-i", src, "-o", svgOut, "-t", "neutral", "-b", "white",
     "-p", PUPPETEER_CONFIG],
    { stdio: "pipe", encoding: "utf8", shell: true }
  );

  if (svgRes.status !== 0) {
    console.error(`  ✗ SVG failed (exit ${svgRes.status}):`);
    console.error((svgRes.stderr || "").trim());
    console.error((svgRes.stdout || "").trim());
    fail++;
    continue;
  }
  console.log(`  ✓ SVG → ${svgOut}`);

  // PNG (scale 2 for crisp display)
  const pngRes = spawnSync(
    MMC,
    ["-i", src, "-o", pngOut, "-t", "neutral", "-b", "white",
     "-s", "2", "-p", PUPPETEER_CONFIG],
    { stdio: "pipe", encoding: "utf8", shell: true }
  );

  if (pngRes.status !== 0) {
    console.error(`  ✗ PNG failed (exit ${pngRes.status}):`);
    console.error((pngRes.stderr || "").trim());
    console.error((pngRes.stdout || "").trim());
    fail++;
    continue;
  }
  console.log(`  ✓ PNG → ${pngOut}`);

  ok++;
}

console.log(`\nDone: ${ok} succeeded, ${fail} failed.`);
process.exit(fail > 0 ? 1 : 0);
