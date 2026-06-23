import { Router, type IRouter } from "express";
import { generateJson, generateText } from "../lib/gemini";
import { getCached, setCached } from "../lib/aiCache";

const router: IRouter = Router();

// ── Data ─────────────────────────────────────────────────────────────────────

const INDIA_CITIES: Record<string, { name: string; lat: number; lng: number; x: number; y: number }> = {
  "delhi-in":     { name: "Delhi",     lat: 28.61, lng: 77.21, x: 37, y: 22 },
  "mumbai-in":    { name: "Mumbai",    lat: 19.08, lng: 72.88, x: 26, y: 52 },
  "bangalore-in": { name: "Bangalore", lat: 12.97, lng: 77.59, x: 37, y: 72 },
  "chennai-in":   { name: "Chennai",   lat: 13.08, lng: 80.27, x: 46, y: 70 },
  "hyderabad-in": { name: "Hyderabad", lat: 17.38, lng: 78.49, x: 42, y: 60 },
  "kolkata-in":   { name: "Kolkata",   lat: 22.57, lng: 88.36, x: 61, y: 38 },
  "jaipur-in":    { name: "Jaipur",    lat: 26.91, lng: 75.79, x: 32, y: 28 },
  "pune-in":      { name: "Pune",      lat: 18.52, lng: 73.86, x: 29, y: 57 },
  "ahmedabad-in": { name: "Ahmedabad", lat: 23.03, lng: 72.58, x: 24, y: 42 },
  "lucknow-in":   { name: "Lucknow",   lat: 26.85, lng: 80.95, x: 48, y: 27 },
};

interface RadarEvent {
  id: string;
  name: string;
  category: string;
  city: string;
  cityId: string;
  location: string;
  lat: number;
  lng: number;
  x: number;
  y: number;
  activity: number;
  crowd: "Low" | "Medium" | "High" | "Very High";
  startTime: string;
  endTime: string;
  peakTime: string;
  crowdByHour: { hour: string; level: number }[];
  impact: { traffic: string; restaurants: string; parking: string; transport: string };
  distance: number;
  aiTip: string;
  emoji: string;
  color: string;
  trending: boolean;
  tags: string[];
}

