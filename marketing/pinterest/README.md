# Pinterest assets — what each pin actually says

Board: https://www.pinterest.com/howtoniksen/ (The room · Mornings · Drink well)

There is no generator for these four; they are finished PNGs, and the text is
baked into the pixels. Opened and read one by one on 18 Sep 2026, because no
document recorded what was on them. Three of the four contradict the site.

| File | Baked-in text | Verdict |
|---|---|---|
| `pin-room.png` | "A CAFE, A BAR, A THEATRE — ONE ROOM IN KOH SAMUI · NIKSEN · PLEASE COME IN" | ✅ Fine. No menu or hours claim. Our best interior shot — see `../shot-list.md` §1. |
| `pin-night.png` | "RECORDS TILL 02:00, SUNSET AT NINE · FREE ENTRANCE · EVERY NIGHT" | ⚠️ **Hours are wrong.** The site says the room closes at 23:00. Either the pin is wrong or the site is. |
| `pin-menu.png` | "TEA FLIGHT · MORNING / THREE TEAS ON A STEEL TRAY / OPEN 08:00 – 13:00" | ⚠️ **Wrong twice.** There is no tea on the menu — see `../content-plan.md` §1. And 08:00–13:00 is a third set of hours, agreeing with neither the site (07:30–14:00) nor the old marketing docs (07:00–14:00). |
| `pin-offer.png` | "EVERY DAY, ALL NIGHT / 1 SPIRIT + 1 CRAFT SODA / 129฿" | 🚨 **Take this one down.** See below. |

---

## `pin-offer.png` — take it down

It is a **priced, promoted alcohol offer** on a public board: a spirit, a price
and "every day, all night". Thailand's amended Alcoholic Beverage Control Act
(No. 2) B.E. 2568 has been in force since 8 Nov 2025 and restricts alcohol
advertising; a named price attached to a standing promotion is the shape of
thing it restricts, not a borderline case.

This is also why nothing alcoholic appears in the online catalogue at all, and
why `../tiktok-seo.md` no longer tells you to film the same offer — it used to.

**Action:** unpin it from the board. Deleting the file here does not unpublish
anything, so the file stays as a record of what was posted until you confirm
it's gone. Worth running past local counsel; this note is not legal advice.

---

## Before making another pin

Check the claim against the site and the menu API first:

- Menu: `https://niksensamui.com/api/public/menu` — 23 craft sodas at ฿89, nine dishes at ฿169
- Hours: 07:30–14:00 and 17:00–23:00, per the site's schema.org block

No drink prices, brands or promotions on anything involving the bar.
