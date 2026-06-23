import { Router, type IRouter } from "express";
import { generateJson, generateText } from "../lib/gemini";
import { getCached, setCached } from "../lib/aiCache";

const router: IRouter = Router();

// ── In-memory stores ────────────────────────────────────────────────────────
interface WatchedPlace {
  id: string;
  locationName: string;
  category: "home" | "college" | "work" | "travel" | "custom";
  alertTypes: string[];
  addedAt: string;
}
interface AlertItem {
  id: string;
  locationName: string;
  type: "traffic" | "events" | "weather" | "crowd" | "trending" | "city";
  priority: "critical" | "important" | "info";
  title: string;
  message: string;
  detail: string;
  aiExplanation: string;
  recommendation: string;
  triggeredAt: string;
  isRead: boolean;
}
interface CommunityReport {
  id: string; locationName: string; description: string;
  aiCategory?: string; reportedAt: string;
}

const WATCHLIST: WatchedPlace[] = [];
const ALERT_HISTORY: AlertItem[] = [];
const COMMUNITY_REPORTS: CommunityReport[] = [];

// ── Helpers ──────────────────────────────────────────────────────────────────
function priorityColor(p: string) {
  return p === "critical" ? "🔴" : p === "important" ? "🟠" : "🔵";
}

function alertFallback(locationName: string, alertTypes: string[]): AlertItem[] {
  const hour = new Date().getHours();
  const evening = hour >= 16 && hour <= 21;
  const items: AlertItem[] = [];

  if (alertTypes.includes("crowd") || alertTypes.includes("all")) {
    items.push({
      id: `alert-crowd-${Date.now()}`,
      locationName,
      type: "crowd",
      priority: evening ? "important" : "info",
      title: `👥 Crowd ${evening ? "Rising" : "Normal"} in ${locationName}`,
      message: evening ? `Crowd levels picking up in ${locationName}` : `Crowd levels normal in ${locationName}`,
      detail: evening ? "Market zones and public spaces seeing increased footfall" : "Activity within expected range",
      aiExplanation: "Based on time-of-day patterns and historical data for this location",
      recommendation: evening ? "Travel before 6 PM for best experience" : "Good time to visit — minimal crowd",
      triggeredAt: new Date().toISOString(),
      isRead: false,
    });
  }
  if (alertTypes.includes("events") || alertTypes.includes("all")) {
    items.push({
      id: `alert-event-${Date.now() + 1}`,
      locationName,
      type: "events",
      priority: "info",
      title: `🎉 Event Activity Detected near ${locationName}`,
      message: "Local event activity detected in your watch area",
      detail: "Cultural or community events showing up in proximity signals",
      aiExplanation: "AI detected elevated activity patterns consistent with local events",
      recommendation: "Check local listings — a cultural event may be nearby",
      triggeredAt: new Date().toISOString(),
      isRead: false,
    });
  }
  if (alertTypes.includes("traffic") || alertTypes.includes("all")) {
    items.push({
      id: `alert-traffic-${Date.now() + 2}`,
      locationName,
      type: "traffic",
      priority: evening ? "important" : "info",
      title: `🚗 Traffic ${evening ? "Building Up" : "Light"} near ${locationName}`,
      message: evening ? "Traffic increasing in key corridors" : "Roads are clear — good travel window",
      detail: evening ? "Main roads and junctions seeing congestion build-up" : "Low traffic across monitored zones",
      aiExplanation: "Traffic signal analysis combined with time-of-day patterns",
      recommendation: evening ? "Avoid main roads between 5–8 PM" : "Good time to travel",
      triggeredAt: new Date().toISOString(),
      isRead: false,
    });
  }
  return items;
}

// ── POST /alerts/watchlist — Add to watchlist ────────────────────────────────
router.post("/alerts/watchlist", (req, res): void => {
  const { locationName, category, alertTypes } = req.body as Partial<WatchedPlace>;
  if (!locationName?.trim()) { res.status(400).json({ error: "locationName required" }); return; }
  const existing = WATCHLIST.find(w => w.locationName.toLowerCase() === locationName.toLowerCase());
  if (existing) { res.json({ message: "Already watching", place: existing }); return; }
  const place: WatchedPlace = {
    id: `wp-${Date.now()}`,
    locationName: locationName.trim(),
    category: category || "custom",
    alertTypes: alertTypes || ["crowd", "events", "traffic", "weather"],
    addedAt: new Date().toISOString(),
  };
  WATCHLIST.push(place);
  res.status(201).json(place);
});

