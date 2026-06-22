import { Router, type IRouter } from "express";
import { generateJson } from "../lib/gemini";
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

function generateMonthForecast(placeId: string, year: number, month: number) {
  const daysInMonth = new Date(year, month, 0).getDate();
  const monthStr = new Date(year, month - 1, 1).toLocaleString("en", { month: "long" });

  const EVENTS: Record<string, Array<{ days: number[]; name: string; impact: number }>> = {
    "delhi-in": [
      { days: [26], name: "Republic Day", impact: 95 },
      { days: [14, 15], name: "Diwali Season", impact: 90 },
    ],
    "tokyo-jp": [
      { days: [3, 4, 5], name: "Golden Week", impact: 98 },
      { days: [25, 26, 27, 28, 29, 30], name: "Cherry Blossom Season", impact: 92 },
    ],
    "new-york-us": [
      { days: [4], name: "Independence Day", impact: 95 },
      { days: [31], name: "Halloween NYC", impact: 88 },
    ],
    "london-uk": [
      { days: [25, 26], name: "Christmas Markets", impact: 90 },
      { days: [5], name: "Guy Fawkes Night", impact: 85 },
    ],
  };

  const placeEvents = EVENTS[placeId] || [];

  return {
    month: monthStr,
    year,
    days: Array.from({ length: daysInMonth }, (_, i) => {
      const day = i + 1;
      const dayOfWeek = new Date(year, month - 1, day).getDay();
      const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
      const event = placeEvents.find(e => e.days.includes(day));
      const baseScore = isWeekend ? 65 : 45;
      const crowdScore = event ? event.impact : baseScore + Math.floor(Math.random() * 20);
      const level = crowdScore > 80 ? "very-high" : crowdScore > 65 ? "high" : crowdScore > 45 ? "moderate" : "low";

      return {
        day,
        crowdScore: Math.min(100, crowdScore),
        level,
        eventName: event?.name || null,
        isWeekend,
        tip: event ? `Major event: ${event.name}` : isWeekend ? "Weekend — expect higher crowds" : null,
      };
    }),
  };
}

router.get("/forecast/calendar", async (req, res): Promise<void> => {
  const placeId = String(req.query.placeId || "tokyo-jp");
  const now = new Date();
  const month = parseInt(String(req.query.month || now.getMonth() + 1));
  const year = parseInt(String(req.query.year || now.getFullYear()));

  const result = {
    placeId,
    placeName: getName(placeId),
    ...generateMonthForecast(placeId, year, month),
    generatedAt: new Date().toISOString(),
  };

  res.json(result);
});

const EVENTS_DATA: Record<string, object[]> = {
  "delhi-in": [
    { id: "e1", type: "festival", name: "Street Food Festival", location: "Connaught Place", severity: "moderate", crowdSpike: 45, description: "Annual street food fest drawing thousands across the city center.", startTime: new Date(Date.now() - 3600000).toISOString(), detectedAt: new Date(Date.now() - 7200000).toISOString() },
    { id: "e2", type: "sports", name: "IPL Match — Kotla", location: "Feroz Shah Kotla Stadium", severity: "high", crowdSpike: 78, description: "Major IPL match creating significant crowd surges around the stadium and metro.", startTime: new Date(Date.now() + 7200000).toISOString(), detectedAt: new Date().toISOString() },
  ],
  "tokyo-jp": [
    { id: "e3", type: "concert", name: "Major Concert — Tokyo Dome", location: "Tokyo Dome, Bunkyo", severity: "high", crowdSpike: 85, description: "Large concert event causing crowd surges in Suidobashi area and surrounding metro stations.", startTime: new Date(Date.now() + 3600000).toISOString(), detectedAt: new Date().toISOString() },
    { id: "e4", type: "festival", name: "Night Market — Shibuya", location: "Shibuya", severity: "moderate", crowdSpike: 55, description: "Seasonal night market running through the weekend with elevated foot traffic.", startTime: new Date(Date.now() - 86400000).toISOString(), detectedAt: new Date(Date.now() - 90000000).toISOString() },
  ],
  "new-york-us": [
    { id: "e5", type: "protest", name: "Civic March — Downtown", location: "Midtown Manhattan", severity: "moderate", crowdSpike: 60, description: "Large civic gathering expected on 5th Avenue, expect road closures and rerouting.", startTime: new Date(Date.now() + 1800000).toISOString(), detectedAt: new Date().toISOString() },
  ],
};

