# Self-hosting infrastructure for daemon-architecture apps

Personal reference for **digitalgriot** on what kind of hosting you need to run your own paseo relay and future apps that follow the same architecture (mobile/web client ↔ websocket relay ↔ home/server daemon).

Like `INSTALL-DEVICE.md`, this is a personal doc — not for upstream.

---

## What is a daemon-architecture app

A daemon-architecture app has three moving pieces:

1. **A daemon** — a long-running process on your machine (or a server) doing the actual work. In paseo's case, it manages Claude Code / Codex / OpenCode agents.
2. **A client** — typically a mobile app and/or web app that's the UI.
3. **A relay** — a publicly-reachable middleman that bridges the daemon and client over the internet, because neither end can usually accept inbound connections directly (NAT, firewalls, cellular CGNAT).

The relay is the only piece you have to host publicly. The daemon stays on your own hardware (your dev box, a home server, a VPS — wherever the work happens). The client is just the app on your phone or laptop.

---

## Resource profile (why this is cheap)

Here's the unintuitive part: a relay for a **solo developer running a few personal apps** uses almost no resources, because:

- It only forwards encrypted bytes — no parsing, no decryption, no business logic
- WebSocket I/O is cheap; a single Node process can hold tens of thousands of idle connections
- Solo use means there are usually 1–10 active connections at a time, not 10,000
- Voice/audio is the only meaningful bandwidth, and it's still small (~50–200 KB/sec compressed)

Realistic per-user numbers (you, across all your apps):

| Resource | Typical usage |
|---|---|
| CPU | <1% of a single core |
| RAM | 50–150 MB (Node baseline + buffers) |
| Bandwidth | 1–10 GB/month (chat) up to 50 GB/month if heavy voice |
| Disk | 1–5 GB (mostly Node + logs) |
| Open connections | 2–20 |

This means **the smallest VPS any provider sells is overkill**. Your bottleneck is going to be the *number of apps you run on the same box*, not the relay itself.

---

## Hosting options compared

### Cloudflare Workers (matches existing paseo code)

The paseo relay codebase ([packages/relay/src/cloudflare-adapter.ts](packages/relay/src/cloudflare-adapter.ts)) ships a Cloudflare Workers Durable Objects adapter — meaning if you deploy on Cloudflare, **almost zero porting work**. This is what `relay.paseo.sh` runs on.

| | Cloudflare Workers |
|---|---|
| Setup time | 30–60 min once |
| Code changes | None — the adapter is in the repo |
| Cost (solo use) | $5/mo (Workers Paid required for Durable Objects) |
| Cost (idle) | ~$5/mo flat |
| Cold starts | Negligible (~5–20ms) |
| WebSocket support | Yes, native |
| Global edge | Yes — anycasted |
| You manage | Wrangler config, DNS |
| You don't manage | OS, TLS, scaling, uptime |

**When this wins:** you want it deployed yesterday, you don't want to babysit servers, and $5/mo for set-and-forget is fine.

**Caveat:** Durable Objects pricing scales with requests + duration. Solo use stays under the included quota; if you ever go viral with an app, this could spike. Cloudflare's pricing calculator is honest — go there before deploying.

### VPS (DigitalOcean / Hetzner / Vultr / Linode)

Run a Node.js server you control. **No relay code exists yet for this path** — you'd need to port `cloudflare-adapter.ts` to a standalone `ws` (npm package) server. That's roughly half a day of work because the Durable Object pattern (one object per session, transactional storage) translates reasonably to in-memory `Map<sessionId, Session>` for a non-distributed server.

Prices for the smallest tier worth bothering with (as of 2026):

| Provider | Spec | Price/mo | Bandwidth | Notes |
|---|---|---|---|---|
| **Hetzner CX22** | 2 vCPU shared, 4 GB RAM, 40 GB SSD | €4.51 | 20 TB | Best value globally. EU + US locations. |
| **Hetzner CCX13** | 2 vCPU dedicated, 8 GB RAM, 80 GB SSD | €13.10 | 20 TB | Dedicated CPU, no noisy neighbors. |
| **DigitalOcean Basic** | 1 vCPU, 1 GB RAM, 25 GB SSD | $6 | 1 TB | Friendly UI, lots of tutorials. |
| **DigitalOcean Premium AMD** | 1 vCPU, 2 GB RAM, 50 GB SSD | $14 | 2 TB | Faster CPU, NVMe disk. |
| **Vultr Regular** | 1 vCPU, 1 GB RAM, 25 GB SSD | $6 | 1 TB | Similar to DO. |
| **Linode Nanode** | 1 vCPU, 1 GB RAM, 25 GB SSD | $5 | 1 TB | Acquired by Akamai; reliable. |
| **OVH Eco VPS** | 2 vCPU, 2 GB RAM, 40 GB SSD | $4.20 | unmetered | Cheapest, but support is hit-or-miss. |

