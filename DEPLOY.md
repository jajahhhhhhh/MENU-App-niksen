# Deploying niksen secret bar to niksensamui.com

This puts the whole app online — landing page, `/order` (the QR-ordering page for
customers), and `/pos` (staff) — on your own cheap VPS, with automatic HTTPS.

**Goal:** customers scan a QR → order at `https://niksensamui.com/order` →
the order appears for staff at `https://niksensamui.com/pos`.

**Time:** ~20–30 minutes. **Cost:** ~$4–6/month for the server.

---

## What only *you* can do (I can't, by design)

1. **Create a VPS** and pay for it (Step 1).
2. **Point the domain** — add a DNS record at your registrar (Step 2).
3. Run the server commands below (copy‑paste).

Everything else (the code, config, and this guide) is already done.

---

## Step 1 — Create the server

Sign up at **[Hetzner Cloud](https://console.hetzner.cloud)** (~€4/mo) or
**[DigitalOcean](https://www.digitalocean.com)** (~$6/mo) and create a server:

- Image: **Ubuntu 24.04**
- Size: the smallest (1 vCPU / 2 GB RAM is plenty)
- Add your **SSH key** (or use the root password they email you)

Note the server's **public IP address**. The current live server is
`5.223.78.64` — the rest of this guide uses it.

## Step 2 — Point your domain at the server (Cloudflare)

Your domain is on **Cloudflare**. In the Cloudflare dashboard → select
**niksensamui.com** → **DNS** → **Add record**:

| Type | Name | IPv4 address   | Proxy status        |
|------|------|----------------|---------------------|
| A    | `@`  | your server IP | **DNS only** (grey) |

> **Important:** click the orange cloud so it turns **grey (DNS only)**. That lets
> Caddy fetch its own HTTPS certificate directly and keeps things simple. You *can*
> switch it back to Proxied later for Cloudflare's CDN/DDoS protection — but if you
> do, also set Cloudflare **SSL/TLS → Overview → Full (strict)**, or you'll get a
> redirect loop.

Optional: add a second `A` record, Name `www` → same IP (also DNS only).

Cloudflare DNS updates are usually near-instant.

> **Note — "Deploy a site with Workers" won't work for this app.** Cloudflare's
> one-click Workers deploy is for static/serverless sites. This app is a Node
> server with a SQLite database, so it needs the VPS below. Cloudflare here is
> just your registrar + DNS.

## Step 3 — Connect to the server

```bash
ssh root@5.223.78.64
```

`5.223.78.64` is the live niksensamui.com server. If you ever rebuild on a
new VPS, this is the one line to update — Step 1 is where you note the new
address.

## Step 4 — Install Node, Caddy, and git

Run this whole block on the server:

```bash
# Node.js 20 LTS
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt-get install -y nodejs git

# Caddy (reverse proxy + automatic HTTPS)
apt-get install -y debian-keyring debian-archive-keyring apt-transport-https curl
curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/gpg.key' | gpg --dearmor -o /usr/share/keyrings/caddy-stable-archive-keyring.gpg
curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/debian.deb.txt' | tee /etc/apt/sources.list.d/caddy-stable.list
apt-get update && apt-get install -y caddy

# A dedicated, non-login user to run the app
adduser --system --group --home /opt/niksen-secret-bar niksen
```

## Step 5 — Get the code and build it

```bash
git clone https://github.com/jajahhhhhhh/MENU-App-niksen.git /opt/niksen-secret-bar
cd /opt/niksen-secret-bar

# Build with the full tree, then reinstall without the build tooling.
npm ci --include=dev
npm run build
npm ci --omit=dev
```

The third command is not a typo. The build needs vite, tailwind and
typescript; the running app does not. Reinstalling with `--omit=dev` drops
them — 270 packages down to 182 — and leaves the compiled `dist/` alone,
since that lives outside `node_modules`.

`tsx` stays behind, because it is a runtime dependency here: the service
runs `server.ts` directly (Node 20 cannot execute TypeScript on its own),
so `deploy/niksen.service` calls `node_modules/.bin/tsx`. Keep the two
installs in that order — building after the prune fails, because the build
tooling is gone by then.

## Step 6 — Set the secret

The app refuses to start in production without a strong session secret.

```bash
cd /opt/niksen-secret-bar
cp .env.example .env
# generate a secret and write it into .env
sed -i "s/^SESSION_SECRET=.*/SESSION_SECRET=$(openssl rand -hex 32)/" .env
cat .env   # check SESSION_SECRET is now filled
```

(Leave `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` blank unless you use the
Google Business Profile feature in the POS.)

## Step 7 — Seed the starting menu

```bash
chown -R niksen:niksen /opt/niksen-secret-bar
sudo -u niksen npm run seed    # loads the 25-item starter menu into the database
```

(You can edit the menu later in the POS. Skip this if you'd rather add items by hand.)

## Step 8 — Start the app as a service

```bash
cp /opt/niksen-secret-bar/deploy/niksen.service /etc/systemd/system/niksen.service
systemctl daemon-reload
systemctl enable --now niksen
systemctl status niksen --no-pager    # should say "active (running)"
```

## Step 9 — Turn on the reverse proxy (HTTPS)

```bash
cp /opt/niksen-secret-bar/deploy/Caddyfile /etc/caddy/Caddyfile
systemctl reload caddy
```

Caddy will automatically obtain an HTTPS certificate for `niksensamui.com`
(this only works once DNS from Step 2 points at this server).

## Step 10 — Firewall

```bash
ufw allow OpenSSH
ufw allow 80
ufw allow 443
ufw --force enable
```

Port 3000 stays private (the app only listens on localhost; only Caddy reaches it).

---

## ✅ Verify

Open **https://niksensamui.com** — you should see the landing page, with a
green padlock. Then check:

- **https://niksensamui.com/order** — the customer ordering page (this is what the QR points to)
- **https://niksensamui.com/pos** — staff login (default PIN `1234` — **change it**, see below)

### First-run housekeeping (in `/pos` → Manage → Store Settings)

1. **Change the staff PIN** from the default `1234`.
2. (Optional) add your **PromptPay** number so the customer's confirmation shows a pay QR.
3. Set the shop name / phone if you like.

**Make your privacy email work:** the Privacy Policy lists `privacy@niksensamui.com`.
In Cloudflare → **Email Routing**, forward that address to your real inbox (free,
~2 min) so data-privacy requests actually reach you.

### The "scan to order" QR code

Point the QR at **`https://niksensamui.com/order`**. Any QR generator works,
or tell me once the site is live and I'll generate a print-ready QR for you.

---

## Updating the app later

When we make more changes and push them to GitHub:

```bash
cd /opt/niksen-secret-bar
git pull
npm ci --include=dev
npm run build
npm ci --omit=dev
systemctl restart niksen
```

Same three-step install as the first deploy: build with everything, then
prune to the runtime tree.

Your database (`pos.db`, with orders and members) is left untouched by updates.

## Backups

The server snapshots `pos.db` nightly at 21:00 UTC (04:00 Bangkok). Install it
once, on the server:

```bash
cd /opt/niksen-secret-bar && sudo bash ops/install-backup.sh
```

It is idempotent and prints the next scheduled run. Check it is alive with:

```bash
systemctl list-timers niksen-backup.timer --no-pager
```

Snapshots land in `/var/backups/niksen` — 30 dailies plus 12 monthlies, mode
`600` because customer phone numbers are in them.

### Off-site copies

Those snapshots live on the same disk as the database they protect, so they do
not survive losing the server. Pull them to your Mac:

```bash
bash ops/pull-backups.sh
```

It copies anything new into `~/niksen-backups`, then actually restores the
newest snapshot and checks it — an unverified backup is a guess. It deletes
nothing locally, so the archive outlives the server's 30-day rotation, and it
warns if the newest snapshot is more than two days old, which is what a
silently stopped timer looks like.

Run it against an archive you already have, without touching the server:

```bash
bash ops/pull-backups.sh --verify
```

The pull runs from the Mac on purpose. The server holds no credential for your
machine, so whatever happens to the VPS cannot reach these copies.

To run it weekly, add it to your Mac's crontab (`crontab -e`) — Mondays at 09:00:

```
0 9 * * 1 /bin/bash /Users/sujittacharoenpong/code/niksen-secret-bar/ops/pull-backups.sh >> /tmp/niksen-backup-pull.log 2>&1
```

### Restoring

```bash
gunzip -c ~/niksen-backups/pos-YYYY-MM-DD.db.gz > pos.db
```

Copy that file to `/opt/niksen-secret-bar/pos.db` on the server and
`systemctl restart niksen`.

## Troubleshooting

- **App won't start:** `journalctl -u niksen -e` — the last lines show the error.
  A missing `SESSION_SECRET` is the most common cause.
- **No HTTPS / cert error:** DNS isn't pointing here yet, or ports 80/443 are
  blocked. Recheck Steps 2 and 10, then `systemctl reload caddy`.
- **Menu is empty:** re-run `sudo -u niksen npm run seed`, or add items in `/pos`.
- **Back up your data:** see the Backups section above — nightly snapshots on
  the server, pulled off-site with `ops/pull-backups.sh`.
