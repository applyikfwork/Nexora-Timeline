import { Router, type IRouter } from "express";
import { generateJson, generateText } from "../lib/gemini";
import { getCached, setCached } from "../lib/aiCache";

const router: IRouter = Router();

// ── In-memory saved cities store ─────────────────────────────────────────
interface SavedCity {
  id: string;
  cityName: string;
  score?: number;
  list: "dream" | "travel" | "future" | "home";
  savedAt: string;
}
const SAVED_CITIES: SavedCity[] = [];

// ── Fallback generators ───────────────────────────────────────────────────
function cityProfileFallback(cityName: string) {
  return {
    cityName,
    country: "India",
    personality: "Dynamic & Emerging",
    tagline: `${cityName} — Where tradition meets ambition`,
    dna: { culture: 82, career: 74, student: 78, lifestyle: 76, budget: 70, startup: 68, safety: 80, nature: 65 },
    climate: { type: "Subtropical", temp: "24–34°C", bestMonths: ["October", "November", "February", "March"], humidity: "Moderate" },
    costOfLiving: {
      monthlyEstimate: "₹15,000–30,000",
      rent1BHK: "₹8,000–18,000",
      food: "₹3,000–6,000",
      transport: "₹1,500–3,000",
      lifestyle: "₹2,500–5,000",
    },
    opportunities: {
      topSectors: ["IT & Services", "Manufacturing", "Education", "Retail & Trade"],
      startupEcosystem: "Growing",
      avgSalary: "₹4–8 LPA entry level",
      jobGrowth: "Moderate to High",
    },
    lifestyle: {
      foodScene: "Rich local cuisine with growing cafe culture",
      nightlife: "Moderate — restaurants and lounges",
      shopping: "Good local markets + malls",
      outdoors: "Parks, lakes, and occasional nature nearby",
    },
    education: {
      topColleges: ["Engineering colleges", "Management institutes", "Government universities"],
      schoolDensity: "High",
      coachingCulture: "Moderate",
    },
    hiddenGems: [
      `Old city quarter of ${cityName} — untouched heritage`,
      `Local weekly market — best street food in region`,
      `Rooftop sunset spots locals love`,
    ],
    dayInLife: {
      morning: "Tea at local dhaba, morning commute by auto or bus",
      afternoon: "Work/college, lunch at local thali restaurants",
      evening: "Evening walk at main market or garden",
      night: "Family dinner, local chai hangout",
    },
    futurePrediction: {
      year: 2035,
      growth: "High",
      infrastructure: "Improving — new roads, metro planned",
      population: "Increasing by 15–20%",
      topTrend: "Smart city initiatives and IT expansion",
      aiPrediction: `${cityName} is positioned for strong growth as Tier-2 investment increases and infrastructure modernizes.`,
    },
    mood: { label: "Active", score: 76, description: "City moves at a productive, livable pace" },
    generatedAt: new Date().toISOString(),
  };
}

function matchFallback(cityName: string, lifestyle: string[]) {
  const score = 72 + Math.floor(Math.random() * 20);
  return {
    cityName,
    lifestyle,
    score,
    verdict: score >= 85 ? "Perfect Match" : score >= 75 ? "Strong Match" : score >= 60 ? "Good Fit" : "Needs Thought",
    summary: `${cityName} aligns well with your ${lifestyle.slice(0, 2).join(" and ")} lifestyle. The city offers a balance of opportunity and liveability that suits your priorities.`,
    pros: [
      "Affordable cost of living vs metros",
      "Growing job market in your sector",
      "Strong community and cultural roots",
      "Less competition, more opportunity",
    ],
    cons: [
      "Fewer nightlife options than metro cities",
      "Slower pace of career growth initially",
    ],
    bestAreas: [`${cityName} New City area`, `University Quarter`, `IT/Business Park zone`],
    localInsiderTip: "Join local LinkedIn groups and alumni networks — Tier-2 cities work on relationships.",
    alternativeCities: ["Indore", "Nashik", "Coimbatore"],
    matchBreakdown: {
      career: score - 5 + Math.floor(Math.random() * 10),
      lifestyle: score + Math.floor(Math.random() * 8),
      culture: score - 3 + Math.floor(Math.random() * 12),
      affordability: Math.min(100, score + 10),
      growth: score - 8 + Math.floor(Math.random() * 15),
    },
    generatedAt: new Date().toISOString(),
  };
}

