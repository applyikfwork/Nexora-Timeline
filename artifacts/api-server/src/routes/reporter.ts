import { Router, type IRouter } from "express";
import { generateJson, generateText } from "../lib/gemini";
import { getCached, setCached } from "../lib/aiCache";

const router: IRouter = Router();

// In-memory citizen reports
interface CitizenReport {
  id: string; cityName: string; location: string;
  type: "event" | "issue" | "discovery" | "recommendation";
  description: string; submittedAt: string; aiCategory?: string;
}
const CITIZEN_REPORTS: CitizenReport[] = [];

// Trending city searches (simple counter)
const SEARCH_COUNTS: Record<string, number> = {};

// ── Fallbacks ─────────────────────────────────────────────────────────────
function reportFallback(cityName: string) {
  const hour = new Date().getHours();
  const timeOfDay = hour < 6 ? "Night" : hour < 12 ? "Morning" : hour < 17 ? "Afternoon" : hour < 21 ? "Evening" : "Night";
  return {
    cityName,
    status: "Active",
    statusColor: "green",
    mood: "Vibrant",
    moodScore: 76,
    moodEmoji: "🔥",
    activityLevel: 78,
    aiConfidence: 84,
    headline: `${cityName} Alive — ${timeOfDay} Activity Report`,
    story: `${cityName} is experiencing its typical ${timeOfDay.toLowerCase()} rhythm today. The city's markets, transport corridors, and social spaces are active with moderate intensity. Local culture is visible across key areas, and the city's energy reflects a balanced mix of commerce, community, and culture. Conditions are favorable for most outdoor and indoor activities.`,
    keyAreas: ["Central Market Area", "Old City Quarter", "Business District", "Local Food Street"],
    signals: {
      traffic: { level: "Moderate", busyZones: ["City Center", "Railway Station area"], bestTime: "Before 6 PM or after 9 PM", icon: "🚗" },
      events: { count: 3, crowd: "Growing", peakTime: `${hour < 18 ? "7" : "9"} PM`, types: ["Local festival", "Market fair", "Cultural event"], icon: "🎉" },
      weather: { condition: "Clear", outdoorGood: true, airQuality: "Moderate", impactNote: "Good conditions for outdoor activities today", icon: "🌤️" },
      economy: { pulse: "Stable", businessActivity: "Normal", marketActivity: "Active", growthSignal: "Positive", icon: "📊" },
    },
    timeline: [
      { time: "6 AM", label: "Morning Pulse", activity: "Morning markets open, commute begins, tea stalls bustle", level: 45 },
      { time: "10 AM", label: "Business Hours", activity: "Peak office and business activity, markets busy", level: 72 },
      { time: "2 PM", label: "Afternoon", activity: "Post-lunch lull, reduced street activity", level: 55 },
      { time: "6 PM", label: "Evening Rush", activity: "Evening commute, markets surge, social gathering peaks", level: 88 },
      { time: "9 PM", label: "Night Life", activity: "Food streets active, restaurants full, cultural events", level: 70 },
      { time: "11 PM", label: "Night Wind-down", activity: "City quiets, late-night food stalls, minimal traffic", level: 30 },
    ],
    neighborhoods: [
      { name: "Old City", activity: 85, vibe: "Cultural", emoji: "🏛️", signal: "high" },
      { name: "New Area", activity: 72, vibe: "Commercial", emoji: "🏢", signal: "medium" },
      { name: "Market Zone", activity: 90, vibe: "Trade Hub", emoji: "🛍️", signal: "high" },
    ],
    localPulse: [
      "🔥 Food area activity rising in central zone",
      "🚗 Traffic picking up near station",
      "🎉 Local event activity detected",
      "☕ Café district seeing weekend crowd",
      "🌙 Night market preparing to open",
    ],
    historicalNote: `${cityName} has evolved over centuries. Historically a center of trade and culture, it carries deep heritage that shapes modern life. The city's character today reflects this layered history.`,
    futureForecast: {
      next7Days: [
        { signal: "Tourism", trend: "up", confidence: 78 },
        { signal: "Events", trend: "up", confidence: 82 },
        { signal: "Traffic", trend: "up", confidence: 75 },
        { signal: "Commerce", trend: "stable", confidence: 80 },
      ],
      overallOutlook: "Positive",
      aiNote: `${cityName} is trending upward in local activity over the next week.`,
    },
    generatedAt: new Date().toISOString(),
  };
}

