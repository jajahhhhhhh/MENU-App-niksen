# Shot list

**The menu photos are done.** All 32 items on
`https://niksensamui.com/api/public/menu` carry an `image_url` — 23 sodas and
nine dishes, checked 18 Sep 2026. Nothing on the ordering page is missing a
picture, so this is no longer a menu shot list.

*(It used to be a shot list for one photo of Black Rest Coffee. There is no
coffee on the menu and there hasn't been for some time. See `content-plan.md`.)*

What is still missing is everything that is **not** a menu tile.

---

## 1. The room — mostly a gap

We have two interiors, both after dark, both in `pinterest/`: `pin-room.png`
(the corner with the lamp and the black blinds) and `pin-night.png` (the
counter and the turntable). Both are good, and `pin-room.png` is the closest
thing to a hero image we have. Both are portrait and both are night.

What is missing is everything else, and editors want the one we don't have —
a horizontal daylight wide. Shoot:

- **Wide of the room, in daylight, horizontal.** This is the one editors crop, and we have no version of it. Highest priority on this page.
- **The door and the walk in.** The "secret" is the premise of the whole place and no photo of it exists. Door → corridor → seat, from standing height.
- **A quiet corner with nobody in it, in the morning.** `pin-room.png` does this at night; the café half of the day has no equivalent.
- **The bar at work, 18:30.** Lamps on, no flash, someone behind it. `pin-night.png` is the empty version.
- **A table in use** — one glass, one dish, a book. Not staged busy; staged calm.

Both orientations of each. Editors want 16:9, Instagram and Pinterest want
vertical, and re-shooting because you only have one orientation is a wasted
morning.

Horizontal and vertical of each. Editors want 16:9, Instagram and Pinterest want
vertical, and re-shooting because you only have one orientation is a wasted
morning.

---

## 2. The twenty-three, together

One hero of the whole soda line-up, and we do not have it.

- All 23 bottles or glasses in one frame, lined up or gridded, shot square from overhead.
- Colour is the entire point — put them on the warm ivory or natural wood, not on white paper, and do not colour-correct the difference out of them.
- This is the pinned Instagram post, the Pinterest pin and the GBP cover, off one shot.

Also worth having: **the pour.** Close, over ice, daylight, 15–20 seconds,
shot the same way every week. That is the content engine in `content-plan.md`
§3, and it needs a repeatable frame more than it needs a perfect one.

---

## 3. People

- The team behind the bar, working, not lined up smiling.
- Hands: pouring, plating, carrying. Faces are optional, hands are not.

Get written consent from anyone recognisable before these go anywhere paid.

---

## Specs for menu tiles

If an item is ever added or a photo replaced:

- **1000 × 1000, square.** The tile renders at 64 × 64 with `object-cover`, so the crop is tight — centre the subject, nothing near the edges survives.
- **250–400 KB.** Bigger is wasted on a 64px tile and slows the menu on hotel wifi.
- Daylight, no flash. Late morning near a window is enough.
- Shoot on the palette — warm ivory or natural wood, not white paper.

## Wiring a photo in

Nothing to commit and nothing to deploy. In `/pos` → **Manage → Menu Items**,
open the item, click **Upload Photo**, pick the file, save. It is on the
customer's menu straight away — the menu API reads the database on each
request, so no restart either.

The photo is downscaled to 1200px and stored with the item, so a 3 MB shot off
the camera arrives as roughly 20 KB. Filenames do not matter; the photo travels
with the item, so renaming a dish can no longer orphan its picture.