const RADAR_EVENTS: RadarEvent[] = [
  {
    id: "ev1", name: "Delhi Food Festival", category: "food", city: "Delhi", cityId: "delhi-in",
    location: "Connaught Place, New Delhi", lat: 28.63, lng: 77.22, x: 37.5, y: 21.5,
    activity: 92, crowd: "High", startTime: "18:00", endTime: "23:00", peakTime: "20:00",
    crowdByHour: [
      { hour: "6 PM", level: 40 }, { hour: "7 PM", level: 65 }, { hour: "8 PM", level: 92 },
      { hour: "9 PM", level: 88 }, { hour: "10 PM", level: 70 }, { hour: "11 PM", level: 45 },
    ],
    impact: { traffic: "High", restaurants: "Very Busy", parking: "Limited", transport: "Active" },
    distance: 1.2, aiTip: "Visit before 7 PM for best experience. Metro recommended.", emoji: "🍛",
    color: "#fdcb6e", trending: true, tags: ["Food", "Culture", "Weekend"],
  },
  {
    id: "ev2", name: "IPL Match — Kotla Stadium", category: "sports", city: "Delhi", cityId: "delhi-in",
    location: "Feroz Shah Kotla, New Delhi", lat: 28.64, lng: 77.24, x: 38, y: 21,
    activity: 98, crowd: "Very High", startTime: "19:30", endTime: "23:30", peakTime: "21:00",
    crowdByHour: [
      { hour: "6 PM", level: 55 }, { hour: "7 PM", level: 80 }, { hour: "8 PM", level: 95 },
      { hour: "9 PM", level: 98 }, { hour: "10 PM", level: 85 }, { hour: "11 PM", level: 60 },
    ],
    impact: { traffic: "Very High", restaurants: "Packed", parking: "No Parking", transport: "Surging" },
    distance: 2.4, aiTip: "Arrive by 6:30 PM. Avoid driving — metro blue line recommended.", emoji: "🏏",
    color: "#00cec9", trending: true, tags: ["Cricket", "Sports", "IPL"],
  },
  {
    id: "ev3", name: "Navratri Night Celebrations", category: "festival", city: "Delhi", cityId: "delhi-in",
    location: "Hauz Khas Village, New Delhi", lat: 28.55, lng: 77.20, x: 36, y: 23,
    activity: 87, crowd: "High", startTime: "20:00", endTime: "01:00", peakTime: "22:00",
    crowdByHour: [
      { hour: "8 PM", level: 45 }, { hour: "9 PM", level: 70 }, { hour: "10 PM", level: 87 },
      { hour: "11 PM", level: 90 }, { hour: "12 AM", level: 75 }, { hour: "1 AM", level: 40 },
    ],
    impact: { traffic: "High", restaurants: "Busy", parking: "Limited", transport: "Active" },
    distance: 4.0, aiTip: "Wear traditional attire. Best garba from 10 PM onwards.", emoji: "🎉",
    color: "#a29bfe", trending: false, tags: ["Festival", "Culture", "Dance"],
  },
  {
    id: "ev4", name: "Biryani Festival", category: "food", city: "Hyderabad", cityId: "hyderabad-in",
    location: "Necklace Road, Hyderabad", lat: 17.41, lng: 78.47, x: 42.5, y: 59,
    activity: 89, crowd: "Very High", startTime: "12:00", endTime: "22:00", peakTime: "13:30",
    crowdByHour: [
      { hour: "12 PM", level: 60 }, { hour: "1 PM", level: 89 }, { hour: "2 PM", level: 80 },
      { hour: "6 PM", level: 75 }, { hour: "8 PM", level: 82 }, { hour: "10 PM", level: 55 },
    ],
    impact: { traffic: "High", restaurants: "Extremely Busy", parking: "Limited", transport: "Active" },
    distance: 3.1, aiTip: "Lunch rush 1-3 PM very crowded. Prefer evening visit.", emoji: "🍛",
    color: "#fdcb6e", trending: true, tags: ["Food", "Hyderabadi", "Festival"],
  },
  {
    id: "ev5", name: "Durga Puja Celebrations", category: "festival", city: "Kolkata", cityId: "kolkata-in",
    location: "Pandal Circuit, South Kolkata", lat: 22.52, lng: 88.33, x: 60, y: 39,
    activity: 95, crowd: "Very High", startTime: "08:00", endTime: "23:59", peakTime: "19:00",
    crowdByHour: [
      { hour: "8 AM", level: 40 }, { hour: "12 PM", level: 65 }, { hour: "4 PM", level: 78 },
      { hour: "7 PM", level: 95 }, { hour: "9 PM", level: 90 }, { hour: "11 PM", level: 70 },
    ],
    impact: { traffic: "Very High", restaurants: "All Packed", parking: "Impossible", transport: "Overcrowded" },
    distance: 0.8, aiTip: "Pandal-hop in morning. Avoid metro between 7-10 PM.", emoji: "🌺",
    color: "#fd79a8", trending: true, tags: ["Durga Puja", "Heritage", "Festival"],
  },
  {
    id: "ev6", name: "Sunburn Music Festival", category: "music", city: "Pune", cityId: "pune-in",
    location: "Venue 97, Pune", lat: 18.55, lng: 73.90, x: 30, y: 56.5,
    activity: 94, crowd: "Very High", startTime: "16:00", endTime: "02:00", peakTime: "22:00",
    crowdByHour: [
      { hour: "4 PM", level: 30 }, { hour: "6 PM", level: 55 }, { hour: "8 PM", level: 75 },
      { hour: "10 PM", level: 94 }, { hour: "12 AM", level: 88 }, { hour: "2 AM", level: 50 },
    ],
    impact: { traffic: "High", restaurants: "Busy", parking: "Limited", transport: "Active" },
    distance: 5.5, aiTip: "Headliners at 10 PM. Book cab in advance for return.", emoji: "🎵",
    color: "#6c5ce7", trending: true, tags: ["Music", "EDM", "Night"],
  },
  {
    id: "ev7", name: "Tech Summit India", category: "business", city: "Bangalore", cityId: "bangalore-in",
    location: "BIEC, Bangalore", lat: 13.02, lng: 77.55, x: 36.5, y: 71.5,
    activity: 78, crowd: "Medium", startTime: "09:00", endTime: "18:00", peakTime: "11:00",
    crowdByHour: [
      { hour: "9 AM", level: 50 }, { hour: "10 AM", level: 65 }, { hour: "11 AM", level: 78 },
      { hour: "2 PM", level: 70 }, { hour: "4 PM", level: 60 }, { hour: "6 PM", level: 35 },
    ],
    impact: { traffic: "Medium", restaurants: "Busy", parking: "Available", transport: "Normal" },
    distance: 8.2, aiTip: "Morning sessions best. Lunch outside venue recommended.", emoji: "💼",
    color: "#74b9ff", trending: false, tags: ["Tech", "Business", "Innovation"],
  },
  {
    id: "ev8", name: "Jaipur Lit Fest", category: "culture", city: "Jaipur", cityId: "jaipur-in",
    location: "Diggi Palace, Jaipur", lat: 26.90, lng: 75.82, x: 32.5, y: 27.5,
    activity: 82, crowd: "High", startTime: "09:00", endTime: "20:00", peakTime: "15:00",
    crowdByHour: [
      { hour: "9 AM", level: 40 }, { hour: "11 AM", level: 60 }, { hour: "1 PM", level: 75 },
      { hour: "3 PM", level: 82 }, { hour: "5 PM", level: 72 }, { hour: "7 PM", level: 45 },
    ],
    impact: { traffic: "Medium", restaurants: "Busy", parking: "Available", transport: "Normal" },
    distance: 1.8, aiTip: "Evening sessions have international authors. Book seats.", emoji: "📚",
    color: "#e17055", trending: false, tags: ["Literature", "Culture", "Heritage"],
  },
  {
    id: "ev9", name: "Garba Night Ahmedabad", category: "festival", city: "Ahmedabad", cityId: "ahmedabad-in",
    location: "GMDC Ground, Ahmedabad", lat: 23.05, lng: 72.55, x: 23.5, y: 41.5,
    activity: 96, crowd: "Very High", startTime: "21:00", endTime: "03:00", peakTime: "23:00",
    crowdByHour: [
      { hour: "9 PM", level: 55 }, { hour: "10 PM", level: 78 }, { hour: "11 PM", level: 96 },
      { hour: "12 AM", level: 92 }, { hour: "1 AM", level: 80 }, { hour: "3 AM", level: 45 },
    ],
    impact: { traffic: "Very High", restaurants: "Packed", parking: "None", transport: "Special Buses" },
    distance: 2.9, aiTip: "World's largest garba. Arrive before 10 PM to get good spot.", emoji: "💃",
    color: "#fd79a8", trending: true, tags: ["Navratri", "Garba", "Festival"],
  },
  {
    id: "ev10", name: "Marine Drive Night Market", category: "market", city: "Mumbai", cityId: "mumbai-in",
    location: "Marine Drive, Mumbai", lat: 18.94, lng: 72.82, x: 25.5, y: 53,
    activity: 75, crowd: "Medium", startTime: "18:00", endTime: "23:00", peakTime: "20:30",
    crowdByHour: [
      { hour: "6 PM", level: 40 }, { hour: "7 PM", level: 60 }, { hour: "8 PM", level: 75 },
      { hour: "9 PM", level: 72 }, { hour: "10 PM", level: 60 }, { hour: "11 PM", level: 35 },
    ],
    impact: { traffic: "Medium", restaurants: "Busy", parking: "Limited", transport: "Active" },
    distance: 3.7, aiTip: "Sea breeze evening. Grab bhel puri and enjoy the sunset.", emoji: "🌙",
    color: "#74b9ff", trending: false, tags: ["Market", "Night", "Street Food"],
  },
];

