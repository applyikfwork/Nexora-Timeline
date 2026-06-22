import { Router, type IRouter } from "express";
import { generateJson, generateText } from "../lib/gemini";
import { getCached, setCached } from "../lib/aiCache";

const router: IRouter = Router();

// ── Saved cities (in-memory) ────────────────────────────────────────────────
interface SavedCity { cityName: string; savedAt: string; category: string }
const SAVED_CITIES: SavedCity[] = [];

// ── Fallbacks ───────────────────────────────────────────────────────────────
function profileFallback(cityName: string) {
  return {
    cityName,
    tagline: `${cityName} — A city with its own story`,
    status: "Growing City",
    overallScore: 82,
    healthScore: 79,
    healthLabel: "Good",
    metrics: {
      growth: { score: 84, trend: "up", label: "Rising", note: "Consistent economic and population growth" },
      lifestyle: { score: 78, trend: "stable", label: "Comfortable", note: "Good quality of life for residents" },
      opportunity: { score: 86, trend: "up", label: "High", note: "Growing employment and startup scene" },
      culture: { score: 88, trend: "stable", label: "Rich", note: "Deep cultural roots and active arts scene" },
      connectivity: { score: 75, trend: "up", label: "Improving", note: "Transport infrastructure expanding" },
    },
    economyProfile: {
      pulse: "Stable",
      businessActivity: "🔥 Active",
      startupGrowth: "⚡ Growing",
      marketActivity: "📈 Bullish",
      tourism: "🟢 Rising",
      gdpTrend: "up",
      keyIndustries: ["Trade", "Tourism", "Services", "Manufacturing"],
    },
    lifestyleFor: [
      { group: "🎓 Students", fit: 82, reason: "Good colleges and affordable living" },
      { group: "💼 Professionals", fit: 78, reason: "Job market expanding, mid-level salaries" },
      { group: "👨‍👩‍👧 Families", fit: 85, reason: "Safe neighborhoods, good schools" },
      { group: "🚀 Entrepreneurs", fit: 80, reason: "Business-friendly, growing network" },
      { group: "🌎 Travelers", fit: 76, reason: "Rich culture, accessible tourism" },
    ],
    strengths: ["Heritage & Culture", "Street Food Scene", "Education Hub", "Community Life", "Affordable Living"],
    challenges: ["Traffic Congestion", "Infrastructure Gaps", "Air Quality", "Rapid Cost Growth"],
    neighborhoods: [
      { name: "Old City", vibe: "Cultural", activity: 88, emoji: "🏛️" },
      { name: "Business District", vibe: "Professional", activity: 84, emoji: "🏢" },
      { name: "Market Area", vibe: "Trade Hub", activity: 91, emoji: "🛍️" },
    ],
    growthTimeline: [
      { year: "2000", label: "Foundation Phase", note: "City establishes core infrastructure" },
      { year: "2010", label: "Growth Decade", note: "Population doubles, new developments rise" },
      { year: "2020", label: "Digital Turn", note: "Tech adoption, startup ecosystem emerges" },
      { year: "2026", label: "Present", note: "Active growth phase with urban renewal" },
      { year: "2035", label: "Future Vision", note: "Smart city upgrades, expanded connectivity predicted" },
    ],
    futureForecast: {
      growth: { outlook: "High", confidence: 81 },
      infrastructure: { outlook: "Improving", confidence: 74 },
      lifestyle: { outlook: "Changing", confidence: 78 },
      opportunity: { outlook: "Expanding", confidence: 83 },
    },
    aiSummary: `${cityName} presents a compelling urban profile — strong cultural identity combined with economic momentum. The city's strengths lie in its community fabric and heritage, while opportunity sectors continue to grow. Ideal for families, students, and entrepreneurs looking for an authentic Indian city experience with modern amenities.`,
    generatedAt: new Date().toISOString(),
  };
}

