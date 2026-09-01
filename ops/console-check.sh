#!/usr/bin/env bash
#
# Report what is actually on this server. Reads only — changes nothing.
#
#   curl -fsSL https://raw.githubusercontent.com/jajahhhhhhh/MENU-App-niksen/main/ops/console-check.sh | bash
#
# Written because a deploy reported success from the console while the live
# site kept serving a build from weeks earlier and the deploy key never
# arrived. Guessing from outside had run out; this prints the few facts that
# separate "never ran here" from "ran, but somewhere else".
#
# No set -e: a failing line here is itself a finding, and stopping at the
# first one would hide everything after it.

echo "--- niksen check ---"
echo "host      : $(hostname) $(hostname -I 2>/dev/null | awk '{print $1}')"

if grep -q 'niksen-deploy' /root/.ssh/authorized_keys 2>/dev/null; then
  echo "deploy key: PRESENT"
else
  echo "deploy key: MISSING"
fi

echo "sshd root : $(sshd -T 2>/dev/null | grep -i '^permitrootlogin' || echo '?')"
echo "service   : $(systemctl is-active niksen 2>/dev/null) / $(systemctl is-enabled niksen 2>/dev/null)"

PID=$(systemctl show -p MainPID --value niksen 2>/dev/null)
APP=""
if [ -n "$PID" ] && [ "$PID" != "0" ]; then
  APP=$(readlink "/proc/$PID/cwd" 2>/dev/null)
fi
echo "app dir   : ${APP:-UNKNOWN (service not running?)}"

if [ -n "$APP" ] && [ -d "$APP" ]; then
  echo "git head  : $(git -C "$APP" log --oneline -1 2>&1 | head -1)"
  echo "git branch: $(git -C "$APP" rev-parse --abbrev-ref HEAD 2>&1)"
  if [ -f "$APP/dist/index.html" ]; then
    echo "dist built: $(date -r "$APP/dist/index.html" '+%Y-%m-%d %H:%M' 2>/dev/null)"
    echo "dist asset: $(grep -oE 'index-[A-Za-z0-9_-]+\.js' "$APP/dist/index.html" | head -1)"
  else
    echo "dist      : MISSING at $APP/dist/index.html"
  fi
fi

# The app serves dist/ from its own cwd, but Caddy can be configured to serve
# files itself — in which case rebuilding the app changes nothing a visitor
# sees. Worth knowing which one is answering.
echo "caddy root: $(grep -riE '^\s*(root|file_server)' /etc/caddy/Caddyfile 2>/dev/null | tr '\n' ' ' | cut -c1-120)"
echo "caddy to  : $(grep -riE 'reverse_proxy' /etc/caddy/Caddyfile 2>/dev/null | tr '\n' ' ' | cut -c1-120)"

echo "backup    : $(systemctl is-enabled niksen-backup.timer 2>/dev/null || echo 'not installed')"
echo "snapshots : $(ls -1 /var/backups/niksen/*.gz 2>/dev/null | wc -l) file(s)"
echo "--- end ---"
