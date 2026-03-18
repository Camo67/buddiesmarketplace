# Buddies Worldwide  [ [

**Secure, open-source marketplace like Facebook Marketplace – scam-proof for communities in South Africa and beyond.** [github](https://github.com/keycloak/keycloak)

## 🚀 Quick Start

```bash
# 1. Setup MySQL on cPanel (Tony's hosting)
# Create DB + user via cPanel > MySQL Databases

# 2. Deploy Keycloak (Docker)
docker run -p 8080:8080 -e KC_DB=postgres -e KC_DB_URL=jdbc:postgresql://your-cpanel-host:3306/buddies_db quay.io/keycloak/keycloak:latest start-dev [web:1]

# 3. Install email-verifier (Node.js example)
npm i email-verifier
# Usage: const verifier = require('email-verifier'); [web:7]

# Full setup guide below 👇
```

## 📋 Core Components

### Identity & Verification
Protect against scams with mandatory signup verification.

| Tool | Repo | Setup Command |
|------|------|---------------|
| **Keycloak** | [keycloak/keycloak](https://github.com/keycloak/keycloak)  [github](https://github.com/keycloak/keycloak) | `docker run quay.io/keycloak/keycloak:latest start-dev` |
| **ORY Kratos** | [ory/kratos](https://github.com/ory/kratos)  [pkg.go](https://pkg.go.dev/github.com/ory/kratos) | `docker compose up` (self-hosted IAM) |
| **Email Verifier** | [umuterturk/email-verifier](https://github.com/umuterturk/email-verifier)  [github](https://github.com/umuterturk/email-verifier) | `npm i email-verifier` |

**How:** Users sign up → Auto-email check (syntax/MX/disposable) → Manual ID if needed. **Phase 1.**

### Database & Storage
Free hosting on existing cPanel.

| Tool | Notes |
|------|-------|
| **MySQL** | cPanel → MySQL Databases → Create `buddies_db` + user  [github](https://github.com/openach/openach) |
| **File Storage** | [FileRun Docker](https://github.com/filerun/docker)  [github](https://github.com/filerun/docker) for images |

**How:** Backend connects via `mysql://user:pass@tony-host:3306/buddies_db`. **Phase 1-2.**

### Listings & Marketplace
Image uploads + browsing like FB Marketplace.

**Flow:**
1. Verified seller creates listing (title, desc, photos).
2. Buyers browse/search → Chat → Purchase.

**Phase 2.**

### Tracking & Logistics
Real-time delivery updates.

| Tool | Repo |
|------|------|
| **LibreTrack** | [proninyaroslav/libretrack](https://github.com/proninyaroslav/libretrack)  [github](https://github.com/proninyaroslav/libretrack) |

**How:** Seller adds tracking # → Auto-updates via API. **Phase 3.**

### Payments
Escrow-style, no upfront costs.

| Tool | Repo |
|------|------|
| **OpenACH** | [openach/openach](https://github.com/openach/openach)  [github](https://github.com/openach/openach) |
| **Hyperswitch** | [juspay/hyperswitch](https://github.com/juspay/hyperswitch-web)  [github](https://github.com/juspay/hyperswitch-web) |

**How:** Log payments manually first → Integrate later. **Phase 4.**

## 🛠️ Tech Stack

[] [] [] []

## 📊 Monitoring

- **Netdata**: Real-time metrics [netdata/netdata](https://github.com/netdata/netdata) [github](https://github.com/netdata/netdata)
- **Uptime Kuma**: Uptime checks [uptimekuma.org](https://uptimekuma.org) [uptimekuma](https://uptimekuma.org)

```bash
# Netdata (1-liner)
bash <(curl -Ss https://my-netdata.io/kickstart.sh)
```

## 🗺️ Roadmap

| Phase | Deliverables | Timeline |
|-------|--------------|----------|
| **1** | DB + Auth + Email Verify | Week 1 |
| **2** | Listings + Images | Week 2-3 |
| **3** | Tracking | Week 4 |
| **4** | Payments | Month 2 |

## 📝 License
MIT – Free to use/modify. See [LICENSE](LICENSE).

## 🤝 Contributing
Fork → PR → Discuss in Issues.

***

**Ready to deploy?** Copy this to your GitHub repo root as `README.md`. Ping me for setup scripts or Docker Compose files! [github](https://github.com/umuterturk/email-verifier)