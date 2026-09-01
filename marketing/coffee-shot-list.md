# Coffee shot list

**One drink: Black Rest Coffee.** (Owner-confirmed 11 Aug 2026 — the coffee
offering is a single house drink, not an espresso-bar line-up.)

This photo goes on `/order` and covers the menu-photo step for the Google
profile.

## File

Upload straight into the POS: **Manage → Menu Items → Edit the drink →
Upload Photo**. Filenames no longer matter — the photo is attached to the item
you are editing, downscaled to 1200px and stored with it.

(There used to be a `public/menu/` folder and a seed script that matched photos
to items by slugified filename. Both are gone: the photo now travels with the
menu item, so renaming a drink can no longer orphan its picture.)

## Specs

- **1000 × 1000, square.** Matches the Signature Tea photos already on the site.
- **Centre the cup.** The tile renders at 64 × 64 with `object-cover`, so the
  crop is square and tight — anything near the edges is lost.
- **250–400 KB.** Bigger is wasted on a 64px tile and slows the menu on hotel
  wifi.

## Shooting

- Daylight, no flash. Late morning near a window is enough.
- Shoot on the palette: warm ivory or natural wood surface, not white paper.
- Since it's black coffee, watch the contrast — a dark drink in a dark cup on a
  dark surface reads as a black circle at thumbnail size. A light cup, or a
  light surface under a dark cup, keeps it legible.
- Worth shooting two or three angles (overhead, 3/4, side with steam) — the
  extras are useful for social even though only one goes on the menu.

## Wiring it in

Nothing to commit and nothing to deploy. In `/pos` → **Manage → Menu Items**,
open the drink, click **Upload Photo**, pick the file, and save. It is on the
customer's menu straight away — the menu API reads the database on each
request, so no restart either.

The photo is downscaled to 1200px and stored with the item, so a 3 MB shot off
the camera arrives as roughly 20 KB.
