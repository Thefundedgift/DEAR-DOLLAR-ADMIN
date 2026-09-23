# DEAR DOLLAR — Admin Panel

Production-ready Admin Panel for the existing **DEAR DOLLAR.com** point market.
Powered by **INTERNET ZONE**.

- Frontend only: **Next.js + TypeScript + Tailwind CSS + shadcn/ui**
- Connects to the **existing NestJS POINT MARKET API** — no second backend, no second database, no mock data
- JWT auth with **refresh-token rotation**, RBAC (SUPER_ADMIN / ADMIN) and per-permission UI gating
- Fully **self-hostable** with Docker on any Linux VPS (Hostinger KVM VPS ready)
- **No dependency** on Vercel, Netlify, Firebase, Supabase, Railway or Render

## Architecture

```
Customer:  https://yourdomain.com          (existing customer app)
Admin:     https://admin.yourdomain.com    (THIS admin panel)
API:       https://api.yourdomain.com      (existing NestJS backend)

GitHub → Hostinger KVM VPS → Docker Compose → Admin Panel → Nginx → SSL
```

The backend API contract this panel expects is documented in [`API_CONTRACT.md`](./API_CONTRACT.md).

## Modules

Dashboard stats · Customer management (profile, money/point wallets, transactions,
bank details, withdrawal approvals) · Buy $dollar listings · Demand listings ·
Buy approvals · Sell approvals · UPI payment verification · Payment settings
(Super Admin, versioned history) · Admin management (roles + 11 granular
permissions) · Audit logs · Reports with CSV export · Social/community links
(Telegram / Discord, Super Admin).

Security: protected routes, RBAC + permission checks (hidden unauthorized UI),
confirmation dialogs before every financial action, no client-side financial
authority — the backend is always the final authority — and full audit logging
on the backend.

## Environment

```bash
cp .env.example .env
```

| Variable | Description |
|---|---|
| `NEXT_PUBLIC_API_URL` | Base URL of the existing NestJS backend, e.g. `https://api.yourdomain.com`. Never hardcoded. |
| `ADMIN_PORT` | Localhost port docker-compose binds to (default `3100`), proxied by Nginx. |

> `NEXT_PUBLIC_*` values are baked into the client bundle at **build** time.
> If you change `NEXT_PUBLIC_API_URL`, rebuild the image.

## Local development

```bash
yarn install
yarn dev        # http://localhost:3000
```

---

# HOSTINGER KVM VPS DEPLOYMENT

## 1. SSH into the VPS

```bash
ssh root@YOUR_VPS_IP
```

## 2. Install Docker + Compose (Ubuntu)

```bash
apt update && apt upgrade -y
curl -fsSL https://get.docker.com | sh
docker --version && docker compose version
```

## 3. Clone from GitHub

```bash
mkdir -p /opt/deardollar && cd /opt/deardollar
git clone https://github.com/YOUR_USERNAME/dear-dollar-admin-panel.git admin-panel
cd admin-panel
```

## 4. Create .env

```bash
cp .env.example .env
nano .env
# NEXT_PUBLIC_API_URL=https://api.yourdomain.com
# ADMIN_PORT=3100
```

## 5. Build

```bash
docker compose build
```

## 6. Start

```bash
docker compose up -d
docker compose ps
curl http://127.0.0.1:3100/api/health   # → {"status":"ok",...}
```

## 7. Nginx reverse proxy (admin.yourdomain.com)

```bash
apt install -y nginx
nano /etc/nginx/sites-available/admin.yourdomain.com
```

```nginx
server {
    listen 80;
    server_name admin.yourdomain.com;

    location / {
        proxy_pass http://127.0.0.1:3100;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }
}
```

```bash
ln -s /etc/nginx/sites-available/admin.yourdomain.com /etc/nginx/sites-enabled/
nginx -t && systemctl reload nginx
```

DNS: create an **A record** for `admin` pointing to your VPS IP.

## 8. SSL (Let's Encrypt)

```bash
apt install -y certbot python3-certbot-nginx
certbot --nginx -d admin.yourdomain.com
certbot renew --dry-run   # auto-renewal check
```

## 9. Logs

```bash
docker compose logs -f              # follow
docker compose logs --tail=200     # last 200 lines
```

## 10. Restart

```bash
docker compose restart
# or full recreate:
docker compose down && docker compose up -d
```

## 11. Update from GitHub

```bash
cd /opt/deardollar/admin-panel
git pull origin main
docker compose build
docker compose up -d
```

## Troubleshooting

| Symptom | Fix |
|---|---|
| Login says "Cannot reach the backend API" | Check `NEXT_PUBLIC_API_URL` in `.env`, rebuild (`docker compose build && up -d`), ensure the NestJS API is up and CORS allows `https://admin.yourdomain.com`. |
| Port already in use | Change `ADMIN_PORT` in `.env`, `docker compose up -d`, update Nginx `proxy_pass`. |
| 502 from Nginx | `docker compose ps` — container must be healthy; check `docker compose logs`. |
| Changed API URL not applied | `NEXT_PUBLIC_*` is build-time: always rebuild the image after changing it. |

## Backend CORS requirement

The NestJS backend must allow the admin origin:

```ts
app.enableCors({ origin: ['https://admin.yourdomain.com'], credentials: true });
```

---

Powered by **INTERNET ZONE**