**Recommended for you:** Hetzner CX22 (€4.51/mo). Roughly 30× more headroom than you need, runs 5–10 apps comfortably, and you'll never pay overage fees on bandwidth.

**When this wins:** you want one box that hosts the relay *plus* future apps' websites *plus* a Postgres *plus* whatever else. Predictable monthly cost. Full control.

### Fly.io / Railway / Render

Middle ground — managed enough that you don't touch the OS, but flexible enough to run any Docker image.

| | Fly.io | Railway | Render |
|---|---|---|---|
| Pricing model | Pay-per-resource | Pay-per-resource (with $5/mo min) | Free tier with cold starts; $7/mo paid |
| WebSocket support | Excellent (anycast) | Good | Good (paid only) |
| Setup effort | Low (Dockerfile + `fly launch`) | Lowest (connect GitHub) | Low |
| Solo cost | ~$3–8/mo | ~$5–10/mo | $7+/mo |
| You manage | Dockerfile | nothing | Build config |
| Best for | Geo-distributed apps | Single regions, getting started | Static sites + API |

**When this wins:** you want a Docker-based deploy with zero OS management, and you're willing to trade a bit of cost predictability for easier ops.

### Self-hosted (homelab / your home PC with port-forwarding)

Free in dollars, expensive in effort.

| | Homelab |
|---|---|
| Cost | $0 (electricity) |
| Setup | Port forwarding, dynamic DNS, TLS via Let's Encrypt or Caddy |
| Reliability | Tied to your home internet uptime + power |
| ISP TOS | Many residential ISPs technically prohibit "running servers" |
| Mobile reachability | Works as long as your home IP is reachable from anywhere |

**When this wins:** you already have a homelab running 24/7 and one more service is no incremental cost. Otherwise the time investment outweighs the $5/mo savings.

**The trick to making homelab not-suck:** put a Cloudflare Tunnel in front. Your home machine makes an outbound connection to Cloudflare; Cloudflare is the public face. No port forwarding, no exposed home IP, no ISP TOS issue. Free tier handles a lot.

---

## My recommendation for you

Given:
- You're a solo dev building multiple Expo apps
- You have a Windows dev box at home running daemons (paseo, future apps)
- You don't currently have a homelab dedicated to 24/7 services
- You want predictable costs and one place to put everything

**Get a Hetzner CX22 (€4.51/mo, ~$5/mo) in their US-East datacenter (Ashburn, VA).**

Run on it:
- Your paseo relay (when ported)
- Future apps' relays (one process per app)
- Caddy as a single TLS terminator + reverse proxy in front of all of them
- A Postgres or SQLite instance for any app that needs persistence
- Optional: Uptime Kuma to monitor it all (it can monitor itself)

One €4.51/mo box runs all of this comfortably. You're not paying for resources you'll never use, and you have one IP / one DNS pattern / one set of TLS certs to manage.

If you decide later you want geo-distribution (e.g. relay in Europe and US for lower phone latency), Fly.io is the easy upgrade path because it's already Docker.

---

## What you actually run on the box

A minimal stack for daemon-arch apps:

```
┌─────────────────────────────────────────────────┐
│  Caddy (port 443, automatic Let's Encrypt TLS)  │
│  - relay.yourdomain.com  → :8081                │
│  - app.yourdomain.com    → :3000                │
│  - api.yourdomain.com    → :8080                │
└─────────────────────────────────────────────────┘
            │            │            │
            ▼            ▼            ▼
     ┌────────────┐  ┌────────┐  ┌────────┐
     │paseo relay │  │next.js │  │ api    │
     │  :8081     │  │  :3000 │  │ :8080  │
     │ (systemd)  │  │(systemd)│  │(systemd)│
     └────────────┘  └────────┘  └────────┘
            │
            └──→ outbound to phones (via Caddy/wss)
            └──→ outbound to your home daemon (via wss)
```

