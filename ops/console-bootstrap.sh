#!/usr/bin/env bash
#
# Everything the server needs, in one run, from the Hetzner web console.
#
# The console is the only way in when SSH has no key installed and root
# password login is disabled (Hetzner's default for a server created with an
# SSH key). Rather than making that trip twice — once to install a key, once
# to deploy — this does the whole job:
#
#   1. installs the Mac's deploy key so ssh/rsync work from now on
#   2. deploys whatever directory the running service actually uses
#   3. installs and fires the nightly pos.db backup timer
#   4. prints the built asset name so the deploy can be verified from outside
#
# Log in as root at the console, then paste the one-liner from DEPLOY.md
# (or run this file if the repo is already checked out).
set -euo pipefail

PUBKEY='ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAIKfeYqArLZbI7RtVPD7xlFd/RERg2emIhfPCNSCrf+Os niksen-deploy'

echo "== 1/4 deploy key =="
mkdir -p /root/.ssh && chmod 700 /root/.ssh
# Idempotent: re-running must not stack duplicate lines in authorized_keys.
grep -qF "${PUBKEY%% *} ${PUBKEY#* }" /root/.ssh/authorized_keys 2>/dev/null \
  || echo "$PUBKEY" >> /root/.ssh/authorized_keys
chmod 600 /root/.ssh/authorized_keys
echo "   installed"

echo "== 2/4 deploy =="
# Ask the running process where it actually lives rather than assuming
# /opt/niksen-secret-bar — the app serves dist/ from its own cwd, and a
# mismatch here is why earlier builds never reached customers.
PID=$(systemctl show -p MainPID --value niksen)
APP=$(readlink "/proc/$PID/cwd")
echo "   app dir: $APP"
cd "$APP"
git pull
# --include=dev first: vite lives in devDependencies, so a pruned tree cannot
# build. Getting this order wrong fails silently inside an && chain.
npm ci --include=dev
npm run build
systemctl restart niksen

echo "== 3/4 backups =="
bash ops/install-backup.sh
systemctl start niksen-backup.service || true
ls -lh /var/backups/niksen/ 2>/dev/null | tail -3 || echo "   (no snapshots yet)"

echo "== 4/4 verify =="
echo -n "   built asset: "
grep -oE 'index-[A-Za-z0-9_-]+\.js' dist/index.html | head -1
echo "   niksen: $(systemctl is-active niksen)   caddy: $(systemctl is-active caddy)"
echo "DONE"