// ── POST /portfolio/profile — Full AI city portfolio profile ────────────────
router.post("/portfolio/profile", async (req, res): Promise<void> => {
  const { cityName } = req.body as { cityName: string };
  if (!cityName?.trim()) { res.status(400).json({ error: "cityName required" }); return; }

  const hourSlot = new Date().toISOString().slice(0, 13);
  const cacheKey = `portfolio-profile-v2:${cityName.toLowerCase().trim()}:${hourSlot}`;
  const cached = await getCached<object>(cacheKey);
  if (cached) { res.json(cached); return; }

  const prompt = `You are Nexora's AI city analyst. Create a complete City Portfolio Profile for "${cityName}".
This city could be any Indian city — metro, Tier-2, small town, district, village, or landmark.
Always produce specific, insightful content based on real knowledge of the place.

Return ONLY valid JSON (no markdown):
{
  "cityName": "${cityName}",
  "tagline": "punchy 6-8 word tagline capturing the city's essence",
  "status": "Growing City / Emerging Hub / Established Metro / Hidden Gem / Cultural Capital / Student City",
  "overallScore": 0-100,
  "healthScore": 0-100,
  "healthLabel": "Excellent / Good / Fair / Improving",
  "metrics": {
    "growth": { "score": 0-100, "trend": "up/stable/down", "label": "one word", "note": "why" },
    "lifestyle": { "score": 0-100, "trend": "up/stable/down", "label": "one word", "note": "why" },
    "opportunity": { "score": 0-100, "trend": "up/stable/down", "label": "one word", "note": "why" },
    "culture": { "score": 0-100, "trend": "up/stable/down", "label": "one word", "note": "why" },
    "connectivity": { "score": 0-100, "trend": "up/stable/down", "label": "one word", "note": "why" }
  },
  "economyProfile": {
    "pulse": "Strong/Stable/Slow",
    "businessActivity": "🔥 Active / 📈 Growing / 😐 Steady / 📉 Slow",
    "startupGrowth": "⚡ Booming / 🌱 Emerging / 😐 Flat",
    "marketActivity": "📈 Bullish / 😐 Neutral / 📉 Cautious",
    "tourism": "🟢 Rising / 🟡 Seasonal / 🔴 Declining",
    "gdpTrend": "up/stable/down",
    "keyIndustries": ["4 real key industries for this city"]
  },
  "lifestyleFor": [
    { "group": "🎓 Students", "fit": 0-100, "reason": "specific reason for this city" },
    { "group": "💼 Professionals", "fit": 0-100, "reason": "specific reason" },
    { "group": "👨‍👩‍👧 Families", "fit": 0-100, "reason": "specific reason" },
    { "group": "🚀 Entrepreneurs", "fit": 0-100, "reason": "specific reason" },
    { "group": "🌎 Travelers", "fit": 0-100, "reason": "specific reason" }
  ],
  "strengths": ["5 real strengths of this city"],
  "challenges": ["4 real challenges or watch areas"],
  "neighborhoods": [
    { "name": "actual area name", "vibe": "vibe label", "activity": 0-100, "emoji": "emoji" },
    { "name": "actual area name", "vibe": "vibe label", "activity": 0-100, "emoji": "emoji" },
    { "name": "actual area name", "vibe": "vibe label", "activity": 0-100, "emoji": "emoji" }
  ],
  "growthTimeline": [
    { "year": "2000", "label": "label", "note": "historical fact about this city around 2000" },
    { "year": "2010", "label": "label", "note": "what changed around 2010" },
    { "year": "2020", "label": "label", "note": "what happened around 2020" },
    { "year": "2026", "label": "Present", "note": "current state" },
    { "year": "2035", "label": "Future Vision", "note": "AI prediction" }
  ],
  "futureForecast": {
    "growth": { "outlook": "High/Medium/Low", "confidence": 0-100 },
    "infrastructure": { "outlook": "Improving/Stable/Declining", "confidence": 0-100 },
    "lifestyle": { "outlook": "Improving/Stable/Changing", "confidence": 0-100 },
    "opportunity": { "outlook": "Expanding/Stable/Contracting", "confidence": 0-100 }
  },
  "aiSummary": "3-4 sentence AI city portfolio summary. Be specific to this city — mention real strengths, who it suits, and its direction.",
  "generatedAt": "ISO date string"
}`;

  const data = await generateJson(prompt, profileFallback(cityName));
  await setCached(cacheKey, "portfolio-profile", null, data, 90);
  res.json(data);
});

