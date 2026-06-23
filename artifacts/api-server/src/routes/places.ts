import { Router, type IRouter } from "express";
import { db, savedPlacesTable, searchLogsTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { generateJson, generateText } from "../lib/gemini";
import { getCached, setCached } from "../lib/aiCache";
import {
  SearchPlacesQueryParams,
  GetPlaceParams,
  GetPlacePersonalityParams,
  GetPlaceLiveDataParams,
} from "@workspace/api-zod";

const router: IRouter = Router();

const KNOWN_PLACES = [
  { id: "delhi-in", name: "Delhi", country: "India", state: "Delhi", lat: 28.6139, lng: 77.209, placeType: "city", population: 32941000, timezone: "Asia/Kolkata" },
  { id: "mumbai-in", name: "Mumbai", country: "India", state: "Maharashtra", lat: 19.076, lng: 72.8777, placeType: "city", population: 20667656, timezone: "Asia/Kolkata" },
  { id: "bangalore-in", name: "Bangalore", country: "India", state: "Karnataka", lat: 12.9716, lng: 77.5946, placeType: "city", population: 12764935, timezone: "Asia/Kolkata" },
  { id: "london-uk", name: "London", country: "United Kingdom", state: "England", lat: 51.5074, lng: -0.1278, placeType: "city", population: 9304016, timezone: "Europe/London" },
  { id: "new-york-us", name: "New York", country: "United States", state: "New York", lat: 40.7128, lng: -74.006, placeType: "city", population: 8336817, timezone: "America/New_York" },
  { id: "tokyo-jp", name: "Tokyo", country: "Japan", state: "Tokyo", lat: 35.6762, lng: 139.6503, placeType: "city", population: 13960000, timezone: "Asia/Tokyo" },
  { id: "paris-fr", name: "Paris", country: "France", state: "Île-de-France", lat: 48.8566, lng: 2.3522, placeType: "city", population: 2161000, timezone: "Europe/Paris" },
  { id: "dubai-ae", name: "Dubai", country: "United Arab Emirates", state: "Dubai", lat: 25.2048, lng: 55.2708, placeType: "city", population: 3331420, timezone: "Asia/Dubai" },
  { id: "singapore-sg", name: "Singapore", country: "Singapore", state: null, lat: 1.3521, lng: 103.8198, placeType: "city", population: 5850342, timezone: "Asia/Singapore" },
  { id: "sydney-au", name: "Sydney", country: "Australia", state: "New South Wales", lat: -33.8688, lng: 151.2093, placeType: "city", population: 5312000, timezone: "Australia/Sydney" },
  { id: "cairo-eg", name: "Cairo", country: "Egypt", state: "Cairo", lat: 30.0444, lng: 31.2357, placeType: "city", population: 10085869, timezone: "Africa/Cairo" },
  { id: "seoul-kr", name: "Seoul", country: "South Korea", state: "Seoul", lat: 37.5665, lng: 126.978, placeType: "city", population: 9720846, timezone: "Asia/Seoul" },
  { id: "berlin-de", name: "Berlin", country: "Germany", state: "Berlin", lat: 52.52, lng: 13.405, placeType: "city", population: 3769495, timezone: "Europe/Berlin" },
  { id: "toronto-ca", name: "Toronto", country: "Canada", state: "Ontario", lat: 43.6532, lng: -79.3832, placeType: "city", population: 2731571, timezone: "America/Toronto" },
  { id: "sao-paulo-br", name: "São Paulo", country: "Brazil", state: "São Paulo", lat: -23.5505, lng: -46.6333, placeType: "city", population: 12325232, timezone: "America/Sao_Paulo" },
];

router.get("/places/search", async (req, res): Promise<void> => {
  const parsed = SearchPlacesQueryParams.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { q, limit = 10 } = parsed.data;
  const query = q.toLowerCase().trim();

  const results = KNOWN_PLACES
    .filter(p =>
      p.name.toLowerCase().includes(query) ||
      p.country.toLowerCase().includes(query) ||
      (p.state && p.state.toLowerCase().includes(query))
    )
    .slice(0, limit);

  await db.insert(searchLogsTable).values({ query: q, resultCount: results.length }).catch(() => {});

  res.json(results);
});

router.get("/places/:placeId", async (req, res): Promise<void> => {
  const params = GetPlaceParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const place = KNOWN_PLACES.find(p => p.id === params.data.placeId);
  if (!place) {
    res.status(404).json({ error: "Place not found" });
    return;
  }

  const descriptions: Record<string, string> = {
    "delhi-in": "Delhi, India's capital and second-largest city, is a vibrant metropolis blending ancient history with modern ambitions. Home to UNESCO World Heritage Sites, bustling markets, and India's largest metro network.",
    "mumbai-in": "Mumbai is India's financial capital and the city of dreams — a fast-paced megacity where Bollywood glamour meets coastal beauty and relentless entrepreneurial energy.",
    "london-uk": "London is a global metropolis with 2,000 years of history, iconic landmarks, world-class museums, and one of the world's most diverse populations.",
    "new-york-us": "New York City is the cultural and financial capital of the world — a city that never sleeps, where skyscrapers meet street art and every neighborhood tells a different story.",
    "tokyo-jp": "Tokyo is a hyper-organized marvel of technology and tradition — the world's largest metropolitan area, where ancient temples stand beside neon-lit skyscrapers.",
  };

  res.json({
    ...place,
    description: descriptions[place.id] ?? `${place.name} is a major city in ${place.country} with a rich cultural heritage and vibrant urban life.`,
    tags: ["urban", "cultural", "historic"],
    createdAt: new Date().toISOString(),
  });
});

router.get("/places/:placeId/personality", async (req, res): Promise<void> => {
  const params = GetPlacePersonalityParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const { placeId } = params.data;
  const place = KNOWN_PLACES.find(p => p.id === placeId);
  if (!place) {
    res.status(404).json({ error: "Place not found" });
    return;
  }

  const cacheKey = `personality:${placeId}`;
  const cached = await getCached(cacheKey);
  if (cached) {
    res.json(cached);
    return;
  }

  const personalities: Record<string, object> = {
    "delhi-in": { ratings: { energy: 4.8, tourism: 4.5, shopping: 4.6, nightlife: 3.8, education: 4.2, business: 4.5 }, areaDna: { food: 85, business: 78, culture: 90, shopping: 82, nature: 35, entertainment: 72, education: 70, healthcare: 65 } },
    "mumbai-in": { ratings: { energy: 5.0, tourism: 4.3, shopping: 4.7, nightlife: 4.5, education: 4.0, business: 5.0 }, areaDna: { food: 82, business: 95, culture: 80, shopping: 88, nature: 30, entertainment: 85, education: 68, healthcare: 72 } },
    "london-uk": { ratings: { energy: 4.2, tourism: 5.0, shopping: 4.8, nightlife: 4.3, education: 4.9, business: 4.8 }, areaDna: { food: 78, business: 92, culture: 95, shopping: 90, nature: 55, entertainment: 88, education: 92, healthcare: 85 } },
    "tokyo-jp": { ratings: { energy: 4.5, tourism: 5.0, shopping: 5.0, nightlife: 4.0, education: 4.7, business: 4.9 }, areaDna: { food: 95, business: 90, culture: 88, shopping: 96, nature: 45, entertainment: 85, education: 88, healthcare: 90 } },
  };

  const defaultPersonality = {
    ratings: { energy: 4.0, tourism: 4.0, shopping: 3.8, nightlife: 3.5, education: 3.8, business: 4.0 },
    areaDna: { food: 70, business: 72, culture: 75, shopping: 68, nature: 50, entertainment: 65, education: 62, healthcare: 60 },
  };

  const personality = personalities[placeId] ?? defaultPersonality;

  const prompt = `Generate a 2-sentence personality summary for ${place.name}, ${place.country}. Focus on its unique character, energy, and what makes it distinctive. Be vivid and specific.`;
  const summary = await generateText(prompt).catch(() => `${place.name} is a city of extraordinary contrasts — where ancient traditions meet modern ambitions. Its streets pulse with life, culture, and the energy of millions of stories unfolding simultaneously.`);

  const result = {
    placeId,
    placeName: place.name,
    ...personality,
    summary: typeof summary === 'string' ? summary.trim() : summary,
    generatedAt: new Date().toISOString(),
  };

  await setCached(cacheKey, "personality", placeId, result, 1440);
  res.json(result);
});

router.get("/places/:placeId/live-data", async (req, res): Promise<void> => {
  const params = GetPlaceLiveDataParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const { placeId } = params.data;
  const place = KNOWN_PLACES.find(p => p.id === placeId);

  const hour = new Date().getHours();
  const isRushHour = (hour >= 8 && hour <= 10) || (hour >= 17 && hour <= 20);
  const isNight = hour >= 22 || hour <= 5;
  const isMorning = hour >= 6 && hour <= 9;

  const trafficLevel = isRushHour ? "high" : isNight ? "low" : "moderate";
  const crowdLevel = isRushHour ? "busy" : isNight ? "quiet" : "moderate";

  res.json({
    placeId,
    timestamp: new Date().toISOString(),
    weather: {
      condition: isMorning ? "Clear" : isNight ? "Clear Night" : "Partly Cloudy",
      temperature: placeId.includes("dubai") ? 38 : placeId.includes("london") ? 16 : placeId.includes("tokyo") ? 22 : 28,
      humidity: placeId.includes("mumbai") ? 82 : placeId.includes("singapore") ? 78 : 55,
      description: isNight ? "Cool and clear night" : isMorning ? "Fresh morning air" : "Mild conditions with some cloud cover",
    },
    traffic: {
      level: trafficLevel,
      score: isRushHour ? 78 : isNight ? 12 : 45,
    },
    crowd: {
      level: crowdLevel,
      score: isRushHour ? 82 : isNight ? 15 : 48,
    },
    noise: {
      level: isRushHour ? "loud" : isNight ? "quiet" : "moderate",
    },
    safety: {
      score: placeId.includes("singapore") ? 96 : placeId.includes("tokyo") ? 94 : placeId.includes("london") ? 78 : 72,
      level: placeId.includes("singapore") || placeId.includes("tokyo") ? "very_safe" : "safe",
    },
    mood: {
      sentiment: isNight ? "calm" : isMorning ? "energetic" : "vibrant",
      score: isRushHour ? 65 : isNight ? 75 : 80,
    },
  });
});

export default router;