const FESTIVALS = [
  {
    id: "diwali", name: "Diwali", emoji: "✨", status: "Upcoming", daysAway: 28,
    crowd: "Very High", traffic: "High", bestTime: "Morning",
    aiTip: "Shop early morning to avoid evening rush. Keep dua before fireworks peak.",
    shopping: 95, energy: 98, markets: 92, fireworks: 100,
    cities: ["Delhi", "Jaipur", "Varanasi", "Mumbai"],
    description: "Festival of lights celebrated across India with fireworks, diyas, and sweets.",
  },
  {
    id: "holi", name: "Holi", emoji: "🌈", status: "Seasonal", daysAway: 185,
    crowd: "Very High", traffic: "High", bestTime: "Morning",
    aiTip: "Best colors before 12 PM. Mathura-Vrindavan for authentic experience.",
    shopping: 72, energy: 97, markets: 76, fireworks: 30,
    cities: ["Mathura", "Vrindavan", "Delhi", "Mumbai"],
    description: "Festival of colors marking the triumph of good over evil and arrival of spring.",
  },
  {
    id: "navratri", name: "Navratri", emoji: "💃", status: "Active Now", daysAway: 0,
    crowd: "High", traffic: "Medium", bestTime: "Evening",
    aiTip: "Ahmedabad has world's largest garba. Book passes in advance.",
    shopping: 85, energy: 92, markets: 88, fireworks: 20,
    cities: ["Ahmedabad", "Delhi", "Mumbai", "Baroda"],
    description: "Nine nights of garba dancing celebrating the divine feminine.",
  },
  {
    id: "eid", name: "Eid al-Fitr", emoji: "🌙", status: "Upcoming", daysAway: 65,
    crowd: "High", traffic: "High", bestTime: "Morning",
    aiTip: "Old Delhi markets open from dawn. Try sheer khurma at local homes.",
    shopping: 90, energy: 88, markets: 94, fireworks: 15,
    cities: ["Delhi", "Hyderabad", "Lucknow", "Mumbai"],
    description: "Festival marking the end of Ramadan with prayers, feasts, and celebrations.",
  },
  {
    id: "christmas", name: "Christmas", emoji: "🎄", status: "Upcoming", daysAway: 180,
    crowd: "Medium", traffic: "Medium", bestTime: "Evening",
    aiTip: "Goa and Shillong have best atmosphere. Church at midnight is magical.",
    shopping: 78, energy: 80, markets: 75, fireworks: 40,
    cities: ["Goa", "Mumbai", "Shillong", "Kolkata"],
    description: "Celebrated with midnight mass, carol singing, and festive markets.",
  },
  {
    id: "durga-puja", name: "Durga Puja", emoji: "🌺", status: "Peak", daysAway: 3,
    crowd: "Very High", traffic: "Very High", bestTime: "Morning",
    aiTip: "Pandal-hopping best before noon. Sindur Khela on final day is unmissable.",
    shopping: 89, energy: 95, markets: 87, fireworks: 60,
    cities: ["Kolkata", "Mumbai", "Delhi", "Bangalore"],
    description: "UNESCO heritage festival with elaborate pandals and cultural performances.",
  },
];

