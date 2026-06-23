import { Router, type IRouter } from "express";
import { generateJson, generateText } from "../lib/gemini";
import { getCached, setCached } from "../lib/aiCache";

const router: IRouter = Router();

const PLACE_NAMES: Record<string, string> = {
  "delhi-in": "Delhi, India",
  "mumbai-in": "Mumbai, India",
  "london-uk": "London, UK",
  "new-york-us": "New York, USA",
  "tokyo-jp": "Tokyo, Japan",
  "paris-fr": "Paris, France",
  "dubai-ae": "Dubai, UAE",
  "singapore-sg": "Singapore",
  "bangalore-in": "Bangalore, India",
  "sydney-au": "Sydney, Australia",
  "cairo-eg": "Cairo, Egypt",
  "seoul-kr": "Seoul, South Korea",
  "berlin-de": "Berlin, Germany",
  "toronto-ca": "Toronto, Canada",
  "sao-paulo-br": "São Paulo, Brazil",
};

function getName(id: string) {
  return PLACE_NAMES[id] ?? id.replace(/-/g, " ");
}

const VIBE_DEFAULTS: Record<string, object> = {
  "delhi-in": { vibeScore: 87, personality: "Electric", energy: 92, culture: 90, chaos: 78, soul: 95, quote: "Delhi doesn't walk — it charges forward, ancient and electric at once." },
  "tokyo-jp": { vibeScore: 94, personality: "Hyper-Precise", energy: 88, culture: 96, chaos: 42, soul: 91, quote: "In Tokyo, even the silence has a schedule." },
  "new-york-us": { vibeScore: 91, personality: "Relentless", energy: 96, culture: 89, chaos: 72, soul: 87, quote: "New York doesn't give you a moment to breathe — and somehow that's the point." },
  "mumbai-in": { vibeScore: 89, personality: "Unstoppable", energy: 93, culture: 85, chaos: 80, soul: 92, quote: "Mumbai runs on dreams and chai, and somehow never stops." },
  "paris-fr": { vibeScore: 88, personality: "Romantic Defiance", energy: 75, culture: 98, chaos: 55, soul: 94, quote: "Paris is the only city where being lost is a form of arrival." },
  "london-uk": { vibeScore: 85, personality: "Composed Chaos", energy: 82, culture: 95, chaos: 60, soul: 88, quote: "London holds 2000 years of stories in a single city block." },
  "dubai-ae": { vibeScore: 82, personality: "Audacious", energy: 85, culture: 70, chaos: 35, soul: 72, quote: "Dubai turned desert into a dare — and won." },
  "singapore-sg": { vibeScore: 90, personality: "Flawlessly Efficient", energy: 80, culture: 78, chaos: 20, soul: 82, quote: "Singapore is the future, quietly already here." },
};

router.get("/viral/vibe-card", async (req, res): Promise<void> => {
  const placeId = String(req.query.placeId || "delhi-in");
  const cacheKey = `vibe-card:${placeId}:${new Date().toISOString().slice(0, 10)}`;
  const cached = await getCached(cacheKey);
  if (cached) { res.json(cached); return; }

  const name = getName(placeId);
  const fallback = VIBE_DEFAULTS[placeId] ?? {
    vibeScore: Math.floor(70 + Math.random() * 25),
    personality: "Vibrant",
    energy: Math.floor(65 + Math.random() * 30),
    culture: Math.floor(65 + Math.random() * 30),
    chaos: Math.floor(30 + Math.random() * 50),
    soul: Math.floor(65 + Math.random() * 30),
    quote: `${name} pulses with a rhythm all its own.`,
  };

  const prompt = `Generate a vibe card for ${name} right now. Return JSON:
{
  "vibeScore": 87,
  "personality": "Electric (1-2 word vibe label)",
  "energy": 92,
  "culture": 90,
  "chaos": 78,
  "soul": 95,
  "quote": "A punchy one-liner about the city's soul right now (max 12 words)"
}`;

  const data = await generateJson(prompt, fallback);
  const result = { placeId, placeName: name, generatedAt: new Date().toISOString(), ...data };
  await setCached(cacheKey, "vibe-card", placeId, result, 1440);
  res.json(result);
});

