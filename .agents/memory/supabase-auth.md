---
name: Supabase auth migration
description: Clerk was fully removed and replaced with Supabase Auth; covers env vars, hook locations, admin gate, and DATABASE_URL quirk
---

Auth is now Supabase Auth (email/password). Key facts:

**Frontend**
- `artifacts/nexora/src/lib/supabase.ts` — creates supabase client using `VITE_SUPABASE_URL` + `VITE_SUPABASE_ANON_KEY`
- `artifacts/nexora/src/lib/auth.tsx` — `AuthProvider` + `useAuth()` hook (replaces `useUser`/`useClerk`)
- `useAuth()` returns `{ user, session, isLoaded, signOut }` — use `user.email` for admin check
- Sign-in/sign-up are custom pages at `/sign-in` and `/sign-up`
- `@layer clerk` removed from `index.css` — now `@layer theme, base, components, utilities;`

**Backend**
- `artifacts/api-server/src/lib/supabase.ts` — supabase admin client using `SUPABASE_SERVICE_ROLE_KEY`
- `verifyToken(token)` — extracts Bearer token from `Authorization` header, calls `supabaseAdmin.auth.getUser()`
- `requireAdmin` middleware in `admin.ts` uses `verifyToken` + email check (no more Clerk `getAuth`)
- Clerk proxy middleware file deleted entirely; `app.ts` has no Clerk imports

**Admin gate**
- Client: `useAuth().user?.email === ADMIN_EMAIL`
- Server: `verifyToken(token)` → check `user.email` in `ADMIN_EMAILS` array
- Frontend passes `session.access_token` as `Authorization: Bearer <token>` on admin API calls

**Database connection**
- `lib/db/src/index.ts` prefers `SUPABASE_DATABASE_URL` over `DATABASE_URL`
- `DATABASE_URL` is runtime-managed by Replit (points to Replit's internal Postgres) — cannot be overridden via env tools
- `SUPABASE_DATABASE_URL` is set as a shared env var with the Supabase connection string + `ssl: { rejectUnauthorized: false }`

**Why:** DATABASE_URL is locked by Replit runtime; SUPABASE_DATABASE_URL is the workaround to point Drizzle at Supabase.

**Env vars required**
- Secrets: `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`
- Shared env: `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, `SUPABASE_DATABASE_URL`

**Removed packages**
- `@clerk/react`, `@clerk/themes` (frontend)
- `@clerk/express`, `@clerk/shared`, `http-proxy-middleware` (backend)

**Storage discipline**
- `search_logs` and `ai_request_logs` tables/inserts removed — analytics waste on free 500MB Supabase tier
- RLS enabled on all user-data tables: `saved_places`, `saved_insights`, `saved_journeys`, `saved_maps`, `city_watchlist`
