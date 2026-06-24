import { Router, type IRouter } from "express";
import { db, aiCacheTable, adminSettingsTable, featureFlagsTable } from "@workspace/db";
import { sql, count, eq, lt, gt } from "drizzle-orm";
import { verifyToken, supabaseAdmin } from "../lib/supabase";
import { getApiKey, saveApiKey, getKeyStatus, invalidateKey } from "../lib/apiKeyService";
import { logger } from "../lib/logger";

const router: IRouter = Router();
const ADMIN_EMAILS = ["xyzapplywork@gmail.com"];

async function requireAdmin(req: any, res: any, next: any) {
  const token = (req.headers.authorization as string | undefined)?.startsWith("Bearer ")
    ? (req.headers.authorization as string).slice(7)
    : null;
  if (!token) return res.status(401).json({ error: "Unauthorized" });
  const user = await verifyToken(token);
  if (!user || !ADMIN_EMAILS.includes(user.email ?? "")) return res.status(403).json({ error: "Forbidden" });
  (req as any).adminUser = user;
  next();
}

// ── Public config (no auth) ────────────────────────────────────────────────
router.get("/config/public", async (_req, res): Promise<void> => {
  const mapboxToken = await getApiKey("mapbox");
  res.json({ mapboxToken: mapboxToken ?? null });
});

// ── Stats overview ─────────────────────────────────────────────────────────
router.get("/admin/stats", requireAdmin, async (_req, res): Promise<void> => {
  try {
    const now = new Date();
    const [total] = await db.select({ count: count() }).from(aiCacheTable);
    const [expired] = await db.select({ count: count() }).from(aiCacheTable).where(lt(aiCacheTable.expiresAt, now));
    const [active] = await db.select({ count: count() }).from(aiCacheTable).where(gt(aiCacheTable.expiresAt, now));

    let userCount = 0;
    try {
      const { data } = await supabaseAdmin.auth.admin.listUsers({ page: 1, perPage: 1 });
      userCount = data?.users?.length ?? 0;
    } catch {}

    res.json({
      totalCacheEntries: total?.count ?? 0,
      activeCacheEntries: active?.count ?? 0,
      expiredCacheEntries: expired?.count ?? 0,
      userCount,
    });
  } catch {
    res.json({ totalCacheEntries: 0, activeCacheEntries: 0, expiredCacheEntries: 0, userCount: 0 });
  }
});

// ── AI Usage breakdown ─────────────────────────────────────────────────────
router.get("/admin/usage", requireAdmin, async (_req, res): Promise<void> => {
  try {
    const byType = await db
      .select({ type: aiCacheTable.requestType, count: count() })
      .from(aiCacheTable)
      .groupBy(aiCacheTable.requestType)
      .orderBy(sql`count(*) desc`)
      .limit(20);

    const recent = await db
      .select({ cacheKey: aiCacheTable.cacheKey, requestType: aiCacheTable.requestType, createdAt: aiCacheTable.createdAt })
      .from(aiCacheTable)
      .orderBy(sql`${aiCacheTable.createdAt} desc`)
      .limit(10);

    const [totalSize] = await db
      .select({ avgLen: sql<number>`avg(length(${aiCacheTable.responseJson}))`, total: count() })
      .from(aiCacheTable);

    const estimatedKB = Math.round(((totalSize?.avgLen ?? 0) * (totalSize?.total ?? 0)) / 1024);

    res.json({ byType, recent, estimatedKB });
  } catch (err) {
    logger.error({ err }, "Admin usage error");
    res.json({ byType: [], recent: [], estimatedKB: 0 });
  }
});

// ── Cache management ───────────────────────────────────────────────────────
router.get("/admin/cache", requireAdmin, async (req, res): Promise<void> => {
  try {
    const typeFilter = req.query.type as string | undefined;
    let query = db
      .select({ id: aiCacheTable.id, request_type: aiCacheTable.requestType, cache_key: aiCacheTable.cacheKey, expires_at: aiCacheTable.expiresAt, created_at: aiCacheTable.createdAt })
      .from(aiCacheTable)
      .$dynamic();

    if (typeFilter) {
      query = query.where(eq(aiCacheTable.requestType, typeFilter));
    }
    const entries = await query.orderBy(sql`${aiCacheTable.createdAt} desc`).limit(100);
    res.json(entries);
  } catch {
    res.json([]);
  }
});

router.delete("/admin/cache", requireAdmin, async (_req, res): Promise<void> => {
  try {
    await db.delete(aiCacheTable);
    res.json({ success: true, message: "All cache cleared" });
  } catch {
    res.status(500).json({ error: "Failed to clear cache" });
  }
});

