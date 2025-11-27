# Helparo — Authentication, Real-Time & Full User Flows

Last updated: November 27, 2025

This document describes the current implementation in the repository and provides a complete end-to-end flow for two user roles (Helper and Customer) from registration to payment. It also explains how real-time updates work, how tokens/sessions are handled, multi-device security, checks you can run to verify behavior, and recommended improvements.

---

## Table of contents

- Findings (what exists today)
- How real-time updates work
- Token & session handling (access/refresh)
- Multi-device login & security (how to handle and what's implemented)
- End-to-end flows
  - Customer: register → verify → book → pay
  - Helper: register → verify → accept bids → get paid
- Concrete checks (how you can verify in your running app)
- Recommended changes and prioritized next steps
- Useful commands & snippets

---

## Findings (quick summary)

- Real-time updates: Implemented using Supabase Realtime channels in `src/lib/realtime-notifications.tsx`.
  - Hooks: `useRealtimeNotifications`, `useRealtimeMessages`, `useRealtimeBids`.
  - These subscribe to PostgreSQL `INSERT` events and update UI instantly.

- Auth / Session management:
  - Browser client: `src/lib/supabase/client.ts` uses `createBrowserClient` from `@supabase/ssr`.
  - Server client: `src/lib/supabase/server.ts` uses `createServerClient` and reads/writes cookie store.
  - Server-side auth helpers are in `src/lib/auth.ts` (e.g., `requireAuth`, `requireHelper`, `requireCustomer`).
  - Login, magic link, password reset and update actions are in `src/app/actions/auth.ts`.
  - `supabase.auth.getSession()` is used to check session server-side.

- Security dashboard UI exists (`src/components/security-dashboard.tsx`) showing sessions, login history, and a "Log Out All Devices" button — UI is present but there is no explicit server-side code found that performs session revocation for other devices.

- Admin actions: `src/app/actions/admin-auth.ts` uses the Supabase service role key (`SUPABASE_SERVICE_ROLE_KEY`) to create or delete users. The service role key can be used to manage sessions programmatically via admin APIs (not currently used for session revocation).

---

## How Real-Time Updates Work (in this app)

Files:
- `src/lib/realtime-notifications.tsx`

What it does:
- Creates a Supabase client with `createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY)`.
- On mount, it loads the last N notifications/messages/bids from the DB then subscribes to `postgres_changes` for `INSERT` events on respective tables via `supabase.channel()`.
- When a new row is inserted on the server (e.g., a new message, bid, or notification), Supabase emits the event and the client hook receives it immediately and updates state.
- The hook also triggers browser notifications (`Notification` API) and plays a sound.

Implications:
- Real-time updates are supported out-of-the-box for notifications, messages, and bids.
- Works where the client is active and has network connectivity.

Notes / Caveats:
- Ensure your Supabase project has Realtime enabled for the database (it is by default).
- For mobile or background behavior, browser restrictions (notifications, sound autoplay) may apply.

---

## Token & Session Handling

What the code shows:
- The project uses Supabase client SDKs and SSR helpers to manage sessions.
- Server code uses `createServerClient` configured with cookie getters/setters so sessions are persisted in cookies for server-side rendering.
- Client code uses `createBrowserClient`, which will persist sessions (via cookies/local storage) depending on SDK behavior.

How to check at runtime:
- On the server (inside server actions or server components): call `const { data: { user, session } } = await supabase.auth.getUser()` or `supabase.auth.getSession()`.
  - `session` object includes `access_token`, `refresh_token`, `expires_at`, and `user` fields when active.
- On the browser: call `await supabase.auth.getSession()` from a client component or open browser devtools and inspect cookies/localStorage.

Are explicit refresh tokens visible in the code? No. The app does not implement custom refresh-rotation logic — Supabase SDK handles access token refresh using the refresh token. The repository uses the SDK's session management; you can read tokens via `supabase.auth.getSession()`.

Where session cookies live:
- With `createServerClient` the SDK reads/writes cookies via the helper defined in `src/lib/supabase/server.ts`. This means session tokens are kept in HTTP cookies where Next.js SSR code can access them.

---

## Multi-device login & Security

Question: "If I log in as Helper on two devices, how is that handled?"

Current behavior (based on code inspection):
- Supabase allows multiple concurrent sessions by default (multiple devices can be signed in with the same account).
- UI: `SecurityDashboard` displays active sessions and offers "Log Out All Devices" and per-session "Revoke" buttons (UI prepared).
- Server-side: I did not find code that implements server-side session revocation for other devices. The `SecurityDashboard` UI will need server endpoints that call the Supabase Admin API to delete other sessions.

How to *securely* handle multi-device login (recommended patterns):
1. Session Tracking Table (recommended):
   - Create a `user_sessions` table with fields: `id`, `user_id`, `jwt`, `created_at`, `last_active_at`, `device_info`, `ip_address`, `is_current`.
   - On login (server-side), insert a row and attach `session_id` to user's cookies or metadata.
   - Use triggers or background jobs to mark stale sessions.

2. Server-side Revoke / Log Out All:
   - Use the Supabase Admin API with your `SUPABASE_SERVICE_ROLE_KEY` to call `auth.admin.deleteUser()` or delete sessions via `auth.admin` endpoints (or direct DB deletion of `auth.sessions` if using service key).
   - Implement a server action like `/api/auth/revoke-session` which validates the current user (server) and then deletes the specific session(s).

3. Refresh Token Rotation and Short-lived Access Tokens:
   - Prefer short access token lifetime and refresh rotation (Supabase supports rotating refresh tokens via configuration). This reduces risk if tokens are leaked.

4. Device Login Alerts & 2FA:
   - Send email/SMS alerts when a new device signs in.
   - Implement two-factor authentication (TOTP or SMS) for high-risk actions.

5. Limit concurrent sessions (optional):
   - Enforce a maximum concurrent session policy (e.g., 3 devices). If exceeded, either deny login or revoke oldest session(s).

6. Revoke on Role Change or Ban:
   - In `loginAction` the code already signs out users when banned or suspended. Also use service role to revoke all sessions on ban.

---

## End-to-end Flows (detailed)

Below are step-by-step flows for each user type. Each step references code files where the action occurs.

A) Customer flow: register → verify → login → create request → accept helper → payment

