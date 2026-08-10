#!/usr/bin/env bash
#
# Install the daily pos.db backup as a systemd timer. Idempotent — safe to
# re-run after editing backup-db.sh.
#
#   sudo bash ops/install-backup.sh
set -euo pipefail

SRC_DIR=$(cd "$(dirname "$0")" && pwd)

install -m 750 "$SRC_DIR/backup-db.sh" /usr/local/bin/niksen-backup
mkdir -p /var/backups/niksen
chmod 700 /var/backups/niksen   # customer phone numbers live in these files

cat > /etc/systemd/system/niksen-backup.service <<'UNIT'
[Unit]
Description=Snapshot niksen pos.db
After=niksen.service

[Service]
Type=oneshot
ExecStart=/usr/local/bin/niksen-backup
UNIT

cat > /etc/systemd/system/niksen-backup.timer <<'UNIT'
[Unit]
Description=Daily niksen pos.db backup

[Timer]
# 21:00 UTC = 04:00 Bangkok, three hours before opening.
OnCalendar=*-*-* 21:00:00
# If the server was down at 21:00, run once it is back rather than skipping.
Persistent=true
RandomizedDelaySec=120

[Install]
WantedBy=timers.target
UNIT

systemctl daemon-reload
systemctl enable --now niksen-backup.timer

echo "installed. next run:"
systemctl list-timers niksen-backup.timer --no-pager | sed -n 2p