const TRENDING_EVENTS = [
  { id: "t1", title: "IPL Final Fever", category: "sports", heat: 98, growth: "+120%", city: "Mumbai", emoji: "🏏", hot: true, description: "India grinding to halt as IPL final approaches" },
  { id: "t2", title: "Durga Puja Kolkata", category: "festival", heat: 95, growth: "+85%", city: "Kolkata", emoji: "🌺", hot: true, description: "8 million visitors over 5 days, UNESCO heritage" },
  { id: "t3", title: "Delhi Food Festival", category: "food", heat: 92, growth: "+67%", city: "Delhi", emoji: "🍛", hot: true, description: "500+ stalls, 50,000+ visitors expected" },
  { id: "t4", title: "Garba Night Ahmedabad", category: "festival", heat: 96, growth: "+90%", city: "Ahmedabad", emoji: "💃", hot: true, description: "World's largest garba at GMDC Ground" },
  { id: "t5", title: "Sunburn Music Fest", category: "music", heat: 94, growth: "+73%", city: "Pune", emoji: "🎵", hot: false, description: "Top EDM artists, all-night festival" },
  { id: "t6", title: "Biryani Festival HYD", category: "food", heat: 89, growth: "+55%", city: "Hyderabad", emoji: "🍛", hot: false, description: "300+ stalls of authentic Hyderabadi cuisine" },
  { id: "t7", title: "Jaipur Lit Fest", category: "culture", heat: 82, growth: "+38%", city: "Jaipur", emoji: "📚", hot: false, description: "International authors and cultural sessions" },
  { id: "t8", title: "Tech Summit India", category: "business", heat: 78, growth: "+44%", city: "Bangalore", emoji: "🚀", hot: false, description: "5000+ founders, unicorn announcements expected" },
];

