import { Router, type IRouter } from "express";
import { generateJson } from "../lib/gemini";
import { getCached, setCached } from "../lib/aiCache";

const router: IRouter = Router();

// ── In-memory saved places ──────────────────────────────────────────────────
interface SavedPlace { id: string; locationName: string; category: string; savedAt: string }
const SAVED_PLACES: SavedPlace[] = [];

// ── POST /crowd/forecast — Full crowd forecast for any location ─────────────
router.post("/crowd/forecast", async (req, res): Promise<void> => {
  const { locationName } = req.body as { locationName: string };
  if (!locationName?.trim()) { res.status(400).json({ error: "locationName required" }); return; }

  const hourSlot = new Date().toISOString().slice(0, 13);
  const cacheKey = `crowd-forecast-v3:${locationName.toLowerCase().trim()}:${hourSlot}`;
  const cached = await getCached<object>(cacheKey);
  if (cached) { res.json(cached); return; }

  const hour = new Date().getHours();
  const timeOfDay = hour < 6 ? "Night" : hour < 12 ? "Morning" : hour < 17 ? "Afternoon" : hour < 21 ? "Evening" : "Night";
  const dayName = ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"][new Date().getDay()];
  const isWeekend = new Date().getDay() === 0 || new Date().getDay() === 6;

  const prompt = `You are Nexora's AI Crowd Forecast engine. Analyse crowd patterns for "${locationName}" — this could be any Indian city, town, market, landmark, street, area, or neighborhood.
It is currently ${timeOfDay} on ${dayName}. Weekend: ${isWeekend}.

Return ONLY valid JSON (no markdown):
{
  "locationName": "${locationName}",
  "locationType": "City | Market | Temple | Mall | Street | Park | Tourist Place | Neighborhood | Landmark | Beach | Stadium",
  "currentCrowd": 0-100,
  "crowdStatus": "Calm | Moderate | Busy | Very Crowded",
  "crowdStatusColor": "green | yellow | orange | red",
  "crowdPersonality": {
    "dominant": "Tourist | Local | Student | Family | Shopper | Worker | Pilgrim | Mixed",
    "types": [
      { "label": "Tourist Crowd", "pct": 0-100, "emoji": "✈️" },
      { "label": "Local Residents", "pct": 0-100, "emoji": "🏠" },
      { "label": "Family Visitors", "pct": 0-100, "emoji": "👨‍👩‍👧" },
      { "label": "Student Groups", "pct": 0-100, "emoji": "🎓" }
    ]
  },
  "hourlyTimeline": [
    { "hour": "6 AM", "level": 0-100, "label": "Very Low|Low|Moderate|Busy|Very Busy|Peak" },
    { "hour": "8 AM", "level": 0-100, "label": "..." },
    { "hour": "10 AM", "level": 0-100, "label": "..." },
    { "hour": "12 PM", "level": 0-100, "label": "..." },
    { "hour": "2 PM", "level": 0-100, "label": "..." },
    { "hour": "4 PM", "level": 0-100, "label": "..." },
    { "hour": "6 PM", "level": 0-100, "label": "..." },
    { "hour": "8 PM", "level": 0-100, "label": "..." },
    { "hour": "10 PM", "level": 0-100, "label": "..." }
  ],
  "dailyPattern": {
    "morning": { "level": 0-100, "label": "Low|Moderate|Busy", "note": "one sentence" },
    "afternoon": { "level": 0-100, "label": "...", "note": "one sentence" },
    "evening": { "level": 0-100, "label": "...", "note": "one sentence" },
    "night": { "level": 0-100, "label": "...", "note": "one sentence" }
  },
  "prediction": {
    "next1h": { "direction": "rising|stable|falling", "level": 0-100, "reason": "one sentence" },
    "next3h": { "direction": "rising|stable|falling", "level": 0-100, "reason": "one sentence" },
    "tonight": { "direction": "rising|stable|falling", "level": 0-100, "reason": "one sentence" },
    "confidence": 0-100
  },
  "crowdReasons": [
    { "reason": "reason text", "impact": "High|Medium|Low", "emoji": "appropriate emoji" }
  ],
  "bestTimes": [
    { "window": "e.g. 7 AM – 9 AM", "crowdLevel": 0-100, "label": "Best" },
    { "window": "e.g. 2 PM – 4 PM", "crowdLevel": 0-100, "label": "Good" }
  ],
  "worstTimes": [
    { "window": "e.g. 6 PM – 8 PM", "crowdLevel": 0-100, "label": "Avoid" }
  ],
  "heatZones": [
    { "zone": "zone name", "crowdLevel": 0-100, "status": "High|Medium|Low", "peakTime": "e.g. 8 PM", "advice": "one sentence" }
  ],
  "indiaContext": {
    "festivalImpact": "None|Low|Medium|High|Very High",
    "festivalNote": "relevant festival or seasonal context if any",
    "specialFactors": ["factor 1", "factor 2"]
  },
  "eventNearby": { "detected": true|false, "eventType": "event type or null", "distanceKm": 0-10, "crowdImpact": "Low|Medium|High" },
  "aiSummary": "2-3 sentences describing crowd situation and recommendation",
  "generatedAt": "ISO date string"
}

Be specific to ${locationName}. Crowd reasons should reference real factors (festivals, local habits, geography, day of week, weather patterns).`;

  const fallback = {
    locationName,
    locationType: "City",
    currentCrowd: 65,
    crowdStatus: "Moderate",
    crowdStatusColor: "yellow",
    crowdPersonality: {
      dominant: "Mixed",
      types: [
        { label: "Local Residents", pct: 45, emoji: "🏠" },
        { label: "Tourist Crowd", pct: 25, emoji: "✈️" },
        { label: "Family Visitors", pct: 20, emoji: "👨‍👩‍👧" },
        { label: "Student Groups", pct: 10, emoji: "🎓" },
      ],
    },
    hourlyTimeline: [
      { hour: "6 AM", level: 20, label: "Very Low" }, { hour: "8 AM", level: 40, label: "Low" },
      { hour: "10 AM", level: 55, label: "Moderate" }, { hour: "12 PM", level: 65, label: "Moderate" },
      { hour: "2 PM", level: 60, label: "Moderate" }, { hour: "4 PM", level: 70, label: "Busy" },
      { hour: "6 PM", level: 85, label: "Very Busy" }, { hour: "8 PM", level: 80, label: "Busy" },
      { hour: "10 PM", level: 45, label: "Low" },
    ],
    dailyPattern: {
      morning: { level: 30, label: "Low", note: "Quiet start, good time to visit key spots" },
      afternoon: { level: 60, label: "Moderate", note: "Activity builds through afternoon hours" },
      evening: { level: 82, label: "Busy", note: "Peak crowd — markets and streets come alive" },
      night: { level: 40, label: "Moderate", note: "Crowds thin out, pleasant atmosphere" },
    },
    prediction: {
      next1h: { direction: "rising", level: 72, reason: "Evening activity building — typical weekday pattern" },
      next3h: { direction: "rising", level: 83, reason: "Peak hours approaching — markets and food streets filling up" },
      tonight: { direction: "falling", level: 45, reason: "Crowd disperses after 10 PM" },
      confidence: 78,
    },
    crowdReasons: [
      { reason: "Evening market hours", impact: "High", emoji: "🛒" },
      { reason: "Office commute timing", impact: "Medium", emoji: "🏢" },
      { reason: "Weekend leisure activity", impact: "Medium", emoji: "🌞" },
      { reason: "Local festivals and events", impact: "Low", emoji: "🎊" },
    ],
    bestTimes: [
      { window: "7 AM – 9 AM", crowdLevel: 30, label: "Best" },
      { window: "2 PM – 4 PM", crowdLevel: 55, label: "Good" },
    ],
    worstTimes: [
      { window: "6 PM – 9 PM", crowdLevel: 85, label: "Avoid" },
    ],
    heatZones: [
      { zone: "Main Market", crowdLevel: 85, status: "High", peakTime: "7 PM", advice: "Visit before 5 PM for best experience" },
      { zone: "Old City Area", crowdLevel: 70, status: "Medium", peakTime: "6 PM", advice: "Moderate crowd throughout the day" },
      { zone: "Residential Streets", crowdLevel: 35, status: "Low", peakTime: "8 AM", advice: "Quieter alternative routes available" },
    ],
    indiaContext: {
      festivalImpact: "Low",
      festivalNote: "No major festivals this week",
      specialFactors: ["Regular weekday patterns", "Market hours influence crowd flow"],
    },
    eventNearby: { detected: false, eventType: null, distanceKm: 0, crowdImpact: "Low" },
    aiSummary: `${locationName} shows moderate crowd activity currently with a typical pattern. Evening hours between 6–9 PM see the highest footfall. Morning visits before 10 AM offer the best experience.`,
    generatedAt: new Date().toISOString(),
  };

  const data = await generateJson(prompt, fallback);
  await setCached(cacheKey, "crowd-forecast", null, data, 60);
  res.json(data);
});

