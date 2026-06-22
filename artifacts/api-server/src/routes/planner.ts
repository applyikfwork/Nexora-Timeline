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

router.post("/planner/itinerary", async (req, res): Promise<void> => {
  const { city, days, month, interests } = req.body as { city: string; days: number; month?: string; interests?: string[] };
  if (!city || !days) { res.status(400).json({ error: "city and days required" }); return; }

  const cacheKey = `itinerary:${city}:${days}:${month ?? "any"}:${(interests || []).sort().join(",")}`;
  const cached = await getCached(cacheKey);
  if (cached) { res.json(cached); return; }

  const cityName = getName(city);
  const interestStr = interests?.join(", ") || "culture, food, sightseeing";
  const monthStr = month || "any time of year";

  const fallbackDays = Array.from({ length: Math.min(days, 7) }, (_, i) => ({
    day: i + 1,
    theme: ["Arrival & Orientation", "Cultural Immersion", "Local Cuisine Deep-Dive", "Hidden Gems", "Day Trip", "Shopping & Markets", "Departure"][i] || `Day ${i + 1}`,
    morning: { activity: "Explore the old city quarter", location: "Historic District", tip: "Go early to beat the crowds" },
    afternoon: { activity: "Visit the main museum", location: "City Center", tip: "Book tickets online in advance" },
    evening: { activity: "Rooftop dinner with city views", location: "Top restaurant district", tip: "Reserve 2 days ahead" },
    crowdLevel: ["Low", "Moderate", "High", "Moderate", "Low", "High", "Low"][i] || "Moderate",
    weatherNote: `Expect typical ${monthStr} weather`,
    localTip: "Ask locals for their favorite hidden spots",
  }));

  const prompt = `Create a detailed ${days}-day travel itinerary for ${cityName} in ${monthStr}. Focus on: ${interestStr}.
Return JSON:
{
  "city": "${cityName}",
  "days": ${days},
  "bestTimeNote": "One sentence about visiting in ${monthStr}",
  "packingTips": ["tip1", "tip2", "tip3"],
  "budgetEstimate": "Daily budget range (USD)",
  "itinerary": [
    {
      "day": 1,
      "theme": "Day theme title",
      "morning": { "activity": "...", "location": "...", "tip": "..." },
      "afternoon": { "activity": "...", "location": "...", "tip": "..." },
      "evening": { "activity": "...", "location": "...", "tip": "..." },
      "crowdLevel": "Low/Moderate/High",
      "weatherNote": "...",
      "localTip": "One insider tip for the day"
    }
  ]
}`;

  const fallback = {
    city: cityName,
    days,
    bestTimeNote: `${monthStr} is a great time to visit ${cityName} with comfortable weather and vibrant local events.`,
    packingTips: ["Comfortable walking shoes", "Light layers for evenings", "Portable charger for navigation"],
    budgetEstimate: "$80-150/day",
    itinerary: fallbackDays,
  };

  const data = await generateJson(prompt, fallback);
  const result = { ...data, generatedAt: new Date().toISOString() };
  await setCached(cacheKey, "itinerary", city, result, 240);
  res.json(result);
});

router.get("/planner/historical", async (req, res): Promise<void> => {
  const placeId = String(req.query.placeId || "delhi-in");
  const year = String(req.query.year || "1985");
  const event = String(req.query.event || "");

  const cacheKey = `historical:${placeId}:${year}:${event}`;
  const cached = await getCached(cacheKey);
  if (cached) { res.json(cached); return; }

  const name = getName(placeId);
  const context = event ? ` during ${event}` : ` in ${year}`;

  const prompt = `Reconstruct what ${name}${context} was like. Make it atmospheric, historically accurate, and vivid.
Return JSON:
{
  "era": "${year}",
  "atmosphere": "3-4 sentence atmospheric description of the city",
  "dailyLife": "2-3 sentences on what ordinary life was like",
  "landmarks": ["3 key landmarks or features of that era"],
  "population": "approximate population",
  "keyEvents": ["2-3 significant things happening in the city at that time"],
  "sensoryDescription": "What did it smell, sound, and look like?",
  "quote": "A fictional quote from an imagined resident of that era"
}`;

  const fallback = {
    era: year,
    atmosphere: `${name} in ${year} was a city in transformation. The streets carried a different rhythm, slower in some ways, more urgent in others. The skyline was lower, the sounds more human-scaled, and the air thick with possibility.`,
    dailyLife: "Most residents rose with the sun. Markets opened early, and the rhythm of the city was set by foot traffic and cycles rather than cars. Evenings gathered communities around radio broadcasts and shared meals.",
    landmarks: ["The original central railway station", "Colonial-era administrative buildings", "The old bazaar quarter"],
    population: "4-6 million",
    keyEvents: ["Major infrastructure construction underway", "Cultural renaissance in arts and literature", "First generation of modern industry establishing roots"],
    sensoryDescription: "Coal smoke and jasmine, the clang of trams, voices in half a dozen dialects, and the scent of street food vendors setting up before dawn.",
    quote: `"This city has always been a place of arrival. Everyone comes here to become someone new." — A resident, ${year}`,
  };

  const data = await generateJson(prompt, fallback);
  const result = { placeId, placeName: name, ...data, generatedAt: new Date().toISOString() };
  await setCached(cacheKey, "historical", placeId, result, 1440);
  res.json(result);
});

