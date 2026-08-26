#!/usr/bin/env bash
#
# Copy the server's pos.db snapshots to this Mac, then prove the newest one
# actually restores.
#
#   bash ops/pull-backups.sh              # sync, then verify the newest
#   bash ops/pull-backups.sh --verify     # verify what is already local
#
# This pulls rather than letting the server push. The server never holds a
# credential for this machine, so losing the VPS — to a bad disk, a wrong
# rm, or someone else — cannot reach the copies kept here.
#
# Nothing is ever deleted locally. backup-db.sh prunes the server to 30 dailies
# and 12 monthlies; the whole point of this archive is to outlive that.
#
# Override with env vars:
#   NIKSEN_HOST=root@1.2.3.4  NIKSEN_BACKUP_DIR=~/somewhere  bash ops/pull-backups.sh
set -euo pipefail

# Default to the "niksen" alias in ~/.ssh/config, not the raw IP. The config
# block binds the deploy key to that name, and IdentitiesOnly means a raw
# root@IP target never offers it — which lands you on a password prompt.
HOST=${NIKSEN_HOST:-niksen}
REMOTE_DIR=${NIKSEN_REMOTE_DIR:-/var/backups/niksen}
DEST=${NIKSEN_BACKUP_DIR:-$HOME/niksen-backups}
STALE_AFTER_DAYS=${NIKSEN_STALE_DAYS:-2}

for tool in sqlite3 gunzip; do
  command -v "$tool" >/dev/null || { echo "missing required tool: $tool" >&2; exit 1; }
done

mkdir -p "$DEST"
chmod 700 "$DEST"   # snapshots contain customer phone numbers

if [ "${1:-}" != "--verify" ]; then
  command -v rsync >/dev/null || { echo "missing required tool: rsync" >&2; exit 1; }
  echo "pulling $HOST:$REMOTE_DIR -> $DEST"
  # No --delete: the server prunes, this archive keeps.
  # Flags kept to what rsync 2.6.9 understands — macOS ships openrsync, which
  # rejects --info= and treats -h as --help.
  rsync -az --stats "$HOST:$REMOTE_DIR/" "$DEST/"
fi

newest=$(ls -1t "$DEST"/pos-*.db.gz 2>/dev/null | head -1 || true)
if [ -z "$newest" ]; then
  echo "no snapshots in $DEST — has ops/install-backup.sh been run on the server?" >&2
  exit 1
fi

# Age of the newest snapshot, read from its filename. A timer that has quietly
# stopped looks exactly like a healthy archive until the day you need it.
stamp=$(basename "$newest" .db.gz); stamp=${stamp#pos-}
to_epoch() {
  date -j -f "%Y-%m-%d" "$1" +%s 2>/dev/null || date -d "$1" +%s 2>/dev/null
}
snap_epoch=$(to_epoch "$stamp" || true)
if [ -n "${snap_epoch:-}" ]; then
  age_days=$(( ( $(date -u +%s) - snap_epoch ) / 86400 ))
  if [ "$age_days" -gt "$STALE_AFTER_DAYS" ]; then
    echo "WARNING: newest snapshot is ${age_days} days old ($stamp)." >&2
    echo "         Check the server: systemctl list-timers niksen-backup.timer" >&2
  fi
fi

# Restore it for real. An unverified backup is a guess, not a backup.
tmp=$(mktemp /tmp/niksen-verify.XXXXXX.db)
trap 'rm -f "$tmp"' EXIT
gunzip -c "$newest" > "$tmp"

check=$(sqlite3 "$tmp" 'PRAGMA integrity_check;')
[ "$check" = "ok" ] || { echo "RESTORE FAILED — integrity_check: $check" >&2; exit 1; }

items=$(sqlite3 "$tmp" 'SELECT COUNT(*) FROM menu_items;')
orders=$(sqlite3 "$tmp" 'SELECT COUNT(*) FROM orders;')
members=$(sqlite3 "$tmp" 'SELECT COUNT(*) FROM members;')
[ "$items" -ge 1 ] || { echo "RESTORE FAILED — snapshot has no menu items" >&2; exit 1; }

total=$(ls -1 "$DEST"/*.db.gz 2>/dev/null | wc -l | tr -d ' ')
size=$(du -sh "$DEST" | cut -f1)
echo "verified $(basename "$newest"): $items menu items, $orders orders, $members members"
echo "archive: $total snapshots, $size, in $DEST"
