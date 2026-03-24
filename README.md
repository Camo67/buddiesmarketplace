# Buddies Worldwide

Secure, community-driven marketplace infrastructure for South Africa and similar markets, designed to reduce scams through stronger verification, moderation, and transparent transactions.

This repository currently contains the project foundation:

- A corrected technical plan for the MVP
- A local development stack for identity and databases
- Practical notes on what should stay simple in Phase 1 and what should wait

## Current Auth Direction

As of March 24, 2026, the live app auth path in this repo uses Supabase Auth for:

- marketplace account sign-up
- marketplace sign-in
- moderator sign-in

Some older Keycloak notes remain below as historical deployment context, but the active app code now expects Supabase auth environment variables.

## Project Goal

Buddies Worldwide aims to deliver a marketplace experience similar to Facebook Marketplace, but with stronger trust controls:

- verified accounts
- clear listing ownership
- fraud reporting and moderation
- safer buyer and seller interactions
- transparent delivery and payment records

## Recommended MVP Stack

The original tool list is directionally good, but a few components need tighter boundaries to stay realistic.

| Area | Recommended Starting Point | Why |
|------|-----------------------------|-----|
| Frontend | Next.js | Fast MVP path, good for listings, auth redirects, dashboards |
| Backend/API | Node.js with a modular service layer | Keeps listing, chat, moderation, and order logic under one roof |
| Identity | Keycloak | Mature self-hosted IAM with admin UI, email verification, MFA options |
| App Database | MySQL or MariaDB | Works well for listings, chats, orders, reports |
| Keycloak Database | PostgreSQL for local/dev and VPS deployments | Cleanest default for Keycloak setup |
| Email Screening | `email-verifier` as a pre-check only | Useful signal, but not a trust guarantee |
| File Storage | Start simple: app-managed uploads or object storage | Easier than introducing a separate file manager too early |
| Tracking | Manual courier + tracking number first | Safer than overcommitting to an immature integration |
| Payments | Manual/off-platform records first | Escrow and payment orchestration add legal and operational complexity |

## Important Corrections

### 1. Keycloak database config

Do not run Keycloak with `KC_DB=postgres` while pointing it at port `3306`. That mixes PostgreSQL configuration with a MySQL-style connection.

For local development in this repo:

- Keycloak uses PostgreSQL
- The marketplace app uses MySQL

For production:

- Keep Keycloak on its own VPS or container host
- Use a dedicated Postgres or MariaDB database for Keycloak
- Use cPanel MySQL or MariaDB for marketplace application data if the host is reliable enough

### 2. cPanel hosting expectations

Shared cPanel hosting can be fine for the marketplace database and a simple app backend, but Keycloak usually belongs on infrastructure where you control long-running services and environment variables cleanly.

For this repo specifically:

- the marketplace app can run on cPanel if your plan includes Node.js via Application Manager or Setup Node.js App
- Keycloak should stay on a VPS, container host, or another always-on service
- if your cPanel plan does not support Passenger or Node.js apps, this Next.js backend will not run there

### cPanel deployment for the marketplace app

Files added for the cPanel path:

- `app.js` for Passenger or Application Manager startup
- `.env.cpanel.example` for production environment values

Before you deploy:

- use Node.js `20.9.0` or newer because this repo runs `next@16.1.6`
- create a MySQL or MariaDB database and user in cPanel
- keep Keycloak on a separate host and update its client redirect URIs for your production domain

Suggested cPanel flow:

1. In cPanel, open Application Manager or Setup Node.js App and create a Node.js app that points at this repo's application root.
2. Set the startup file to `app.js`.
3. Add the environment variables from `.env.cpanel.example` in Application Manager, or save them to `.env.production.local` inside the app root if you manage them on disk.
4. In the cPanel terminal, install and build the app:

```bash
npm install
npm run build
```

5. Restart the application from cPanel, or run:

```bash
mkdir -p tmp && touch tmp/restart.txt
```

Key settings to double-check for production:

- `APP_BASE_URL` must exactly match the public HTTPS URL for the app
- `APP_BASE_URL_ALIASES` should include any extra hostnames such as `https://www.your-domain.example`
- `KEYCLOAK_BASE_URL` must point to the external Keycloak host, not the cPanel account
- `APP_DB_NAME` and `APP_DB_USER` usually need the cPanel account prefix, for example `cpaneluser_buddies_app`

Keycloak client updates needed for the cPanel domain:

- add `https://your-domain.example/api/auth/callback` as a valid redirect URI
- add `https://your-domain.example/api/auth/keycloak/callback` as a valid redirect URI
- add your final logout redirect URL as an allowed post-logout redirect

