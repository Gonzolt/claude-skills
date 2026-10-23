# Casting the model

One image decides the whole campaign. Every garment is tried on this exact
file, so its pose, framing, lighting and base layer are inherited by every
result. Re-casting after ten try-ons means redoing the ten try-ons — spend the
time here instead.

## The prompt template

`scripts/cast.ps1` assembles this. The slots are the only part that varies.

```
A full-colour studio photograph of {AGE_PHRASE} {SUBJECT}, standing upright and
facing the camera, {EXPRESSION}.

They wear a plain close-fitting mid-grey crew-neck t-shirt with no print, no
text and no logo, and plain mid-grey trousers. The clothing is simple and
unremarkable.

Their arms hang away from their sides with a slight bend at the elbow, hands
open and clearly separated from the body, nothing crossing the chest or
stomach. {HAIR_CLAUSE}

Framed head to mid-thigh, centred, full body width visible with room either
side. Plain seamless {BACKDROP} studio backdrop, evenly lit.

Shot on an 85mm lens at f/4 on a full-frame camera, large soft key light from
slightly camera-left, gentle fill, soft natural shadows, neutral white balance,
crisp focus on the face, realistic skin texture with visible pores and fine
detail, natural photographic grain.
```

Negative direction, appended where the model supports it: `no hands on hips, no
crossed arms, no folded arms, no hands in pockets, no jacket, no pattern, no
logo, no text, no jewellery, no props, no motion blur`.

## Why each constraint is load-bearing

These are not style preferences. Each one prevents a specific downstream
failure documented in `realism.md`.

| Constraint | Prevents |
|---|---|
| Arms clear of the torso, slight bend | Occlusion — hands and forearms painted as fabric. The top try-on failure source, unfixable later. |
| Hands open and separated | Cuff/hand boundary confusion at the wrists. |
| Hair behind the shoulders | Hair transferred into the garment region. |
| Plain close-fitting base layer | Silhouette bleed — a bulky base donates its outline to every garment. |
| Mid-grey base layer | Colour bleed into the new garment, and mid-grey is the easiest tone for a transfer model to repaint cleanly. |
| No print/text/logo on the base | Ghost text surviving under the new garment. |
| Head to mid-thigh | Category range. The model can only paint inside the frame it is given, so a waist crop cannot show a long cardigan or any trousers. |
| Room either side | Sleeves need somewhere to exist. A tight crop clips them. |
| Seamless plain backdrop | Edge halo at the garment silhouette. |
| Explicit light direction | Lets you match the storefront's reference lighting instead of discovering a mismatch after ten runs. |
| Lens and grain language | FLUX responds strongly to photographic vocabulary; without it, output drifts towards illustration. |

**Match the key light to the references, not to taste.** Check the storefront's
on-model shots first (`garments.md`), see which side their light comes from,
and set the casting prompt to agree. Their photography is fixed; yours is not.

## Age

State it plainly and once: `a 7-year-old girl`, `a 4-year-old boy`, `a woman in
her early thirties`. Do not stack age cues — "young", "little", "child" piled
onto a stated age pushes proportions towards caricature rather than making the
subject younger.

Kidswear needs body proportion to be right or nothing reads as real. If the
head-to-body ratio looks adult-shrunk rather than genuinely childlike, that is
a re-cast, not something to fix downstream.

Casting a **child** is the default use here and works, but note two practical
consequences that belong in the client conversation, not in the prompt:
disclosure requirements on many ad placements, and the labelling question under
Norway's Marketing Act. Both are covered in `SKILL.md`.

## Resolution and aspect

RefTon works at **512×384** or **1024×768** — width:height of **3:4**, portrait.
Every input is resized to exactly that, *without preserving aspect ratio*, so a
square or 16:9 master arrives visibly stretched.

Cast at **1152×1536** (3:4, comfortable on 12 GB) and let stage 3 downsample.
Casting larger than the try-on resolution is deliberate: the master is also the
source for the stage 4 identity restore, where its extra resolution is what
keeps the face sharper than the upscaled try-on around it.

## Model choice

| Model | Use | Licence |
|---|---|---|
| `schnell` | **default.** 4 steps, ~20–40 s, commercially clean | Apache-2.0 |
| `krea` | most photographic look, when licence is not a concern | Non-commercial |
| `dev` | general quality step up from schnell | Non-commercial |

For client work stay on `schnell`. It is the only stage of this pipeline that
*can* be commercially clean, so do not casually spend that.

## Working method

1. Generate **a sheet of candidates at a fixed prompt with varying seeds** —
   `-Count 6`. Casting is a selection problem, not a prompting problem.
2. Pick on **pose and framing first**, face second. A beautiful frame with
   crossed arms is useless; a plain frame with clean arms works for every
   garment.
3. Fix the seed of the winner and note it. It goes in the workdir's
   `cast.json`, so the master can be regenerated exactly.
4. Only then refine, one prompt element at a time, seed held fixed.

## Accept only if all of these are true

- [ ] Both arms fully clear of the torso, elbows slightly bent
- [ ] Both hands fully visible, open, not touching the body
- [ ] Nothing crosses the chest or stomach — no hair, no straps, no props
- [ ] Base layer is plain, close-fitting, mid-grey, unprinted
- [ ] Framing runs head to mid-thigh with side clearance for sleeves
- [ ] Background is plain and even, no gradient banding at the shoulders
- [ ] Hands and fingers are anatomically correct — count them
- [ ] Age reads correctly in body proportion, not only in the face
- [ ] Key light direction matches the garment references
- [ ] Face is sharp and skin has real texture, not plastic smoothing

Any unchecked box is a re-cast. It is a 40-second operation at this stage and a
multi-hour one after the try-ons are done.
