// Shared launch configuration — used by both the ordering page and the server.
// Online ordering is disabled until the opening moment (Thailand time, UTC+7),
// then enables automatically. No redeploy needed on opening day.
export const OPENING_ISO = '2026-08-18T00:00:00+07:00';

// Override the date gate: set to `true` to open ordering now (e.g. for a soft
// launch or testing) or `false` to force it closed. Leave `null` to gate purely
// by OPENING_ISO.
//
// Held at `false` for now. OPENING_ISO has already passed, so without this the
// site would take real orders — deducting stock and enrolling members — for a
// shop that has not opened and cannot cook them. On opening day set this back
// to `null` (or `true`), rebuild and deploy; nothing else has to change.
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