If you deploy by pulling from Git inside cPanel, run this after each pull:

```bash
npm install
npm run build
mkdir -p tmp && touch tmp/restart.txt
```

### Supabase path for auth and marketplace data

This repo can now run the marketplace data layer on PostgreSQL, including Supabase, and the active sign-in flow now uses Supabase Auth instead of Keycloak redirects.

What this covers:

- Supabase email/password sign-up
- Supabase email/password sign-in
- Supabase-backed moderator sign-in
- `marketplace_users`
- `marketplace_listings`
- `marketplace_orders`
- `marketplace_payment_events`
- `paxi_bulk_shipments`

What this does not cover yet:

- password reset and social login flows
- row-level security policies for direct client-side Supabase data access
- replacing every historical Keycloak note in this README

To point the app at Supabase:

1. Copy `.env.supabase.example` to `.env.production.local` or your host's environment settings.
2. Set `APP_DB_PROVIDER=postgres`.
3. Set `APP_DB_URL` to the Supabase direct Postgres connection string.
4. Set `SUPABASE_URL` and `SUPABASE_ANON_KEY`.
5. Set `SUPABASE_ADMIN_EMAILS` or assign the configured `SUPABASE_ADMIN_ROLE` in Supabase metadata for moderator accounts.

Notes:

- the app auto-creates its marketplace tables on first write, just like the MySQL path
- use a Postgres connection string with SSL enabled, for example `?sslmode=require`
- the current compose files still include MySQL for the marketplace data path unless you point `APP_DB_PROVIDER=postgres` and `APP_DB_URL` at Supabase

### 3. LibreTrack scope

LibreTrack is an Android package tracking app, not a drop-in backend API for marketplace shipment orchestration. For Phase 3, start with:

- courier name
- tracking number
- delivery status field
- external tracking URL when available

### 4. OpenACH fit

OpenACH is ACH-focused, so it is not a South Africa-first payment strategy. If you later add a payment orchestration layer, Hyperswitch is the more relevant direction, but only after you have a confirmed local payment provider and compliance plan.

## Local Development Quick Start

### Prerequisites

- Docker
- Docker Compose

### 1. Create your local env file

```bash
cp .env.example .env
```

### 2. Start infrastructure

```bash
docker compose up -d
```

This starts:

- `keycloak` on `http://localhost:8080`
- `postgres` for Keycloak
- `mysql` for marketplace app data

### 3. Default local credentials

Keycloak admin:

- username: `admin`
- password: `admin123`

These values are passed to Keycloak using the current bootstrap admin environment variables in `docker-compose.yml`.

MySQL app database:

- host: `127.0.0.1`
- port: `3306`
- database: `buddies_app`
- username: `buddies`
- password: `buddies123`

Change these values before using this setup outside local development.

Admin review login in the imported local realm:

- realm: `buddies`
- client: `buddies-web`
- role: `buddies-admin`
- username: `moderator`
- password: `moderator123`

The Next.js app expects these Keycloak OIDC settings in `.env`:

- `APP_BASE_URL`
- `APP_SESSION_SECRET`
- `KEYCLOAK_BASE_URL`
- `KEYCLOAK_REALM`
- `KEYCLOAK_CLIENT_ID`
- `KEYCLOAK_CLIENT_SECRET`
- `KEYCLOAK_ADMIN_ROLE`

### Cloudflare preview on `buddiesworldwide.online`

The live apex domain may already be attached to a Cloudflare Pages project. To test this local stack without replacing the live site, use preview hostnames instead:

- `app.buddiesworldwide.online` for the Next.js app
- `auth.buddiesworldwide.online` for Keycloak

Required DNS records in Cloudflare:

- proxied `CNAME` `app` -> `<tunnel-id>.cfargotunnel.com`
- proxied `CNAME` `auth` -> `<tunnel-id>.cfargotunnel.com`

Preview environment values:

- `APP_BASE_URL=https://app.buddiesworldwide.online`
- `KEYCLOAK_BASE_URL=https://auth.buddiesworldwide.online`
- `CLOUDFLARE_TUNNEL_TOKEN=<your tunnel token>`

Run the local infrastructure plus the preview tunnel:

```bash
docker compose up -d
docker compose --profile preview up -d cloudflared
npm run dev
```

The Keycloak realm seed already accepts both `http://localhost:3000/*` and `https://app.buddiesworldwide.online/*` redirect URIs.

### Short-term restore on an always-on VPS

The fastest way to get the current stack off your PC is to run it on one always-on server and keep Cloudflare Tunnel in front of it.