1. Registration (Customer)
   - Page: `/auth/signup` (frontend form)
   - Action: calls Supabase `auth.signUp()` or server action that wraps it (check your signup action; e.g., a server action that creates profile row)
   - After sign up: Supabase sends confirmation email using template `confirmation.html` (if enabled).

2. Email confirmation
   - User clicks confirmation link → Redirects to `/auth/confirm?token_hash=...`.
   - Page: `src/app/auth/confirm/page.tsx` uses `supabase.auth.verifyOtp` or `supabase.auth.getSession()` + call to server to verify.
   - On success: user sees success message and is redirected to `/auth/login`.

3. Login
   - Action: `src/app/actions/auth.ts` → `loginAction` uses `supabase.auth.signInWithPassword()`.
   - On success: server verifies profile status and redirects to `/${role}/dashboard`.
   - Session: Supabase SDK sets session cookies (server & client) that include access/refresh tokens.

4. Create service request (Customer)
   - UI: Customer creates request (forms stored in `request` / `service_requests` table)
   - Backend: Server action inserts into `service_requests` table and may notify helpers.
   - Real-time: Helpers subscribed to matching requests receive live notifications via `useRealtimeBids` or similar.

5. Helper selection & booking
   - Customer reviews helper bids, selects helper, and confirms booking.
   - The booking triggers `payment_intent` creation on payment provider (Cashfree / Stripe) — check `src/app/actions/payments` or `src/lib/payments` for provider integration.

6. Payment
   - Payment flow (client/server) interacts with payment provider.
   - On payment success: backend inserts `payments` row, triggers notification and updates booking status.
   - Real-time: Customer & Helper receive immediate notifications (`payment_received`, `service_confirmed`).

7. Post-service
   - After service completion, the app updates booking status and triggers `service_completed` notifications.

B) Helper flow: register → verify → bid → accept → complete → payout

1. Registration (Helper)
   - Page: `/auth/signup?role=helper` (frontend form)
   - Action: signup via Supabase; helper profile row is created with role `helper`.
   - Verification: Email confirmation as above.

2. Profile & verification
   - Helpers may require additional verification (KYC or documents). Look for `src/app/admin/verification` or `profiles` table.
   - Admin may set `is_verified` or `status` to `active`.

3. Receive requests / place bid
   - Helpers see incoming requests in dashboard; they can place bids using the `request_applications` table.
   - Real-time: As bids are placed, customers will see `useRealtimeBids` updates.

