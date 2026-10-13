#!/usr/bin/env python3
"""Open the launch gate and the opening hours, in a CI checkout only.

system-test.py cannot reach the online-order section while ORDERING_OVERRIDE
holds ordering shut and the clock sits outside OPENING_HOURS -- a CI runner is
on UTC, so "07:30-14:00 Bangkok" is a coin toss on whether the test even runs.
Its docstring says to open both and put them back; this is that step, done to
a throwaway checkout instead of to someone's working tree.

Patching the source is uglier than an env var, and deliberately so. An env var
that opens ordering would exist in production too, one typo away from a closed
shop taking real orders -- which is the exact thing ORDERING_OVERRIDE was added
to prevent. A sed in a CI job cannot reach production.

The cost of that choice is fragility: rename the constants and this stops
matching. So it asserts. If an expected line is not found, or the rewrite does
not land, it exits non-zero and the job fails loudly rather than running the
test against a still-closed shop and reporting a pass.

    python3 test/ci-open-gates.py            # patch, or fail
    python3 test/ci-open-gates.py --check     # report only, change nothing
"""
import io, re, sys

PATH = 'src/config.ts'
EDITS = [
    ("the launch gate",
     'export const ORDERING_OVERRIDE: boolean | null = false;',
     'export const ORDERING_OVERRIDE: boolean | null = true;'),
    ("the morning hours",
     "  { open: '07:30', close: '14:00' },",
     "  { open: '00:00', close: '23:59' },"),
    ("the evening hours",
     "  { open: '17:00', close: '23:00' },",
     "  { open: '00:00', close: '23:59' },"),
]

def main():
    check = '--check' in sys.argv
    src = io.open(PATH, encoding='utf-8').read()
    missing = [label for label, old, _ in EDITS if old not in src]
    if missing:
        print(f"FAIL: {PATH} no longer contains: " + ', '.join(missing), file=sys.stderr)
        print("      The constants moved or were renamed. Update EDITS in this "
              "file to match, or the end-to-end test runs against a shut shop.",
              file=sys.stderr)
        return 1
    if check:
        print(f"ok: all {len(EDITS)} gate lines found in {PATH}")
        return 0
    for label, old, new in EDITS:
        src = src.replace(old, new, 1)
        print(f"  opened {label}")
    io.open(PATH, 'w', encoding='utf-8').write(src)

    # Read it back. A successful write is not proof the gate is open.
    after = io.open(PATH, encoding='utf-8').read()
    if 'ORDERING_OVERRIDE: boolean | null = true;' not in after:
        print("FAIL: the launch gate did not end up open", file=sys.stderr); return 1
    if re.search(r"open: '(?!00:00)", after):
        print("FAIL: an opening-hours window is still restricted", file=sys.stderr); return 1
    print("gates open: ordering forced on, hours 00:00-23:59")
    return 0

if __name__ == '__main__':
    sys.exit(main())