// ── POST /crowd/compare — Compare crowd between two locations ───────────────
router.post("/crowd/compare", async (req, res): Promise<void> => {
  const { location1, location2 } = req.body as { location1: string; location2: string };
  if (!location1?.trim() || !location2?.trim()) { res.status(400).json({ error: "Both locations required" }); return; }

  const daySlot = new Date().toISOString().slice(0, 13);
  const cacheKey = `crowd-compare-v2:${[location1, location2].sort().join(":").toLowerCase()}:${daySlot}`;
  const cached = await getCached<object>(cacheKey);
  if (cached) { res.json(cached); return; }

  const prompt = `Compare crowd levels for "${location1}" vs "${location2}" right now.
Return ONLY valid JSON:
{
  "loc1": {
    "name": "${location1}",
    "currentCrowd": 0-100,
    "status": "Calm|Moderate|Busy|Very Crowded",
    "statusColor": "green|yellow|orange|red",
    "peakHour": "e.g. 7 PM",
    "bestVisit": "e.g. 8 AM – 10 AM",
    "crowdType": "main crowd type",
    "advantage": "one key advantage of visiting"
  },
  "loc2": {
    "name": "${location2}",
    "currentCrowd": 0-100,
    "status": "Calm|Moderate|Busy|Very Crowded",
    "statusColor": "green|yellow|orange|red",
    "peakHour": "e.g. 8 PM",
    "bestVisit": "e.g. 9 AM – 11 AM",
    "crowdType": "main crowd type",
    "advantage": "one key advantage of visiting"
  },
  "recommendation": "which is better to visit right now and why — 2 sentences",
  "winner": "${location1} or ${location2} — which is less crowded right now"
}`;

  const fallback = {
    loc1: { name: location1, currentCrowd: 65, status: "Moderate", statusColor: "yellow", peakHour: "7 PM", bestVisit: "8 AM – 10 AM", crowdType: "Mixed crowd", advantage: "More accessible public transport" },
    loc2: { name: location2, currentCrowd: 55, status: "Moderate", statusColor: "yellow", peakHour: "8 PM", bestVisit: "9 AM – 11 AM", crowdType: "Local crowd", advantage: "Quieter streets and less tourist traffic" },
    recommendation: `Both locations have moderate crowd levels right now. ${location2} is slightly less crowded and may offer a more relaxed experience. Morning visits are best for both.`,
    winner: location2,
  };

  const data = await generateJson(prompt, fallback);
  await setCached(cacheKey, "crowd-compare", null, data, 60);
  res.json(data);
});

// ── POST /crowd/saved — Save a place ────────────────────────────────────────
router.post("/crowd/saved", (req, res): void => {
  const { locationName, category } = req.body as { locationName: string; category?: string };
  if (!locationName?.trim()) { res.status(400).json({ error: "locationName required" }); return; }
  const exists = SAVED_PLACES.find(p => p.locationName.toLowerCase() === locationName.toLowerCase());
  if (exists) { res.json(exists); return; }
  const place: SavedPlace = { id: `sp-${Date.now()}`, locationName: locationName.trim(), category: category || "custom", savedAt: new Date().toISOString() };
  SAVED_PLACES.push(place);
  res.status(201).json(place);
});

// ── GET /crowd/saved ─────────────────────────────────────────────────────────
router.get("/crowd/saved", (_req, res): void => {
  res.json({ saved: SAVED_PLACES });
});

// ── DELETE /crowd/saved/:id ───────────────────────────────────────────────────
router.delete("/crowd/saved/:id", (req, res): void => {
  const idx = SAVED_PLACES.findIndex(p => p.id === req.params.id);
  if (idx === -1) { res.status(404).json({ error: "Not found" }); return; }
  SAVED_PLACES.splice(idx, 1);
  res.json({ message: "Removed" });
});

export default router;
