# Why try-on reads as fake, and what fixes each case

Photoreal failure is never one big thing. It is a dozen small tells, each
individually forgivable, that stack until the eye rejects the image. Below,
each tell is paired with its actual cause and the actual fix.

**The discipline that matters most: fix inputs, not settings.** Almost every
result you will want to reject is caused by a crop, a reference or a pose, and
almost none are caused by steps, guidance or seed. Re-rolling a seed on a bad
input just produces a different bad image, burns four minutes, and teaches you
nothing.

---

## The judging protocol

Never judge a try-on by looking at the whole image on a screen. It flatters.
Do this instead, in order:

1. **Neckline at 200%.** The single highest-yield inspection. It is where
   garment meets skin, and it is where transfer models fail first.
2. **Cuffs and hands at 200%.** The second-highest.
3. **Hem, at the waist or hip.** Does the garment end, or does it dissolve?
4. **Compare the print to the reference side by side, at matched body width.**
   Not the flat lay. The reference.
5. **Squint, or shrink to 25%.** Kills detail, leaves tonal structure. If the
   garment separates from the body as a distinct pasted shape at 25%, it is
   pasted, and no amount of detail work will save it.

`scripts/sheet.sh` builds exactly these views. Use it rather than eyeballing.

---

## Tier 1 — the tells that kill an image outright

### 1. Wrong print scale

**Looks like:** the motif is bedsheet-sized, or a busy print becomes texture.
It is the most common single reason a garment reads as a graphic rather than
cloth.

**Cause:** a flat-lay-only run. The model has no way to know a fawn is 40 mm
across rather than 200 mm, so it fills the region at whatever scale looks
plausible in isolation.

**Fix:** supply `--reference`. This is what the reference branch is *for* — a
worn photo pins the motif to a real body width. If a reference genuinely does
not exist, crop the flat lay so the frame is filled by roughly the same
proportion of garment as the person's torso occupies, which gives the model a
scale hint it would not otherwise have.

The predecessor project hit this exactly and solved it by hand-computing a
0.586 scale factor from plate pixel widths. That arithmetic is no longer
needed — but it is a good sanity check if a result looks off.

### 2. Silhouette bleed from the base layer

**Looks like:** a fitted t-shirt with mysteriously bulky shoulders; a cardigan
whose outline is subtly the shape of the jumper underneath.

**Cause:** RefTon repaints the garment region, but the master's existing
garment shapes that region. A bulky base layer donates its outline.

**Fix:** at casting. Plain, close-fitting, mid-grey base layer, every time.
Cannot be repaired downstream — it is a re-cast.

### 3. Occlusion over the torso

**Looks like:** print painted across the back of a hand; a braid that becomes
fabric; a garment that swallows a forearm.

**Cause:** anything crossing the garment region in the master. Hands, hair,
crossed arms, a strap.

**Fix:** at casting — arms clear of the torso, hair behind the shoulder. This
is why the casting prompt insists on it. The predecessor project spent a whole
debugging cycle on a two-threshold skin mask to rescue hands at the cuffs;
casting the pose correctly costs nothing and removes the problem entirely.

### 4. Text and logos as gibberish

**Looks like:** a chest print that is almost letters. Instantly fatal — the eye
finds broken text faster than anything else in this list.

**Cause:** diffusion models cannot spell, and a LoRA trained for garment
transfer certainly cannot.

**Fix:** two options, both legitimate.
- Choose products without chest text. Usually possible in kidswear.
- Composite the **real logo asset** back over the result at stage 4, warped to
  the garment's perspective and multiplied so the fabric's folds show through.
  A real asset placed by hand beats a hallucinated one every time, and this is
  the one place where the old project's compositing instinct was correct.

### 5. Light direction mismatch

**Looks like:** hard to name, easy to feel. The face is lit from one side and
the garment from the other. Reads as uncanny before it reads as anything
specific.

**Cause:** a reference photo shot under different lighting than the master.