// ── POST /reporter/report — Full city intelligence report ─────────────────
router.post("/reporter/report", async (req, res): Promise<void> => {
  const { cityName } = req.body as { cityName: string };
  if (!cityName?.trim()) { res.status(400).json({ error: "cityName required" }); return; }

  const key = cityName.toLowerCase().trim();
  SEARCH_COUNTS[key] = (SEARCH_COUNTS[key] || 0) + 1;

  const hourSlot = new Date().toISOString().slice(0, 13);
  const cacheKey = `reporter-full-v2:${key}:${hourSlot}`;
  const cached = await getCached<object>(cacheKey);
  if (cached) { res.json(cached); return; }

  const hour = new Date().getHours();
  const timeOfDay = hour < 6 ? "Night" : hour < 12 ? "Morning" : hour < 17 ? "Afternoon" : hour < 21 ? "Evening" : "Night";

  const prompt = `You are Nexora's AI City Reporter — India's most intelligent city intelligence platform.
Generate a comprehensive live intelligence report for "${cityName}" at ${timeOfDay} time.
This city could be anywhere — metro, Tier-2, small town, village, neighborhood, or landmark.
Always produce meaningful, specific content based on real knowledge of the place.

Return ONLY valid JSON (no markdown, no code blocks):
{
  "cityName": "${cityName}",
  "status": "Active / Quiet / Festive / Sleeping",
  "statusColor": "green / yellow / orange / blue",
  "mood": "Vibrant / Calm / Festive / Energetic / Relaxed / Buzzing / Tense",
  "moodScore": 0-100,
  "moodEmoji": "one emoji",
  "activityLevel": 0-100,
  "aiConfidence": 0-100,
  "headline": "punchy 8-12 word AI headline for this city today",
  "story": "3-4 sentence AI-written newspaper-style story about what's happening in this city today. Reference real landmarks, culture, events.",
  "keyAreas": ["4 actual well-known areas in this city"],
  "signals": {
    "traffic": { "level": "Low/Moderate/High/Very High", "busyZones": ["2 real zones"], "bestTime": "travel advice", "icon": "🚗" },
    "events": { "count": 1-8, "crowd": "Growing/Steady/Declining", "peakTime": "time", "types": ["type1","type2"], "icon": "🎉" },
    "weather": { "condition": "weather state", "outdoorGood": true/false, "airQuality": "Good/Moderate/Poor", "impactNote": "one sentence", "icon": "🌤️" },
    "economy": { "pulse": "Strong/Stable/Slow", "businessActivity": "Active/Normal/Quiet", "marketActivity": "Busy/Normal/Quiet", "growthSignal": "Positive/Neutral/Negative", "icon": "📊" }
  },
  "timeline": [
    { "time": "6 AM", "label": "Morning Pulse", "activity": "what happens here in the morning", "level": 0-100 },
    { "time": "10 AM", "label": "Business Hours", "activity": "what happens at midday", "level": 0-100 },
    { "time": "2 PM", "label": "Afternoon", "activity": "afternoon activity", "level": 0-100 },
    { "time": "6 PM", "label": "Evening Rush", "activity": "evening activity specific to this city", "level": 0-100 },
    { "time": "9 PM", "label": "Night Life", "activity": "night activity specific to this city", "level": 0-100 },
    { "time": "11 PM", "label": "Night Wind-down", "activity": "late night", "level": 0-100 }
  ],
  "neighborhoods": [
    { "name": "actual area name", "activity": 0-100, "vibe": "vibe label", "emoji": "emoji", "signal": "high/medium/low" },
    { "name": "actual area name", "activity": 0-100, "vibe": "vibe label", "emoji": "emoji", "signal": "high/medium/low" },
    { "name": "actual area name", "activity": 0-100, "vibe": "vibe label", "emoji": "emoji", "signal": "high/medium/low" }
  ],
  "localPulse": [
    "5 real-time style pulse updates specific to this city",
    "2nd pulse",
    "3rd pulse",
    "4th pulse",
    "5th pulse"
  ],
  "historicalNote": "2 sentences: what this city was historically known for and how it evolved",
  "futureForecast": {
    "next7Days": [
      { "signal": "Tourism", "trend": "up/stable/down", "confidence": 0-100 },
      { "signal": "Events", "trend": "up/stable/down", "confidence": 0-100 },
      { "signal": "Traffic", "trend": "up/stable/down", "confidence": 0-100 },
      { "signal": "Commerce", "trend": "up/stable/down", "confidence": 0-100 }
    ],
    "overallOutlook": "Positive/Neutral/Mixed",
    "aiNote": "one sentence forecast"
  },
  "generatedAt": "ISO date string"
}`;

  const data = await generateJson(prompt, reportFallback(cityName));
  await setCached(cacheKey, "reporter-report", null, data, 60);
  res.json(data);
});

