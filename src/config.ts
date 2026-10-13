// Shared launch configuration — used by both the ordering page and the server.
// Online ordering is disabled until the opening moment (Thailand time, UTC+7),
// then enables automatically. No redeploy needed on opening day.
export const OPENING_ISO = '2026-12-01T00:00:00+07:00';

// Override the date gate: set to `true` to open ordering now (e.g. for a soft
// launch or testing) or `false` to force it closed. Leave `null` to gate purely
// by OPENING_ISO.
//
// Still held at `false`, but no longer for the reason it was. It was set when
// OPENING_ISO had already gone by, which made the date gate useless: without
// the override the site would have taken real orders — deducting stock and
// enrolling members — for a shop that had not opened. OPENING_ISO is now
// 1 December 2026, ahead of us, so the date gate holds the door on its own and
// this override is belt as well as braces.
//
// **It is also the thing that will stop ordering opening on 1 December.** While
// this reads `false` it beats the date, and the shop opens to a dead button.
// Set it to `null` to let the date do its job — then ordering switches itself
// on at midnight Bangkok time on the 1st with no deploy, which is what the
// header above promises. That was left for a person to decide, because the
// alternative is a till that starts taking money, stock and members at
// midnight with nobody in the room.
export const ORDERING_OVERRIDE: boolean | null = false;

/** The opening date as customers should read it, or null once it has passed.
 *  Every surface that advertises the opening — the landing hero, the ordering
 *  banner — asks here rather than spelling the date out, because the date was
 *  written into eight strings across three languages and went stale in all of
 *  them at once: on 7 September the site was still promising to open on
 *  18 August. Nothing quotes a date that has gone by; set OPENING_ISO to the
 *  real day and every surface says it again. */
export function openingDateLabel(locale: string, now: Date = new Date()): string | null {
  const d = new Date(OPENING_ISO);
  if (d.getTime() <= now.getTime()) return null;
  return new Intl.DateTimeFormat(locale, {
    day: 'numeric', month: 'long', year: 'numeric', timeZone: 'Asia/Bangkok',
  }).format(d);
}

export function orderingOpen(now: Date = new Date()): boolean {
  if (ORDERING_OVERRIDE !== null) return ORDERING_OVERRIDE;
  return now.getTime() >= new Date(OPENING_ISO).getTime();
}

// ------------------------------------------------------------- delivery ---
// Off. Delivery needs four things the shop does not have yet: online payment
// taken before the rider leaves, an order the customer can follow, a real map
// and address, and someone to carry it. Taking a delivery order without them
// means a stranger's food sitting on the counter with an address nobody can
// find. Pickup works today and is all the page offers.
//
// Turning it back on: set this to true, rebuild, deploy. The address field,
// the delivery button and the wording all come back with it — but do the four
// things first.
export const DELIVERY_ENABLED = false;

// ---------------------------------------------------------------- money ---
// The shop quotes whole baht. The till and the ordering page have to agree to
// the satang: a customer holding a PromptPay slip next to a printed receipt
// must not see two numbers. So the rounding happens once, here, on the total —
// not per line, and not separately in each screen's formatter, which is how
// the two sides drifted to ฿95.23 and ฿95 in the first place.
export const TAX_RATE = 1.07;

export function totalWithTax(subtotal: number): number {
  return Math.round(subtotal * TAX_RATE);
}

// One loyalty point per this many baht spent, floored. Written here once
// because it was written in three places — the online order, the till's
// charge, and the till's on-screen preview — and a shop that changes the
// rate would have had to find all three, plus the sentence on the ordering
// page that quotes it to the customer.
export const BAHT_PER_POINT = 50;

export function pointsFor(total: number): number {
  return Math.floor(total / BAHT_PER_POINT);
}

// ------------------------------------------------------------ open hours ---
// Breakfast, then the bar. Written once so the ordering page and the server
// cannot disagree about whether the kitchen is on.
export const OPENING_HOURS = [
  { open: '07:30', close: '14:00' },
  { open: '17:00', close: '23:00' },
] as const;

/** Thailand is UTC+7 all year with no daylight saving, so the shop's clock is
 *  derived from UTC rather than from the device's. A tourist whose phone is
 *  still on London time must see the same answer as the till in the kitchen. */
export function withinOpeningHours(now: Date = new Date()): boolean {
  const minutes = (now.getUTCHours() * 60 + now.getUTCMinutes() + 7 * 60) % 1440;
  return OPENING_HOURS.some(({ open, close }) => {
    const [oh, om] = open.split(':').map(Number);
    const [ch, cm] = close.split(':').map(Number);
    return minutes >= oh * 60 + om && minutes < ch * 60 + cm;
  });
}
