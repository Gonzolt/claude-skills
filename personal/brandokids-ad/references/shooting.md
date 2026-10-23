# Shooting the child

This is the file that decides the quality of the ad. Everything downstream is
correction; nothing downstream is rescue.

The goal is not "good photographs". It is **four garments that cut together as
one film**, shot in a register that reads as genuine rather than staged.

## The non-negotiables

Six rules. Each one, broken, costs a reshoot rather than a fix.

1. **One session. One location. One light.** All four garments in a single
   sitting. Light moves ~15° an hour; a garment shot after lunch will not cut
   against one shot at breakfast, and prep can match colour but cannot match
   the *direction* of a shadow.
2. **Window light, subject facing it.** Stand the child so the window is in
   front of them, slightly to one side. Soft, directional, flattering, free.
   Never overhead room lights — they put shadows in eye sockets and turn every
   white garment grey-green.
3. **Flash off. Always.** On-camera flash flattens the fabric texture that is
   the entire reason to photograph clothes.
4. **Plain wall, 1.5 m behind.** Distance is what makes the background go soft
   and the child pop. Against the wall, it reads as a school photo.
5. **Camera at the child's chest height.** Shooting down from adult eye level
   foreshortens the body and makes every garment look short and wide. Crouch.
6. **Garment steamed or ironed, hem straightened, sleeves pulled down** before
   every single frame. Creases are the one thing that makes a real photograph
   look cheap.

## Framing

Shoot **vertical**, and shoot **wider than you think** — the edit crops in, and
you cannot crop out. Leave headroom and a hand's width either side.

Per garment, three frames minimum:

| Frame | What it is | Why the edit needs it |
|---|---|---|
| **Hero** | Head to knee, child square to camera, arms clear of the torso | The scene's anchor. Arms clear of the body is what lets the garment's silhouette read. |
| **Detail** | Chest to hip, closer, slight angle | Cutaway. Sells fabric and print at a scale the hero can't. |
| **Motion** | Any movement — a turn, a jump, a walk toward camera | The frame that makes it a film instead of a catalogue. Burst-mode it and keep the best. |

Shoot each of these **three to five times**. Children blink, look away and go
stiff; the keeper rate is maybe one in four, and finding that out after the
garments are back in the wardrobe is expensive.

## Styling for cohesion

The trick that makes four separate outfits read as one campaign:

- **Keep the bottom half constant.** Same jeans, same shoes, in all four
  scenes, changing only the top. The eye reads the repeated element as
  continuity and the changing element as the story.
- If a product *is* the bottom half, keep the top constant instead — plain, and
  in a colour that doesn't fight any of the four.
- **Hair identical throughout.** A ponytail in one scene and loose in the next
  reads as different days.
- No busy prints on anything that isn't the product.

## Direction — getting a real expression

The register is UGC, so a stiff posed smile is worse than a slightly
off-centre real one.

- Give an action, not an expression: "jump and land", "spin once", "walk to
  me". Shoot the moment *after* it, when they're still breathing hard and
  actually amused.
- Talk while shooting. The frames between instructions are the good ones.
- Twenty minutes is the ceiling for a young child. Plan for it: garments
  ordered and on hangers before the child is dressed for the first one.
- Bribery is a legitimate production technique.

## Phone settings

- **Highest resolution, and turn HDR off.** HDR flattens the fabric's tonal
  range and fights the grade in prep.
- **Lock exposure and focus** (tap and hold) on the garment, not the face —
  the garment is the product, and a blown-out white top can't be recovered.
- **1× lens.** The ultrawide distorts bodies at close range; the 2×/3× is
  usually a lower-quality sensor on mid-range phones.
- Wipe the lens. This sounds beneath mentioning and is responsible for more
  soft frames than any other cause.

## What to hand over

Everything, unedited, in one folder:

```text
raw/
  <product-slug>-hero-1.jpg
  <product-slug>-hero-2.jpg
  <product-slug>-detail-1.jpg
  <product-slug>-motion-1.jpg
```

Do not pre-crop, pre-filter or apply a phone "enhance". `scripts/prep.sh`
needs the original latitude, and a phone filter is a grade baked in at the
wrong point in the chain.

## Consent

Get the parent's written consent for advertising use before the shoot, not
after — including if the child is your own. One paragraph naming the brand,
the placement and the duration is enough. Norway's åndsverkloven §104 requires
consent to publish identifiable photographs of a person, and for a minor that
consent is the parent's to give.