### Software list

| Component | Purpose | Why this one |
|---|---|---|
| **Caddy** | TLS termination, reverse proxy | Automatic Let's Encrypt, dead-simple Caddyfile syntax, single binary |
| **systemd** | Process supervision | Built into every Linux distro, no extra tools needed |
| **nvm** | Node version management | Lets you run different Node versions per app cleanly |
| **ufw** | Firewall | Beginner-friendly wrapper around iptables; just `ufw allow 22,80,443` |
| **fail2ban** | SSH brute-force protection | Free, set-and-forget |
| **unattended-upgrades** | Automatic security patches | Ubuntu's built-in; never touch the box for kernel CVEs |

Optional but useful:

| Component | Purpose |
|---|---|
| **Docker + Docker Compose** | If you prefer container isolation per app |
| **Tailscale** | Mesh VPN; lets you SSH the box without exposing port 22 to the internet |
| **Uptime Kuma** | Self-hosted uptime monitor with notifications |
| **PostgreSQL or SQLite** | App persistence if needed |
| **Restic + B2/S3** | Encrypted offsite backups, ~$1/month for tens of GB |

### A working Caddyfile sample

```caddyfile
# /etc/caddy/Caddyfile

relay.yourdomain.com {
    reverse_proxy localhost:8081
}

paseo.yourdomain.com {
    reverse_proxy localhost:3000
}

api.yourdomain.com {
    reverse_proxy localhost:8080
}
```

That's literally it. Caddy automatically gets TLS certs from Let's Encrypt, handles renewals, and proxies websockets correctly out of the box. **No config beyond that for 90% of cases.**

---

## Network requirements (what you need beyond the box)

### Domain

Buy a cheap domain. The provider matters less than the registrar's pricing model — avoid registrars that auction expiring domains or charge for WHOIS privacy.

| Registrar | At-cost? | Notes |
|---|---|---|
| **Cloudflare Registrar** | Yes (no markup) | Best choice. ~$10/year for `.com`. Requires using Cloudflare DNS. |
| **Porkbun** | Near at-cost | Friendly UI, free WHOIS privacy. ~$9/year `.com`. |
| **Namecheap** | Markup but reasonable | Lots of options. Watch for renewal price hikes. |
| **GoDaddy** | Avoid | Markup + aggressive upsells. |

For a solo dev, Cloudflare Registrar is the move. ~$10/year, includes free DNS, free CDN, free DDoS protection.

### DNS

Use Cloudflare DNS (free) regardless of registrar. Set:

- `A relay.yourdomain.com → <vps-ip>`
- `AAAA relay.yourdomain.com → <vps-ipv6>` (if VPS has one)
- Repeat for each subdomain

Optionally enable Cloudflare's proxy (orange cloud) for extra DDoS protection on plain HTTPS. Note: **don't enable proxy on websocket subdomains unless you upgrade to Cloudflare's WebSocket-supporting tier** (they're supported on free tier, but worth verifying for your case).

### TLS certificates

Free via Caddy + Let's Encrypt. Caddy handles this entirely automatically — no manual renewals, no certbot configuration, no cron jobs. The first time Caddy starts with a public domain, it requests certs and you're done.

### Firewall (on the VPS)

```bash
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow 22/tcp     # SSH
sudo ufw allow 80/tcp     # HTTP (for Let's Encrypt challenge + redirects)
sudo ufw allow 443/tcp    # HTTPS / wss
sudo ufw enable
```

Optionally close port 22 to the public and use Tailscale instead — then SSH is only reachable from your other Tailscale-connected machines. Strictly more secure but adds one moving part.

---

## Specific: deploying paseo's relay

Two paths.

### Path A — Cloudflare Workers (low effort, $5/mo)

The codebase already has the adapter. You'd:

1. Sign up for Cloudflare Workers Paid ($5/mo).
2. Install Wrangler: `npm install -g wrangler`.
3. Write a `wrangler.toml` for the relay package pointing at `packages/relay/src/cloudflare-adapter.ts`.
4. Configure a Durable Object binding for `RelayDurableObject`.
5. `wrangler deploy`.
6. Get a `*.workers.dev` URL or bind your own domain.
7. In your daemon's config (`$PASEO_HOME/config.json`), set:
   ```json
   {
     "daemon": {
       "relay": {
         "enabled": true,
         "endpoint": "your-relay.workers.dev:443"
       }
     },
     "app": {
       "baseUrl": "https://app.paseo.sh"
     }
   }
   ```