function getEventsForCity(cityId: string): RadarEvent[] {
  const city = INDIA_CITIES[cityId];
  if (!city) return RADAR_EVENTS.slice(0, 3);
  return RADAR_EVENTS.filter(e => e.cityId === cityId).length > 0
    ? RADAR_EVENTS.filter(e => e.cityId === cityId)
    : RADAR_EVENTS.slice(0, 3);
}

// ── Routes ────────────────────────────────────────────────────────────────────

router.get("/events/radar", async (req, res): Promise<void> => {
  const cityId = String(req.query.cityId || "delhi-in");
  const city = INDIA_CITIES[cityId] || INDIA_CITIES["delhi-in"];
  const events = getEventsForCity(cityId);

  const stats = {
    liveEvents: events.length,
    nearbyEvents: Math.floor(Math.random() * 8) + 3,
    trendingEvents: events.filter(e => e.trending).length,
    aiInsights: events.length * 3,
  };

  res.json({
    cityId,
    cityName: city.name,
    events,
    allEvents: RADAR_EVENTS,
    stats,
    updatedAt: new Date().toISOString(),
  });
});

router.get("/events/search", (req, res): void => {
  const q = String(req.query.q || "").toLowerCase();
  if (!q) { res.json({ results: [] }); return; }

  const results = RADAR_EVENTS.filter(e =>
    e.name.toLowerCase().includes(q) ||
    e.city.toLowerCase().includes(q) ||
    e.category.toLowerCase().includes(q) ||
    e.tags.some(t => t.toLowerCase().includes(q))
  );

  res.json({ query: q, results, count: results.length });
});

router.get("/events/festivals", (_req, res): void => {
  res.json({ festivals: FESTIVALS, updatedAt: new Date().toISOString() });
});

router.get("/events/trending", (_req, res): void => {
  const events = TRENDING_EVENTS.map(e => ({
    ...e,
    heat: Math.min(100, e.heat + Math.floor(Math.random() * 5 - 2)),
  }));
  res.json({ events, updatedAt: new Date().toISOString() });
});

router.get("/events/ai-summary", async (req, res): Promise<void> => {
  const cityId = String(req.query.cityId || "delhi-in");
  const city = INDIA_CITIES[cityId] || INDIA_CITIES["delhi-in"];
  const cacheKey = `event-ai-summary-${cityId}-${new Date().toISOString().slice(0, 13)}`;

  const cached = await getCached<object>(cacheKey);
  if (cached) { res.json(cached); return; }

  const events = getEventsForCity(cityId);
  const eventNames = events.map(e => e.name).join(", ");

  const fallback = {
    cityName: city.name,
    summary: `${city.name} is highly active today with multiple cultural events and weekend gatherings creating an exciting urban atmosphere. The city is buzzing with energy across multiple districts.`,
    impacts: [
      { label: "Traffic", level: "High", icon: "🚗", up: true },
      { label: "Food Areas", level: "Very Busy", icon: "🍽️", up: true },
      { label: "Metro Activity", level: "Elevated", icon: "🚇", up: true },
      { label: "Parking", level: "Limited", icon: "🅿️", up: false },
    ],
    overallMood: "Energetic",
    activityScore: 87,
    aiConfidence: 94,
    generatedAt: new Date().toISOString(),
  };

  const data = await generateJson(
    `You are an urban AI analyst. Analyze the current event situation in ${city.name}, India.
Active events: ${eventNames}
Return JSON: {
  "cityName": "${city.name}",
  "summary": "2-3 sentence analysis of city energy and event impact today",
  "impacts": [
    {"label": "Traffic", "level": "High/Medium/Low/Very High", "icon": "🚗", "up": true/false},
    {"label": "Food Areas", "level": "string", "icon": "🍽️", "up": true/false},
    {"label": "Metro Activity", "level": "string", "icon": "🚇", "up": true/false},
    {"label": "Parking", "level": "string", "icon": "🅿️", "up": true/false}
  ],
  "overallMood": "one word city mood",
  "activityScore": 0-100,
  "aiConfidence": 85-98,
  "generatedAt": "ISO date string"
}`,
    fallback
  );

  await setCached(cacheKey, "event-ai-summary", cityId, data, 60);
  res.json(data);
});