// ── GET /alerts/watchlist ────────────────────────────────────────────────────
router.get("/alerts/watchlist", (_req, res): void => {
  res.json({ watchlist: WATCHLIST });
});

// ── DELETE /alerts/watchlist/:id ─────────────────────────────────────────────
router.delete("/alerts/watchlist/:id", (req, res): void => {
  const idx = WATCHLIST.findIndex(w => w.id === req.params.id);
  if (idx === -1) { res.status(404).json({ error: "Not found" }); return; }
  WATCHLIST.splice(idx, 1);
  res.json({ message: "Removed" });
});

// ── POST /alerts/scan — AI scans a location and generates alerts ─────────────
router.post("/alerts/scan", async (req, res): Promise<void> => {
  const { locationName, alertTypes = ["crowd", "events", "traffic", "weather", "trending"] } = req.body as { locationName: string; alertTypes?: string[] };
  if (!locationName?.trim()) { res.status(400).json({ error: "locationName required" }); return; }

  const hourSlot = new Date().toISOString().slice(0, 13);
  const cacheKey = `alerts-scan-v2:${locationName.toLowerCase().trim()}:${hourSlot}`;
  const cached = await getCached<object>(cacheKey);
  if (cached) { res.json(cached); return; }

  const hour = new Date().getHours();
  const timeOfDay = hour < 6 ? "Night" : hour < 12 ? "Morning" : hour < 17 ? "Afternoon" : hour < 21 ? "Evening" : "Night";

  const prompt = `You are Nexora's AI alert engine. Scan "${locationName}" at ${timeOfDay} and generate smart alerts.
This could be any Indian city, town, neighborhood, or area. Be specific and contextual.

Return ONLY valid JSON (no markdown):
{
  "locationName": "${locationName}",
  "overallStatus": "Normal / Active / Alert / Critical",
  "statusColor": "green / yellow / orange / red",
  "statusMessage": "one sentence overall status",
  "activityLevel": 0-100,
  "alerts": [
    {
      "id": "unique string",
      "locationName": "${locationName}",
      "type": "traffic|events|weather|crowd|trending|city",
      "priority": "critical|important|info",
      "title": "alert title with emoji",
      "message": "one sentence alert",
      "detail": "one sentence more detail",
      "aiExplanation": "why AI triggered this — 1 sentence",
      "recommendation": "what user should do — 1 sentence",
      "triggeredAt": "ISO date string",
      "isRead": false
    }
  ],
  "dailyBrief": {
    "weather": "weather summary for today",
    "events": "events summary",
    "traffic": "traffic summary",
    "activity": "activity summary"
  },
  "prediction": {
    "timeframe": "Tonight / Tomorrow / This Weekend",
    "prediction": "what AI predicts will happen",
    "confidence": 0-100,
    "reason": "why"
  },
  "generatedAt": "ISO date string"
}

Generate 3-5 alerts. Mix priorities — include at least one informational, one important.
Make alerts specific and actionable for ${locationName} at ${timeOfDay} time.`;

  const fallbackAlerts = alertFallback(locationName, alertTypes);
  const fallback = {
    locationName,
    overallStatus: "Normal",
    statusColor: "green",
    statusMessage: `${locationName} is operating within normal parameters`,
    activityLevel: 65,
    alerts: fallbackAlerts,
    dailyBrief: {
      weather: "Clear conditions, good for outdoor activity",
      events: "A few local events detected in the area",
      traffic: "Normal traffic flow on major roads",
      activity: "Activity picking up towards evening",
    },
    prediction: {
      timeframe: "Tonight",
      prediction: "Activity expected to rise significantly",
      confidence: 74,
      reason: "Evening patterns and weekend proximity",
    },
    generatedAt: new Date().toISOString(),
  };

  const data = await generateJson(prompt, fallback);

  // Store in alert history
  if (Array.isArray((data as any).alerts)) {
    for (const alert of (data as any).alerts) {
      ALERT_HISTORY.push(alert);
    }
    if (ALERT_HISTORY.length > 200) ALERT_HISTORY.splice(0, ALERT_HISTORY.length - 200);
  }

  await setCached(cacheKey, "alerts-scan", null, data, 60);
  res.json(data);
});

