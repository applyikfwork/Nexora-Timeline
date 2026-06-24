import { Router, type IRouter } from "express";
import { generateJson, generateText } from "../lib/gemini";
import { getCached, setCached } from "../lib/aiCache";
import { getApiKey } from "../lib/apiKeyService";
import { logger } from "../lib/logger";

const router: IRouter = Router();

// ── Types ─────────────────────────────────────────────────────────────────────
export type AlertCategory = "student" | "scam" | "weather" | "traffic" | "public" | "utility" | "health" | "general";
export type AlertLevel = "area" | "city" | "state" | "national";
export type VerificationStatus = "verified" | "likely" | "community" | "developing";
export type Severity = "critical" | "high" | "medium" | "low";

export interface AlertNetworkItem {
  id: string;
  title: string;
  category: AlertCategory;
  level: AlertLevel;
  location: string;
  severity: Severity;
  importanceScore: number;
  aiSummary: string;
  whatHappened: string;
  whyItMatters: string;
  whoAffected: string;
  recommendedAction: string;
  verificationStatus: VerificationStatus;
  sources: string[];
  publishedAt: string;
  isAiGenerated: boolean;
}

export interface CommunityReport {
  id: string;
  location: string;
  description: string;
  category: string;
  confidence: number;
  reportedAt: string;
  isDuplicate: boolean;
}

export interface WatchlistEntry {
  id: string;
  label: string;
  location: string;
  categories: AlertCategory[];
  addedAt: string;
}

// ── In-memory stores ──────────────────────────────────────────────────────────
const COMMUNITY_REPORTS: CommunityReport[] = [];
const WATCHLISTS: WatchlistEntry[] = [];

// ── External data helpers ─────────────────────────────────────────────────────
async function fetchNewsHeadlines(query: string): Promise<string[]> {
  const headlines: string[] = [];
  try {
    const gnewsKey = await getApiKey("gnews");
    if (gnewsKey) {
      const url = `https://gnews.io/api/v4/search?q=${encodeURIComponent(query)}&country=in&lang=en&max=10&token=${gnewsKey}`;
      const r = await fetch(url, { signal: AbortSignal.timeout(5000) });
      if (r.ok) {
        const d = await r.json() as { articles?: { title: string; description: string }[] };
        for (const a of d.articles ?? []) {
          if (a.title) headlines.push(a.title + (a.description ? ". " + a.description : ""));
        }
      }
    }
  } catch (err) {
    logger.warn({ err }, "GNews fetch failed");
  }
  if (headlines.length === 0) {
    try {
      const napiKey = await getApiKey("newsapi");
      if (napiKey) {
        const url = `https://newsapi.org/v2/everything?q=${encodeURIComponent(query)}&language=en&pageSize=10&apiKey=${napiKey}`;
        const r = await fetch(url, { signal: AbortSignal.timeout(5000) });
        if (r.ok) {
          const d = await r.json() as { articles?: { title: string; description: string }[] };
          for (const a of d.articles ?? []) {
            if (a.title) headlines.push(a.title + (a.description ? ". " + a.description : ""));
          }
        }
      }
    } catch (err) {
      logger.warn({ err }, "NewsAPI fetch failed");
    }
  }
  return headlines.slice(0, 10);
}

async function fetchWeatherContext(city: string): Promise<string> {
  try {
    const owKey = await getApiKey("openweather");
    if (owKey) {
      const url = `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(city)}&appid=${owKey}&units=metric`;
      const r = await fetch(url, { signal: AbortSignal.timeout(5000) });
      if (r.ok) {
        const d = await r.json() as { weather?: { description: string }[]; main?: { temp: number; humidity: number }; wind?: { speed: number } };
        const desc = d.weather?.[0]?.description ?? "clear";
        const temp = d.main?.temp ?? 0;
        const humidity = d.main?.humidity ?? 0;
        const wind = d.wind?.speed ?? 0;
        return `Current weather in ${city}: ${desc}, ${temp}°C, humidity ${humidity}%, wind ${wind} m/s.`;
      }
    }
    const wapiKey = await getApiKey("weatherapi");
    if (wapiKey) {
      const url = `https://api.weatherapi.com/v1/current.json?key=${wapiKey}&q=${encodeURIComponent(city)}&aqi=no`;
      const r = await fetch(url, { signal: AbortSignal.timeout(5000) });
      if (r.ok) {
        const d = await r.json() as { current?: { condition?: { text: string }; temp_c?: number; humidity?: number; wind_kph?: number } };
        const cur = d.current ?? {};
        return `Current weather in ${city}: ${cur.condition?.text ?? "clear"}, ${cur.temp_c ?? 0}°C, humidity ${cur.humidity ?? 0}%, wind ${cur.wind_kph ?? 0} kph.`;
      }
    }
  } catch (err) {
    logger.warn({ err }, "Weather fetch failed");
  }
  return "";
}

