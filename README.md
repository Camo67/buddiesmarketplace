# Buddies Worldwide

Secure, community-driven marketplace infrastructure for South Africa and similar markets, designed to reduce scams through stronger verification, moderation, and transparent transactions.

This repository currently contains the project foundation:

- A corrected technical plan for the MVP
- A local development stack for identity and databases
- Practical notes on what should stay simple in Phase 1 and what should wait

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