// ── GET /reporter/trending — Trending city reports ────────────────────────
router.get("/reporter/trending", async (_req, res): Promise<void> => {
  // Top searched + always-interesting cities
  const topSearched = Object.entries(SEARCH_COUNTS)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 4)
    .map(([name, count]) => ({ name: name.charAt(0).toUpperCase() + name.slice(1), searches: count, badge: "🔥 Trending" }));

  const featured = [
    { name: "Jaipur", searches: 42, badge: "🎨 Cultural", desc: "Heritage + Festival season" },
    { name: "Indore", searches: 38, badge: "🏆 Top Ranked", desc: "India's cleanest city" },
    { name: "Varanasi", searches: 35, badge: "🕌 Spiritual", desc: "Ancient + alive every day" },
    { name: "Goa", searches: 33, badge: "🌊 Holiday", desc: "Beach + nightlife pulse" },
    { name: "Kota", searches: 31, badge: "🎓 Student Hub", desc: "Coaching capital buzz" },
    { name: "Mysore", searches: 28, badge: "🌿 Peaceful", desc: "Palace city vibes" },
  ];

  const combined = [
    ...topSearched.filter(c => !featured.find(f => f.name.toLowerCase() === c.name.toLowerCase())),
    ...featured,
  ].slice(0, 9);

  res.json({ trending: combined, updatedAt: new Date().toISOString() });
});