// ── Fallback alert data ───────────────────────────────────────────────────────
function buildFallback(location: string, level: AlertLevel): AlertNetworkItem[] {
  const now = new Date().toISOString();
  return [
    {
      id: `an-1-${Date.now()}`, title: `🎓 NEET / Board Exam Important Notice — ${location}`,
      category: "student", level, location, severity: "medium", importanceScore: 82,
      aiSummary: "Examination-related notice affecting students in the region. Stay updated with official sources.",
      whatHappened: "Examination board has issued a notice regarding upcoming exams.",
      whyItMatters: "Affects thousands of students preparing for competitive and board exams.",
      whoAffected: "Students across the state and district.", recommendedAction: "Check official examination board website for details.",
      verificationStatus: "likely", sources: ["AI Generated"], publishedAt: now, isAiGenerated: true,
    },
    {
      id: `an-2-${Date.now() + 1}`, title: `💰 UPI Scam Alert — Fake Customer Support Calls`,
      category: "scam", level: "national", location: "India", severity: "high", importanceScore: 91,
      aiSummary: "Fraudsters posing as bank or UPI support staff are calling users and asking for OTPs. Never share OTP.",
      whatHappened: "Surge in fake UPI customer support scam calls reported across India.",
      whyItMatters: "People are losing money through social engineering attacks on UPI apps.",
      whoAffected: "Anyone using UPI payments — PhonePe, GPay, Paytm, etc.",
      recommendedAction: "Never share OTP or PIN with anyone claiming to be from a bank. Disconnect such calls immediately.",
      verificationStatus: "verified", sources: ["Cybercrime Portal", "AI Generated"], publishedAt: now, isAiGenerated: true,
    },
    {
      id: `an-3-${Date.now() + 2}`, title: `🌧 Weather Advisory — ${location}`,
      category: "weather", level, location, severity: "medium", importanceScore: 74,
      aiSummary: "Weather conditions require monitoring. Light to moderate rain possible in the coming days.",
      whatHappened: "Meteorological department has issued an advisory for the region.",
      whyItMatters: "Rain and wind can affect outdoor plans, commute, and infrastructure.",
      whoAffected: "Residents and commuters in the region.", recommendedAction: "Carry umbrella, check road conditions before travel.",
      verificationStatus: "likely", sources: ["IMD", "AI Generated"], publishedAt: now, isAiGenerated: true,
    },
    {
      id: `an-4-${Date.now() + 3}`, title: `🚦 Traffic Disruption Reported — ${location}`,
      category: "traffic", level, location, severity: "low", importanceScore: 61,
      aiSummary: "Road diversions and congestion reported in parts of the city. Plan alternate routes.",
      whatHappened: "Road work or event-related closures causing congestion.",
      whyItMatters: "Commuters may face delays during peak hours.",
      whoAffected: "Daily commuters and drivers in the affected zone.",
      recommendedAction: "Avoid peak hours or take alternate routes. Check traffic apps before travel.",
      verificationStatus: "community", sources: ["Community Report", "AI Generated"], publishedAt: now, isAiGenerated: true,
    },
    {
      id: `an-5-${Date.now() + 4}`, title: `⚡ Power Outage Alert — Scheduled Maintenance`,
      category: "utility", level, location, severity: "low", importanceScore: 55,
      aiSummary: "Electricity board has scheduled maintenance work. Power cuts expected in select areas.",
      whatHappened: "Electricity distribution company announced scheduled maintenance.",
      whyItMatters: "Affects homes, businesses and water pumping stations.",
      whoAffected: "Residents in the maintenance zones.",
      recommendedAction: "Backup essential devices. Check with local electricity board for exact zones and timings.",
      verificationStatus: "developing", sources: ["AI Generated"], publishedAt: now, isAiGenerated: true,
    },
  ];
}