// ── Routes ────────────────────────────────────────────────────────────────

// POST /city/profile — generate full AI profile for ANY city
router.post("/city/profile", async (req, res): Promise<void> => {
  const { cityName } = req.body as { cityName: string };
  if (!cityName?.trim()) { res.status(400).json({ error: "cityName required" }); return; }

  const key = cityName.toLowerCase().trim();
  const cacheKey = `city-profile-v2:${key}`;
  const cached = await getCached<object>(cacheKey);
  if (cached) { res.json(cached); return; }

  const prompt = `You are an expert AI urban analyst for India. Generate a comprehensive city profile for "${cityName}".
This could be a major metro, a Tier-2 city, a small town, or even a village. Always provide helpful insights.

Return ONLY valid JSON (no markdown, no code blocks):
{
  "cityName": "${cityName}",
  "country": "India or country name",
  "state": "state/region name",
  "tier": "Metro/Tier-2/Tier-3/Town/Village",
  "personality": "2-3 word personality description",
  "tagline": "One catchy tagline about this city",
  "description": "2-3 sentence overview of what makes this place unique",
  "dna": {
    "culture": 0-100,
    "career": 0-100,
    "student": 0-100,
    "lifestyle": 0-100,
    "budget": 0-100,
    "startup": 0-100,
    "safety": 0-100,
    "nature": 0-100
  },
  "climate": {
    "type": "climate type",
    "temp": "temperature range",
    "bestMonths": ["month1", "month2", "month3"],
    "humidity": "Low/Moderate/High"
  },
  "costOfLiving": {
    "monthlyEstimate": "₹X,XXX–XX,XXX",
    "rent1BHK": "₹X,XXX–XX,XXX/month",
    "food": "₹X,XXX–X,XXX/month",
    "transport": "₹X,XXX–X,XXX/month",
    "lifestyle": "₹X,XXX–X,XXX/month"
  },
  "opportunities": {
    "topSectors": ["sector1", "sector2", "sector3", "sector4"],
    "startupEcosystem": "Non-existent/Nascent/Growing/Thriving",
    "avgSalary": "₹X–X LPA entry level",
    "jobGrowth": "Low/Moderate/High/Very High"
  },
  "lifestyle": {
    "foodScene": "description",
    "nightlife": "description",
    "shopping": "description",
    "outdoors": "description"
  },
  "education": {
    "topColleges": ["college1", "college2", "college3"],
    "schoolDensity": "Low/Moderate/High",
    "coachingCulture": "Low/Moderate/High/Very High"
  },
  "hiddenGems": ["gem1 with specific detail", "gem2", "gem3"],
  "dayInLife": {
    "morning": "describe a typical morning",
    "afternoon": "describe a typical afternoon",
    "evening": "describe a typical evening",
    "night": "describe a typical night"
  },
  "futurePrediction": {
    "year": 2035,
    "growth": "Low/Moderate/High/Very High",
    "infrastructure": "description of what's improving",
    "population": "population trend",
    "topTrend": "biggest upcoming change",
    "aiPrediction": "2-sentence AI forecast"
  },
  "mood": {
    "label": "one-word city mood",
    "score": 0-100,
    "description": "one sentence"
  },
  "generatedAt": "ISO date string"
}`;

  const data = await generateJson(prompt, cityProfileFallback(cityName));
  await setCached(cacheKey, "city-profile", null, data, 1440);
  res.json(data);
});

