# Nexora

India-first location intelligence platform — AI-powered city insights, metro deep dives, real estate intelligence, and location analysis for every place on Earth.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server (port 8080)
- `pnpm --filter @workspace/nexora run dev` — run the frontend (port from $PORT)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- Required env: `SUPABASE_DATABASE_URL` — Supabase Postgres connection string (falls back to `DATABASE_URL`)

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- Frontend: React + Vite + Tailwind v4 + Framer Motion + Wouter
- API: Express 5 + Supabase Auth middleware
- DB: Supabase PostgreSQL + Drizzle ORM
- Auth: Supabase Auth (email/password, JWT tokens)
- AI: Gemini 2.0 Flash via GEMINI_API_KEY
- Validation: Zod (v4), drizzle-zod
- API codegen: Orval (from OpenAPI spec)
- Build: esbuild (CJS bundle)

## Where things live

- `artifacts/nexora/` — React/Vite frontend
- `artifacts/api-server/` — Express 5 API server
- `lib/db/src/schema/` — Drizzle ORM schema (source of truth for DB)
- `lib/api-spec/` — OpenAPI spec (source of truth for API contracts)
- `lib/api-client-react/` — Generated React Query hooks
- `lib/api-zod/` — Generated Zod schemas
- `artifacts/nexora/src/pages/` — All page components
- `artifacts/nexora/src/lib/auth.tsx` — Supabase AuthProvider + useAuth hook
- `artifacts/nexora/src/lib/supabase.ts` — Supabase client (frontend, uses VITE_SUPABASE_*)
- `artifacts/api-server/src/lib/supabase.ts` — Supabase admin client (backend, uses SERVICE_ROLE_KEY)
- `artifacts/nexora/src/components/layout/` — Sidebar, AppLayout, MobileBottomNav
- `artifacts/api-server/src/routes/` — All API route handlers

## Architecture decisions

- **India-first** — All ranking data, festival calendars, and business intelligence defaults to Indian cities
- **24h AI Cache** — Factual AI responses cached for 1440 minutes in PostgreSQL to conserve Gemini quota
- **Admin gate** — Admin panel at `/admin` is email-gated to `xyzapplywork@gmail.com` via `useAuth()` user email check
- **Supabase Auth** — JWT tokens from Supabase Auth; backend verifies via `verifyToken()` using service role key
- **Session-based persistence** — Non-authenticated users identified by `nexora_session_id` in localStorage
- **Storage discipline** — `search_logs` and `ai_request_logs` tables removed to save Supabase free tier (500MB)

## Product

- **Home** — Hero with live city ticker, search bar, 18 AI feature highlights
- **India Intelligence** (`/india`) — Metro deep dives, festival calendar, monsoon data, state business climate, Tier 2 rising cities
- **City Comparison** (`/compare`) — AI side-by-side scoring of any two cities on 6 dimensions
- **City Leaderboard** (`/leaderboard`) — Top 10 India + Global city rankings with live AI refresh
- **Business Intelligence** (`/business`) — Market entry analysis, rental yield tables by city
- **Admin Panel** (`/admin`) — System stats, cache management, feature flags, settings (admin-only)
- **Explore Map** (`/map`) — Interactive map with heatlayers and place search
- **AI Assistant** (`/chat`) — Conversational AI with location context
- **Time Machine** — Historical city vibe analysis
- **Viral Hub** — City vibe cards and battle-mode comparisons

## User preferences

- Admin email: `xyzapplywork@gmail.com`
- India-first positioning — prioritize Indian cities in defaults and examples
- Dark purple/violet theme throughout

## Gotchas

- Cache TTL for AI routes: factual routes = 1440min (24h), time-sensitive routes (crowd, alerts) = 60min
- `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` must be set as shared env vars for the frontend to connect to Supabase
- `SUPABASE_SERVICE_ROLE_KEY` is used server-side only (never expose to frontend)
- `lib/db/src/index.ts` prefers `SUPABASE_DATABASE_URL` over `DATABASE_URL` (Replit's built-in Postgres)
- `pnpm --filter @workspace/nexora run typecheck` not `build` for verifying artifact (build needs workflow PORT/BASE_PATH)
- `@layer theme, base, components, utilities;` in index.css (clerk layer removed)
- `tailwindcss({ optimize: false })` in vite.config.ts is still required for reliable Tailwind v4 prod builds

## Supabase Schema

Run `supabase_schema.sql` in Supabase Dashboard → SQL Editor. Tables kept (storage-optimised):
- `ai_cache` — 24h TTL AI response cache (purge expired rows regularly)
- `chat_messages` — AI chat history per session (purge rows > 7 days old)
- `saved_places`, `saved_insights`, `saved_journeys`, `saved_maps` — user saves (RLS enabled)
- `city_watchlist` — smart alert subscriptions (RLS enabled)
- `india_intelligence` — structured India city data cache
- `admin_settings`, `feature_flags` — platform config

Tables intentionally NOT used (removed to save storage):
- `search_logs` — analytics waste, not user-facing
- `ai_request_logs` — audit logs, not user-facing

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
