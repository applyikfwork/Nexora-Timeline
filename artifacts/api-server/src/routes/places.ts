import { Router, type IRouter } from "express";
import { generateJson, generateText } from "../lib/gemini";
import { getCached, setCached } from "../lib/aiCache";
import { getApiKey } from "../lib/apiKeyService";
import { logger } from "../lib/logger";
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
  { id: "hyderabad-in", name: "Hyderabad", country: "India", state: "Telangana", lat: 17.385, lng: 78.4867, placeType: "city", population: 9746000, timezone: "Asia/Kolkata" },
  { id: "chennai-in", name: "Chennai", country: "India", state: "Tamil Nadu", lat: 13.0827, lng: 80.2707, placeType: "city", population: 8696010, timezone: "Asia/Kolkata" },
  { id: "kolkata-in", name: "Kolkata", country: "India", state: "West Bengal", lat: 22.5726, lng: 88.3639, placeType: "city", population: 14850000, timezone: "Asia/Kolkata" },
  { id: "pune-in", name: "Pune", country: "India", state: "Maharashtra", lat: 18.5204, lng: 73.8567, placeType: "city", population: 6800000, timezone: "Asia/Kolkata" },
  { id: "ahmedabad-in", name: "Ahmedabad", country: "India", state: "Gujarat", lat: 23.0225, lng: 72.5714, placeType: "city", population: 7200000, timezone: "Asia/Kolkata" },
  { id: "jaipur-in", name: "Jaipur", country: "India", state: "Rajasthan", lat: 26.9124, lng: 75.7873, placeType: "city", population: 3400000, timezone: "Asia/Kolkata" },
  { id: "surat-in", name: "Surat", country: "India", state: "Gujarat", lat: 21.1702, lng: 72.8311, placeType: "city", population: 4500000, timezone: "Asia/Kolkata" },
  { id: "lucknow-in", name: "Lucknow", country: "India", state: "Uttar Pradesh", lat: 26.8467, lng: 80.9462, placeType: "city", population: 3200000, timezone: "Asia/Kolkata" },
  { id: "indore-in", name: "Indore", country: "India", state: "Madhya Pradesh", lat: 22.7196, lng: 75.8577, placeType: "city", population: 2200000, timezone: "Asia/Kolkata" },
  { id: "coimbatore-in", name: "Coimbatore", country: "India", state: "Tamil Nadu", lat: 11.0168, lng: 76.9558, placeType: "city", population: 1600000, timezone: "Asia/Kolkata" },
  { id: "kochi-in", name: "Kochi", country: "India", state: "Kerala", lat: 9.9312, lng: 76.2673, placeType: "city", population: 2100000, timezone: "Asia/Kolkata" },
  { id: "nagpur-in", name: "Nagpur", country: "India", state: "Maharashtra", lat: 21.1458, lng: 79.0882, placeType: "city", population: 2500000, timezone: "Asia/Kolkata" },
  { id: "bhubaneswar-in", name: "Bhubaneswar", country: "India", state: "Odisha", lat: 20.2961, lng: 85.8245, placeType: "city", population: 900000, timezone: "Asia/Kolkata" },
  { id: "chandigarh-in", name: "Chandigarh", country: "India", state: "Punjab/Haryana", lat: 30.7333, lng: 76.7794, placeType: "city", population: 1100000, timezone: "Asia/Kolkata" },
  { id: "visakhapatnam-in", name: "Visakhapatnam", country: "India", state: "Andhra Pradesh", lat: 17.6868, lng: 83.2185, placeType: "city", population: 2100000, timezone: "Asia/Kolkata" },
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
  { id: "nairobi-ke", name: "Nairobi", country: "Kenya", state: "Nairobi", lat: -1.2921, lng: 36.8219, placeType: "city", population: 4400000, timezone: "Africa/Nairobi" },
  { id: "amsterdam-nl", name: "Amsterdam", country: "Netherlands", state: "North Holland", lat: 52.3676, lng: 4.9041, placeType: "city", population: 872680, timezone: "Europe/Amsterdam" },
];

interface PlaceResult {
  id: string; name: string; country: string; state: string | null;
  lat: number; lng: number; placeType: string; population: number; timezone: string;
}