router.post("/events/plan", async (req, res): Promise<void> => {
  const { eventId, cityId } = req.body as { eventId: string; cityId: string };
  const event = RADAR_EVENTS.find(e => e.id === eventId);
  const city = INDIA_CITIES[cityId] || INDIA_CITIES["delhi-in"];

  if (!event) {
    res.status(404).json({ error: "Event not found" });
    return;
  }

  const cacheKey = `event-plan-${eventId}`;
  const cached = await getCached<object>(cacheKey);
  if (cached) { res.json(cached); return; }

  const fallback = {
    eventName: event.name,
    bestArrival: `${parseInt(event.startTime) - 1}:15 ${parseInt(event.startTime) < 12 ? "AM" : "PM"}`,
    avoidTimes: `${event.peakTime} rush hour`,
    route: "Metro recommended",
    tips: [
      "Arrive 45 minutes early for best experience",
      "Book return transport in advance",
      "Carry cash for local vendors",
      "Check weather before heading out",
    ],
    estimatedDuration: "3-4 hours",
    budgetEstimate: "₹500-1500 per person",
    familyFriendly: event.category !== "music",
    crowdWarning: event.crowd === "Very High" ? "Extremely crowded — plan accordingly" : null,
    generatedAt: new Date().toISOString(),
  };

  const data = await generateJson(
    `You are an AI event planner for India. Create a visit plan for "${event.name}" in ${city.name}.
Event details: starts ${event.startTime}, ends ${event.endTime}, peak crowd at ${event.peakTime}, crowd level: ${event.crowd}.
Location: ${event.location}.
Return JSON: {
  "eventName": "${event.name}",
  "bestArrival": "best time to arrive",
  "avoidTimes": "times to avoid",
  "route": "recommended transport route",
  "tips": ["tip1", "tip2", "tip3", "tip4"],
  "estimatedDuration": "X hours",
  "budgetEstimate": "₹XXX-XXXX per person",
  "familyFriendly": true/false,
  "crowdWarning": "warning string or null",
  "generatedAt": "ISO date string"
}`,
    fallback
  );

  await setCached(cacheKey, "event-plan", cityId, data, 1440);
  res.json(data);
});