router.post("/viral/city-battle", async (req, res): Promise<void> => {
  const { placeA, placeB } = req.body as { placeA: string; placeB: string };
  if (!placeA || !placeB) { res.status(400).json({ error: "placeA and placeB required" }); return; }

  const cacheKey = `battle:${[placeA, placeB].sort().join(":")}:${new Date().toISOString().slice(0, 10)}`;
  const cached = await getCached(cacheKey);
  if (cached) { res.json(cached); return; }

  const nameA = getName(placeA);
  const nameB = getName(placeB);

  const fallbackStats = (name: string, base: number) => ({
    energy: base + Math.floor(Math.random() * 15),
    culture: base + Math.floor(Math.random() * 15),
    nightlife: base + Math.floor(Math.random() * 15),
    food: base + Math.floor(Math.random() * 15),
    safety: base + Math.floor(Math.random() * 15),
    innovation: base + Math.floor(Math.random() * 15),
  });

  const prompt = `Epic city battle: ${nameA} vs ${nameB}. Rate each city 1-100 on: energy, culture, nightlife, food, safety, innovation. Declare a winner with a punchy reason. Return JSON:
{
  "cityA": { "name": "${nameA}", "stats": { "energy": 85, "culture": 90, "nightlife": 78, "food": 92, "safety": 72, "innovation": 80 } },
  "cityB": { "name": "${nameB}", "stats": { "energy": 88, "culture": 85, "nightlife": 92, "food": 88, "safety": 85, "innovation": 90 } },
  "winner": "${nameA} or ${nameB}",
  "margin": "narrow/clear/dominant",
  "verdict": "One sentence: why the winner wins and what it's best at",
  "tagline": "A battle cry for the winner (max 8 words)"
}`;

  const fallback = {
    cityA: { name: nameA, stats: fallbackStats(nameA, 70) },
    cityB: { name: nameB, stats: fallbackStats(nameB, 72) },
    winner: nameB,
    margin: "narrow",
    verdict: `${nameB} edges ahead with superior innovation and safety scores, though ${nameA} leads in raw cultural energy.`,
    tagline: `${nameB}: where the future lives`,
  };

  const data = await generateJson(prompt, fallback);
  const result = { ...data, generatedAt: new Date().toISOString() };
  await setCached(cacheKey, "battle", placeA, result, 1440);
  res.json(result);
});

const QUIZ_CITIES = [
  { id: "tokyo-jp", name: "Tokyo", traits: ["organized", "tech", "foodie", "night-owl", "introvert"] },
  { id: "new-york-us", name: "New York", traits: ["ambitious", "fast", "creative", "social", "hustle"] },
  { id: "paris-fr", name: "Paris", traits: ["romantic", "artistic", "slow", "cultured", "aesthetic"] },
  { id: "mumbai-in", name: "Mumbai", traits: ["resilient", "dreamer", "social", "hustle", "foodie"] },
  { id: "singapore-sg", name: "Singapore", traits: ["efficient", "organized", "tech", "ambitious", "clean"] },
  { id: "berlin-de", name: "Berlin", traits: ["creative", "night-owl", "free-spirit", "artistic", "social"] },
  { id: "dubai-ae", name: "Dubai", traits: ["ambitious", "luxury", "fast", "social", "modern"] },
  { id: "delhi-in", name: "Delhi", traits: ["cultural", "foodie", "social", "resilient", "historic"] },
  { id: "london-uk", name: "London", traits: ["cultured", "composed", "social", "creative", "historic"] },
  { id: "sydney-au", name: "Sydney", traits: ["outdoor", "relaxed", "social", "creative", "free-spirit"] },
];

router.post("/viral/quiz-result", async (req, res): Promise<void> => {
  const { answers } = req.body as { answers: string[] };
  if (!answers || !Array.isArray(answers)) { res.status(400).json({ error: "answers array required" }); return; }

  const prompt = `Based on these personality quiz answers: ${answers.join(", ")}
Match this person to one of these cities: ${QUIZ_CITIES.map(c => c.name).join(", ")}.
Return JSON:
{
  "city": "Tokyo",
  "cityId": "tokyo-jp",
  "matchPercent": 87,
  "personality": "The Hyper-Organized Dreamer",
  "why": "2-3 sentences explaining why this city matches them perfectly",
  "topTraits": ["organized", "tech-savvy", "night-owl"],
  "funFact": "One surprising fact about why they'd thrive in this city"
}`;

  const fallback = {
    city: "Tokyo",
    cityId: "tokyo-jp",
    matchPercent: 84,
    personality: "The Thoughtful Innovator",
    why: "Your blend of precision and curiosity matches Tokyo's culture perfectly. You thrive in structured environments that still leave room for wonder and exploration.",
    topTraits: ["organized", "curious", "tech-savvy"],
    funFact: "Tokyo has more Michelin-starred restaurants than any other city — perfect for a foodie who values quality.",
  };

  const data = await generateJson(prompt, fallback);
  res.json({ ...data, generatedAt: new Date().toISOString() });
});