// ── POST /portfolio/compare — Compare two city profiles ─────────────────────
router.post("/portfolio/compare", async (req, res): Promise<void> => {
  const { city1, city2 } = req.body as { city1: string; city2: string };
  if (!city1?.trim() || !city2?.trim()) { res.status(400).json({ error: "city1 and city2 required" }); return; }

  const cacheKey = `portfolio-compare-v1:${city1.toLowerCase()}:${city2.toLowerCase()}:${new Date().toISOString().slice(0, 13)}`;
  const cached = await getCached<object>(cacheKey);
  if (cached) { res.json(cached); return; }

  const prompt = `Compare city portfolio profiles for "${city1}" vs "${city2}" in India.
Return ONLY valid JSON:
{
  "city1": {
    "name": "${city1}",
    "overallScore": 0-100,
    "growth": 0-100,
    "cost": 0-100,
    "lifestyle": 0-100,
    "future": 0-100,
    "bestFor": "who this city suits most",
    "topAdvantage": "its single biggest advantage"
  },
  "city2": {
    "name": "${city2}",
    "overallScore": 0-100,
    "growth": 0-100,
    "cost": 0-100,
    "lifestyle": 0-100,
    "future": 0-100,
    "bestFor": "who this city suits most",
    "topAdvantage": "its single biggest advantage"
  },
  "verdict": "2-3 sentence AI verdict comparing both cities honestly",
  "winner": "city name that edges ahead overall",
  "generatedAt": "ISO date string"
}`;

  const fallback = {
    city1: { name: city1, overallScore: 80, growth: 82, cost: 70, lifestyle: 78, future: 81, bestFor: "Professionals and families", topAdvantage: "Cultural heritage and connectivity" },
    city2: { name: city2, overallScore: 83, growth: 86, cost: 65, lifestyle: 82, future: 85, bestFor: "Entrepreneurs and students", topAdvantage: "Economic growth and opportunity" },
    verdict: `Both ${city1} and ${city2} offer strong urban profiles. ${city2} edges ahead on growth and future potential while ${city1} scores higher on cultural lifestyle and affordability.`,
    winner: city2,
    generatedAt: new Date().toISOString(),
  };

  const data = await generateJson(prompt, fallback);
  await setCached(cacheKey, "portfolio-compare", null, data, 90);
  res.json(data);
});

// ── POST /portfolio/report — Full AI report text ─────────────────────────────
router.post("/portfolio/report", async (req, res): Promise<void> => {
  const { cityName } = req.body as { cityName: string };
  if (!cityName?.trim()) { res.status(400).json({ error: "cityName required" }); return; }

  const cacheKey = `portfolio-report-v1:${cityName.toLowerCase()}:${new Date().toISOString().slice(0, 11)}`;
  const cached = await getCached<object>(cacheKey);
  if (cached) { res.json(cached); return; }

  const report = await generateText(
    `Write a professional 5-paragraph City Intelligence Report for "${cityName}". 
Cover: 1) City Overview & Status, 2) Economic Opportunities, 3) Lifestyle & Culture, 4) Challenges & Risks, 5) Future Outlook.
Be specific to this city — mention real landmarks, industries, demographics. Write like a Bloomberg City Intelligence analyst.`
  ).catch(() => `${cityName} is a dynamic city with a unique blend of heritage and modern growth. Economic activity is healthy across key sectors including trade, services, and tourism. The lifestyle here balances traditional culture with contemporary amenities. Key challenges include infrastructure keeping pace with growth. Looking ahead, ${cityName} is positioned for sustained expansion through the next decade.`);

  const data = { cityName, report, generatedAt: new Date().toISOString() };
  await setCached(cacheKey, "portfolio-report", null, data, 120);
  res.json(data);
});

// ── POST /portfolio/save — Save a city ──────────────────────────────────────
router.post("/portfolio/save", (req, res): void => {
  const { cityName, category } = req.body as { cityName: string; category?: string };
  if (!cityName?.trim()) { res.status(400).json({ error: "cityName required" }); return; }
  const existing = SAVED_CITIES.find(c => c.cityName.toLowerCase() === cityName.toLowerCase());
  if (existing) { res.json({ message: "Already saved", city: existing }); return; }
  const saved: SavedCity = { cityName, savedAt: new Date().toISOString(), category: category || "My Cities" };
  SAVED_CITIES.push(saved);
  res.status(201).json(saved);
});

// ── DELETE /portfolio/save/:city — Remove saved city ─────────────────────────
router.delete("/portfolio/save/:city", (req, res): void => {
  const idx = SAVED_CITIES.findIndex(c => c.cityName.toLowerCase() === req.params.city.toLowerCase());
  if (idx === -1) { res.status(404).json({ error: "Not found" }); return; }
  SAVED_CITIES.splice(idx, 1);
  res.json({ message: "Removed" });
});

// ── GET /portfolio/saved — Get saved cities ──────────────────────────────────
router.get("/portfolio/saved", (_req, res): void => {
  res.json({ saved: SAVED_CITIES });
});

export default router;
