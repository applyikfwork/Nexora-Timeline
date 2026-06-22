import { Router, type IRouter } from "express";
import { generateJson } from "../lib/gemini";
import { getCached, setCached } from "../lib/aiCache";
import { ReadPlaceTimelineParams, ReadPlaceTimelineQueryParams, ReadTimelineReplayParams, ReadTimelineReplayQueryParams } from "@workspace/api-zod";

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
};

function getPlaceName(placeId: string): string {
  return PLACE_NAMES[placeId] ?? placeId.replace(/-/g, " ");
}

function generateFallbackTimeline(placeName: string, mode: string) {
  const entries = [
    { time: "6:00 AM", title: "City awakens", description: "Early commuters begin their day, street vendors set up, and the city slowly comes to life.", category: "crowd", intensity: "low", icon: "sunrise" },
    { time: "8:30 AM", title: "Morning rush begins", description: "Metro stations fill with office workers, traffic builds at major intersections.", category: "traffic", intensity: "high", icon: "train" },
    { time: "11:00 AM", title: "Business hours in full swing", description: "Markets open, cafes fill with morning patrons, business districts busy.", category: "business", intensity: "medium", icon: "briefcase" },
    { time: "1:00 PM", title: "Lunch hour activity", description: "Restaurants see peak crowds, food streets packed with workers on break.", category: "restaurant", intensity: "high", icon: "utensils" },
    { time: "3:30 PM", title: "Afternoon lull", description: "Post-lunch slowdown in most areas. Shopping districts seeing steady foot traffic.", category: "crowd", intensity: "low", icon: "sun" },
    { time: "6:00 PM", title: "Evening rush hour", description: "Major roads congested as offices close. Metro at maximum capacity.", category: "transit", intensity: "high", icon: "train" },
    { time: "8:00 PM", title: "Restaurants and nightlife stir", description: "Dinner service in full swing, early evening entertainment venues open up.", category: "restaurant", intensity: "high", icon: "moon" },
    { time: "10:00 PM", title: "Night scene emerges", description: "Clubs and bars filling up, late-night street food vendors doing brisk business.", category: "event", intensity: "medium", icon: "stars" },
  ];

  return {
    entries,
    narrative: `As ${mode === "today" ? "today" : "the day"} unfolds in ${placeName}, the city moves through its familiar rhythms. The morning brings a surge of commuters and the energy of a city coming to life. By midday, the streets hum with activity as workers, shoppers, and visitors all converge. The evening transformation is particularly striking — what was a business district becomes a vibrant social hub, with restaurants filling to capacity and the sound of city life reaching its nightly crescendo.`,
  };
}

router.get("/timelines/:placeId", async (req, res): Promise<void> => {
  const params = ReadPlaceTimelineParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const query = ReadPlaceTimelineQueryParams.safeParse(req.query);
  const mode = (query.success ? query.data.mode : "today") ?? "today";
  const date = (query.success ? query.data.date : undefined) ?? new Date().toISOString().split("T")[0];

  const { placeId } = params.data;
  const placeName = getPlaceName(placeId);
  const cacheKey = `timeline:${placeId}:${mode}:${date}`;

  const cached = await getCached(cacheKey);
  if (cached) {
    res.json(cached);
    return;
  }

  const fallback = generateFallbackTimeline(placeName, mode);

  const prompt = `Generate a realistic hourly activity timeline for ${placeName} for ${mode === "today" ? "today" : mode}.

Return JSON in this exact format:
{
  "entries": [
    {"time": "8:00 AM", "title": "Short title", "description": "1-2 sentence description", "category": "one of: traffic|crowd|restaurant|transit|event|weather|safety|business", "intensity": "one of: low|medium|high", "icon": "icon name"},
    ... (8-10 entries spanning the full day from 6am to midnight)
  ],
  "narrative": "A 3-4 sentence flowing narrative about the city's activity pattern throughout the day"
}`;

  const aiData = await generateJson(prompt, fallback);

  const result = {
    placeId,
    date: date as string,
    mode,
    narrative: aiData.narrative ?? fallback.narrative,
    entries: aiData.entries ?? fallback.entries,
  };

  await setCached(cacheKey, "timeline", placeId, result, mode === "today" ? 30 : 240);
  res.json(result);
});

router.get("/timelines/:placeId/replay", async (req, res): Promise<void> => {
  const params = ReadTimelineReplayParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const { placeId } = params.data;

  const hourlyData = [
    { hour: 6, label: "6 AM", traffic: 15, crowd: 10, noise: 20, activity: 25, description: "City waking up" },
    { hour: 7, label: "7 AM", traffic: 45, crowd: 40, noise: 50, activity: 55, description: "Early rush begins" },
    { hour: 8, label: "8 AM", traffic: 82, crowd: 75, noise: 78, activity: 85, description: "Peak morning rush" },
    { hour: 9, label: "9 AM", traffic: 70, crowd: 65, noise: 68, activity: 72, description: "Offices open" },
    { hour: 10, label: "10 AM", traffic: 50, crowd: 55, noise: 55, activity: 60, description: "Mid-morning activity" },
    { hour: 11, label: "11 AM", traffic: 45, crowd: 58, noise: 52, activity: 62, description: "Business hours" },
    { hour: 12, label: "12 PM", traffic: 65, crowd: 80, noise: 75, activity: 82, description: "Lunch rush" },
    { hour: 13, label: "1 PM", traffic: 60, crowd: 72, noise: 70, activity: 75, description: "Peak lunch" },
    { hour: 14, label: "2 PM", traffic: 42, crowd: 50, noise: 50, activity: 55, description: "Afternoon lull" },
    { hour: 15, label: "3 PM", traffic: 38, crowd: 45, noise: 45, activity: 50, description: "Quiet afternoon" },
    { hour: 16, label: "4 PM", traffic: 55, crowd: 55, noise: 55, activity: 62, description: "Schools out" },
    { hour: 17, label: "5 PM", traffic: 85, crowd: 78, noise: 80, activity: 88, description: "Evening rush" },
    { hour: 18, label: "6 PM", traffic: 90, crowd: 85, noise: 85, activity: 92, description: "Peak evening rush" },
    { hour: 19, label: "7 PM", traffic: 65, crowd: 72, noise: 70, activity: 78, description: "Dinner time" },
    { hour: 20, label: "8 PM", traffic: 50, crowd: 78, noise: 72, activity: 80, description: "Evening out" },
    { hour: 21, label: "9 PM", traffic: 40, crowd: 70, noise: 68, activity: 74, description: "Nightlife" },
    { hour: 22, label: "10 PM", traffic: 35, crowd: 55, noise: 62, activity: 60, description: "Late night" },
    { hour: 23, label: "11 PM", traffic: 20, crowd: 35, noise: 45, activity: 40, description: "Winding down" },
  ];

  res.json(hourlyData);
});

export default router;