// POST /city/match — AI compatibility match for lifestyle + city
router.post("/city/match", async (req, res): Promise<void> => {
  const { cityName, lifestyle, priorities } = req.body as { cityName: string; lifestyle: string[]; priorities?: Record<string, number> };
  if (!cityName?.trim() || !lifestyle?.length) {
    res.status(400).json({ error: "cityName and lifestyle required" });
    return;
  }

  const key = `${cityName.toLowerCase().trim()}:${lifestyle.sort().join(",")}`;
  const cacheKey = `city-match-v2:${key}`;
  const cached = await getCached<object>(cacheKey);
  if (cached) { res.json(cached); return; }

  const lifestyleStr = lifestyle.join(", ");
  const prioritiesStr = priorities ? Object.entries(priorities).map(([k, v]) => `${k}: ${v}/10`).join(", ") : "";

  const prompt = `You are a Nexora AI compatibility engine. Analyze how well "${cityName}" matches someone with this profile:
Lifestyle: ${lifestyleStr}
${prioritiesStr ? `Priorities: ${prioritiesStr}` : ""}

This person could be from anywhere in India — a small town or a metro. Give honest, practical analysis.

Return ONLY valid JSON:
{
  "cityName": "${cityName}",
  "lifestyle": ${JSON.stringify(lifestyle)},
  "score": 0-100,
  "verdict": "Perfect Match / Strong Match / Good Fit / Worth Exploring / Challenging",
  "summary": "2-3 sentences explaining the match quality",
  "pros": ["pro1", "pro2", "pro3", "pro4"],
  "cons": ["con1", "con2"],
  "bestAreas": ["area1 with description", "area2", "area3"],
  "localInsiderTip": "one practical insider tip for moving/visiting",
  "alternativeCities": ["city1 if this doesnt fit", "city2", "city3"],
  "matchBreakdown": {
    "career": 0-100,
    "lifestyle": 0-100,
    "culture": 0-100,
    "affordability": 0-100,
    "growth": 0-100
  },
  "aiMessage": "One encouraging, personal message to the user about this city",
  "generatedAt": "ISO date string"
}`;

  const data = await generateJson(prompt, matchFallback(cityName, lifestyle));
  await setCached(cacheKey, "city-match", null, data, 720);
  res.json(data);
});

// POST /city/compare — compare two cities
router.post("/city/compare", async (req, res): Promise<void> => {
  const { city1, city2, lifestyle } = req.body as { city1: string; city2: string; lifestyle?: string[] };
  if (!city1?.trim() || !city2?.trim()) {
    res.status(400).json({ error: "city1 and city2 required" });
    return;
  }

  const cacheKey = `city-compare-v2:${city1.toLowerCase()}:${city2.toLowerCase()}`;
  const cached = await getCached<object>(cacheKey);
  if (cached) { res.json(cached); return; }

  const lifestyleStr = lifestyle?.join(", ") || "general";

  const prompt = `Compare "${city1}" vs "${city2}" for someone with lifestyle: ${lifestyleStr}.
These could be any Indian cities — metros, Tier-2, small towns. Be specific and honest.

Return ONLY valid JSON:
{
  "city1": {
    "name": "${city1}",
    "score": 0-100,
    "personality": "2-word personality",
    "bestFor": "who it's best for",
    "cost": "₹ estimate monthly",
    "weather": "brief",
    "jobs": "job market quality",
    "culture": "brief",
    "verdict": "one sentence"
  },
  "city2": {
    "name": "${city2}",
    "score": 0-100,
    "personality": "2-word personality",
    "bestFor": "who it's best for",
    "cost": "₹ estimate monthly",
    "weather": "brief",
    "jobs": "job market quality",
    "culture": "brief",
    "verdict": "one sentence"
  },
  "metrics": {
    "cost": {"city1": 0-100, "city2": 0-100, "label": "Lower is better"},
    "jobs": {"city1": 0-100, "city2": 0-100, "label": "Higher is better"},
    "weather": {"city1": 0-100, "city2": 0-100, "label": "Comfort score"},
    "lifestyle": {"city1": 0-100, "city2": 0-100, "label": "Quality score"},
    "growth": {"city1": 0-100, "city2": 0-100, "label": "Future potential"},
    "safety": {"city1": 0-100, "city2": 0-100, "label": "Safety index"}
  },
  "winner": "${city1} or ${city2}",
  "aiVerdict": "2-sentence honest comparison and recommendation",
  "generatedAt": "ISO date string"
}`;

  const fallback = {
    city1: { name: city1, score: 78, personality: "Dynamic Growing", bestFor: "Students and young professionals", cost: "₹18,000/month", weather: "Moderate", jobs: "Good", culture: "Rich heritage", verdict: `${city1} offers a balanced lifestyle.` },
    city2: { name: city2, score: 82, personality: "Tech Driven", bestFor: "Career-focused professionals", cost: "₹25,000/month", weather: "Pleasant", jobs: "Excellent", culture: "Cosmopolitan", verdict: `${city2} excels in opportunities.` },
    metrics: {
      cost: { city1: 75, city2: 55, label: "Affordability" },
      jobs: { city1: 70, city2: 88, label: "Job Market" },
      weather: { city1: 72, city2: 85, label: "Weather" },
      lifestyle: { city1: 74, city2: 80, label: "Lifestyle" },
      growth: { city1: 78, city2: 85, label: "Growth" },
      safety: { city1: 80, city2: 78, label: "Safety" },
    },
    winner: city2,
    aiVerdict: `Both cities offer unique advantages. ${city1} wins on affordability while ${city2} leads in career opportunities. Choose based on your priorities.`,
    generatedAt: new Date().toISOString(),
  };

  const data = await generateJson(prompt, fallback);
  await setCached(cacheKey, "city-compare", null, data, 720);
  res.json(data);
});