router.post("/events/compare", async (req, res): Promise<void> => {
  const { event1Id, event2Id } = req.body as { event1Id: string; event2Id: string };
  const e1 = RADAR_EVENTS.find(e => e.id === event1Id);
  const e2 = RADAR_EVENTS.find(e => e.id === event2Id);

  if (!e1 || !e2) { res.status(404).json({ error: "Event(s) not found" }); return; }

  const cacheKey = `event-compare-${event1Id}-${event2Id}`;
  const cached = await getCached<object>(cacheKey);
  if (cached) { res.json(cached); return; }

  const fallback = {
    event1: {
      id: e1.id, name: e1.name, emoji: e1.emoji, city: e1.city,
      crowd: e1.crowd, activity: e1.activity, bestFor: "Food lovers & families",
      vibe: "Lively and colorful", costEstimate: "₹200-800", verdict: "Great for weekend outings",
    },
    event2: {
      id: e2.id, name: e2.name, emoji: e2.emoji, city: e2.city,
      crowd: e2.crowd, activity: e2.activity, bestFor: "Sports fans",
      vibe: "Electrifying and loud", costEstimate: "₹500-2000", verdict: "Must for cricket fans",
    },
    aiVerdict: `For a relaxed experience, go to ${e1.name}. For high energy, choose ${e2.name}.`,
    winner: Math.random() > 0.5 ? event1Id : event2Id,
  };

  const data = await generateJson(
    `Compare these two India events for a visitor deciding which to attend:
Event 1: "${e1.name}" in ${e1.city} — category: ${e1.category}, crowd: ${e1.crowd}, activity: ${e1.activity}%
Event 2: "${e2.name}" in ${e2.city} — category: ${e2.category}, crowd: ${e2.crowd}, activity: ${e2.activity}%
Return JSON: {
  "event1": {"id":"${e1.id}","name":"${e1.name}","emoji":"${e1.emoji}","city":"${e1.city}","crowd":"${e1.crowd}","activity":${e1.activity},"bestFor":"who it's best for","vibe":"one phrase vibe","costEstimate":"₹range","verdict":"one sentence"},
  "event2": {"id":"${e2.id}","name":"${e2.name}","emoji":"${e2.emoji}","city":"${e2.city}","crowd":"${e2.crowd}","activity":${e2.activity},"bestFor":"who it's best for","vibe":"one phrase vibe","costEstimate":"₹range","verdict":"one sentence"},
  "aiVerdict": "helpful comparison sentence for deciding",
  "winner": "${event1Id} or ${event2Id}"
}`,
    fallback
  );

  await setCached(cacheKey, "event-compare", null, data, 120);
  res.json(data);
});

router.post("/events/chat", async (req, res): Promise<void> => {
  const { message, cityId, eventId } = req.body as { message: string; cityId?: string; eventId?: string };
  if (!message) { res.status(400).json({ error: "message required" }); return; }

  const city = cityId ? INDIA_CITIES[cityId] : INDIA_CITIES["delhi-in"];
  const event = eventId ? RADAR_EVENTS.find(e => e.id === eventId) : null;

  const context = event
    ? `Event: ${event.name} in ${event.city}. Location: ${event.location}. Crowd: ${event.crowd}. Time: ${event.startTime}-${event.endTime}. AI tip: ${event.aiTip}.`
    : `City: ${city?.name || "India"}. User asking about local events.`;

  const fallbackResponses: Record<string, string> = {
    crowd: event ? `Expected crowd: ${event?.crowd}. Peak at ${event?.peakTime}.` : "Crowd varies by event. Check individual event details.",
    time: event ? `Best time: before ${event?.peakTime}. Avoid peak hours.` : "Morning visits are generally less crowded.",
    reach: event ? `For ${event?.location}: Metro is recommended. Check Google Maps for exact route.` : "Use metro or auto for most India events.",
    family: event ? (event?.category === "festival" ? "Yes, family-friendly! Great for all ages." : "Depends on the event type and timings.") : "Most festivals and food events are family friendly.",
    default: `I'm analyzing events in ${city?.name || "your city"}. ${event ? `For ${event.name}: ${event.aiTip}` : "Ask me anything about local events, crowd, timing, or how to reach!"}`,
  };

  const key = message.toLowerCase().includes("crowd") ? "crowd"
    : message.toLowerCase().includes("time") || message.toLowerCase().includes("when") ? "time"
    : message.toLowerCase().includes("reach") || message.toLowerCase().includes("how to") || message.toLowerCase().includes("transport") ? "reach"
    : message.toLowerCase().includes("family") || message.toLowerCase().includes("kids") || message.toLowerCase().includes("safe") ? "family"
    : "default";

  const fallback = fallbackResponses[key] || fallbackResponses.default;

  const reply = await generateText(
    `You are Nexora's AI Event Assistant for India. You have deep knowledge about Indian events, festivals, crowds, traffic, and urban life.
Context: ${context}
User question: "${message}"
Give a helpful, concise answer (2-4 sentences). Be specific to India. Include practical tips.`
  ).catch(() => fallback);

  res.json({
    reply: reply === "AI service unavailable. Please set GEMINI_API_KEY." ? fallback : reply,
    isAI: reply !== fallback,
    timestamp: new Date().toISOString(),
  });
});

export default router;