router.delete("/admin/cache/expired", requireAdmin, async (_req, res): Promise<void> => {
  try {
    await db.delete(aiCacheTable).where(lt(aiCacheTable.expiresAt, new Date()));
    res.json({ success: true, message: "Expired entries cleared" });
  } catch {
    res.status(500).json({ error: "Failed to clear expired cache" });
  }
});

router.delete("/admin/cache/type/:type", requireAdmin, async (req, res): Promise<void> => {
  try {
    await db.delete(aiCacheTable).where(eq(aiCacheTable.requestType, req.params.type));
    res.json({ success: true });
  } catch {
    res.status(500).json({ error: "Failed" });
  }
});

// ── API Key management ─────────────────────────────────────────────────────
const API_KEYS_META = [
  { name: "gemini", label: "Google Gemini", description: "Powers all AI intelligence features", required: true, getUrl: "https://aistudio.google.com/", envVar: "GEMINI_API_KEY" },
  { name: "mapbox", label: "Mapbox", description: "Interactive maps, geocoding, place search", required: true, getUrl: "https://account.mapbox.com/", envVar: "MAPBOX_ACCESS_TOKEN" },
  { name: "openweather", label: "OpenWeatherMap", description: "Real weather data for alerts & overlays", required: false, getUrl: "https://home.openweathermap.org/api_keys", envVar: "OPENWEATHER_API_KEY" },
  { name: "serpapi", label: "SerpAPI", description: "Real business density & place data", required: false, getUrl: "https://serpapi.com/manage-api-key", envVar: "SERPAPI_KEY" },
  { name: "gnews", label: "GNews", description: "Alert Network: Real news headlines (free tier: 100/day)", required: false, getUrl: "https://gnews.io/", envVar: "GNEWS_API_KEY" },
  { name: "newsapi", label: "NewsAPI", description: "Alert Network: News headlines fallback", required: false, getUrl: "https://newsapi.org/register", envVar: "NEWSAPI_KEY" },
  { name: "weatherapi", label: "WeatherAPI", description: "Alert Network: Weather alerts (alternative to OpenWeather)", required: false, getUrl: "https://www.weatherapi.com/signup.aspx", envVar: "WEATHERAPI_KEY" },
];

router.get("/admin/api-keys", requireAdmin, async (_req, res): Promise<void> => {
  try {
    const statuses = await Promise.all(
      API_KEYS_META.map(async (k) => {
        const status = await getKeyStatus(k.name);
        return { ...k, ...status };
      })
    );
    res.json(statuses);
  } catch (err) {
    logger.error({ err }, "api-keys status error");
    res.status(500).json({ error: "Failed" });
  }
});

router.post("/admin/api-keys/:name", requireAdmin, async (req, res): Promise<void> => {
  const { name } = req.params;
  const { value } = req.body as { value?: string };
  if (!value?.trim()) { res.status(400).json({ error: "Value required" }); return; }
  if (!API_KEYS_META.find(k => k.name === name)) { res.status(400).json({ error: "Unknown key" }); return; }
  try {
    await saveApiKey(name, value.trim());
    res.json({ success: true });
  } catch (err) {
    logger.error({ err }, "save api key error");
    res.status(500).json({ error: "Failed to save key" });
  }
});

router.delete("/admin/api-keys/:name", requireAdmin, async (req, res): Promise<void> => {
  const { name } = req.params;
  try {
    await db.delete(adminSettingsTable).where(eq(adminSettingsTable.key, `api_key_${name}`));
    invalidateKey(name);
    res.json({ success: true });
  } catch {
    res.status(500).json({ error: "Failed" });
  }
});

router.post("/admin/api-keys/:name/test", requireAdmin, async (req, res): Promise<void> => {
  const { name } = req.params;
  const key = await getApiKey(name);
  if (!key) { res.json({ success: false, error: "Key not configured" }); return; }

  const start = Date.now();
  try {
    if (name === "gemini") {
      const { GoogleGenerativeAI } = await import("@google/generative-ai");
      const g = new GoogleGenerativeAI(key);
      const model = g.getGenerativeModel({ model: "gemini-2.0-flash" });
      await model.generateContent("Say: ok");
    } else if (name === "mapbox") {
      const r = await fetch(`https://api.mapbox.com/geocoding/v5/mapbox.places/Mumbai.json?access_token=${key}&limit=1`);
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
    } else if (name === "openweather") {
      const r = await fetch(`https://api.openweathermap.org/data/2.5/weather?q=Mumbai&appid=${key}`);
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
    } else if (name === "serpapi") {
      const r = await fetch(`https://serpapi.com/search.json?q=Mumbai+restaurants&api_key=${key}&num=1`);
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
    }
    res.json({ success: true, latency: Date.now() - start });
  } catch (err) {
    res.json({ success: false, error: String((err as Error).message), latency: Date.now() - start });
  }
});