router.get("/forecast/events", async (req, res): Promise<void> => {
  const placeId = String(req.query.placeId || "delhi-in");
  const events = EVENTS_DATA[placeId] || [
    { id: "default1", type: "activity_spike", name: "Unusual Activity Detected", location: "City Center", severity: "low", crowdSpike: 30, description: "Our AI has detected a slight uptick in crowd activity in the city center area.", startTime: new Date().toISOString(), detectedAt: new Date().toISOString() },
  ];

  res.json({ placeId, placeName: getName(placeId), events, updatedAt: new Date().toISOString() });
});

const WORLD_PULSE_CITIES = [
  { id: "tokyo-jp", name: "Tokyo", lat: 35.6762, lng: 139.6503, pulse: 94, trend: "stable", status: "Surging — Concert Night" },
  { id: "new-york-us", name: "New York", lat: 40.7128, lng: -74.006, pulse: 88, trend: "up", status: "Rising — Rush Hour" },
  { id: "london-uk", name: "London", lat: 51.5074, lng: -0.1278, pulse: 75, trend: "stable", status: "Normal — Midday" },
  { id: "paris-fr", name: "Paris", lat: 48.8566, lng: 2.3522, pulse: 82, trend: "up", status: "Elevated — Tourist Season" },
  { id: "dubai-ae", name: "Dubai", lat: 25.2048, lng: 55.2708, pulse: 91, trend: "up", status: "Surging — Weekend" },
  { id: "singapore-sg", name: "Singapore", lat: 1.3521, lng: 103.8198, pulse: 68, trend: "down", status: "Quiet — Late Night" },
  { id: "mumbai-in", name: "Mumbai", lat: 19.076, lng: 72.8777, pulse: 86, trend: "stable", status: "Active — Evening Peak" },
  { id: "delhi-in", name: "Delhi", lat: 28.6139, lng: 77.209, pulse: 79, trend: "up", status: "Rising — Market Hours" },
  { id: "seoul-kr", name: "Seoul", lat: 37.5665, lng: 126.978, pulse: 83, trend: "up", status: "Active — Night Scene" },
  { id: "berlin-de", name: "Berlin", lat: 52.52, lng: 13.405, pulse: 77, trend: "stable", status: "Normal — Afternoon" },
  { id: "sydney-au", name: "Sydney", lat: -33.8688, lng: 151.2093, pulse: 71, trend: "down", status: "Easing — Morning" },
  { id: "cairo-eg", name: "Cairo", lat: 30.0444, lng: 31.2357, pulse: 85, trend: "up", status: "Busy — Market Day" },
  { id: "sao-paulo-br", name: "São Paulo", lat: -23.5505, lng: -46.6333, pulse: 89, trend: "up", status: "Surging — Evening" },
  { id: "toronto-ca", name: "Toronto", lat: 43.6532, lng: -79.3832, pulse: 66, trend: "stable", status: "Moderate — Afternoon" },
  { id: "bangalore-in", name: "Bangalore", lat: 12.9716, lng: 77.5946, pulse: 80, trend: "up", status: "Active — Tech Hub Busy" },
];

router.get("/forecast/pulse", (req, res) => {
  const cities = WORLD_PULSE_CITIES.map(c => ({
    ...c,
    pulse: Math.min(100, Math.max(20, c.pulse + Math.floor(Math.random() * 10 - 5))),
  }));
  const surging = cities.filter(c => c.pulse > 85);
  res.json({ cities, surging: surging.length, updatedAt: new Date().toISOString() });
});

interface Alert {
  id: string;
  placeId: string;
  placeName: string;
  metric: string;
  condition: "below" | "above";
  threshold: number;
  notifyBy: string;
  active: boolean;
  createdAt: string;
}

const ALERTS_STORE: Alert[] = [];
let alertIdCounter = 1;

router.get("/forecast/alerts", (req, res) => {
  res.json(ALERTS_STORE);
});

router.post("/forecast/alerts", (req, res) => {
  const { placeId, placeName, metric, condition, threshold, notifyBy } = req.body as Alert;
  if (!placeId || !metric || !condition || threshold === undefined) {
    res.status(400).json({ error: "placeId, metric, condition, threshold required" });
    return;
  }
  const alert: Alert = {
    id: `alert-${alertIdCounter++}`,
    placeId,
    placeName: placeName || getName(placeId),
    metric,
    condition,
    threshold,
    notifyBy: notifyBy || "in-app",
    active: true,
    createdAt: new Date().toISOString(),
  };
  ALERTS_STORE.push(alert);
  res.status(201).json(alert);
});

router.delete("/forecast/alerts/:id", (req, res) => {
  const idx = ALERTS_STORE.findIndex(a => a.id === req.params.id);
  if (idx === -1) { res.status(404).json({ error: "Alert not found" }); return; }
  ALERTS_STORE.splice(idx, 1);
  res.status(204).send();
});

export default router;