// ── GET /alert-network/feed ───────────────────────────────────────────────────
router.get("/alert-network/feed", async (req, res): Promise<void> => {
  const country = (req.query.country as string) || "India";
  const state = (req.query.state as string) || "";
  const city = (req.query.city as string) || "";
  const area = (req.query.area as string) || "";
  const level = ((req.query.level as string) || "city") as AlertLevel;
  const category = (req.query.category as string) || "all";

  const locationKey = [country, state, city, area].filter(Boolean).join(",") || "India";
  const hourSlot = new Date().toISOString().slice(0, 13);
  const cacheKey = `alert-network-feed-v2:${locationKey.toLowerCase()}:${level}:${hourSlot}`;
  const cached = await getCached<{ alerts: AlertNetworkItem[]; stats: object; generatedAt: string }>(cacheKey);
  if (cached) {
    const result = category === "all" ? cached : { ...cached, alerts: cached.alerts.filter(a => a.category === category) };
    res.json(result);
    return;
  }

  const focusLocation = city || state || country;
  const newsQuery = `${focusLocation} alert warning scam fraud weather traffic civic`;

  const [headlines, weatherCtx] = await Promise.all([
    fetchNewsHeadlines(newsQuery),
    city ? fetchWeatherContext(city) : Promise.resolve(""),
  ]);

  const communityContext = COMMUNITY_REPORTS
    .filter(r => r.location.toLowerCase().includes(focusLocation.toLowerCase()))
    .slice(-5)
    .map(r => `Community: "${r.description}" (${r.category})`)
    .join("\n");

  const prompt = `You are Nexora Alert Network — India's AI-powered public awareness system.
Generate a comprehensive alert feed for this location context:
- Country: ${country}
- State: ${state || "N/A"}
- City: ${city || "N/A"}
- Area/Neighborhood: ${area || "N/A"}
- Intelligence Level: ${level}
${weatherCtx ? `\nWeather: ${weatherCtx}` : ""}
${headlines.length > 0 ? `\nReal News Headlines (process these into alerts):\n${headlines.map((h, i) => `${i + 1}. ${h}`).join("\n")}` : ""}
${communityContext ? `\nCommunity Reports:\n${communityContext}` : ""}

Generate 6-10 alerts appropriate for this location and level. India-first focus.
Categories: student, scam, weather, traffic, public, utility, health, general
Levels: area (hyperlocal), city (city-wide), state (statewide), national (India-wide)
Severity: critical, high, medium, low
Verification: verified (official sources), likely (multiple signals), community (user reported), developing (emerging)

⚠️ IMPORTANT RULES:
- Never accuse named individuals or businesses of wrongdoing
- Label scam alerts as "AI Summary — Please verify through official sources"
- Use "Developing" status for unconfirmed reports
- Include both local and national alerts in the mix
- Real news headlines should be classified and summarized, not repeated verbatim

Return ONLY valid JSON:
{
  "alerts": [
    {
      "id": "an-unique-id",
      "title": "emoji + title (under 80 chars)",
      "category": "student|scam|weather|traffic|public|utility|health|general",
      "level": "area|city|state|national",
      "location": "specific location name",
      "severity": "critical|high|medium|low",
      "importanceScore": 0-100,
      "aiSummary": "1-2 sentence AI summary",
      "whatHappened": "What happened — 1 sentence",
      "whyItMatters": "Why it matters — 1 sentence",
      "whoAffected": "Who is affected — 1 sentence",
      "recommendedAction": "What should the user do — 1 sentence",
      "verificationStatus": "verified|likely|community|developing",
      "sources": ["source1", "source2"],
      "publishedAt": "ISO date string",
      "isAiGenerated": true
    }
  ],
  "stats": {
    "activeAlerts": 0,
    "localSignals": 0,
    "nationalAlerts": 0,
    "riskReports": 0
  },
  "generatedAt": "ISO date string"
}`;

  const fallback = {
    alerts: buildFallback(focusLocation, level),
    stats: { activeAlerts: 5, localSignals: 3, nationalAlerts: 2, riskReports: 1 },
    generatedAt: new Date().toISOString(),
  };

  const data = await generateJson(prompt, fallback);
  await setCached(cacheKey, "alert-network-feed", null, data, 60);

  const result = category === "all" ? data : { ...data, alerts: (data as any).alerts?.filter((a: any) => a.category === category) ?? [] };
  res.json(result);
});

