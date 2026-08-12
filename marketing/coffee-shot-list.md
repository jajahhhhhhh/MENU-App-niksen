# Coffee shot list

**One drink: Black Rest Coffee.** (Owner-confirmed 11 Aug 2026 — the coffee
offering is a single house drink, not an espresso-bar line-up.)

This photo goes on `/order` and covers the menu-photo step for the Google
profile.

## File

Save as JPEG into `public/menu/`:

| Drink | Filename |
|---|---|
| Black Rest Coffee | `black-rest-coffee.jpg` |

The name has to match: `seed-coffee.ts` slugifies whatever is in the database
(`Black Rest Coffee` → `black-rest-coffee`) and looks for that exact file. If
the menu item is ever renamed, rename the photo to match — a mismatch is
skipped silently and the tile keeps its grey placeholder.

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

Drop the file in, then from the app root:

```bash
git add public/menu && git commit -m "Black Rest Coffee photo" && git push origin main
```

Then on the server:

```bash
cd /opt/niksen-secret-bar && git pull && npm run build && npm run seed:coffee
```

The script prints what it wired and what is still missing. No restart needed —
the menu API reads the database on each request.

> ⚠️ `npm run seed:coffee` and `npm run seed` still contain the old multi-item
> coffee list (Espresso / Americano / Latte / Cappuccino / Cold Brew, plus four
> more in `seed.ts`). Running either will re-insert drinks that aren't on the
> menu. Those scripts need updating before they're run again — see the note in
> the session log.