const NEIGHBORHOODS: Record<string, Record<string, object>> = {
  "mumbai-in": {
    "bandra": { name: "Bandra", vibe: "Bollywood Soul", vibeScore: 91, personality: "Creative Rebel", bestTime: "Evenings (7-11pm)", hiddenGems: ["Bandstand Promenade at sunset", "Mount Mary Church steps market", "Lucky Restaurant (oldest Irani café)"], dna: { food: 92, nightlife: 88, art: 85, shopping: 78, green: 45, history: 70 } },
    "dharavi": { name: "Dharavi", vibe: "Unstoppable Hustle", vibeScore: 88, personality: "The Engine Room", bestTime: "Morning (8-11am)", hiddenGems: ["Pottery colony workshops", "Leather goods factories", "Rooftop views at dusk"], dna: { food: 70, nightlife: 30, art: 65, shopping: 85, green: 10, history: 80 } },
  },
  "new-york-us": {
    "brooklyn": { name: "Brooklyn", vibe: "Curated Authenticity", vibeScore: 89, personality: "The Creative Class", bestTime: "Weekend afternoons", hiddenGems: ["Smorgasburg food market", "BLDG 92 in Navy Yard", "Sunny's Bar (Red Hook)"], dna: { food: 90, nightlife: 82, art: 92, shopping: 78, green: 65, history: 75 } },
    "harlem": { name: "Harlem", vibe: "Cultural Powerhouse", vibeScore: 86, personality: "The Soul Kitchen", bestTime: "Sunday mornings (gospel)", hiddenGems: ["Sylvia's Restaurant", "National Jazz Museum", "El Museo del Barrio"], dna: { food: 88, nightlife: 75, art: 94, shopping: 65, green: 55, history: 95 } },
  },
  "london-uk": {
    "shoreditch": { name: "Shoreditch", vibe: "Creative Frontier", vibeScore: 87, personality: "Permanently Trendsetting", bestTime: "Thursday-Saturday evenings", hiddenGems: ["Boxpark food court", "Brick Lane Sunday Market", "Nightjar speakeasy bar"], dna: { food: 85, nightlife: 90, art: 95, shopping: 80, green: 35, history: 65 } },
    "brixton": { name: "Brixton", vibe: "Electric Diversity", vibeScore: 84, personality: "The Melting Pot", bestTime: "Market days (Tue-Sat)", hiddenGems: ["Brixton Village market", "Effra Social pub", "Coldharbour Lane murals"], dna: { food: 90, nightlife: 88, art: 80, shopping: 75, green: 40, history: 82 } },
  },
};

router.get("/planner/neighborhood", async (req, res): Promise<void> => {
  const cityId = String(req.query.cityId || "mumbai-in");
  const neighborhood = String(req.query.neighborhood || "").toLowerCase();

  const cityNeighborhoods = NEIGHBORHOODS[cityId];
  if (cityNeighborhoods && neighborhood && cityNeighborhoods[neighborhood]) {
    res.json({ cityId, ...cityNeighborhoods[neighborhood], generatedAt: new Date().toISOString() });
    return;
  }

  if (cityNeighborhoods && !neighborhood) {
    res.json({ cityId, neighborhoods: Object.values(cityNeighborhoods) });
    return;
  }

  const cityName = getName(cityId);
  const neighborhoodName = neighborhood || "city center";

  const cacheKey = `neighborhood:${cityId}:${neighborhoodName}`;
  const cached = await getCached(cacheKey);
  if (cached) { res.json(cached); return; }

  const prompt = `Describe the neighborhood "${neighborhoodName}" in ${cityName}. Return JSON:
{
  "name": "${neighborhoodName}",
  "vibe": "2-3 word vibe label",
  "vibeScore": 85,
  "personality": "One-word personality archetype",
  "bestTime": "Best time to visit",
  "hiddenGems": ["3 hidden gems or local secrets"],
  "dna": { "food": 80, "nightlife": 70, "art": 85, "shopping": 75, "green": 50, "history": 80 }
}`;

  const fallback = {
    name: neighborhoodName,
    vibe: "Urban Character",
    vibeScore: 78,
    personality: "The Authentic Core",
    bestTime: "Evenings and weekends",
    hiddenGems: ["Local family-run restaurant down the side street", "Hidden rooftop with city views", "Weekend artisan market"],
    dna: { food: 75, nightlife: 65, art: 70, shopping: 68, green: 45, history: 72 },
  };

  const data = await generateJson(prompt, fallback);
  const result = { cityId, cityName, ...data, generatedAt: new Date().toISOString() };
  await setCached(cacheKey, "neighborhood", cityId, result, 1440);
  res.json(result);
});