// ── POST /alert-network/brief ─────────────────────────────────────────────────
router.post("/alert-network/brief", async (req, res): Promise<void> => {
  const { country = "India", state = "", city = "", area = "" } = req.body as Record<string, string>;
  const focusLocation = city || state || country;

  const daySlot = new Date().toISOString().slice(0, 10);
  const cacheKey = `alert-network-brief-v1:${focusLocation.toLowerCase()}:${daySlot}`;
  const cached = await getCached<object>(cacheKey);
  if (cached) { res.json(cached); return; }

  const weatherCtx = city ? await fetchWeatherContext(city) : "";
  const communityCount = COMMUNITY_REPORTS.filter(r =>
    r.location.toLowerCase().includes(focusLocation.toLowerCase())
  ).length;

  const prompt = `Generate a morning daily brief for "${focusLocation}" India for the Nexora Alert Network.
${weatherCtx ? `Current weather: ${weatherCtx}` : ""}
Local community reports count: ${communityCount}

Return ONLY valid JSON:
{
  "greeting": "Good morning message mentioning the city",
  "localAlerts": number,
  "nationalAlerts": number,
  "severeRisks": false,
  "weatherStatus": "weather summary in one line",
  "topAlert": "Most important alert in one line",
  "trafficStatus": "traffic summary",
  "examAlert": "any exam-related alert or empty string",
  "scamAlert": "any scam alert or empty string",
  "mood": "city mood emoji + word (e.g. ⚡ Energetic)",
  "advice": "one smart piece of advice for today",
  "generatedAt": "ISO date"
}`;

  const fallback = {
    greeting: `Good morning! Here's your Nexora brief for ${focusLocation} today.`,
    localAlerts: 3, nationalAlerts: 1, severeRisks: false,
    weatherStatus: "Clear skies expected. Good for outdoor activity.",
    topAlert: "No critical alerts at this time. Stay informed.",
    trafficStatus: "Normal traffic flow. Best travel window before 9 AM.",
    examAlert: "", scamAlert: "UPI scam calls reported — never share OTP.",
    mood: "⚡ Energetic", advice: "Stay alert, stay informed. Verify before you share.",
    generatedAt: new Date().toISOString(),
  };

  const data = await generateJson(prompt, fallback);
  await setCached(cacheKey, "alert-network-brief", null, data, 1440);
  res.json(data);
});

// ── POST /alert-network/forecast ──────────────────────────────────────────────
router.post("/alert-network/forecast", async (req, res): Promise<void> => {
  const { city = "", state = "", country = "India" } = req.body as Record<string, string>;
  const focusLocation = city || state || country;

  const hourSlot = new Date().toISOString().slice(0, 13);
  const cacheKey = `alert-network-forecast-v1:${focusLocation.toLowerCase()}:${hourSlot}`;
  const cached = await getCached<object>(cacheKey);
  if (cached) { res.json(cached); return; }

  const prompt = `Generate AI risk forecasts for "${focusLocation}", India for Nexora Alert Network.
Predict risks across different categories for the next 24-72 hours.

Return ONLY valid JSON:
{
  "forecasts": [
    {
      "category": "weather|traffic|scam|student|health|utility|public",
      "emoji": "category emoji",
      "prediction": "what might happen — 1 sentence",
      "confidence": 0-100,
      "timeframe": "Tonight|Tomorrow|This Weekend|Next 48h",
      "reason": "why AI predicts this — 1 sentence",
      "severity": "critical|high|medium|low"
    }
  ],
  "overallRiskLevel": "low|moderate|elevated|high",
  "overallRiskReason": "one sentence summary",
  "generatedAt": "ISO date"
}
Generate 4-6 forecasts. Be realistic and helpful.`;

  const fallback = {
    forecasts: [
      { category: "weather", emoji: "🌧", prediction: "Light to moderate rain possible.", confidence: 65, timeframe: "Tomorrow", reason: "Monsoon season patterns for this region.", severity: "low" },
      { category: "traffic", emoji: "🚦", prediction: "Increased congestion during evening peak hours.", confidence: 80, timeframe: "Tonight", reason: "Typical weekday evening traffic pattern.", severity: "medium" },
      { category: "scam", emoji: "💰", prediction: "UPI scam calls may increase near month-end.", confidence: 72, timeframe: "Next 48h", reason: "Historical pattern — scam activity spikes near salary credit dates.", severity: "high" },
    ],
    overallRiskLevel: "moderate",
    overallRiskReason: "Normal risk environment with some weather and traffic watch advisories.",
    generatedAt: new Date().toISOString(),
  };

  const data = await generateJson(prompt, fallback);
  await setCached(cacheKey, "alert-network-forecast", null, data, 60);
  res.json(data);
});

