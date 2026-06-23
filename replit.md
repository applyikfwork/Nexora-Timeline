# Nexora

India-first location intelligence platform — AI-powered city insights, metro deep dives, real estate intelligence, and location analysis for every place on Earth.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server (port 8080)
- `pnpm --filter @workspace/nexora run dev` — run the frontend (port from $PORT)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- Required env: `DATABASE_URL` — Postgres connection string

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- Frontend: React + Vite + Tailwind v4 + Framer Motion + Wouter
- API: Express 5 + Clerk Auth middleware
- DB: PostgreSQL + Drizzle ORM
- Auth: Clerk (Replit-managed, appId: app_3FWmdHt3cg8GjfVXxjU1agjpzMV)
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
- `artifacts/nexora/src/components/layout/` — Sidebar, AppLayout, MobileBottomNav
- `artifacts/api-server/src/routes/` — All API route handlers

## Architecture decisions

- **India-first** — All ranking data, festival calendars, and business intelligence defaults to Indian cities
- **24h AI Cache** — Factual AI responses cached for 1440 minutes in PostgreSQL to conserve Gemini quota
- **Admin gate** — Admin panel at `/admin` is email-gated client-side to `xyzapplywork@gmail.com` via Clerk `useUser()`
- **Clerk proxy** — `clerkProxyMiddleware` on `/api/__clerk` so the same Express server handles both API and Clerk OAuth callbacks
- **Session-based persistence** — Non-authenticated users identified by `nexora_session_id` in localStorage

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
- Clerk `publishableKey` must use `publishableKeyFromHost()` from `@clerk/react/internal` — never the raw env var
- `tailwindcss({ optimize: false })` in vite.config.ts is required for Clerk themes to work in prod builds
- `@layer theme, base, clerk, components, utilities;` must precede `@import 'tailwindcss'` in index.css
- `pnpm --filter @workspace/nexora run typecheck` not `build` for verifying artifact (build needs workflow PORT/BASE_PATH)

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
- See the `clerk-auth` skill for auth setup details
