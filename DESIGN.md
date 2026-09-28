# DESIGN

## Architecture

```
 React Native (Expo)  ──HTTPS/JSON──►  Express API  ──Prisma──►  SQLite (file)
        │                                   │
        │ expo-secure-store                 └──SMTP──► Mailpit (local dev inbox)
        │ (JWT persistence)                     │ falls back to console.log if unset
```

The mobile app is a thin, purely native client (no WebView) talking to a REST API over
`/api/*`. Routing on the client is driven entirely by state (`AuthContext`: `status` /
`isAuthenticated` / `session.hasProfile` / `session.hasSelectedTasks`) rather than manual
`navigation.reset()` calls — the set of registered screens in `RootNavigator` changes as that
state changes, so React Navigation mounts a fresh stack and a user can never navigate back into a
finished onboarding step.

On the backend, each domain (`auth`, `profile`, `tasks`) is a self-contained module
(`routes → controller → service → schema`). The "risky logic" the brief calls out — OTP
generation/expiry/attempt-limits and login rules — lives in two dependency-free files,
`otp.rules.ts` and `auth.rules.ts`: pure functions that take primitives (`now`, `expiresAt`,
`attempts`, `passwordMatches`, …) and return a decision or throw a typed `ApiError`. Services just
wire these to Prisma, bcrypt and the mailer. This is what makes the test suite fast and
mock-free for the parts that matter most, without forcing a repository-pattern abstraction onto
the rest of the codebase.

## Key trade-offs

- **SQLite instead of PostgreSQL, and no Docker.** The brief explicitly allows either database
  ("Any database; PostgreSQL or SQLite preferred") and Docker Compose is only called out as
  "ideal," not required ("must run locally with one documented command"). Both were dropped after
  hitting real friction on the dev machine — Docker Desktop needed a BIOS-level virtualization
  change that wasn't available, and the machine's ambient local Postgres had no known password.
  SQLite means `npm install && npm run dev` needs nothing beyond Node.js — no database server, no
  container runtime, no credentials to find — which matters for the "someone else can run this
  from your README in under 15 minutes" criterion. The schema uses no Postgres-specific types, so
  swapping the Prisma `datasource` provider back to `postgresql` for a real deployment is a
  one-line change plus picking a hosted instance.
- **Real SMTP delivery to Mailpit, matching the brief by name.** The brief asks for "SMTP, or a
  local mail catcher such as Mailpit or Ethereal" — this project uses Mailpit specifically, run as
  a standalone binary (`winget install axllent.mailpit` / `brew install axllent/mailpit/mailpit` /
  a direct binary download — no Docker needed). `backend/.env.example` points at it by default
  (`SMTP_HOST="localhost"`, port `1025`), and this was verified live: registering a real account
  produced an email in Mailpit's own REST API (`/api/v1/messages`), whose OTP was read back and
  used to complete verification — a genuine SMTP round trip, not a stub. A real provider (e.g.
  Gmail, via `SMTP_USER`/`SMTP_PASSWORD`) is also supported and was verified the same way.
  `mailer.ts` never lets a delivery failure break the request, though: if the configured SMTP
  server is unreachable (Mailpit not started, wrong credentials, network blip), it catches the
  error, logs it, and falls back to printing the code to the backend's own console instead of
  surfacing a 500 — this was hit for real during development (registering with Mailpit not
  running) and fixed rather than left as a rough edge.
- **A one-command dev launcher (`dev.js` + root `package.json`) rather than Docker Compose.**
  `npm run dev` from the repo root syncs the schema, seeds the catalogue, detects and starts
  Mailpit if it's installed (a clear message and console-only fallback if not), and starts the
  backend — all labeled/colored, `Ctrl+C` stops everything. It's a ~70-line Node script using only
  `child_process`, not a new dependency, chosen over `concurrently` to keep the "one command"
  entry point free of anything beyond what Node itself ships.
- **`prisma db push` instead of versioned `prisma migrate` migrations.** This is a
  single-environment take-home with no need for migration history or rollback between
  environments, and `db push` guarantees the run always produces a schema that matches
  `schema.prisma` — there's no hand-written SQL migration file that could silently drift from the
  schema. A real production rollout would switch to `prisma migrate` with committed migration
  files.
- **Verify does not auto-login.** `POST /auth/verify-otp` only marks the account verified; the
  mobile app then routes to the Login screen. This matches the brief's literal flow (Register →
  Verify → **Login** → first-login profile) rather than the arguably-smoother "verify and go
  straight in" alternative.
- **A single long-lived JWT (7 days), no refresh tokens.** The brief explicitly allows "JWT with
  expiry"; adding refresh/rotation would be the right call for production but is out of
  proportion for this scope.
- **Pure-function rule tests over full DB integration tests.** `otp.rules.ts`/`auth.rules.ts` are
  tested directly with zero mocking; `otp.service.ts`/`auth.service.ts` are tested with a mocked
  Prisma client. Neither needs a live database, so `npm test` is fast and deterministic
  everywhere. Real SQL behaviour was instead verified with a manual end-to-end pass against the
  live server over HTTP — register → wrong OTP (attempts-remaining message) → correct OTP →
  login-before-verify rejected → login → `/me` → profile save/validation → task catalogue →
  save/read selection → re-login reflecting `hasProfile`/`hasSelectedTasks` → resend-cooldown
  rejection — all against the real SQLite file and Express app, not mocks.
- **Business Name is optional.** PadosiPro serves households as well as home businesses;
  requiring it would block plain household sign-ups the brief describes as the primary case.
- **Debug APK, not a signed release build.** No production keystore exists for this assignment,
  so the README documents `assembleDebug` (installable, unsigned) rather than a signed release —
  the right next step, not a shortcut taken silently.
- **Login timing/enumeration hardening kept minimal but present.** Unknown email and wrong
  password return the identical `INVALID_CREDENTIALS` error and message; an unknown email is
  compared against a dummy bcrypt hash so login timing doesn't leak account existence. Verified
  status is only revealed once the password is confirmed correct.

## What was left out

- Password reset ("forgot password") flow — not in the brief's scope.
- Refresh tokens / server-side session revocation (logout is client-side-only: the JWT is simply
  discarded from secure storage, not blacklisted server-side).
- Rate limiting at the HTTP layer (the OTP attempt-limit/cooldown rules are enforced in the
  domain logic, but there's no IP-level throttle on the auth endpoints generally).
- Editing profile details after the first-login flow (the API supports it — `PUT /profile` is
  idempotent upsert — there's just no settings screen wired up to it yet, unlike task selection
  which does have an edit path from Home).
- Automated integration/E2E tests (Detox/Maestro) driving the real mobile UI.
- A CI pipeline.

## Next, with another week

1. Refresh tokens + a server-side revocation list, so logout and "log out of all devices" are
   real security actions, not just local storage clears.
2. A profile-editing screen reusing the existing `PUT /profile` endpoint.
3. Detox/Maestro E2E tests for the full mobile journey, plus a CI workflow running backend tests,
   both typechecks, and an Android build on every push.
4. Switch the Prisma datasource to PostgreSQL with versioned migrations for a real deploy target,
   plus basic HTTP rate limiting on the auth/OTP endpoints.
5. A signed release APK/AAB (and a Play Store internal-testing track) instead of a debug build.
6. Accessibility pass (screen-reader labels, dynamic type) and a dark theme, since the design
   tokens already live in one `theme/` module.
