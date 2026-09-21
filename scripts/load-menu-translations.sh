#!/usr/bin/env bash
# Write the Thai and Russian menu names into the live POS database.
#
#     ./scripts/load-menu-translations.sh
#
# Only menu_items.name_th / name_ru (and one description) change; nothing is
# deleted and no other table is touched. The database is backed up first, and
# the counts are read back afterwards. No deploy: the menu API reads the
# database per request, so the site shows it immediately.
set -euo pipefail

HOST=${NIKSEN_HOST:-niksen}
APP=/opt/niksen-secret-bar
SQL="$(cd "$(dirname "$0")" && pwd)/menu-translations.sql"

echo "==> sending $(basename "$SQL") ($(grep -c '^UPDATE' "$SQL") updates)"
scp -q "$SQL" "$HOST:/tmp/menu-translations.sql"

ssh "$HOST" bash -s <<REMOTE
set -euo pipefail
cd $APP
sqlite3 pos.db ".backup /root/pos-before-translations.db"
chmod 600 /root/pos-before-translations.db
echo "    backed up to /root/pos-before-translations.db"
sqlite3 pos.db < /tmp/menu-translations.sql
rm -f /tmp/menu-translations.sql
echo "==> verifying"
sqlite3 pos.db "PRAGMA integrity_check"
sqlite3 -header -column pos.db "
  SELECT COUNT(*) items,
         SUM(name_th IS NOT NULL AND name_th <> '') with_thai,
         SUM(name_ru IS NOT NULL AND name_ru <> '') with_russian
  FROM menu_items"
REMOTE
echo "==> done"
