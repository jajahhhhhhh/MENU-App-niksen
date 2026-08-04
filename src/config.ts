// Shared launch configuration — used by both the ordering page and the server.
// Online ordering is disabled until the opening moment (Thailand time, UTC+7),
// then enables automatically. No redeploy needed on opening day.
export const OPENING_ISO = '2026-08-18T00:00:00+07:00';

// Override the date gate: set to `true` to open ordering now (e.g. for a soft
// launch or testing) or `false` to force it closed. Leave `null` to gate purely
// by OPENING_ISO.
export const ORDERING_OVERRIDE: boolean | null = null;

export function orderingOpen(now: Date = new Date()): boolean {
  if (ORDERING_OVERRIDE !== null) return ORDERING_OVERRIDE;
  return now.getTime() >= new Date(OPENING_ISO).getTime();
}
