---
name: Clerk setup quirks
description: Key Clerk auth setup rules for this Nexora project (Vite + Tailwind v4)
---

- `publishableKey` must use `publishableKeyFromHost(window.location.hostname, import.meta.env.VITE_CLERK_PUBLISHABLE_KEY)` from `@clerk/react/internal` — never raw env var
- `proxyUrl={import.meta.env.VITE_CLERK_PROXY_URL}` is unconditional — empty in dev (intentional), auto-set in prod
- `tailwindcss({ optimize: false })` in `vite.config.ts` required for Clerk themes in prod builds
- `@layer theme, base, clerk, components, utilities;` must come BEFORE `@import 'tailwindcss'` in index.css
- Route pattern must be exactly `/sign-in/*?` and `/sign-up/*?` — the `/*?` wildcard handles OAuth sub-paths
- `<SignIn path>` and `<SignUp path>` props need full browser path including basePath
- Admin gate is client-side only via `useUser()` email check for `xyzapplywork@gmail.com`
- Clerk app ID: `app_3FWmdHt3cg8GjfVXxjU1agjpzMV`

**Why:** Getting any of these wrong causes 404s, broken OAuth, or Clerk UI invisible in prod.

**How to apply:** Any time Clerk auth is touched or the auth flow breaks, check these points first.