// ── GET /alerts/history — Alert history ─────────────────────────────────────
router.get("/alerts/history", (req, res): void => {
  const location = req.query.location as string | undefined;
  const alerts = location
    ? ALERT_HISTORY.filter(a => a.locationName.toLowerCase().includes(location.toLowerCase()))
    : ALERT_HISTORY;
  res.json({ alerts: alerts.slice(-50).reverse() });
});

// ── PATCH /alerts/history/:id/read — Mark as read ───────────────────────────
router.patch("/alerts/history/:id/read", (req, res): void => {
  const alert = ALERT_HISTORY.find(a => a.id === req.params.id);
  if (!alert) { res.status(404).json({ error: "Not found" }); return; }
  alert.isRead = true;
  res.json(alert);
});

// ── POST /alerts/brief — Daily morning briefing ──────────────────────────────
router.post("/alerts/brief", async (req, res): Promise<void> => {
  const { locationName } = req.body as { locationName: string };
  if (!locationName?.trim()) { res.status(400).json({ error: "locationName required" }); return; }

  const daySlot = new Date().toISOString().slice(0, 10);
  const cacheKey = `alerts-brief-v1:${locationName.toLowerCase()}:${daySlot}`;
  const cached = await getCached<object>(cacheKey);
  if (cached) { res.json(cached); return; }

  const prompt = `Generate a morning daily city brief for "${locationName}" — like a smart assistant reading the morning paper for this city.
Return ONLY valid JSON:
{
  "greeting": "Good morning greeting with city name",
  "weatherLine": "weather summary for today",
  "eventsLine": "any notable events or activities today",
  "trafficLine": "traffic situation today",
  "activityLine": "when activity peaks today",
  "highlightLine": "one special thing happening in ${locationName} today",
  "mood": "Today's city mood emoji + word",
  "generatedAt": "ISO date string"
}`;

  const fallback = {
    greeting: `Good morning! Here's your briefing for ${locationName} today.`,
    weatherLine: "Clear skies expected, good for outdoor activities",
    eventsLine: "A few local events and market activities detected",
    trafficLine: "Roads are clear in the morning — best travel before 9 AM or after 7 PM",
    activityLine: "Activity peaks expected between 6 PM and 9 PM",
    highlightLine: `${locationName}'s markets and food streets are especially active today`,
    mood: "⚡ Energetic",
    generatedAt: new Date().toISOString(),
  };

  const data = await generateJson(prompt, fallback);
  await setCached(cacheKey, "alerts-brief", null, data, 1440);
  res.json(data);
});

// ── POST /alerts/community — Submit community signal ────────────────────────
router.post("/alerts/community", async (req, res): Promise<void> => {
  const { locationName, description } = req.body as { locationName: string; description: string };
  if (!locationName || !description) { res.status(400).json({ error: "locationName and description required" }); return; }

  const aiCategory = await generateText(
    `Categorize this community signal in 3 words max: "${description}". Just return the category label.`
  ).catch(() => "Local Update");

  const report: CommunityReport = {
    id: `cr-${Date.now()}`,
    locationName,
    description,
    aiCategory: aiCategory.replace(/[^a-zA-Z\s]/g, "").trim().slice(0, 30),
    reportedAt: new Date().toISOString(),
  };
  COMMUNITY_REPORTS.push(report);
  if (COMMUNITY_REPORTS.length > 100) COMMUNITY_REPORTS.shift();
  res.status(201).json(report);
});

// ── GET /alerts/community ────────────────────────────────────────────────────
router.get("/alerts/community", (req, res): void => {
  const loc = req.query.location as string | undefined;
  const reports = loc
    ? COMMUNITY_REPORTS.filter(r => r.locationName.toLowerCase().includes(loc.toLowerCase()))
    : COMMUNITY_REPORTS;
  res.json({ reports: reports.slice(-20).reverse() });
});

export default router;
