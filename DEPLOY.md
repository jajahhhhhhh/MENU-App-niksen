# Deploying niksen secret bar to ch-howtoniksen.com

This puts the whole app online — landing page, `/order` (the QR-ordering page for
customers), and `/pos` (staff) — on your own cheap VPS, with automatic HTTPS.

**Goal:** customers scan a QR → order at `https://ch-howtoniksen.com/order` →
the order appears for staff at `https://ch-howtoniksen.com/pos`.

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

Note the server's **public IP address** (e.g. `203.0.113.10`).

## Step 2 — Point your domain at the server

At whatever registrar you bought `ch-howtoniksen.com` from, add a DNS record:

| Type | Name / Host | Value        | TTL  |
|------|-------------|--------------|------|
| A    | `@`         | your server IP | 3600 |

(Optional: add another `A` record with Name `www` → same IP if you want the
`www.` version too.)

DNS can take a few minutes to a couple of hours to propagate. You can continue
while it does.

## Step 3 — Connect to the server

```bash
ssh root@YOUR_SERVER_IP
```

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

# Install everything (dev deps are needed for the build) and build the client
npm ci --include=dev
npm run build
```

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

Caddy will automatically obtain an HTTPS certificate for `ch-howtoniksen.com`
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

Open **https://ch-howtoniksen.com** — you should see the landing page, with a
green padlock. Then check:

- **https://ch-howtoniksen.com/order** — the customer ordering page (this is what the QR points to)
- **https://ch-howtoniksen.com/pos** — staff login (default PIN `1234` — **change it**, see below)

### First-run housekeeping (in `/pos` → Manage → Store Settings)

1. **Change the staff PIN** from the default `1234`.
2. (Optional) add your **PromptPay** number so the customer's confirmation shows a pay QR.
3. Set the shop name / phone if you like.

### The "scan to order" QR code

Point the QR at **`https://ch-howtoniksen.com/order`**. Any QR generator works,
or tell me once the site is live and I'll generate a print-ready QR for you.

---

## Updating the app later

When we make more changes and push them to GitHub:

```bash
cd /opt/niksen-secret-bar
git pull
npm ci --include=dev
npm run build
systemctl restart niksen
```

Your database (`pos.db`, with orders and members) is left untouched by updates.

## Troubleshooting

- **App won't start:** `journalctl -u niksen -e` — the last lines show the error.
  A missing `SESSION_SECRET` is the most common cause.
- **No HTTPS / cert error:** DNS isn't pointing here yet, or ports 80/443 are
  blocked. Recheck Steps 2 and 10, then `systemctl reload caddy`.
- **Menu is empty:** re-run `sudo -u niksen npm run seed`, or add items in `/pos`.
- **Back up your data:** the whole database is the single file
  `/opt/niksen-secret-bar/pos.db` — copy it somewhere safe periodically.
