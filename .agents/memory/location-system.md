---
name: Global Location Intelligence System
description: Architecture and wiring for Nexora's Phase 1–5 location system (locationContext, LocationSwitcher, bridge to AppContext)
---

# Location System Architecture

## Detection priority (Phase 1 + 3 + 5)
1. `localStorage` (`nexora_loc_v2_active`) — zero friction for returning users
2. Browser GPS → `findNearestCity()` from `useGeolocation.ts` — city-level only, 15 major cities
3. IP geo via `ipapi.co` — city-level, cached 4h in `nexora_loc_v2_detected`
4. Default: `"Delhi, India"` (never user's personal neighborhood)

## Key files
- `artifacts/nexora/src/lib/locationContext.tsx` — single source of truth, `LocationProvider + useLocation + useActiveLocation`
- `artifacts/nexora/src/components/LocationSwitcher.tsx` — universal pill + dropdown, `TravelAlertToast`
- `artifacts/nexora/src/App.tsx` — `LocationBridge` component syncs `location.city → setActivePlaceName` in AppContext

## Bridge pattern (backward compat)
`LocationBridge` lives inside `<LocationProvider><AppProvider>` nesting in `App.tsx`.
It reads `useLocation().location.city` and calls `setActivePlaceName()` on change.
All pages using `activePlaceName` from `useAppContext()` get the detected location automatically.

## Why `LocationBridge` not context merge
AppContext (store.tsx) was too entangled to merge — safer to keep separate and bridge via effect.
The bridge is a React component not a hook so it can be placed inside both providers.

## Pages updated
- **AlertNetwork**: uses `useGlobalLocation()` directly (has live sync via `useEffect`)
- **Insights, TimeMachine, Heatmaps**: Add `useEffect` to sync when `activePlaceName` changes (guards `!location` to avoid clobbering manual searches)
- **CrowdForecast, CityPortfolio, CityReporter**: `useAppContext().activePlaceName` pre-fills search input (guards `!searchInput`)

## Storage keys
`nexora_loc_v2_active`, `nexora_loc_v2_home`, `nexora_loc_v2_recent`, `nexora_loc_v2_saved`, `nexora_loc_v2_detected`

**Why:** Previous session had `nexora_session_id` cache pollution with "Nangloi" in AI cache keys. The new system ensures the default is "Delhi" (major city) not any personal location.

## Travel alert (Phase 5)
If GPS/IP detects a city different from saved home, shows `TravelAlertToast` inside `AppLayout`.
User can accept (switch to detected) or dismiss. No auto-switch.

## Explore Mode (Phase 3)
When `location.city !== homeLocation.city`, `isExploring = true`.
LocationSwitcher pill switches to telescope icon + "Exploring [City]" label.
"← Home" quick-return button appears below the pill.