Recommended free-tier target for this repo:

- Oracle Cloud Always Free ARM

Why this is the best short-term fit:

- this repo needs Next.js, MySQL, PostgreSQL, Keycloak, and `cloudflared`
- tiny 1 GB micro tiers are usually too cramped for that mix once Keycloak is included
- Oracle's Always Free ARM shape is the only mainstream no-cost option that is usually large enough for the full stack

Files added for the VPS restore path:

- `Dockerfile`
- `docker-compose.server.yml`
- `.env.server.example`

Recommended hostname layout on the VPS tunnel:

- `buddiesworldwide.online` -> `http://app:3000`
- `id.buddiesworldwide.online` -> `http://keycloak:8080`
- optional `app.buddiesworldwide.online` -> `http://app:3000`

Suggested restore flow:

1. Create an always-on VPS and install Docker with the Compose plugin.
2. Copy this repo to the VPS.
3. Copy `.env.server.example` to `.env.server` and replace every placeholder secret.
4. Create a remotely-managed Cloudflare Tunnel and copy its token into `.env.server`.
5. Add the tunnel routes so the public hostnames point to the `app` and `keycloak` services above.
6. Start the stack:

```bash
docker compose --env-file .env.server -f docker-compose.server.yml up -d --build
```

If you point the apex domain directly to `http://app:3000`, the old apex proxy worker is no longer required for the short-term restore.

## Identity and Verification Strategy

Phase 1 should focus on practical trust, not perfect trust.

Minimum trust controls:

- email + password signup
- email confirmation
- rate limiting on signup and login
- account reporting
- admin moderation tools
- seller profile completeness checks

Higher-trust controls for later:

- phone verification
- manual ID review
- verified seller badges
- suspicious behavior scoring

`email-verifier` should be treated as an extra signal for:

- invalid syntax
- missing MX records
- disposable domains

It should not be the only reason to block a real user.

## Marketplace Modules

The first build should center around these modules:

### Phase 1

- authentication and onboarding
- user profiles
- trust levels
- reports and moderation

### Phase 2

- categories
- listings
- listing images
- saved items
- seller contact or messaging

### Phase 3

- transactions
- order records
- shipping details
- tracking references

### Phase 4

- payment integration
- dispute workflows
- escrow-like controls where legally appropriate

## Paystack Checkout

The current payment path uses a hosted Paystack checkout for fixed-price listings only.

Required environment variables:

- `PAYSTACK_SECRET_KEY`
- `PAYSTACK_PUBLIC_KEY` (reserved for future client-side or native SDK flows)
- `PAYSTACK_CURRENCY` default `ZAR`

Current app endpoints:

- `POST /api/payments/checkout`
- `GET /api/payments/paystack/callback`
- `GET /api/payments/paystack/cancel`
- `POST /api/payments/paystack/webhook`

Paystack dashboard setup:

- callback URL should allow the app domain in production
- webhook URL should point to `/api/payments/paystack/webhook`
- mobile shell traffic to hosted checkout is allowed through the Expo WebView host allowlist

## Suggested Initial Data Model

The MVP database will likely need:

- `users`
- `profiles`
- `verification_requests`
- `listings`
- `listing_images`
- `listing_categories`
- `favorites`
- `conversations`
- `messages`
- `orders`
- `shipments`
- `ratings`
- `reports`
- `admin_actions`

## Production Notes

### If you stay on cPanel first

- keep the app backend lightweight
- use MySQL or MariaDB for marketplace data
- use SMTP for transactional email
- host Keycloak separately if Docker or custom service control is limited

### When you outgrow cPanel

Move to:

- a VPS or cloud VM
- Dockerized services
- managed object storage for media
- queue workers for email, moderation, and notifications

## Official References

- Keycloak: https://www.keycloak.org/
- Keycloak database configuration: https://www.keycloak.org/server/db
- ORY Kratos: https://www.ory.sh/kratos/
- ORY self-hosted persistence docs: https://www.ory.sh/docs/self-hosted/deployment
- Email Verifier: https://github.com/umuterturk/email-verifier
- LibreTrack: https://github.com/proninyaroslav/libretrack
- Hyperswitch: https://github.com/juspay/hyperswitch
- OpenACH: https://github.com/openach/openach

## Near-Term Next Steps

1. Decide whether Keycloak remains the default identity provider for production.
2. Settle the application stack for the marketplace service itself.
3. Build the Phase 1 schema and backend modules.
4. Add the first frontend screens: signup, login, profile, create listing, browse listings.
5. Introduce moderation before adding payment flows.
# buddiesmarketplace
