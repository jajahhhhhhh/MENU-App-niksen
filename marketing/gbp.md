# Google Business Profile

**The profile already exists and is claimed.** It is not something to create.

- Listing: https://maps.google.com/?cid=10835151823109526765 — "Niksen · Cafe · Bo Put"
- Review link: https://g.page/r/Ce2U3g8tMV6WEBI/review (the same link as the receipt QR — a `g.page/r/` short link is only issued for a verified profile)
- Manage it at business.google.com, signed in as the account that claimed it

A café and bar is eligible for a profile, unlike a rental property. (The
Chowrest villas are not: Google excludes *"rental or for-sale properties such
as vacation homes, model homes, or vacant apartments"*. Different business,
different rule — do not carry that restriction over to here.)

This page is what to check on it, because the profile was set up around the
old catalogue — the one with coffee, bowls, breakfasts and five island teas —
and none of that has been on the menu for some time.

**What is on the listing right now is not recorded here.** Maps needs
JavaScript to render and this repo has no way to read it, so every line below
is "check this", not "this is wrong". Open the dashboard and work down.

---

## 1. Hours — settle this first, it is not only a GBP question

Four published sources give four different opening times:

| Source | Opens |
|---|---|
| The site (schema.org + every landing string) | **07:30** |
| Every marketing doc before 18 Sep 2026 | 07:00 |
| `pinterest/pin-menu.png`, live on the board | 08:00–13:00 |
| `pinterest/pin-night.png`, live on the board | "records till 02:00" |

Everything in this folder now says **07:30–14:00 and 17:00–23:00**, chosen to
match the site because that is what a customer reads. **That was a tie-break,
not a fact.**

Decide the real hours, then set them in three places or none: the profile,
`index.html`'s schema.org block, and `src/landingStrings.ts`. Google reads that
schema block, so leaving it wrong contradicts the profile from your own site.

GBP takes **two periods per day** — add both, do not merge them into
07:30–23:00. The 14:00–17:00 gap is real and a customer who arrives at 15:00 to
a closed door leaves a one-star review about it.

---

## 2. Categories

Primary category decides most of what you rank for.

- **Primary: Cafe.** It is what the place is for the whole morning trade, and "คาเฟ่บ่อผุด" is the query worth owning (see `tiktok-seo.md`).
- **Secondary: Bar**, and **Restaurant**. Without Bar, the evening half of the business is invisible to "บาร์ลับสมุย" and "bar near me" — and that half is real, it just cannot be sold online.

Do not add a category for something the till cannot ring up. No coffee
category, no "Coffee shop" as primary.

---

## 3. The fields that were written around the old menu

Check each and rewrite from `content-plan.md` §1 if it mentions coffee, bowls,
breakfasts, smoothies or island teas:

| Field | What it should say now |
|---|---|
| **Description** (750 chars) | A secret café and bar in Bophut named after the Dutch idea of doing nothing. Twenty-three craft sodas at ฿89 — yuzu, ume, lychee, muscat, root beer, eight on black tea. Food ฿169: sandwiches, rice, fried chicken, a beef burrito. Open from 07:30, bar again in the evening. English, Thai and Russian. |
| **Services / menu highlights** | Craft soda, sandwiches, rice, burrito, fried chicken. Nothing else. |
| **Website** | `https://niksensamui.com` |
| **Order-ahead link** | `https://niksensamui.com/order` — GBP has a field for this and it is the highest-intent link on the profile |
| **Phone** | +66 62 962 4644 |
| **Opening date** | 18 August 2026 |
| **Attributes** | Whatever is true: seating, wifi, card payment, air conditioning, accessibility. Leave anything you are unsure of unset rather than guessing — an attribute that turns out false is the same broken promise as a menu item. |

The **menu link** field can point at `/order`, which is the live catalogue.
That is better than a static menu photo, because it cannot drift.

---

## 4. Photos

The profile's cover and interior shots are the same gap as everywhere else:
`shot-list.md` §1. We have two night interiors (`pinterest/pin-room.png`,
`pinterest/pin-night.png`) and no daylight horizontal wide of the room, which
is the shot Google shows largest.

All 32 menu items are already photographed in the POS, so the food and drink
photos can be lifted from there.

---

## 5. Posts — one a week, from the content plan

GBP posts expire, which suits the flavour-of-the-week format in
`content-plan.md` §3 exactly: one soda, one photo, ฿89, a line of tasting note.
Twenty-three weeks of posts that write themselves.

**Do not post drink prices, brands or promotions for anything alcoholic.**
Thailand's amended Alcoholic Beverage Control Act (No. 2) B.E. 2568 has been in
force since 8 Nov 2025. This applies to a GBP post exactly as it applies to
TikTok. `pinterest/README.md` has the one currently live that needs taking down.

---

## 6. Reviews

The review link is already the receipt QR, so the asking mechanism exists.
Reply to every review in the reviewer's language — Google weights the profile
on response rate, and the site runs in three languages, so the replies should
too.

## What to measure

**Direction requests**, not views. Followers in Bangkok do not walk into a room
in Bophut. business.google.com → Performance.