router.get("/viral/poetry", async (req, res): Promise<void> => {
  const placeId = String(req.query.placeId || "tokyo-jp");
  const form = String(req.query.form || "haiku");
  const name = getName(placeId);
  const hour = new Date().getHours();
  const timeOfDay = hour < 6 ? "pre-dawn" : hour < 12 ? "morning" : hour < 17 ? "afternoon" : hour < 21 ? "evening" : "night";

  const prompt = `Write a beautiful ${form} about ${name} during ${timeOfDay}. 
${form === "haiku" ? "Strict 5-7-5 syllable haiku." : "Short 4-line poem."}
Make it vivid, evocative, and specific to this city's character right now.
Return JSON: { "poem": "line1\\nline2\\nline3", "form": "${form}", "mood": "one word mood" }`;

  const fallbackPoems: Record<string, string> = {
    "tokyo-jp": "Rain on Tokyo streets\nSalarymen bow in mist\nMidnight ramen waits",
    "delhi-in": "Ancient dust, new light\nAuto rickshaws weave and dart\nDreams sold by the gram",
    "new-york-us": "Glass towers pierce cloud\nEight million separate dreams\nOne city breathes whole",
    "paris-fr": "Seine reflects old lamps\nCafé smoke and philosophy\nTime forgets to rush",
    "mumbai-in": "Dabbawalas run\nDharavi never sleeps\nDreams float on sea-wind",
  };

  const fallback = {
    poem: fallbackPoems[placeId] ?? `${name} breathes\nMillions move as one great tide\nThe city exhales`,
    form,
    mood: "contemplative",
  };

  const data = await generateJson(prompt, fallback);
  res.json({ placeId, placeName: name, ...data, generatedAt: new Date().toISOString() });
});

const LEADERBOARD_BASE = [
  { rank: 1, placeId: "tokyo-jp", name: "Tokyo", country: "Japan", explores: 12847, vibeScore: 94, trend: "stable", badge: "🏆" },
  { rank: 2, placeId: "new-york-us", name: "New York", country: "USA", explores: 11203, vibeScore: 91, trend: "up", badge: "🔥" },
  { rank: 3, placeId: "paris-fr", name: "Paris", country: "France", explores: 9841, vibeScore: 88, trend: "up", badge: "⬆️" },
  { rank: 4, placeId: "london-uk", name: "London", country: "UK", explores: 9102, vibeScore: 85, trend: "stable", badge: "" },
  { rank: 5, placeId: "dubai-ae", name: "Dubai", country: "UAE", explores: 8754, vibeScore: 82, trend: "up", badge: "🚀" },
  { rank: 6, placeId: "singapore-sg", name: "Singapore", country: "Singapore", explores: 7903, vibeScore: 90, trend: "down", badge: "" },
  { rank: 7, placeId: "mumbai-in", name: "Mumbai", country: "India", explores: 7421, vibeScore: 89, trend: "up", badge: "⬆️" },
  { rank: 8, placeId: "delhi-in", name: "Delhi", country: "India", explores: 6982, vibeScore: 87, trend: "up", badge: "" },
  { rank: 9, placeId: "seoul-kr", name: "Seoul", country: "South Korea", explores: 6543, vibeScore: 86, trend: "up", badge: "⬆️" },
  { rank: 10, placeId: "berlin-de", name: "Berlin", country: "Germany", explores: 5891, vibeScore: 83, trend: "stable", badge: "" },
];

router.get("/viral/leaderboard", async (req, res): Promise<void> => {
  const jitter = () => Math.floor(Math.random() * 200 - 100);
  const result = LEADERBOARD_BASE.map(c => ({ ...c, explores: c.explores + jitter() }));
  res.json({ cities: result, updatedAt: new Date().toISOString(), period: "this week" });
});

export default router;
