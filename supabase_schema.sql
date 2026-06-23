-- ============================================================
-- Nexora — Supabase SQL Schema
-- Run this in: Supabase Dashboard → SQL Editor → New Query
-- ============================================================

-- 1. AI response cache (saves Gemini quota by reusing results)
CREATE TABLE IF NOT EXISTS ai_cache (
  id            SERIAL PRIMARY KEY,
  cache_key     TEXT NOT NULL UNIQUE,
  request_type  TEXT NOT NULL,
  place_id      TEXT,
  response_json TEXT NOT NULL,
  expires_at    TIMESTAMPTZ NOT NULL,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for fast cache lookups and expiry cleanup
CREATE INDEX IF NOT EXISTS idx_ai_cache_key      ON ai_cache (cache_key);
CREATE INDEX IF NOT EXISTS idx_ai_cache_expires  ON ai_cache (expires_at);
CREATE INDEX IF NOT EXISTS idx_ai_cache_place    ON ai_cache (place_id) WHERE place_id IS NOT NULL;

-- 2. Chat history (stores AI conversations per session)
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
  place_id    TEXT NOT NULL,
  place_name  TEXT NOT NULL,
  country     TEXT NOT NULL DEFAULT '',
  lat         DOUBLE PRECISION NOT NULL,
  lng         DOUBLE PRECISION NOT NULL,
  notes       TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. Search analytics log
CREATE TABLE IF NOT EXISTS search_logs (
  id            SERIAL PRIMARY KEY,
  query         TEXT NOT NULL,
  result_count  INTEGER NOT NULL DEFAULT 0,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 5. AI request audit log
CREATE TABLE IF NOT EXISTS ai_request_logs (
  id               SERIAL PRIMARY KEY,
  request_type     TEXT NOT NULL,
  place_id         TEXT,
  place_name       TEXT,
  response_time_ms INTEGER,
  cached           TEXT NOT NULL DEFAULT 'false',
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ai_logs_type    ON ai_request_logs (request_type);
CREATE INDEX IF NOT EXISTS idx_ai_logs_created ON ai_request_logs (created_at DESC);

-- 6. Saved AI insights (per session)
CREATE TABLE IF NOT EXISTS saved_insights (
  id          SERIAL PRIMARY KEY,
  session_id  TEXT NOT NULL,
  location    TEXT NOT NULL,
  score       INTEGER NOT NULL DEFAULT 0,
  summary     TEXT NOT NULL,
  radar_json  TEXT,
  saved_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_saved_insights_session ON saved_insights (session_id, saved_at DESC);

-- 7. Saved time machine journeys (per session)
CREATE TABLE IF NOT EXISTS saved_journeys (
  id          SERIAL PRIMARY KEY,
  session_id  TEXT NOT NULL,
  location    TEXT NOT NULL,
  from_year   INTEGER NOT NULL,
  to_year     INTEGER NOT NULL,
  view        TEXT NOT NULL DEFAULT 'past',
  notes_json  TEXT,
  saved_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_saved_journeys_session ON saved_journeys (session_id, saved_at DESC);

-- 8. Saved heatmaps (per session)
CREATE TABLE IF NOT EXISTS saved_maps (
  id          SERIAL PRIMARY KEY,
  session_id  TEXT NOT NULL,
  location    TEXT NOT NULL,
  layers_json TEXT NOT NULL DEFAULT '[]',
  time_of_day TEXT NOT NULL DEFAULT 'Evening',
  saved_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_saved_maps_session ON saved_maps (session_id, saved_at DESC);

-- ============================================================
-- Optional: auto-delete expired AI cache entries daily
-- (Supabase Pro supports pg_cron; on Free tier run manually)
-- ============================================================
-- SELECT cron.schedule(
--   'purge-ai-cache',
--   '0 3 * * *',
--   $$DELETE FROM ai_cache WHERE expires_at < NOW()$$
-- );
