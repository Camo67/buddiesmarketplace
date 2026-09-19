# Buddies Worldwide

Community marketplace app (Next.js frontend + Fastify API server) for listings, chat, moderation, and orders, with Supabase Auth and MySQL/Postgres backing stores.

Status: Active — real app code across storefront, API, and mobile; auth path uses Supabase (older Keycloak notes remain as history).

## Tech stack

- Next.js + React (storefront), Fastify API (`server/`, `tsx`)
- Supabase Auth (`@supabase/supabase-js`), MySQL (`mysql2`) + Postgres (`pg`)
- OpenNext Cloudflare build, Wrangler, Docker Compose
- `email-verifier`, Paystack, Turnstile (per env template)

## Project structure

- `app/` — Next.js routes (listings, admin, signup, profile, payments, verify, …)
- `server/` — Fastify API service; `db/` — database files; `data/` — seed/static data
- `components/`, `lib/` — shared UI and helpers; `mobile/` — mobile client
- `cloudflare/`, `wrangler.json`, `wrangler.jsonc`, `open-next.config.ts` — edge build/deploy
- `Dockerfile`, `docker-compose.yml`, `docker-compose.server.yml` — container stacks
- `app.js` — cPanel/Passenger startup; `public/` — static assets

## Run locally

```bash
npm install
npm run dev          # Next.js storefront (port 3000)
npm run server:dev   # Fastify API with tsx watch (port 4000)
npm run server:check # typecheck the API (tsc -p server/tsconfig.json)
```

cPanel path: `npm run start:cpanel` (runs `node app.js`).

## Deployment

- Cloudflare: `npm run deploy` (opennextjs-cloudflare build + deploy; `npm run preview` for local preview, config in `wrangler.json`)
- Docker: `Dockerfile` + `docker-compose.yml` / `docker-compose.server.yml`
- cPanel: `app.js` Passenger entry + `.env.cpanel.example` values (Keycloak stays on a VPS, not shared hosting)

## Env vars

From `.env.example` (copy to `.env`):

| Var | Purpose |
|---|---|
| `DATABASE_URL` / `APP_DB_*` | MySQL app database |
| `API_HOST` / `API_PORT` / `API_CORS_ORIGINS` | Fastify API bind + CORS |
| `APP_BASE_URL` / `APP_SESSION_SECRET` | Public base URL, session signing |
| `NEXT_PUBLIC_SUPABASE_URL` / `SUPABASE_*` | Supabase Auth (anon + service-role keys, admin emails) |
| `PAYSTACK_*` | Payments (secret/public key, currency) |
| `TURNSTILE_*` / `NEXT_PUBLIC_TURNSTILE_SITE_KEY` | Bot protection |
| `EMAIL_VERIFIER_API_KEY` | Email pre-check signal |
| `META_*` | Meta webhook verification |
| `CLOUDFLARE_TUNNEL_TOKEN` | Preview-tunnel profile only |

## Links

- Preview/app URL referenced in `.env.example`: `https://app.buddiesworldwide.online`