4. Bid accepted & booking
   - When customer accepts a bid, a booking is created and the helper is notified (realtime).
   - The helper's UI should indicate pending payment or scheduled service.

5. Payment and payout
   - Payment is processed via the platform (check `src/app/actions/payments` or `src/lib/payments` for provider integration).
   - On successful payment, helper receives `payment_received` notification and booking moves to `in_progress` or `scheduled`.
   - Payouts to helpers (withdrawals) are typically handled asynchronously — check `supabase/migrations` or `src/actions/withdrawals` for implementation.

6. Service complete & review
   - After completion, customer can mark completed and leave review; `review_received` notifications and gamification points may be applied.

---

## Concrete Checks You Can Run (how to verify features exist right now)

1. Real-time notifications
   - Start two browser windows (same user or different users) and open a place where notifications are shown (e.g., helper dashboard + customer request page).
   - Insert a row in `notifications` or `messages` table via Supabase SQL editor and confirm the client UI updates instantly.

2. Inspect tokens & session server-side
   - In a server action, add a quick debug call (temporary) to log `await supabase.auth.getSession()` and confirm the shape includes `access_token` and `refresh_token`.

3. Check client session
   - Open browser devtools → Application → Cookies and look for Supabase session cookie(s) or call `await supabase.auth.getSession()` in browser console.

4. Test multi-device login UI
   - Log in on device A and device B. Open `SecurityDashboard` → do you see both sessions? (Currently the UI shows sample sessions; you may need to implement server-side session listing.)

5. Test revoke session/server-side logout
   - Attempt to use Supabase Admin API (service role) to delete sessions created for a user — verify that the user is logged out on other devices.

---

## Recommended Changes & Next Steps (prioritized)

1. Implement server-side session tracking and revocation endpoints (High priority)
   - Add server actions that use `SUPABASE_SERVICE_ROLE_KEY` to delete sessions via Admin API or manipulate `auth.sessions`.
   - Wire the `SecurityDashboard` UI buttons to these endpoints (per-session revoke and "Log Out All Devices").

2. Add session rows to `user_sessions` table on login (Medium)
   - Helps list devices in `SecurityDashboard` accurately (store browser user-agent, IP, and last active timestamp).

3. Enable refresh token rotation & short access expiry in Supabase (High)
   - Configure Supabase authentication settings to use rotating refresh tokens to reduce token replay risk.

4. Implement Login Alerts and 2FA (Medium)
   - Send email on new device login; add optional TOTP 2FA for helpers (higher security).

5. Hook `SecurityDashboard` to real data (Medium)
   - Replace mocked session arrays with real queries (from `user_sessions` or `auth.sessions` via admin key).

6. (Optional) Limit concurrent sessions per user (Low/Medium)
   - Decide policy (deny or revoke oldest) and implement accordingly.

---

## Useful code snippets & commands

- Check current session on the server:

```ts
const supabase = await createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, { cookies })
const { data: { session } } = await supabase.auth.getSession()
console.log(session)
```

- Check current session on the client:

```ts
// In a client component
const { data: { session } } = await supabase.auth.getSession()
console.log(session.access_token, session.refresh_token)
```

- Revoke all sessions for a user (server-side, using service role key):

```ts
import { createClient } from '@supabase/supabase-js'
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

// Delete all sessions from auth.sessions for a user (dangerous, use carefully)
await supabase
  .from('auth.sessions')
  .delete()
  .eq('user_id', userId)
```

Note: Deleting from `auth.sessions` may not be permitted for some setups; prefer `supabase.auth.admin` API endpoints. Example:

```ts
const { error } = await supabase.auth.admin.deleteUser(userId)
// or use admin API to delete specific sessions if SDK exposes it
```

---

## Final notes

- Your project already includes a robust real-time layer (notifications/messages/bids).
- Auth flows (signup, login, reset) use Supabase SDK properly and sessions are managed via SSR helpers.
- The main gap is server-side session management for multi-device revocation and the wiring of the `SecurityDashboard` UI to real session data. Implementing those server endpoints using the service role key will close that gap.

If you'd like, I can:
- Implement server endpoints to list and revoke sessions and wire them to the `SecurityDashboard` UI.
- Add a `user_sessions` table migration and server-side hooks to populate it on login.
- Add a short example demonstrating revoking sessions via the admin key.

Which of the follow-up tasks do you want me to do next? (I can implement 1 or more.)
