# Coffee shot list

Five drinks to photograph. These go on `/order` **and** cover the menu-photo
step that's currently blocking Google profile completeness.

## Files

Save as JPEG into `public/menu/` with these exact names — the seed script
matches on the filename, so a typo means the photo is silently skipped:

| Drink | Price | Filename |
|---|---|---|
| Espresso | ฿60 | `espresso.jpg` |
| Americano | ฿70 | `americano.jpg` |
| Latte | ฿90 | `latte.jpg` |
| Cappuccino | ฿90 | `cappuccino.jpg` |
| Cold Brew | ฿110 | `cold-brew.jpg` |

## Specs

- **1000 × 1000, square.** Matches the Signature Tea photos already on the site.
- **Centre the cup.** The tile renders at 64 × 64 with `object-cover`, so the
  crop is square and tight — anything near the edges is lost.
- **250–400 KB** each. Bigger is wasted on a 64px tile and slows the menu on
  hotel wifi.

## Shooting

- Daylight, no flash. Late morning near a window is enough.
- Shoot on the palette: warm ivory or natural wood surface, not white paper.
- Overhead or 3/4 — pick one and use it for all five so the menu reads as a set.
- Cappuccino and latte photograph best straight after the pour, before the foam
  settles.

## Wiring them in

Drop the files in, then from the app root:

```bash
git add public/menu && git commit -m "Coffee photos" && git push origin main
```

Then on the server:

```bash
cd /opt/niksen-secret-bar && git pull && npm run build && npm run seed:coffee
```

The script prints which photos it wired and which are still missing. No restart
needed — the menu API reads the database on each request.
