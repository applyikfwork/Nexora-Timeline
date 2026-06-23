-- ============================================================
-- Nexora — Supabase SQL Schema (FULLY ADDITIVE MIGRATION)
-- Safe to run on a fresh DB OR on top of an existing schema.
-- Run in: Supabase Dashboard → SQL Editor → New Query
-- ============================================================
-- Strategy:
--   1. CREATE TABLE IF NOT EXISTS (id + created_at only)
--   2. ALTER TABLE ADD COLUMN IF NOT EXISTS for every other col
--   3. CREATE INDEX IF NOT EXISTS (after columns are guaranteed)
--   4. Enable RLS + recreate policies
-- ============================================================

-- -------------------------------------------------------
-- 1. AI cache
-- -------------------------------------------------------
CREATE TABLE IF NOT EXISTS ai_cache (
  id SERIAL PRIMARY KEY,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
ALTER TABLE ai_cache ADD COLUMN IF NOT EXISTS cache_key     TEXT NOT NULL DEFAULT '';
ALTER TABLE ai_cache ADD COLUMN IF NOT EXISTS request_type  TEXT NOT NULL DEFAULT '';
ALTER TABLE ai_cache ADD COLUMN IF NOT EXISTS place_id      TEXT;
ALTER TABLE ai_cache ADD COLUMN IF NOT EXISTS response_json TEXT NOT NULL DEFAULT '';
ALTER TABLE ai_cache ADD COLUMN IF NOT EXISTS expires_at    TIMESTAMPTZ NOT NULL DEFAULT NOW();

CREATE UNIQUE INDEX IF NOT EXISTS idx_ai_cache_key     ON ai_cache (cache_key);
CREATE INDEX        IF NOT EXISTS idx_ai_cache_expires ON ai_cache (expires_at);
CREATE INDEX        IF NOT EXISTS idx_ai_cache_place   ON ai_cache (place_id) WHERE place_id IS NOT NULL;

-- -------------------------------------------------------
-- 2. Chat messages
-- -------------------------------------------------------
CREATE TABLE IF NOT EXISTS chat_messages (
  id SERIAL PRIMARY KEY,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
ALTER TABLE chat_messages ADD COLUMN IF NOT EXISTS session_id    TEXT NOT NULL DEFAULT '';
ALTER TABLE chat_messages ADD COLUMN IF NOT EXISTS role          TEXT NOT NULL DEFAULT 'user';
ALTER TABLE chat_messages ADD COLUMN IF NOT EXISTS content       TEXT NOT NULL DEFAULT '';
ALTER TABLE chat_messages ADD COLUMN IF NOT EXISTS place_context TEXT;

CREATE INDEX IF NOT EXISTS idx_chat_session ON chat_messages (session_id, created_at DESC);

-- -------------------------------------------------------
-- 3. Saved places
-- -------------------------------------------------------
CREATE TABLE IF NOT EXISTS saved_places (
  id SERIAL PRIMARY KEY,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
ALTER TABLE saved_places ADD COLUMN IF NOT EXISTS user_id    UUID REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE saved_places ADD COLUMN IF NOT EXISTS session_id TEXT;
ALTER TABLE saved_places ADD COLUMN IF NOT EXISTS place_id   TEXT NOT NULL DEFAULT '';
ALTER TABLE saved_places ADD COLUMN IF NOT EXISTS place_name TEXT NOT NULL DEFAULT '';
ALTER TABLE saved_places ADD COLUMN IF NOT EXISTS country    TEXT NOT NULL DEFAULT '';
ALTER TABLE saved_places ADD COLUMN IF NOT EXISTS lat        DOUBLE PRECISION NOT NULL DEFAULT 0;
ALTER TABLE saved_places ADD COLUMN IF NOT EXISTS lng        DOUBLE PRECISION NOT NULL DEFAULT 0;
ALTER TABLE saved_places ADD COLUMN IF NOT EXISTS notes      TEXT;

CREATE INDEX IF NOT EXISTS idx_saved_places_user    ON saved_places (user_id);
CREATE INDEX IF NOT EXISTS idx_saved_places_session ON saved_places (session_id);

-- -------------------------------------------------------
-- 4. Saved insights
-- -------------------------------------------------------
CREATE TABLE IF NOT EXISTS saved_insights (
  id SERIAL PRIMARY KEY,
  saved_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
ALTER TABLE saved_insights ADD COLUMN IF NOT EXISTS user_id    UUID REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE saved_insights ADD COLUMN IF NOT EXISTS session_id TEXT;
ALTER TABLE saved_insights ADD COLUMN IF NOT EXISTS location   TEXT NOT NULL DEFAULT '';
ALTER TABLE saved_insights ADD COLUMN IF NOT EXISTS score      INTEGER NOT NULL DEFAULT 0;
ALTER TABLE saved_insights ADD COLUMN IF NOT EXISTS summary    TEXT NOT NULL DEFAULT '';
ALTER TABLE saved_insights ADD COLUMN IF NOT EXISTS radar_json TEXT;

CREATE INDEX IF NOT EXISTS idx_saved_insights_user    ON saved_insights (user_id);
CREATE INDEX IF NOT EXISTS idx_saved_insights_session ON saved_insights (session_id, saved_at DESC);

-- -------------------------------------------------------
-- 5. Saved journeys
-- -------------------------------------------------------
CREATE TABLE IF NOT EXISTS saved_journeys (
  id SERIAL PRIMARY KEY,
  saved_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
ALTER TABLE saved_journeys ADD COLUMN IF NOT EXISTS user_id    UUID REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE saved_journeys ADD COLUMN IF NOT EXISTS session_id TEXT;
ALTER TABLE saved_journeys ADD COLUMN IF NOT EXISTS location   TEXT NOT NULL DEFAULT '';
ALTER TABLE saved_journeys ADD COLUMN IF NOT EXISTS from_year  INTEGER NOT NULL DEFAULT 2000;
ALTER TABLE saved_journeys ADD COLUMN IF NOT EXISTS to_year    INTEGER NOT NULL DEFAULT 2025;
ALTER TABLE saved_journeys ADD COLUMN IF NOT EXISTS view       TEXT NOT NULL DEFAULT 'past';
ALTER TABLE saved_journeys ADD COLUMN IF NOT EXISTS notes_json TEXT;

CREATE INDEX IF NOT EXISTS idx_saved_journeys_user    ON saved_journeys (user_id);
CREATE INDEX IF NOT EXISTS idx_saved_journeys_session ON saved_journeys (session_id, saved_at DESC);

-- -------------------------------------------------------
-- 6. Saved maps
-- -------------------------------------------------------
CREATE TABLE IF NOT EXISTS saved_maps (
  id SERIAL PRIMARY KEY,
  saved_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
ALTER TABLE saved_maps ADD COLUMN IF NOT EXISTS user_id     UUID REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE saved_maps ADD COLUMN IF NOT EXISTS session_id  TEXT;
ALTER TABLE saved_maps ADD COLUMN IF NOT EXISTS location    TEXT NOT NULL DEFAULT '';
ALTER TABLE saved_maps ADD COLUMN IF NOT EXISTS layers_json TEXT NOT NULL DEFAULT '[]';
ALTER TABLE saved_maps ADD COLUMN IF NOT EXISTS time_of_day TEXT NOT NULL DEFAULT 'Evening';

CREATE INDEX IF NOT EXISTS idx_saved_maps_user    ON saved_maps (user_id);
CREATE INDEX IF NOT EXISTS idx_saved_maps_session ON saved_maps (session_id, saved_at DESC);

-- -------------------------------------------------------
-- 7. City watchlist
-- -------------------------------------------------------
CREATE TABLE IF NOT EXISTS city_watchlist (
  id SERIAL PRIMARY KEY,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
ALTER TABLE city_watchlist ADD COLUMN IF NOT EXISTS user_id         UUID REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE city_watchlist ADD COLUMN IF NOT EXISTS session_id      TEXT;
ALTER TABLE city_watchlist ADD COLUMN IF NOT EXISTS city_name       TEXT NOT NULL DEFAULT '';
ALTER TABLE city_watchlist ADD COLUMN IF NOT EXISTS country_code    TEXT NOT NULL DEFAULT 'IN';
ALTER TABLE city_watchlist ADD COLUMN IF NOT EXISTS current_score   INTEGER DEFAULT 0;
ALTER TABLE city_watchlist ADD COLUMN IF NOT EXISTS alert_threshold INTEGER DEFAULT 80;
ALTER TABLE city_watchlist ADD COLUMN IF NOT EXISTS alert_type      TEXT NOT NULL DEFAULT 'score_change';

CREATE INDEX IF NOT EXISTS idx_watchlist_user ON city_watchlist (user_id);

-- Drop old Clerk column if it somehow still exists
DO $$ BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'city_watchlist' AND column_name = 'clerk_user_id'
  ) THEN
    ALTER TABLE city_watchlist DROP COLUMN clerk_user_id;
  END IF;
END $$;

-- -------------------------------------------------------
-- 8. India intelligence cache
-- -------------------------------------------------------
CREATE TABLE IF NOT EXISTS india_intelligence (
  id SERIAL PRIMARY KEY,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
ALTER TABLE india_intelligence ADD COLUMN IF NOT EXISTS city_name    TEXT NOT NULL DEFAULT '';
ALTER TABLE india_intelligence ADD COLUMN IF NOT EXISTS state        TEXT NOT NULL DEFAULT '';
ALTER TABLE india_intelligence ADD COLUMN IF NOT EXISTS category     TEXT NOT NULL DEFAULT '';
ALTER TABLE india_intelligence ADD COLUMN IF NOT EXISTS data_json    TEXT NOT NULL DEFAULT '';
ALTER TABLE india_intelligence ADD COLUMN IF NOT EXISTS source_label TEXT NOT NULL DEFAULT 'AI Analysis';
ALTER TABLE india_intelligence ADD COLUMN IF NOT EXISTS valid_until  TIMESTAMPTZ;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'india_intelligence_city_category_unique'
  ) THEN
    ALTER TABLE india_intelligence ADD CONSTRAINT india_intelligence_city_category_unique UNIQUE (city_name, category);
  END IF;
END $$;

-- -------------------------------------------------------
-- 9. Admin settings
-- -------------------------------------------------------
CREATE TABLE IF NOT EXISTS admin_settings (
  id SERIAL PRIMARY KEY,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
ALTER TABLE admin_settings ADD COLUMN IF NOT EXISTS key         TEXT NOT NULL DEFAULT '';
ALTER TABLE admin_settings ADD COLUMN IF NOT EXISTS value       TEXT NOT NULL DEFAULT '';
ALTER TABLE admin_settings ADD COLUMN IF NOT EXISTS description TEXT;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'admin_settings_key_key'
  ) THEN
    ALTER TABLE admin_settings ADD CONSTRAINT admin_settings_key_key UNIQUE (key);
  END IF;
END $$;

-- -------------------------------------------------------
-- 10. Feature flags
-- -------------------------------------------------------
CREATE TABLE IF NOT EXISTS feature_flags (
  id SERIAL PRIMARY KEY,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
ALTER TABLE feature_flags ADD COLUMN IF NOT EXISTS name        TEXT NOT NULL DEFAULT '';
ALTER TABLE feature_flags ADD COLUMN IF NOT EXISTS enabled     TEXT NOT NULL DEFAULT 'true';
ALTER TABLE feature_flags ADD COLUMN IF NOT EXISTS description TEXT;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'feature_flags_name_key'
  ) THEN
    ALTER TABLE feature_flags ADD CONSTRAINT feature_flags_name_key UNIQUE (name);
  END IF;
END $$;

-- -------------------------------------------------------
-- Drop old unused analytics tables
-- -------------------------------------------------------
DROP TABLE IF EXISTS search_logs;
DROP TABLE IF EXISTS ai_request_logs;

-- -------------------------------------------------------
-- Seed defaults (idempotent)
-- -------------------------------------------------------
INSERT INTO admin_settings (key, value, description) VALUES
  ('gemini_model',      'gemini-2.0-flash-exp', 'Gemini model for AI features'),
  ('cache_ttl_hours',   '24',                   'AI cache TTL in hours'),
  ('max_ai_calls_free', '10',                   'Max AI calls per session (free users)'),
  ('india_focus',       'true',                 'Prioritise Indian cities in defaults')
ON CONFLICT (key) DO NOTHING;

INSERT INTO feature_flags (name, enabled, description) VALUES
  ('india_intelligence', 'true', 'Festival calendar, monsoon data, metro deep dives'),
  ('city_comparison',    'true', 'Side-by-side AI city comparison'),
  ('business_intel',     'true', 'Market entry, rental yield, competitor density'),
  ('leaderboards',       'true', 'Top 10 Indian cities ranking'),
  ('ai_cache_24h',       'true', 'Cache AI responses for 24h to save Gemini quota'),
  ('city_score_share',   'true', 'Share city scores as image cards')
ON CONFLICT (name) DO NOTHING;

-- -------------------------------------------------------
-- Row Level Security
-- -------------------------------------------------------
ALTER TABLE saved_places   ENABLE ROW LEVEL SECURITY;
ALTER TABLE saved_insights ENABLE ROW LEVEL SECURITY;
ALTER TABLE saved_journeys ENABLE ROW LEVEL SECURITY;
ALTER TABLE saved_maps     ENABLE ROW LEVEL SECURITY;
ALTER TABLE city_watchlist ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users see own saved_places"   ON saved_places;
DROP POLICY IF EXISTS "Users see own saved_insights" ON saved_insights;
DROP POLICY IF EXISTS "Users see own saved_journeys" ON saved_journeys;
DROP POLICY IF EXISTS "Users see own saved_maps"     ON saved_maps;
DROP POLICY IF EXISTS "Users see own city_watchlist" ON city_watchlist;

CREATE POLICY "Users see own saved_places"   ON saved_places   FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users see own saved_insights" ON saved_insights FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users see own saved_journeys" ON saved_journeys FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users see own saved_maps"     ON saved_maps     FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users see own city_watchlist" ON city_watchlist FOR ALL USING (auth.uid() = user_id);

-- -------------------------------------------------------
-- Manual cleanup (run these periodically to save storage):
-- DELETE FROM ai_cache WHERE expires_at < NOW();
-- DELETE FROM chat_messages WHERE created_at < NOW() - INTERVAL '7 days';
-- -------------------------------------------------------
