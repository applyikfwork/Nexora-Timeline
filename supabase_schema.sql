-- ============================================================
-- Nexora — Supabase SQL Schema (FINAL)
-- Run this in: Supabase Dashboard → SQL Editor → New Query
-- ============================================================
-- Storage plan: Keep only what users care about.
-- REMOVED: search_logs, ai_request_logs (analytics waste)
-- KEPT WITH LIMITS: ai_cache (auto-purge), chat_messages (capped per session)
-- ============================================================

-- 1. AI response cache (saves Gemini quota — 24h TTL)
CREATE TABLE IF NOT EXISTS ai_cache (
  id            SERIAL PRIMARY KEY,
  cache_key     TEXT NOT NULL UNIQUE,
  request_type  TEXT NOT NULL,
  place_id      TEXT,
  response_json TEXT NOT NULL,
  expires_at    TIMESTAMPTZ NOT NULL,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_ai_cache_key     ON ai_cache (cache_key);
CREATE INDEX IF NOT EXISTS idx_ai_cache_expires ON ai_cache (expires_at);
CREATE INDEX IF NOT EXISTS idx_ai_cache_place   ON ai_cache (place_id) WHERE place_id IS NOT NULL;

-- 2. Chat history (stores AI conversations per session)
--    Auto-purge: keep only last 30 messages per session
CREATE TABLE IF NOT EXISTS chat_messages (
  id            SERIAL PRIMARY KEY,
  session_id    TEXT NOT NULL,
  role          TEXT NOT NULL DEFAULT 'user',
  content       TEXT NOT NULL,
  place_context TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_chat_session ON chat_messages (session_id, created_at DESC);

-- 3. Saved places (user's curated location list)
CREATE TABLE IF NOT EXISTS saved_places (
  id          SERIAL PRIMARY KEY,
  user_id     UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  session_id  TEXT,
  place_id    TEXT NOT NULL,
  place_name  TEXT NOT NULL,
  country     TEXT NOT NULL DEFAULT '',
  lat         DOUBLE PRECISION NOT NULL,
  lng         DOUBLE PRECISION NOT NULL,
  notes       TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_saved_places_user    ON saved_places (user_id);
CREATE INDEX IF NOT EXISTS idx_saved_places_session ON saved_places (session_id);

-- 4. Saved AI insights (per user or session)
CREATE TABLE IF NOT EXISTS saved_insights (
  id          SERIAL PRIMARY KEY,
  user_id     UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  session_id  TEXT,
  location    TEXT NOT NULL,
  score       INTEGER NOT NULL DEFAULT 0,
  summary     TEXT NOT NULL,
  radar_json  TEXT,
  saved_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_saved_insights_user    ON saved_insights (user_id);
CREATE INDEX IF NOT EXISTS idx_saved_insights_session ON saved_insights (session_id, saved_at DESC);

-- 5. Saved time machine journeys (per user or session)
CREATE TABLE IF NOT EXISTS saved_journeys (
  id          SERIAL PRIMARY KEY,
  user_id     UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  session_id  TEXT,
  location    TEXT NOT NULL,
  from_year   INTEGER NOT NULL,
  to_year     INTEGER NOT NULL,
  view        TEXT NOT NULL DEFAULT 'past',
  notes_json  TEXT,
  saved_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_saved_journeys_user    ON saved_journeys (user_id);
CREATE INDEX IF NOT EXISTS idx_saved_journeys_session ON saved_journeys (session_id, saved_at DESC);

-- 6. Saved heatmaps (per user or session)
CREATE TABLE IF NOT EXISTS saved_maps (
  id          SERIAL PRIMARY KEY,
  user_id     UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  session_id  TEXT,
  location    TEXT NOT NULL,
  layers_json TEXT NOT NULL DEFAULT '[]',
  time_of_day TEXT NOT NULL DEFAULT 'Evening',
  saved_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_saved_maps_user    ON saved_maps (user_id);
CREATE INDEX IF NOT EXISTS idx_saved_maps_session ON saved_maps (session_id, saved_at DESC);

-- 7. City watchlist (smart alerts per user or session)
CREATE TABLE IF NOT EXISTS city_watchlist (
  id              SERIAL PRIMARY KEY,
  user_id         UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  session_id      TEXT,
  city_name       TEXT NOT NULL,
  country_code    TEXT NOT NULL DEFAULT 'IN',
  current_score   INTEGER DEFAULT 0,
  alert_threshold INTEGER DEFAULT 80,
  alert_type      TEXT NOT NULL DEFAULT 'score_change',
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_watchlist_user ON city_watchlist (user_id);

-- 8. India Intelligence cache (separate from ai_cache for structured data)
CREATE TABLE IF NOT EXISTS india_intelligence (
  id           SERIAL PRIMARY KEY,
  city_name    TEXT NOT NULL,
  state        TEXT NOT NULL,
  category     TEXT NOT NULL,
  data_json    TEXT NOT NULL,
  source_label TEXT NOT NULL DEFAULT 'AI Analysis',
  valid_until  TIMESTAMPTZ,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (city_name, category)
);

-- 9. Admin settings (key-value config store)
CREATE TABLE IF NOT EXISTS admin_settings (
  id          SERIAL PRIMARY KEY,
  key         TEXT NOT NULL UNIQUE,
  value       TEXT NOT NULL,
  description TEXT,
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 10. Feature flags
CREATE TABLE IF NOT EXISTS feature_flags (
  id          SERIAL PRIMARY KEY,
  name        TEXT NOT NULL UNIQUE,
  enabled     TEXT NOT NULL DEFAULT 'true',
  description TEXT,
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- Seed default admin settings
-- ============================================================
INSERT INTO admin_settings (key, value, description) VALUES
  ('gemini_model',      'gemini-2.0-flash-exp', 'Gemini model to use for AI features'),
  ('cache_ttl_hours',   '24',                   'AI cache TTL in hours'),
  ('max_ai_calls_free', '10',                   'Max AI calls per session (free users)'),
  ('india_focus',       'true',                 'Prioritise Indian cities in defaults')
ON CONFLICT (key) DO NOTHING;

INSERT INTO feature_flags (name, enabled, description) VALUES
  ('india_intelligence', 'true', 'Festival calendar, monsoon data, metro deep dives'),
  ('city_comparison',    'true', 'Side-by-side AI city comparison'),
  ('business_intel',     'true', 'Market entry, rental yield, competitor density'),
  ('leaderboards',       'true', 'Top 10 Indian cities ranking'),
  ('ai_cache_24h',       'true', 'Cache AI responses for 24 hours to save Gemini quota'),
  ('city_score_share',   'true', 'Share city scores as image cards')
ON CONFLICT (name) DO NOTHING;

-- ============================================================
-- Row Level Security (RLS) — protect user data
-- ============================================================
ALTER TABLE saved_places   ENABLE ROW LEVEL SECURITY;
ALTER TABLE saved_insights ENABLE ROW LEVEL SECURITY;
ALTER TABLE saved_journeys ENABLE ROW LEVEL SECURITY;
ALTER TABLE saved_maps     ENABLE ROW LEVEL SECURITY;
ALTER TABLE city_watchlist ENABLE ROW LEVEL SECURITY;

-- Logged-in users only see their own rows
CREATE POLICY "Users see own saved_places"   ON saved_places   FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users see own saved_insights" ON saved_insights FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users see own saved_journeys" ON saved_journeys FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users see own saved_maps"     ON saved_maps     FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users see own city_watchlist" ON city_watchlist FOR ALL USING (auth.uid() = user_id);

-- ============================================================
-- Auto-cleanup: delete expired AI cache entries
-- Run manually or via Supabase cron (Pro plan):
-- ============================================================
-- SELECT cron.schedule(
--   'purge-ai-cache',
--   '0 3 * * *',
--   $$DELETE FROM ai_cache WHERE expires_at < NOW()$$
-- );
--
-- Manual cleanup (run in SQL editor when needed):
-- DELETE FROM ai_cache WHERE expires_at < NOW();
-- DELETE FROM chat_messages WHERE created_at < NOW() - INTERVAL '7 days';
-- ============================================================
