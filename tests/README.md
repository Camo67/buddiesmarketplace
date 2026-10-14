# Bounded auth regression

Run `npm ci --ignore-scripts`, then `npm run test:auth` (Node 22 used for verification).
The test transpiles the actual route with TypeScript and mocks provider/profile/session/bot dependencies. No production services, real accounts or email are used. A local HTTP bridge and default fetch redirect handling prove redirected POSTs become GETs.

Verified: untouched main 5e2aecd has 1 pass/18 failures; patch 19/19 passes. TypeScript and two consecutive Next builds pass after excluding generated dist artifacts from typecheck. No dependency or lockfile changes. Existing dependencies reported npm audit findings; no unrelated upgrades made.

Visual checks: local Next dev signup at 360/768/1280px, keyboard focus and 640px equivalent reflow for 200% zoom. Sidebar previously rendered three narrow columns; signup now opts into vertical cards with readable current-step contrast. No horizontal overflow at tested widths. A pre-existing Next dev issue badge appears in screenshots, not production UI.

Not verified: remote staging deployment, production deployed revision/env, real Supabase confirmation/sign-in/profile persistence, production MySQL/Postgres connectivity. This is a source patch, not a production restoration claim. Do not deploy without reviewing current configuration and a controlled test identity/email scope.