// ── Users ──────────────────────────────────────────────────────────────────
router.get("/admin/users", requireAdmin, async (req, res): Promise<void> => {
  try {
    const page = Number(req.query.page ?? 1);
    const { data, error } = await supabaseAdmin.auth.admin.listUsers({ page, perPage: 50 });
    if (error) throw error;
    res.json({
      total: data.users.length,
      users: data.users.map(u => ({
        id: u.id,
        email: u.email,
        created_at: u.created_at,
        last_sign_in_at: u.last_sign_in_at,
        confirmed: !!u.email_confirmed_at,
      })),
    });
  } catch (err) {
    logger.error({ err }, "list users error");
    res.json({ total: 0, users: [] });
  }
});

// ── Feature flags ──────────────────────────────────────────────────────────
const DEFAULT_FLAGS = [
  { name: "india_intelligence", enabled: "true", description: "Festival calendar, monsoon data, metro deep dives" },
  { name: "city_comparison", enabled: "true", description: "Side-by-side AI city comparison" },
  { name: "business_intel", enabled: "true", description: "Market entry, rental yield, competitor density" },
  { name: "leaderboards", enabled: "true", description: "Top 10 Indian cities ranking" },
  { name: "ai_cache_24h", enabled: "true", description: "Cache AI responses 24h to save Gemini quota" },
  { name: "city_score_share", enabled: "true", description: "Share city scores as image cards" },
  { name: "world_pulse", enabled: "true", description: "Live global trend monitoring" },
  { name: "time_machine", enabled: "true", description: "Historical city timeline explorer" },
  { name: "smart_alerts", enabled: "true", description: "City watch alerts (uses AI quota)" },
  { name: "crowd_forecast", enabled: "true", description: "AI crowd density predictions" },
];

router.get("/admin/feature-flags", requireAdmin, async (_req, res): Promise<void> => {
  try {
    const dbFlags = await db.select().from(featureFlagsTable);
    const flagMap = new Map(dbFlags.map(f => [f.name, f]));
    const merged = DEFAULT_FLAGS.map(d => ({
      name: d.name,
      enabled: flagMap.get(d.name)?.enabled === "true" || (!flagMap.has(d.name) && d.enabled === "true"),
      description: d.description,
      inDb: flagMap.has(d.name),
    }));
    res.json(merged);
  } catch {
    res.json(DEFAULT_FLAGS.map(f => ({ ...f, enabled: f.enabled === "true", inDb: false })));
  }
});

router.post("/admin/feature-flags/:name", requireAdmin, async (req, res): Promise<void> => {
  const { name } = req.params;
  const { enabled } = req.body as { enabled: boolean };
  try {
    await db
      .insert(featureFlagsTable)
      .values({ name, enabled: enabled ? "true" : "false", description: DEFAULT_FLAGS.find(f => f.name === name)?.description ?? "" })
      .onConflictDoUpdate({ target: featureFlagsTable.name, set: { enabled: enabled ? "true" : "false", updatedAt: new Date() } });
    res.json({ success: true });
  } catch (err) {
    logger.error({ err }, "toggle feature flag error");
    res.status(500).json({ error: "Failed" });
  }
});

// ── Announcement ───────────────────────────────────────────────────────────
router.get("/admin/announcement", async (_req, res): Promise<void> => {
  try {
    const [row] = await db.select().from(adminSettingsTable).where(eq(adminSettingsTable.key, "announcement"));
    res.json({ message: row?.value ?? null });
  } catch {
    res.json({ message: null });
  }
});

router.post("/admin/announcement", requireAdmin, async (req, res): Promise<void> => {
  const { message } = req.body as { message?: string };
  if (!message?.trim()) { res.status(400).json({ error: "Message required" }); return; }
  try {
    await db
      .insert(adminSettingsTable)
      .values({ key: "announcement", value: message.trim(), description: "System announcement" })
      .onConflictDoUpdate({ target: adminSettingsTable.key, set: { value: message.trim(), updatedAt: new Date() } });
    res.json({ success: true });
  } catch {
    res.status(500).json({ error: "Failed" });
  }
});

router.delete("/admin/announcement", requireAdmin, async (_req, res): Promise<void> => {
  try {
    await db.delete(adminSettingsTable).where(eq(adminSettingsTable.key, "announcement"));
    res.json({ success: true });
  } catch {
    res.status(500).json({ error: "Failed" });
  }
});

export default router;
