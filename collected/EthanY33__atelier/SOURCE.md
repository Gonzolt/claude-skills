# EthanY33/atelier

Copied from https://github.com/EthanY33/atelier (license: **MIT**). The upstream license file is kept in this folder. All credit goes to the original authors.

| Skill | Upstream path | What it does |
|---|---|---|
| [accessibility-design-audit](accessibility-design-audit/) | `plugins/atelier/skills/accessibility-design-audit` | WCAG 2.1 A and AA accessibility audit of a URL or local HTML file with axe-core in headless Chromium. Writes a markdown report grouped by impact plus raw JSON and exits 1 on critical or serious vio… |
| [brand-asset-pipeline](brand-asset-pipeline/) | `plugins/atelier/skills/brand-asset-pipeline` | Render one SVG logo mark into a PNG brand asset pack (favicons 16 to 180 px, apple-touch-icon and Android Chrome icons, Open Graph, Twitter and LinkedIn covers, Steam store capsules). With --root i… |
| [brand-memory](brand-memory/) | `plugins/atelier/skills/brand-memory` | Create, read, update, validate and audit the project's brand file, .atelier/brand.json (studio, product, voice, hex palette, font stacks, logos, social handles, deploy target, motion and surface to… |
| [design-token-sync](design-token-sync/) | `plugins/atelier/skills/design-token-sync` | Generate design tokens from the atelier brand file (.atelier/brand.json): CSS custom properties, a Tailwind theme config, typed JS constants (tokens.js + tokens.d.ts) and a Figma Variables REST API… |
| [html-to-video](html-to-video/) | `plugins/atelier/skills/html-to-video` | Record an HTML page, local .html file or URL as an MP4 (H.264) or WebM (VP9) video with frame-exact timing (virtual clock), optional muxed audio and a JPG poster. Use for product or game trailers,… |
| [og-card-generator](og-card-generator/) | `plugins/atelier/skills/og-card-generator` | Render 1200x630 Open Graph and Twitter card PNGs, one per page, from .atelier/brand.json colors, fonts, logo and studio name; single card from flags or a batch from a pages.json manifest. Use when… |
| [responsive-image-pipeline](responsive-image-pipeline/) | `plugins/atelier/skills/responsive-image-pipeline` | Resize PNG/JPG/WebP images into AVIF and WebP srcset variants (EXIF-rotated, never upscaled), a fallback <img> file and a base64 LQIP placeholder, then print a copy-paste <picture> snippet with tru… |
| [runtime-ux-audit](runtime-ux-audit/) | `plugins/atelier/skills/runtime-ux-audit` | Audit a URL or local HTML file for runtime UX problems that WCAG checks miss. Back/forward cache blockers, view transitions, speculation rules, INP and main-thread smells, dialog, popover, z-index… |
