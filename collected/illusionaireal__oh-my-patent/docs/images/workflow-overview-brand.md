# Branded workflow overview

Asset: [workflow-overview-brand-v1.png](./workflow-overview-brand-v1.png)

This bilingual illustration is used in both root READMEs. It groups the ten
workflow stages into five tasks and shows the research and drafting feedback
loops. The accompanying README tables preserve searchable stage names.
The [workflow reference](../workflow-diagram-en.md) remains the source for exact
state transitions, including transitions inside these groups.

## Production record

- Generated with the built-in image generation tool on 2026-09-20.
- The tool did not expose a selectable or verified model identifier; this asset
  is not labelled as having been made with "GPT Image 2.5".
- Output: PNG, 1672 × 941 pixels, 1,261,711 bytes.
- Brand references: the existing [social card](../../assets/brand/social/github-social-preview.png)
  and [Archimedes mark](../../assets/brand/png/mark-primary-512.png).
- This is a generated explanatory illustration. The existing logo assets remain
  the canonical brand originals and were not replaced.
- Checked the five numbered groups, all ten stage identifiers, forward arrows
  01 → 02 → 03 → 04 → 05, return arrows 02 → 01 and 04 → 03, bilingual labels,
  and platform spellings.

## Generation prompt

```text
Use case: infographic-diagram / brand compositing.
Create a polished, publication-quality workflow infographic for the existing open-source project "oh-my-patent", for its GitHub README. Transform the supplied brand social card into a diagram-focused composition. Image 1 is the existing social card style reference; Image 2 is the ORIGINAL Archimedes brand mark to insert, preserving its recognizable existing blue linework, face, raised document and WOW! lettering. Do not redesign the character, create another mascot, crop it, recolor it, distort it, or use it inside workflow nodes. Keep the mascot modestly sized in the upper-left header, not dominating the diagram.
Landscape 16:9 canvas, approximately 2048x1152 or higher. Clean flat vector-like editorial infographic, pure white background, generous white space, large readable bilingual typography, consistent rounded rectangles, crisp thin arrows, carefully aligned grid. Brand palette: bright royal blue #2563EB, deep navy #10182D, secondary slate #52617A, pale blue #EFF5FF, dividers #DCE4EF. No purple, no gradients, no 3D, no shadows, no faux UI, no decorative microtext, no unrelated symbols.

Header beside the small original mascot:
"oh-my-patent"
"Archimedes · 从 Eureka 到专利交底书"
"From Eureka to patent disclosure"

Main diagram: exactly FIVE numbered cards arranged on a spacious serpentine grid:
TOP ROW left to right: 01, 02, 03.
SECOND ROW right to left: 04 beneath 03, 05 beneath 02.
Use the second row LEFT area beneath 01 for a compact non-node explanatory block about recorded decisions. This block has no connecting arrows and is not a workflow stage.
Solid blue arrows indicate ONLY 01 → 02 → 03 → 04 → 05. Connect 03 down to 04, then 04 left to 05. Two thin dashed blue return arrows: 02 back to 01 labelled "补充检索 / More evidence", and 04 back up to 03 labelled "修订初稿 / Revise draft". Keep return arrows outside the cards, clearly separate from the forward arrows. No arrow from 05 to 01 and no additional connections.

Each card has one simple navy/blue line icon, a blue two-digit number, Chinese title, English subtitle, and a single monospaced stage mapping. Render this exact text:

01
"准备与检索"
"Prepare & research"
"INIT → RESEARCH"
icon: magnifying glass and document

02
"构思与评估"
"Develop & assess ideas"
"BRAINSTORM_R1 → BRAINSTORM_R2"
icon: light bulb with small check mark

03
"撰写与初稿附图"
"Draft disclosure & figures"
"DRAFT → DIAGRAM_DRAFT"
icon: pen and technical document

04
"审查与修订"
"Review & revise"
"QA_LOOP → FINAL_REVIEW"
icon: reviewed document with check mark

05
"定稿与最终附图"
"Finalize disclosure & figures"
"DIAGRAM_FINAL → DONE"
icon: finished document with small diagram

Explanatory block in lower-left, lighter and visually distinct from numbered cards:
"每一步都有记录"
"Traceable · Forkable · Resumable"
".brainstorm/ · references/"

Small footer with one short explanatory line:
"五组任务，十个阶段 / Five task groups, ten stages"
At bottom right, small platform names:
"Claude Code · Codex · OpenCode"

All text must be legible, spelled correctly, no duplicated words or invented labels. Preserve underscores in stage names. This is a grouped overview, not a chart of all legal state transitions. Do not add agent counts, scores, thresholds, quality guarantees or extra process steps. Visual coherence with the supplied brand card matters more than decoration. The finished image should feel like a clean, approachable, expertly typeset official Archimedes project diagram.
```