// GET /city/intelligence — India city intelligence categories
router.get("/city/intelligence", async (req, res): Promise<void> => {
  const cacheKey = `city-intelligence-v1:${new Date().toISOString().slice(0, 10)}`;
  const cached = await getCached<object>(cacheKey);
  if (cached) { res.json(cached); return; }

  const fallback = {
    categories: [
      { id: "students", label: "Best For Students", emoji: "🎓", cities: ["Kota", "Pune", "Bangalore", "Hyderabad", "Delhi", "Chandigarh"], description: "Top destinations for education and student life" },
      { id: "jobs", label: "Best For Jobs", emoji: "💼", cities: ["Bangalore", "Hyderabad", "Pune", "Chennai", "Gurgaon", "Mumbai"], description: "Highest employment opportunities and salaries" },
      { id: "startups", label: "Best For Startups", emoji: "🚀", cities: ["Bangalore", "Mumbai", "Delhi NCR", "Hyderabad", "Pune", "Chennai"], description: "Strongest startup ecosystems and VC activity" },
      { id: "budget", label: "Best Budget Cities", emoji: "💰", cities: ["Indore", "Nagpur", "Coimbatore", "Jaipur", "Lucknow", "Bhopal"], description: "High quality of life with low cost of living" },
      { id: "peaceful", label: "Most Peaceful", emoji: "🌱", cities: ["Shimla", "Dehradun", "Mysore", "Pondicherry", "Gangtok", "Mangalore"], description: "Slow pace, clean air, and quality of life" },
      { id: "tourists", label: "Best Tourist Cities", emoji: "📸", cities: ["Jaipur", "Agra", "Varanasi", "Goa", "Udaipur", "Rishikesh"], description: "Rich cultural heritage and tourist infrastructure" },
    ],
    updatedAt: new Date().toISOString(),
  };

  const data = await generateJson(
    `List the best Indian cities for 6 categories: students, jobs, startups, budget living, peaceful life, tourism.
Include Tier-2 cities too, not just metros. Return JSON:
{
  "categories": [
    {"id": "students", "label": "Best For Students", "emoji": "🎓", "cities": ["city1","city2","city3","city4","city5","city6"], "description": "one line"},
    {"id": "jobs", "label": "Best For Jobs", "emoji": "💼", "cities": [...], "description": "..."},
    {"id": "startups", "label": "Best For Startups", "emoji": "🚀", "cities": [...], "description": "..."},
    {"id": "budget", "label": "Best Budget Cities", "emoji": "💰", "cities": [...], "description": "..."},
    {"id": "peaceful", "label": "Most Peaceful", "emoji": "🌱", "cities": [...], "description": "..."},
    {"id": "tourists", "label": "Best Tourist Cities", "emoji": "📸", "cities": [...], "description": "..."}
  ],
  "updatedAt": "ISO date string"
}`,
    fallback
  );

  await setCached(cacheKey, "city-intelligence", null, data, 1440);
  res.json(data);
});