// ── POST /reporter/compare — Compare two city reports ─────────────────────
router.post("/reporter/compare", async (req, res): Promise<void> => {
  const { city1, city2 } = req.body as { city1: string; city2: string };
  if (!city1?.trim() || !city2?.trim()) {
    res.status(400).json({ error: "city1 and city2 required" });
    return;
  }

  const cacheKey = `reporter-compare-v1:${city1.toLowerCase()}:${city2.toLowerCase()}:${new Date().toISOString().slice(0, 13)}`;
  const cached = await getCached<object>(cacheKey);
  if (cached) { res.json(cached); return; }

  const prompt = `Compare the live city intelligence of "${city1}" vs "${city2}" right now.
These could be any Indian cities — metros, Tier-2, towns.

Return ONLY valid JSON:
{
  "city1": {
    "name": "${city1}",
    "activityScore": 0-100,
    "mood": "mood label",
    "topActivity": "what's happening most right now",
    "trafficLevel": "Low/Moderate/High",
    "culturePulse": 0-100,
    "foodScene": 0-100,
    "lifestyle": 0-100,
    "growth": 0-100,
    "uniqueFact": "one specific fact about this city today"
  },
  "city2": {
    "name": "${city2}",
    "activityScore": 0-100,
    "mood": "mood label",
    "topActivity": "what's happening most right now",
    "trafficLevel": "Low/Moderate/High",
    "culturePulse": 0-100,
    "foodScene": 0-100,
    "lifestyle": 0-100,
    "growth": 0-100,
    "uniqueFact": "one specific fact about this city today"
  },
  "verdict": "2 sentence comparison and which city wins on overall energy today",
  "generatedAt": "ISO date string"
}`;

  const fallback = {
    city1: { name: city1, activityScore: 76, mood: "Vibrant", topActivity: "Market and cultural activity", trafficLevel: "Moderate", culturePulse: 82, foodScene: 78, lifestyle: 74, growth: 72, uniqueFact: `${city1} is known for its unique cultural blend` },
    city2: { name: city2, activityScore: 81, mood: "Energetic", topActivity: "Business and social activity", trafficLevel: "High", culturePulse: 74, foodScene: 85, lifestyle: 80, growth: 78, uniqueFact: `${city2} leads in modern urban development` },
    verdict: `Both cities are active today. ${city2} edges ahead on overall energy and opportunity while ${city1} offers deeper cultural immersion.`,
    generatedAt: new Date().toISOString(),
  };

  const data = await generateJson(prompt, fallback);
  await setCached(cacheKey, "reporter-compare", null, data, 60);
  res.json(data);
});

// ── POST /reporter/citizen — Submit citizen report ────────────────────────
router.post("/reporter/citizen", async (req, res): Promise<void> => {
  const { cityName, location, type, description } = req.body as CitizenReport;
  if (!cityName || !description) { res.status(400).json({ error: "cityName and description required" }); return; }

  const aiCategory = await generateText(
    `Categorize this citizen city report in 3 words max: "${description}". Just the category label.`
  ).catch(() => "Local Update");

  const report: CitizenReport = {
    id: `cr-${Date.now()}`,
    cityName,
    location: location || cityName,
    type: type || "discovery",
    description,
    submittedAt: new Date().toISOString(),
    aiCategory: aiCategory.replace(/[^a-zA-Z\s]/g, "").trim().slice(0, 30),
  };
  CITIZEN_REPORTS.push(report);
  // Keep last 100
  if (CITIZEN_REPORTS.length > 100) CITIZEN_REPORTS.shift();

  res.status(201).json(report);
});

// ── GET /reporter/citizen — Get citizen reports ───────────────────────────
router.get("/reporter/citizen", (req, res): void => {
  const cityName = req.query.cityName as string;
  const reports = cityName
    ? CITIZEN_REPORTS.filter(r => r.cityName.toLowerCase().includes(cityName.toLowerCase()))
    : CITIZEN_REPORTS;
  res.json({ reports: reports.slice(-20).reverse() });
});

// ── POST /reporter/chat — AI reporter assistant ───────────────────────────
router.post("/reporter/chat", async (req, res): Promise<void> => {
  const { message, cityName } = req.body as { message: string; cityName?: string };
  if (!message?.trim()) { res.status(400).json({ error: "message required" }); return; }

  const context = cityName ? `Currently reporting on ${cityName}.` : "General India city intelligence.";

  const fallback = cityName
    ? `I'm monitoring ${cityName} right now. The city shows active signals across key areas. What specific intelligence would you like — traffic, events, culture, or something else?`
    : "I can generate live intelligence reports for any city, town, or neighborhood in India. Just tell me the place and I'll start my analysis!";

  const reply = await generateText(
    `You are Nexora's AI City Reporter — like a live journalist with data access for every Indian city.
${context}
User: "${message}"
Reply in 3-4 sentences with specific, journalistic intelligence about the place. Be lively and informative.`
  ).catch(() => fallback);

  res.json({
    reply: (reply === "AI service unavailable. Please set GEMINI_API_KEY.") ? fallback : reply,
    isAI: !(reply === "AI service unavailable. Please set GEMINI_API_KEY."),
    timestamp: new Date().toISOString(),
  });
});

export default router;