router.get("/planner/compatibility", async (req, res): Promise<void> => {
  const placeId = String(req.query.placeId || "singapore-sg");
  const lifestyle = String(req.query.lifestyle || "work-life-balance,food,tech");

  const cacheKey = `compatibility:${placeId}:${lifestyle}`;
  const cached = await getCached(cacheKey);
  if (cached) { res.json(cached); return; }

  const name = getName(placeId);

  const prompt = `How compatible would someone with this lifestyle (${lifestyle}) be with living in ${name}?
Return JSON:
{
  "score": 82,
  "verdict": "Strong Match / Good Fit / Challenging / Poor Fit",
  "why": "2-3 sentences on why this match works or doesn't",
  "pros": ["3 reasons they'd love it"],
  "cons": ["2 potential challenges"],
  "bestNeighborhood": "The ideal neighborhood for this person",
  "localTip": "One insider tip for settling in",
  "similarCities": ["2 alternative cities if this one doesn't fit"]
}`;

  const fallback = {
    score: 82,
    verdict: "Strong Match",
    why: `${name} aligns well with your priorities. The city offers excellent infrastructure, a dynamic food scene, and a culture that rewards ambition and curiosity.`,
    pros: ["World-class infrastructure and connectivity", "Thriving expat and local community", "Exceptional food scene across all budgets"],
    cons: ["High cost of living in central areas", "Adjusting to local pace and culture takes time"],
    bestNeighborhood: "City Center or the Creative Quarter",
    localTip: "Join local meetups in your first month — the community is welcoming to newcomers.",
    similarCities: ["Singapore", "Zurich"],
  };

  const data = await generateJson(prompt, fallback);
  const result = { placeId, placeName: name, lifestyle, ...data, generatedAt: new Date().toISOString() };
  await setCached(cacheKey, "compatibility", placeId, result, 720);
  res.json(result);
});

router.get("/planner/reporter", async (req, res): Promise<void> => {
  const placeId = String(req.query.placeId || "delhi-in");
  const cacheKey = `reporter:${placeId}:${new Date().toISOString().slice(0, 13)}`;
  const cached = await getCached(cacheKey);
  if (cached) { res.json(cached); return; }

  const name = getName(placeId);
  const hour = new Date().getHours();

  const prompt = `You are an AI city reporter for ${name}. Write a punchy 60-second daily brief.
Return JSON:
{
  "headline": "Today's main story in ${name} (one punchy headline)",
  "brief": "3-4 sentences covering what happened yesterday, what's notable today, and what to watch",
  "weatherMood": "How weather is shaping the city's energy today",
  "crowdAlert": "Where crowds are surging or dropping today",
  "localBuzz": "One interesting anomaly or emerging trend",
  "mood": "The overall city mood score 1-100",
  "moodLabel": "One word: Tense/Calm/Electric/Festive/etc"
}`;

  const fallback = {
    headline: `${name} Wakes: A City in Motion`,
    brief: `${name} opens another chapter today with characteristic energy. Yesterday's rush-hour saw above-average congestion near the commercial district, while the cultural quarter buzzed with an unexpected street festival. Today expect normal patterns with a slight uptick in foot traffic by afternoon. Watch the eastern neighborhoods for emerging activity as a local event draws crowds.`,
    weatherMood: "Clear skies are lifting the city's mood — people are moving faster and staying out later than usual.",
    crowdAlert: "Crowd surge expected near the main market district (2-5pm) and the transit hub during evening rush.",
    localBuzz: "A pop-up night market that appeared last week is drawing unexpected crowds and becoming a local talking point.",
    mood: 78,
    moodLabel: "Vibrant",
  };

  const data = await generateJson(prompt, fallback);
  const result = { placeId, placeName: name, reportedAt: new Date().toISOString(), ...data };
  await setCached(cacheKey, "reporter", placeId, result, 60);
  res.json(result);
});

export default router;