// POST /city/chat — AI city assistant
router.post("/city/chat", async (req, res): Promise<void> => {
  const { message, cityName } = req.body as { message: string; cityName?: string };
  if (!message?.trim()) { res.status(400).json({ error: "message required" }); return; }

  const context = cityName ? `The user is asking about ${cityName}.` : "The user is asking about Indian cities in general.";

  const fallbacks: Record<string, string> = {
    student: cityName ? `${cityName} has decent student facilities. For top-tier education, also consider Pune, Bangalore, or Delhi NCR.` : "For students, Kota is best for engineering/medical prep, Pune for colleges, and Bangalore for tech careers.",
    move: cityName ? `Moving to ${cityName} can be a good decision. Key factors: cost of living is moderate, job market is growing, and the city has a welcoming culture for newcomers.` : "Moving to a new city depends on your job, budget, and lifestyle. Tier-2 cities offer great value right now.",
    job: cityName ? `${cityName}'s job market is growing, especially in IT, manufacturing, and services. Salaries are lower than metros but so is cost of living.` : "Best job cities: Bangalore (IT), Mumbai (finance/media), Hyderabad (pharma/IT), Pune (manufacturing/IT).",
    default: cityName ? `${cityName} is a wonderful city with its own unique character. What specific aspect would you like to know about — jobs, cost, lifestyle, or education?` : "I can help you understand any Indian city — from metros to small towns. Ask me about cost of living, jobs, lifestyle, or which city suits you best!",
  };

  const key = message.toLowerCase().includes("student") ? "student"
    : message.toLowerCase().includes("move") || message.toLowerCase().includes("shift") || message.toLowerCase().includes("relocate") ? "move"
    : message.toLowerCase().includes("job") || message.toLowerCase().includes("career") || message.toLowerCase().includes("work") ? "job"
    : "default";

  const fallback = fallbacks[key];

  const reply = await generateText(
    `You are Nexora's AI City Expert for India. You know every Indian city — metros, Tier-2, Tier-3, towns, and villages.
${context}
User question: "${message}"
Give a helpful, specific, honest answer in 3-5 sentences. Include practical advice. Focus on India.`
  ).catch(() => fallback);

  const finalReply = (reply === "AI service unavailable. Please set GEMINI_API_KEY.") ? fallback : reply;

  res.json({
    reply: finalReply,
    isAI: finalReply !== fallback,
    timestamp: new Date().toISOString(),
  });
});

// Saved cities endpoints
router.get("/city/saved", (_req, res): void => {
  res.json({ cities: SAVED_CITIES });
});

router.post("/city/saved", (req, res): void => {
  const { cityName, score, list } = req.body as SavedCity;
  if (!cityName || !list) { res.status(400).json({ error: "cityName and list required" }); return; }
  const existing = SAVED_CITIES.findIndex(c => c.cityName.toLowerCase() === cityName.toLowerCase() && c.list === list);
  if (existing >= 0) { res.json(SAVED_CITIES[existing]); return; }
  const city: SavedCity = { id: `sc-${Date.now()}`, cityName, score, list, savedAt: new Date().toISOString() };
  SAVED_CITIES.push(city);
  res.status(201).json(city);
});

router.delete("/city/saved/:id", (req, res): void => {
  const idx = SAVED_CITIES.findIndex(c => c.id === req.params.id);
  if (idx === -1) { res.status(404).json({ error: "Not found" }); return; }
  SAVED_CITIES.splice(idx, 1);
  res.status(204).send();
});

export default router;