async function searchMapbox(query: string, limit: number): Promise<PlaceResult[]> {
  const token = await getApiKey("mapbox");
  if (!token) return [];
  try {
    const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(query)}.json?access_token=${token}&types=place&limit=${limit}&language=en`;
    const resp = await fetch(url);
    if (!resp.ok) return [];
    const data = await resp.json() as {
      features: Array<{
        id: string; text: string; place_name: string;
        center: [number, number];
        context?: Array<{ id: string; text: string; short_code?: string }>;
      }>
    };
    return data.features.map(f => {
      const ctx = f.context ?? [];
      const region = ctx.find(c => c.id.startsWith("region."))?.text ?? null;
      const country = ctx.find(c => c.id.startsWith("country."))?.text ?? "";
      const countryCode = ctx.find(c => c.id.startsWith("country."))?.short_code ?? "xx";
      const slug = `${f.text.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-${countryCode}`;
      return { id: slug, name: f.text, country, state: region, lat: f.center[1], lng: f.center[0], placeType: "city", population: 0, timezone: "" };
    });
  } catch (err) {
    logger.warn({ err }, "Mapbox geocoding failed");
    return [];
  }
}

router.get("/places/search", async (req, res): Promise<void> => {
  const parsed = SearchPlacesQueryParams.safeParse(req.query);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }

  const { q, limit = 10 } = parsed.data;
  const query = q.toLowerCase().trim();

  const mapboxResults = await searchMapbox(q, limit);
  if (mapboxResults.length > 0) {
    res.json(mapboxResults.slice(0, limit));
    return;
  }

  const results = KNOWN_PLACES
    .filter(p =>
      p.name.toLowerCase().includes(query) ||
      p.country.toLowerCase().includes(query) ||
      (p.state && p.state.toLowerCase().includes(query))
    )
    .slice(0, limit);

  res.json(results);
});

router.get("/places/:placeId", async (req, res): Promise<void> => {
  const params = GetPlaceParams.safeParse(req.params);
  if (!params.success) { res.status(400).json({ error: params.error.message }); return; }

  const { placeId } = params.data;
  const known = KNOWN_PLACES.find(p => p.id === placeId);

  const cacheKey = `place:detail:${placeId}`;
  const cached = await getCached<{ description: string; tags: string[] }>(cacheKey);

  if (cached && known) {
    res.json({ ...known, ...cached, createdAt: new Date().toISOString() });
    return;
  }

  const placeName = known ? `${known.name}, ${known.country}` : placeId.replace(/-/g, " ");
  const desc = await generateText(`Write a 2-sentence description of ${placeName} for a location intelligence platform. Focus on its key identity, economic role, and what makes it unique. Be factual and concise.`);
  const detail = { description: desc, tags: ["urban", "cultural"] };
  await setCached(cacheKey, "place_detail", placeId, detail, 1440);

  res.json({
    ...(known ?? { id: placeId, name: placeName, country: "", state: null, lat: 0, lng: 0, placeType: "city", population: 0, timezone: "" }),
    ...detail,
    createdAt: new Date().toISOString(),
  });
});

router.get("/places/:placeId/personality", async (req, res): Promise<void> => {
  const params = GetPlacePersonalityParams.safeParse(req.params);
  if (!params.success) { res.status(400).json({ error: params.error.message }); return; }

  const { placeId } = params.data;
  const cacheKey = `personality:${placeId}`;
  const cached = await getCached(cacheKey);
  if (cached) { res.json(cached); return; }

  const known = KNOWN_PLACES.find(p => p.id === placeId);
  const placeName = known ? `${known.name}, ${known.country}` : placeId.replace(/-/g, " ");

  const personality = await generateJson(
    `Generate a city personality profile for ${placeName}. Return JSON: { "archetype": string (one evocative word), "vibe": string (2-3 words), "energyLevel": number (1-10), "cosmopolitan": number (1-10), "affordable": number (1-10), "safety": number (1-10), "growth": number (1-10), "culture": number (1-10), "tagline": string (short punchy tagline), "bestFor": string[] (3 things this city is best for) }`,
    { archetype: "Metropolitan", vibe: "Fast-paced urban", energyLevel: 7, cosmopolitan: 7, affordable: 6, safety: 7, growth: 7, culture: 8, tagline: "A city of possibilities", bestFor: ["Business", "Culture", "Food"] }
  );

  await setCached(cacheKey, "personality", placeId, personality, 1440);
  res.json(personality);
});

router.get("/places/:placeId/live", async (req, res): Promise<void> => {
  const params = GetPlaceLiveDataParams.safeParse(req.params);
  if (!params.success) { res.status(400).json({ error: params.error.message }); return; }

  const { placeId } = params.data;
  const hour = new Date().getHours();
  const cacheKey = `live:${placeId}:${new Date().toISOString().slice(0, 13)}`;
  const cached = await getCached(cacheKey);
  if (cached) { res.json(cached); return; }

  const known = KNOWN_PLACES.find(p => p.id === placeId);
  const placeName = known ? `${known.name}, ${known.country}` : placeId.replace(/-/g, " ");

  const liveData = await generateJson(
    `Current live city conditions for ${placeName} at ${hour}:00. Return JSON: { "crowdLevel": "Low"|"Moderate"|"Busy"|"Very Busy"|"Packed", "weatherSummary": string, "topAlert": string (one current tip or alert), "activityScore": number (0-100), "transitStatus": "Normal"|"Delayed"|"Disrupted" }`,
    { crowdLevel: "Moderate", weatherSummary: "Partly cloudy", topAlert: "Regular city activity", activityScore: 65, transitStatus: "Normal" }
  );

  await setCached(cacheKey, "live_data", placeId, liveData, 60);
  res.json(liveData);
});

export default router;
