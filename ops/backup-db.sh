#!/usr/bin/env bash
#
# Daily snapshot of pos.db.
#
# Run by niksen-backup.timer at 21:00 UTC (04:00 Bangkok, three hours before
# the doors open). Install with ops/install-backup.sh.
#
# Uses sqlite3's own .backup rather than cp: the app writes to this file while
# the script runs, and a plain copy taken mid-write yields a corrupt database
# that only reveals itself the day you need it.
set -euo pipefail

DB=/opt/niksen-secret-bar/pos.db
DEST=/var/backups/niksen
KEEP_DAILY=30          # a month of daily restore points
KEEP_MONTHLY=12        # first-of-month kept for a year

stamp=$(date -u +%Y-%m-%d)
tmp=$(mktemp /tmp/pos-backup.XXXXXX.db)
trap 'rm -f "$tmp" "$tmp"-*' EXIT

mkdir -p "$DEST"

# Consistent snapshot, safe to take while the server is serving.
sqlite3 "$DB" ".backup '$tmp'"

# A backup that is silently corrupt is worse than none, because it stops you
# looking for a real one. Check before it is allowed to replace anything.
check=$(sqlite3 "$tmp" 'PRAGMA integrity_check;')
if [ "$check" != "ok" ]; then
  echo "integrity check FAILED: $check" >&2
  exit 1
fi

# Sanity-check the contents too — an empty but structurally valid database
# would pass integrity_check and quietly become the newest "good" backup.
items=$(sqlite3 "$tmp" 'SELECT COUNT(*) FROM menu_items;')
if [ "$items" -lt 1 ]; then
  echo "refusing to store a backup with no menu items" >&2
  exit 1
fi

gzip -9 "$tmp"
mv "$tmp.gz" "$DEST/pos-$stamp.db.gz"
chmod 600 "$DEST/pos-$stamp.db.gz"   # contains customer phone numbers

# Keep the first of each month out of the daily rotation.
day_of_month=$(date -u +%d)
if [ "$day_of_month" = "01" ]; then
  cp -p "$DEST/pos-$stamp.db.gz" "$DEST/monthly-$stamp.db.gz"
fi

# Rotate, newest first. Having nothing to prune is the normal state on the
# first runs, and `ls` exits non-zero on a glob that matches nothing — under
# `set -e` with `pipefail` that would fail the whole job after the snapshot had
# already been written successfully.
prune() {
  local pattern=$1 keep=$2 files
  files=$(ls -1t $pattern 2>/dev/null || true)
  [ -z "$files" ] && return 0
  printf '%s\n' "$files" | tail -n +$((keep + 1)) | xargs -r rm --
}
prune "$DEST/pos-*.db.gz"     "$KEEP_DAILY"
prune "$DEST/monthly-*.db.gz" "$KEEP_MONTHLY"

orders=$(sqlite3 "$DB" 'SELECT COUNT(*) FROM orders;')
size=$(du -h "$DEST/pos-$stamp.db.gz" | cut -f1)
count=$(ls -1 "$DEST"/*.db.gz 2>/dev/null | wc -l | tr -d ' ')
echo "backed up: $items menu items, $orders orders, $size — $count snapshots on disk"