8. Run `npm run cli -- daemon pair` and the offer URL now points at *your* relay.

**Half-day of work, no servers to manage, $5/mo flat.**

### Path B — Node port (more effort, $5/mo on Hetzner)

The Cloudflare adapter uses Durable Objects (one stateful object per session). To port it to Node:

1. Read [`packages/relay/src/cloudflare-adapter.ts`](packages/relay/src/cloudflare-adapter.ts) — understand the per-session state machine.
2. Write a `packages/relay/src/node-server.ts` that:
   - Spins up a `ws.Server` (the `ws` npm package; already a dep)
   - Maintains a `Map<serverId, RelaySession>` in memory
   - Translates Durable Object lifecycle methods (`fetch`, `webSocketMessage`, `webSocketClose`) into ws server event handlers
3. Add a `bin` script in `packages/relay/package.json` to run it.
4. On the VPS:
   - Install Node 22 (via nvm or distro package)
   - Clone/build the relay
   - Create `/etc/systemd/system/paseo-relay.service` to run it
   - Add a Caddy block for `relay.yourdomain.com` → `localhost:8081`
5. Configure daemon's `relay.endpoint` to `relay.yourdomain.com:443`.

**Maybe half a day of porting + 1 hour of VPS setup, then $5/mo.**

The advantage of Path B: the same VPS hosts every other future app you build, so the marginal cost of each new app is zero.

---

## Cost summary

What you'd actually pay running the paseo relay + a couple future apps:

| Path | Setup time | Monthly | Annually | What you get |
|---|---|---|---|---|
| **Cloudflare Workers (relay only)** | ~1 hour | $5 | $60 | Just the relay, global edge, zero ops |
| **Hetzner CX22 + Caddy (relay + N apps)** | ~4–6 hours porting + 1 hour setup | €4.51 (~$5) | ~$60 | Relay + unlimited future apps on same box |
| **Both** (cf for relay, vps for apps) | ~5–7 hours | $10 | $120 | Edge relay + flexible app server |
| **Domain on Cloudflare Registrar** | 5 min | — | $10 | yourdomain.com |
| **Backups via Backblaze B2** | 30 min | $1–3 | $12–36 | Encrypted offsite |

**Total realistic budget: ~$60–130/year** for personal infrastructure that hosts the relay, multiple apps, and is fully under your control.

For comparison: that's less than a single SaaS subscription you probably already pay for.

---

## Migration path

Don't over-engineer day one. Reasonable progression:

1. **Right now:** use `relay.paseo.sh` (what the daemon does by default). Build features, get apps shipping.
2. **When you ship app #2:** if you want unified branding, deploy via Path A (Cloudflare Workers). Half a day.
3. **When you build a non-paseo app that needs a backend:** at this point you want a VPS. Get the Hetzner box. Move the relay over too if you're already there.
4. **When you have ≥3 apps with users:** consider geo-distribution (Fly.io's anycast) for the relay. The Node port becomes deployable to multiple regions.

Each step is reversible. The infrastructure is cheap enough that you can experiment without committing.

---

## Security notes (don't skip these)

- **Updates.** Enable `unattended-upgrades` on Ubuntu. Set it to auto-reboot on kernel updates (e.g. weekly at 4am). One sentence saves you from CVE drama.
- **SSH.** Disable password auth (`PasswordAuthentication no` in `/etc/ssh/sshd_config`). SSH keys only.
- **Firewall.** ufw deny-by-default as shown above. Don't open ports unless something's actually listening on them.
- **Backups.** If your relay holds anything stateful (it shouldn't, but apps you build on the same box might), back up daily to off-host storage. Restic + Backblaze B2 is ~$1–3/month for personal-scale data.
- **Don't run as root.** Each app gets its own systemd service running as a non-privileged user (`paseo`, `appname`, etc.).
- **Monitor.** Uptime Kuma takes 5 minutes to set up, sends Discord/Telegram pings if anything goes down. Future-you will appreciate this at 2am when you're trying to use your app and it's broken.
