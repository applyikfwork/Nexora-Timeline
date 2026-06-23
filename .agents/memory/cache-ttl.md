---
name: Cache TTL strategy
description: AI response cache TTL decisions for api-server routes
---

- Factual content (city stories, comparisons, itineraries, personality, vibe-cards, reports): **1440 min (24h)**
- Time-sensitive content (crowd forecasts, live alerts scan, timeline "today" mode): **30-60 min**
- Semi-stable content (event summaries): **360 min (6h)**

**Why:** Gemini free tier has limited quota. Caching factual AI responses for 24h dramatically reduces API calls without sacrificing accuracy (cities don't change day-to-day).

**How to apply:** When adding new AI-powered routes, default to 1440 for any query about stable city facts. Only use lower TTLs for queries explicitly about current/live/today state.
