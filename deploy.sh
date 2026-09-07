#!/usr/bin/env bash
# Deploy main to the Hetzner box. Run from a clean checkout on the laptop:
#
#     ./deploy.sh
#
# Written down because it was retyped from memory each time, and the time it
# was retyped with `npm ci --omit=dev` the build failed — vite is a dev
# dependency — leaving the new server running against the previous bundle.
# Everything below either finishes or stops; nothing is left half-applied.
set -euo pipefail

HOST=${NIKSEN_HOST:-niksen}
APP=/opt/niksen-secret-bar
SITE=${NIKSEN_SITE:-https://niksensamui.com}

echo "==> local checks"
git diff --quiet || { echo "working tree is dirty — commit or stash first"; exit 1; }
[ "$(git rev-parse --abbrev-ref HEAD)" = main ] || { echo "not on main"; exit 1; }
git push origin main
npx tsc --noEmit
npm run build >/dev/null
echo "    typecheck and build clean"

echo "==> deploying to $HOST"
ssh "$HOST" bash -s <<REMOTE
set -euo pipefail
cd $APP
git fetch origin -q
# --ff-only: never resolve a merge on the server. If this fails, someone
# edited files in place, and that has to be looked at rather than merged past.
git merge --ff-only origin/main -q
npm ci --silent            # with dev deps: vite builds the client
npm run build >/dev/null
systemctl restart niksen
REMOTE

echo "==> waiting for the site"
for i in $(seq 1 20); do
  code=$(curl -s -o /dev/null -m 10 -w '%{http_code}' "$SITE/order" || true)
  [ "$code" = 200 ] && break
  sleep 2
done

echo "==> verifying"
fail=0
check() { # name  actual  expected
  if [ "$2" = "$3" ]; then echo "    ok   $1 ($2)"; else echo "    FAIL $1: got $2 want $3"; fail=1; fi
}
check "GET /order"           "$(curl -s -o /dev/null -m 10 -w '%{http_code}' "$SITE/order")" 200
check "GET /pos"             "$(curl -s -o /dev/null -m 10 -w '%{http_code}' "$SITE/pos")" 200
check "GET /api/public/menu" "$(curl -s -o /dev/null -m 10 -w '%{http_code}' "$SITE/api/public/menu")" 200
check "staff routes locked"  "$(curl -s -o /dev/null -m 10 -w '%{http_code}' "$SITE/api/orders")" 401

# The bundle the browser is actually given must be the one just built. A build
# that failed leaves the previous one in place and the site still looks fine.
served=$(curl -s -m 10 "$SITE/order" | grep -o 'assets/index-[A-Za-z0-9_-]*\.js' | head -1)
if [ -f "dist/$served" ]; then echo "    ok   serving $served"; else echo "    FAIL serving $served, which is not in this build"; fail=1; fi

[ $fail -eq 0 ] || { echo "==> DEPLOY VERIFICATION FAILED"; exit 1; }
echo "==> done"
