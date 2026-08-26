#!/usr/bin/env bash
#
# Deploy the current main to the live server and verify it came back up.
#
#   bash ops/remote-deploy.sh
#
# Runs from your Mac over the "niksen" ssh alias. Needs key auth working —
# if it stops on a password prompt, the deploy key is not in the server's
# authorized_keys yet; see "Off-site copies" in DEPLOY.md.
#
# Safe to re-run. Everything it does on the server is idempotent, and it
# refuses to restart the service if the build fails, so a broken build
# leaves the running site alone.
set -euo pipefail

HOST=${NIKSEN_HOST:-niksen}
APP_DIR=${NIKSEN_APP_DIR:-/opt/niksen-secret-bar}
SITE=${NIKSEN_SITE:-https://niksensamui.com}

say() { printf '\n== %s\n' "$1"; }

say "checking ssh"
if ! ssh -o BatchMode=yes -o ConnectTimeout=8 "$HOST" 'echo ok' >/dev/null 2>&1; then
  echo "cannot authenticate to '$HOST' with a key." >&2
  echo "install this public key in the server's /root/.ssh/authorized_keys:" >&2
  echo >&2
  sed 's/^/  /' ~/.ssh/niksen_deploy.pub >&2 2>/dev/null || echo "  (no ~/.ssh/niksen_deploy.pub)" >&2
  exit 1
fi
echo "  key auth ok"

say "deploying"
# Build with the full tree, then prune to the runtime tree. `set -e` on the
# remote side means a failed build stops before the restart.
ssh "$HOST" bash -euo pipefail -s <<REMOTE
  cd "$APP_DIR"
  git pull --ff-only
  npm ci --include=dev
  npm run build
  npm ci --omit=dev
  systemctl restart niksen
REMOTE

say "service status"
ssh "$HOST" 'systemctl is-active niksen && journalctl -u niksen -n 5 --no-pager | tail -3'

say "backup timer"
ssh "$HOST" 'systemctl list-timers niksen-backup.timer --no-pager 2>/dev/null | sed -n 2p || echo "  timer not installed — run: sudo bash ops/install-backup.sh"'

say "site check"
fail=0
for p in / /order /pos /api/public/menu; do
  code=$(curl -s -o /dev/null -w '%{http_code}' --max-time 15 "$SITE$p" || echo 000)
  printf '  %-20s %s\n' "$p" "$code"
  [ "$code" = "200" ] || fail=1
done
[ "$fail" -eq 0 ] || { echo "deploy finished but the site is not healthy — check journalctl -u niksen -e" >&2; exit 1; }

say "deployed and healthy"