**Fix:** pick a reference whose key light matches the master's. If none does,
re-cast the master to match the *reference* — the storefront's photography is
fixed and yours is not. If it is close but not right, a directional grade at
stage 4 can carry a small mismatch, never a large one.

---

## Tier 2 — the tells that make it "off" rather than wrong

### 6. Noiseless fabric on a noisy plate

**Looks like:** the garment is unnaturally clean and smooth while the rest of
the frame has photographic texture. Very common; almost never diagnosed.

**Cause:** diffusion output has no sensor noise. Real photographs do. Even a
perfect transfer sits in an image whose grain structure is discontinuous.

**Fix:** stage 4 applies matched grain across the **whole plate**, not just the
garment. Uniform grain is what makes the layers read as one exposure. This is
one of the highest ratios of effect to effort in the entire pipeline.

### 7. Sharpness discontinuity

**Looks like:** a soft face on a crisp graphic layer, or a garment sharper than
the person wearing it.

**Cause:** RefTon renders at 512×384 or 1024×768 and gets upscaled to plate
size. Everything it touched is now soft; everything it did not is not.

**Fix:** run finals at 1024×768, not 512. Then stage 4's identity restore
brings the face back at master resolution, and the grain pass unifies what is
left. If the garment is still soft relative to the plate, a light unsharp mask
confined to the garment region — not the face — closes the gap.

### 8. Too-clean drape

**Looks like:** an ironed, showroom garment on a child who has been playing.
No fold at the elbow, no gather at the waist, no weight anywhere.

**Cause:** flat-lay-only transfer again, or a reference that is itself a
ghost-mannequin shot.

**Fix:** prefer a reference where the garment is genuinely *in use* — a real
person, ideally with a slight arm bend. A ghost mannequin is better than a flat
lay and worse than a body.

### 9. Edge halo

**Looks like:** a faint bright or dark fringe tracing the garment silhouette.

**Cause:** the transfer boundary against a contrasting background.

**Fix:** usually a crop problem — the person image includes too much background
variation at the shoulder line. Re-crop tighter. A 1px feather at stage 4 hides
a mild case; a strong halo means the input was wrong.

### 10. Colour cast against the layout

**Looks like:** a visible rectangle where the plate meets the page.

**Cause:** the studio sweep is white and the layout background is not.

**Fix:** stage 4 multiplies the plate by the brand colour, so white maps
exactly to the background and everything else picks up the same warm grade.
Carried over from the predecessor project, where it worked well.

---

## Symptom → cause lookup

| What you see | Almost always | Do this |
|---|---|---|
| Garment is a different garment | Reference shows the wrong item, or a layer over it | Re-crop the reference to foreground the target garment |
| Print far too large or small | No reference supplied | Add `--reference` |
| Colour right, fabric wrong | Flat lay only | Add `--reference` |
| Bulky where it should be fitted | Base layer bleed | Re-cast the master |
| Hand or hair painted as fabric | Occlusion in the master | Re-cast the pose |
| Broken lettering | Diffusion cannot spell | Pick another product, or composite the real logo |
| Uncanny but unnameable | Light direction mismatch | Match reference lighting, or re-cast |
| Garment too clean/smooth | No grain pass | Run stage 4 |
| Soft face | 512 draft treated as final | Rerun at 1024, then identity restore |
| Seam against the layout | No grade pass | Run stage 4 |
| Different face per outfit | Ran from different masters | One master for all garments; then identity restore |

Note what is *not* on this list: seed, steps, guidance, and prompt wording.
They are not the lever. If you find yourself tuning them, you have
misdiagnosed.

---

## When to stop

A result is done when, at 200%, the neckline transition is continuous, the
cuffs are cloth and the hands are hands, the print scale matches the reference
at equal body width, and at 25% the garment does not separate from the body.

If three attempts with corrected inputs have not reached that, the honest
answer is that this particular garment does not transfer — a heavily
structured item, a complex closure, an unusual silhouette. Say so plainly and
propose either a different product for that slot or real photography for it.
Shipping a fourth mediocre attempt because three were spent is the failure mode
this note exists to prevent.
