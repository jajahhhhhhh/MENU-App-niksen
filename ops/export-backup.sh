#!/usr/bin/env bash
#
# Pull a full copy of the live data over the API, from anywhere.
#
#   NIKSEN_PIN=xxxx bash ops/export-backup.sh
#
# This is the stopgap for when you cannot reach the server over SSH. The real
# backup is ops/backup-db.sh on the box plus ops/pull-backups.sh here — that
# one snapshots pos.db itself and can be restored wholesale. This can only see
# what the API exposes, so treat it as a safety net, not a replacement.
#
# It exports every table the POS reads back: menu (including sold-out items),
# members with their points, orders with their line items, staff and shifts,
# settings, and today's report.
#
# The PIN is read from the environment and never written to disk or echoed.
# Pass it inline so it does not land in your shell history:
#
#   NIKSEN_PIN=xxxx bash ops/export-backup.sh
#
# Override with:  NIKSEN_URL=https://...  NIKSEN_BACKUP_DIR=~/somewhere
set -euo pipefail

BASE=${NIKSEN_URL:-https://niksensamui.com}
DEST=${NIKSEN_BACKUP_DIR:-$HOME/niksen-backups}

command -v curl >/dev/null || { echo "curl is required" >&2; exit 1; }
command -v python3 >/dev/null || { echo "python3 is required" >&2; exit 1; }

if [ -z "${NIKSEN_PIN:-}" ]; then
  echo "NIKSEN_PIN is not set. Run:  NIKSEN_PIN=xxxx bash ops/export-backup.sh" >&2
  exit 1
fi

jar=$(mktemp /tmp/niksen-jar.XXXXXX)
out=""; complete=0
# Leave nothing behind on failure: a half-written export directory reads as a
# backup at exactly the moment you need one.
cleanup() { rm -f "$jar"; [ "$complete" = 1 ] || { [ -n "$out" ] && rm -rf "$out"; }; }
trap cleanup EXIT

code=$(curl -s -c "$jar" -o /dev/null -w '%{http_code}' --max-time 30 \
  -X POST "$BASE/api/auth/login" \
  -H 'Content-Type: application/json' \
  --data-binary "$(python3 -c 'import json,os;print(json.dumps({"pin":os.environ["NIKSEN_PIN"]}))')")
if [ "$code" != "200" ]; then
  echo "login failed (HTTP $code) — wrong PIN, or $BASE is unreachable" >&2
  exit 1
fi

stamp=$(date -u +%Y-%m-%d-%H%M)
out="$DEST/api-export-$stamp"
mkdir -p "$out"
chmod 700 "$DEST" "$out"   # members carry phone numbers

get() {  # get <path> <file>
  local c
  c=$(curl -s -b "$jar" -o "$out/$2" -w '%{http_code}' --max-time 60 "$BASE$1")
  [ "$c" = "200" ] || { echo "  $1 -> HTTP $c (aborting; the export would be incomplete)" >&2; exit 1; }
  printf "  %-22s %s\n" "$1" "$(python3 -c "
import json,sys
d=json.load(open('$out/$2'))
print(f'{len(d)} records' if isinstance(d,list) else 'ok')")"
}

echo "exporting $BASE -> $out"
get /api/menu           menu.json
get /api/members        members.json
get /api/orders         orders.json
get /api/staff          staff.json
get /api/settings       settings.json
get /api/reports/daily  report-daily.json

# Orders list carries totals but not the lines. Without these an order cannot
# be reconstructed, so fetch each one and fail if any is missing.
python3 - "$out" "$BASE" "$jar" <<'PY'
import json, subprocess, sys, pathlib
out, base, jar = sys.argv[1], sys.argv[2], sys.argv[3]
orders = json.load(open(f"{out}/orders.json"))
detail = []
for o in orders:
    oid = o.get("id")
    r = subprocess.run(["curl","-s","-b",jar,"--max-time","30",f"{base}/api/orders/{oid}"],
                       capture_output=True, text=True)
    try:
        detail.append(json.loads(r.stdout))
    except json.JSONDecodeError:
        print(f"  order {oid} did not return JSON — export incomplete", file=sys.stderr)
        sys.exit(1)
pathlib.Path(f"{out}/orders-detail.json").write_text(json.dumps(detail, indent=1, ensure_ascii=False))
print(f"  {'/api/orders/<id>':22} {len(detail)} orders with line items")
PY

# An export that is silently empty is worse than none: it looks like a backup.
items=$(python3 -c "import json;print(len(json.load(open('$out/menu.json'))))")
[ "$items" -ge 1 ] || { echo "refusing to keep an export with no menu items" >&2; rm -rf "$out"; exit 1; }

chmod 600 "$out"/*.json
complete=1
echo "done: $items menu items, $(du -sh "$out" | cut -f1) in $out"