// ── POST /alert-network/community ─────────────────────────────────────────────
router.post("/alert-network/community", async (req, res): Promise<void> => {
  const { location, description, category } = req.body as { location: string; description: string; category?: string };
  if (!location?.trim() || !description?.trim()) {
    res.status(400).json({ error: "location and description required" });
    return;
  }

  const isDuplicate = COMMUNITY_REPORTS.some(r =>
    r.location.toLowerCase() === location.toLowerCase() &&
    r.description.toLowerCase().slice(0, 40) === description.toLowerCase().slice(0, 40)
  );

  const aiCategory = category || await generateText(
    `Classify this community alert report in 3 words or less: "${description}". Return only the category label.`
  ).catch(() => "Local Report");

  const confidence = isDuplicate ? 30 :
    description.length > 100 ? 75 :
    description.length > 50 ? 60 : 45;

  const report: CommunityReport = {
    id: `cr-${Date.now()}`,
    location: location.trim(),
    description: description.trim(),
    category: typeof aiCategory === "string" ? aiCategory.replace(/[^a-zA-Z\s]/g, "").trim().slice(0, 30) : "Local Report",
    confidence,
    reportedAt: new Date().toISOString(),
    isDuplicate,
  };

  COMMUNITY_REPORTS.push(report);
  if (COMMUNITY_REPORTS.length > 200) COMMUNITY_REPORTS.splice(0, COMMUNITY_REPORTS.length - 200);
  res.status(201).json(report);
});

// ── GET /alert-network/community ──────────────────────────────────────────────
router.get("/alert-network/community", (req, res): void => {
  const location = (req.query.location as string | undefined)?.toLowerCase();
  const reports = location
    ? COMMUNITY_REPORTS.filter(r => r.location.toLowerCase().includes(location))
    : COMMUNITY_REPORTS;
  res.json({ reports: reports.slice(-30).reverse() });
});

// ── Watchlist endpoints ────────────────────────────────────────────────────────
router.get("/alert-network/watchlist", (_req, res): void => {
  res.json({ watchlist: WATCHLISTS });
});

router.post("/alert-network/watchlist", (req, res): void => {
  const { label, location, categories } = req.body as Partial<WatchlistEntry>;
  if (!location?.trim()) { res.status(400).json({ error: "location required" }); return; }
  const existing = WATCHLISTS.find(w => w.location.toLowerCase() === location.toLowerCase());
  if (existing) { res.json({ message: "Already watching", entry: existing }); return; }
  const entry: WatchlistEntry = {
    id: `wl-${Date.now()}`,
    label: label?.trim() || location.trim(),
    location: location.trim(),
    categories: categories || ["student", "scam", "weather", "traffic"],
    addedAt: new Date().toISOString(),
  };
  WATCHLISTS.push(entry);
  if (WATCHLISTS.length > 50) WATCHLISTS.shift();
  res.status(201).json(entry);
});

router.delete("/alert-network/watchlist/:id", (req, res): void => {
  const idx = WATCHLISTS.findIndex(w => w.id === req.params.id);
  if (idx === -1) { res.status(404).json({ error: "Not found" }); return; }
  WATCHLISTS.splice(idx, 1);
  res.json({ message: "Removed" });
});

export default router;
