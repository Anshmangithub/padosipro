# PadosiPro — Take-Home Assignment

A native mobile app (React Native/Expo) + REST API (Node/TypeScript) implementing the
"sign up → verify email → complete profile → pick tasks" journey from the assignment brief.

- **Backend**: Node.js, TypeScript, Express, Prisma, SQLite, Zod, JWT, bcrypt — [`backend/`](backend)
- **Mobile**: React Native (Expo), TypeScript, React Navigation, TanStack Query — [`mobile/`](mobile).
  Custom design system (gradient theme, Space Grotesk/Inter fonts, a consistent `ScreenHeader` nav
  bar on every screen).
- **Email**: real SMTP to [Mailpit](https://github.com/axllent/mailpit), a local mail catcher — by
  default. See [Configuration](#configuration) for the other two options.
- **Architecture, trade-offs, what's next**: see [`DESIGN.md`](DESIGN.md).

Needs **Node.js 20+**. That's it — SQLite is a single file (no database server), and there's no
Docker anywhere in this project.

---

## Run it

**One-time setup:**

```bash
cd backend && npm install && cp .env.example .env && cd ..
cd mobile && npm install && cp .env.example .env && cd ..
winget install axllent.mailpit   # macOS: brew install axllent/mailpit/mailpit — see Configuration for other options
```

**Every time, two terminals:**

```bash
# Terminal 1 — repo root
npm run dev
```

```bash
# Terminal 2
cd mobile && npx expo start
```

`npm run dev` syncs the database schema, seeds the task catalogue, starts Mailpit, and starts the
backend — one command, labeled output, `Ctrl+C` stops everything. In the Expo terminal, press `a`
for an Android emulator, `i` for iOS (macOS only), or scan the QR code with the **Expo Go** app on
your phone.

---

## Try the flow

1. **Register** with any email + password (8+ characters).
2. Open **http://localhost:8025** (Mailpit) and read the 6-digit code from the email.
3. Enter it on **Verify email**.
4. **Log in** with the same credentials.
5. Fill in the profile (name, 10-digit mobile number, address, optional business name).
6. **Select tasks** (search, multi-select across categories) and confirm.
7. Land on **Home** — try **Edit tasks** and **Log out** (then log back in; the session also
   survives a full app restart).

---

## Configuration

### Mobile → backend connection

`mobile/.env`'s `EXPO_PUBLIC_API_URL` must match how your backend is reachable **from wherever
you're running the app**:

| Running on | `EXPO_PUBLIC_API_URL` |
|---|---|
| Android emulator | `http://10.0.2.2:4000/api` |
| iOS simulator | `http://localhost:4000/api` |
| Physical device (Expo Go) | `http://<your-computer's-LAN-IP>:4000/api` (same Wi-Fi; allow port 4000 through your firewall) |

### Email delivery (three options, `backend/.env`)

1. **Mailpit (default)** — `SMTP_HOST="localhost"`, port `1025`. Install with
   `winget install axllent.mailpit`, `brew install axllent/mailpit/mailpit`, or a binary from its
   [releases page](https://github.com/axllent/mailpit/releases) — no Docker, no account. Read
   codes at **http://localhost:8025**. This is the "local mail catcher such as Mailpit" option the
   assignment names directly. `npm run dev` starts it for you automatically if it's installed.
2. **Console only** — leave `SMTP_HOST` blank; codes print to the backend's terminal as
   `[dev-mail] OTP for <email>: <code>`. This also kicks in automatically if Mailpit is configured
   but unreachable, so a missed `mailpit` process never hard-fails registration.
3. **A real inbox** — set `SMTP_HOST` + `SMTP_USER`/`SMTP_PASSWORD` to a real provider. For Gmail:
   turn on 2-Step Verification, create an
   [App Password](https://myaccount.google.com/apppasswords), then:
   ```
   SMTP_HOST="smtp.gmail.com"
   SMTP_PORT=587
   SMTP_USER="you@gmail.com"
   SMTP_PASSWORD="16-character app password, no spaces"
   ```
   Restart the backend after editing `.env` (env vars are only read at startup).

Full variable list: [`backend/.env.example`](backend/.env.example) /
[`mobile/.env.example`](mobile/.env.example).

---

## Tests

```bash
cd backend && npm test   # 36 tests — OTP generation/expiry/attempt-limits/login rules + wiring
cd mobile && npm test    # 12 tests — validators + task-grouping
```

---

## Building an Android APK

```bash
cd mobile
npx expo prebuild --platform android
cd android
./gradlew assembleDebug                # Windows: gradlew.bat assembleDebug
adb install app/build/outputs/apk/debug/app-debug.apk
```

Debug build — no signing keystore needed for this assignment (see `DESIGN.md` for the
production-signing step this would need next).

---

## API overview

All endpoints are under `/api`, JSON in/out. Errors always have the shape
`{ "error": { "code": "...", "message": "...", "details"?: ... } }`.

| Method & path | Auth | Notes |
|---|---|---|
| `POST /auth/register` | – | `{ email, password }`. Resends the OTP instead of erroring if the email exists but isn't verified yet. |
| `POST /auth/verify-otp` | – | `{ email, code }`. Does **not** log the user in — matches the brief's Register → Verify → **Login** flow. |
| `POST /auth/resend-otp` | – | `{ email }`. 30s cooldown. |
| `POST /auth/login` | – | `{ email, password }`. Verified users only. Returns `{ token, hasProfile, hasSelectedTasks }`. |
| `GET /me` | ✓ | Same shape as login (minus `token`); used to restore the session after an app restart. |
| `GET /profile` / `PUT /profile` | ✓ | `{ name, mobileNumber, address, businessName? }`. |
| `GET /tasks` | ✓ | Full catalogue. |
| `GET /tasks/selection` / `POST /tasks/selection` | ✓ | `{ taskIds: string[] }`, replace semantics. |

---

## Project structure

```
padosipro/
├── DESIGN.md
├── package.json, dev.js    # `npm run dev` — one-command launcher, see "Run it"
├── backend/                # Express + Prisma (SQLite) API
└── mobile/                 # Expo React Native app
```

---

## Troubleshooting

- **Mobile app can't reach the backend**: double-check `EXPO_PUBLIC_API_URL` against the table
  above — almost always an emulator-vs-device host mismatch.
- **No OTP email arrives**: confirm Mailpit is actually running (http://localhost:8025 should
  load) *before* you register. If it's not running, check the backend's own terminal for
  `[dev-mail] OTP for ...` instead — the app falls back there automatically.
- **`npm run dev` fails with `EADDRINUSE`**: something's already on port 4000 or 1025 — likely a
  backend or Mailpit instance you started manually earlier. Stop it, then try again.
- **`npm run dev` says "Mailpit not found on PATH" right after installing it**: close and reopen
  your terminal — a freshly-installed command isn't visible to terminals opened before the install
  finished.
- **UI looks unstyled, wrong font, or stuck on the splash screen**: fully stop and restart
  `npx expo start` (a plain in-app reload doesn't pick up newly-added native packages) and make
  sure `npm install` has been run in `mobile/`.
- **Android emulator won't reach `10.0.2.2`**: confirm the backend is actually running
  (`curl http://localhost:4000/health`) and that you're using an emulator, not a physical device
  (which needs the LAN-IP form instead).
