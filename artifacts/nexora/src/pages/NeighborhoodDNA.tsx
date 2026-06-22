import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search, Sparkles, Loader2, X, MapPin, Clock, Star, Zap,
  ChevronRight, ArrowUpRight, Users, Coffee, Moon, Sun,
  Briefcase, Utensils, Music, Leaf, Building2, Heart, Flame
} from "lucide-react";

// ── INDIA NEIGHBORHOOD DATA ───────────────────────────────────────────
const INDIA_NEIGHBORHOODS: Record<string, {
  city: string; emoji: string; vibe: string; vibeScore: number;
  personality: string; tagline: string; bestTime: string;
  dna: Record<string, number>;
  hiddenGems: string[];
  dailyLife: { time: string; activity: string; emoji: string }[];
  foodDna: Record<string, number>;
  cultureDna: Record<string, number>;
  comfortDay: number; comfortNight: number;
  whoLivesHere: string[]; bestFor: string[];
  hiddenLayer: { label: string; value: string }[];
  trendDirection: "up" | "stable" | "down";
  color: string;
}> = {
  "connaught-place": {
    city: "Delhi", emoji: "🏛", vibe: "Power & Commerce", vibeScore: 92,
    personality: "The Urban Powerhouse",
    tagline: "Delhi's beating commercial heart since 1933",
    bestTime: "Evenings 6–10 PM & Weekends",
    dna: { Energy: 92, Culture: 78, Food: 85, Business: 96, Nightlife: 72, History: 88 },
    hiddenGems: ["Odeon Cinema lane — retro Delhi", "Underground Palika Bazaar labyrinth", "A-Block rooftop bars with Rajiv Chowk views", "Wenger's Bakery since 1926"],
    dailyLife: [
      { time: "7 AM", activity: "Office walkers, early chai stalls open", emoji: "☕" },
      { time: "9 AM", activity: "Metro flood, corporate rush begins", emoji: "🚇" },
      { time: "1 PM", activity: "Lunch crowds, street food peaks", emoji: "🍛" },
      { time: "6 PM", activity: "Shopping surge, lights come on", emoji: "🛍" },
      { time: "9 PM", activity: "Restaurants full, couples & groups", emoji: "🌙" },
    ],
    foodDna: { "Street Food": 88, "Fine Dining": 82, "Cafes": 85, "Late Night": 75 },
    cultureDna: { Heritage: 88, "Modern Art": 65, "Theatre": 72, Festivals: 80 },
    comfortDay: 88, comfortNight: 74,
    whoLivesHere: ["Corporate professionals", "Government workers", "Tourists", "College students"],
    bestFor: ["Business meetings", "Shopping", "Food exploration", "Historical walks"],
    hiddenLayer: [
      { label: "Peak local time", value: "7:30 PM" },
      { label: "Quietest hour", value: "2–4 AM" },
      { label: "Secret strength", value: "Walking city — everything in 10 min" },
      { label: "Local habit", value: "CP baat — evening strolls around the circular road" },
    ],
    trendDirection: "stable", color: "#00ffcc",
  },
  "hauz-khas": {
    city: "Delhi", emoji: "🎨", vibe: "Bohemian Intelligence", vibeScore: 89,
    personality: "The Creative Intellectual",
    tagline: "Where ancient ruins meet rooftop bars",
    bestTime: "Friday–Sunday evenings 7 PM–midnight",
    dna: { Energy: 82, Culture: 95, Food: 88, Business: 58, Nightlife: 90, History: 85 },
    hiddenGems: ["Hauz Khas Lake at sunrise", "Deer Park hidden trail", "Kunzum Travel Café — pay what you want", "Village lane vintage boutiques"],
    dailyLife: [
      { time: "8 AM", activity: "Joggers in Deer Park, early breakfast spots", emoji: "🌅" },
      { time: "11 AM", activity: "Designers & freelancers in cafes", emoji: "💻" },
      { time: "2 PM", activity: "Gallery openings, art walks", emoji: "🎨" },
      { time: "7 PM", activity: "Rooftop bars fill up, Instagram energy", emoji: "🍷" },
      { time: "11 PM", activity: "Late night food, music drifts from basements", emoji: "🎵" },
    ],
    foodDna: { "Street Food": 75, "Fine Dining": 88, "Cafes": 95, "Late Night": 88 },
    cultureDna: { Heritage: 85, "Modern Art": 96, "Theatre": 78, Festivals: 82 },
    comfortDay: 90, comfortNight: 80,
    whoLivesHere: ["Artists & designers", "Young professionals", "International crowd", "Students from nearby colleges"],
    bestFor: ["Art & culture", "Nightlife", "Photography", "Dating"],
    hiddenLayer: [
      { label: "Peak local time", value: "9 PM Friday" },
      { label: "Quietest hour", value: "3–6 AM" },
      { label: "Secret strength", value: "800-year-old ruins 50m from cocktail bars" },
      { label: "Local habit", value: "Rooftop watching the sunrise over the ancient reservoir" },
    ],
    trendDirection: "up", color: "#a29bfe",
  },
  "chandni-chowk": {
    city: "Delhi", emoji: "🕌", vibe: "Ancient Chaos & Life", vibeScore: 94,
    personality: "The Living Museum",
    tagline: "400 years of unbroken human intensity",
    bestTime: "Morning 8–11 AM, avoid peak traffic",
    dna: { Energy: 96, Culture: 98, Food: 99, Business: 88, Nightlife: 40, History: 100 },
    hiddenGems: ["Paranthe Wali Gali — legendary since 1875", "Nai Sarak book street", "Kinari Bazaar — wedding supply labyrinth", "Gurudwara Sis Ganj Sahib at dawn"],
    dailyLife: [
      { time: "5 AM", activity: "Temple bells, early traders arrive", emoji: "🛕" },
      { time: "8 AM", activity: "Wholesale bazaars open, chaos begins", emoji: "📦" },
      { time: "1 PM", activity: "Lunch rush at legendary dhabas", emoji: "🍛" },
      { time: "5 PM", activity: "Retail frenzy, maximum crowd density", emoji: "👥" },
      { time: "8 PM", activity: "Shops close, only food stalls remain", emoji: "🌙" },
    ],
    foodDna: { "Street Food": 100, "Fine Dining": 30, "Cafes": 45, "Late Night": 55 },
    cultureDna: { Heritage: 100, "Modern Art": 25, "Theatre": 60, Festivals: 98 },
    comfortDay: 72, comfortNight: 55,
    whoLivesHere: ["Multigenerational trader families", "Artisans", "Textile workers", "Pilgrims"],
    bestFor: ["Food pilgrimage", "History & culture", "Photography", "Wholesale shopping"],
    hiddenLayer: [
      { label: "Peak local time", value: "10 AM weekday" },
      { label: "Best kept secret", value: "5 AM aarti at Jama Masjid steps" },
      { label: "Secret strength", value: "Every lane specialises in one product since Mughal era" },
      { label: "Local wisdom", value: "Arrive before 9 AM or after 7 PM to breathe" },
    ],
    trendDirection: "stable", color: "#fdcb6e",
  },
  "bandra": {
    city: "Mumbai", emoji: "🎬", vibe: "Bollywood Soul", vibeScore: 91,
    personality: "The Creative Rebel",
    tagline: "Where Bollywood, beaches and bao coexist",
    bestTime: "Evenings 7–11 PM",
    dna: { Energy: 90, Culture: 88, Food: 92, Business: 75, Nightlife: 88, History: 68 },
    hiddenGems: ["Bandstand Promenade at sunset", "Mount Mary Church steps market", "Lucky Restaurant — oldest Irani café", "Chuim Village — artist colony lane"],
    dailyLife: [
      { time: "7 AM", activity: "Sea-face walkers, early chai", emoji: "🌊" },
      { time: "10 AM", activity: "Cafes fill with creatives, shoots begin", emoji: "📸" },
      { time: "2 PM", activity: "Slow lunch, Hill Road shopping", emoji: "🛍" },
      { time: "7 PM", activity: "Bandstand walk, restaurants get lively", emoji: "🌅" },
      { time: "10 PM", activity: "Bar scene, late-night food trucks", emoji: "🍕" },
    ],
    foodDna: { "Street Food": 82, "Fine Dining": 90, "Cafes": 95, "Late Night": 85 },
    cultureDna: { Heritage: 72, "Modern Art": 90, "Theatre": 75, Festivals: 85 },
    comfortDay: 88, comfortNight: 82,
    whoLivesHere: ["Film industry professionals", "Creative class", "Old Bandra Catholics", "Young expats"],
    bestFor: ["Food scene", "Nightlife", "Photography", "Celebrity spotting"],
    hiddenLayer: [
      { label: "Peak local time", value: "8 PM Saturday" },
      { label: "Quietest hour", value: "11 AM weekday" },
      { label: "Secret strength", value: "100% walkable — everything in 2 km radius" },
      { label: "Local habit", value: "Sunday brunch stretching into 5 PM" },
    ],
    trendDirection: "up", color: "#fd79a8",
  },
  "indiranagar": {
    city: "Bangalore", emoji: "💻", vibe: "Tech Pulse + Good Food", vibeScore: 88,
    personality: "The Curated Urbanite",
    tagline: "Bangalore's most liveable address",
    bestTime: "Evenings daily, weekends all day",
    dna: { Energy: 84, Culture: 78, Food: 92, Business: 88, Nightlife: 82, History: 45 },
    hiddenGems: ["100 Feet Road night food walk", "Ivy & Bean bookstore", "Toit Brewpub garden", "CMH Road street art alley"],
    dailyLife: [
      { time: "8 AM", activity: "Cyclists on 100 Feet Road, coffee shops open", emoji: "🚴" },
      { time: "10 AM", activity: "Work-from-cafes crowd, laptop warriors", emoji: "💻" },
      { time: "1 PM", activity: "Tech workers out for lunch, quick bites", emoji: "🍱" },
      { time: "6 PM", activity: "Shopping, evening runs in the park", emoji: "🏃" },
      { time: "8 PM", activity: "Restaurant scene peaks, brewery crowds", emoji: "🍺" },
    ],
    foodDna: { "Street Food": 72, "Fine Dining": 88, "Cafes": 96, "Late Night": 78 },
    cultureDna: { Heritage: 40, "Modern Art": 75, "Theatre": 65, Festivals: 70 },
    comfortDay: 92, comfortNight: 85,
    whoLivesHere: ["Software engineers", "Startup founders", "Young families", "Expats"],
    bestFor: ["Food & drinks", "Working remotely", "Running & fitness", "Craft beer"],
    hiddenLayer: [
      { label: "Peak local time", value: "7 PM Friday" },
      { label: "Quietest hour", value: "2–4 PM weekday" },
      { label: "Secret strength", value: "Cafe per capita ratio — possibly India's highest" },
      { label: "Local habit", value: "Post-work cricket in BDA complex" },
    ],
    trendDirection: "up", color: "#55efc4",
  },
  "koramangala": {
    city: "Bangalore", emoji: "🚀", vibe: "Startup Nation", vibeScore: 90,
    personality: "The Ambitious Builder",
    tagline: "India's startup capital, block by block",
    bestTime: "All day — it never really stops",
    dna: { Energy: 90, Culture: 70, Food: 88, Business: 96, Nightlife: 75, History: 35 },
    hiddenGems: ["6th Block food lane after 10 PM", "Forum Mall rooftop", "Cubbon Park cycle track", "Startup incubator alleys"],
    dailyLife: [
      { time: "7 AM", activity: "Early gym crowd, protein shake stalls", emoji: "💪" },
      { time: "9 AM", activity: "Startup offices fill, stand-ups begin", emoji: "📊" },
      { time: "1 PM", activity: "Team lunch meetings, pitch decks on tables", emoji: "🍜" },
      { time: "6 PM", activity: "Evening networking events, demo days", emoji: "🤝" },
      { time: "9 PM", activity: "Late delivery orders, hustle continues", emoji: "🛵" },
    ],
    foodDna: { "Street Food": 78, "Fine Dining": 82, "Cafes": 90, "Late Night": 82 },
    cultureDna: { Heritage: 30, "Modern Art": 68, "Theatre": 55, Festivals: 65 },
    comfortDay: 88, comfortNight: 80,
    whoLivesHere: ["Founders & VCs", "Product managers", "Engineers", "MBA grads"],
    bestFor: ["Networking", "Startup ecosystem", "Food variety", "Night life"],
    hiddenLayer: [
      { label: "Peak local time", value: "6 PM Tuesday–Thursday" },
      { label: "Best kept secret", value: "More unicorn companies per km² than anywhere in India" },
      { label: "Secret strength", value: "Every Zomato, Swiggy, Flipkart was born here" },
      { label: "Local habit", value: "Discussing funding rounds over filter coffee" },
    ],
    trendDirection: "up", color: "#a29bfe",
  },
};

const CITIES_WITH_AREAS = [
  {
    id: "delhi-in", name: "Delhi", emoji: "🏛",
    areas: ["Connaught Place", "Hauz Khas", "Chandni Chowk", "Lajpat Nagar", "Saket", "Mehrauli", "Karol Bagh"],
  },
  {
    id: "mumbai-in", name: "Mumbai", emoji: "🌊",
    areas: ["Bandra", "Colaba", "Juhu", "Lower Parel", "Dharavi", "Andheri", "Powai"],
  },
  {
    id: "bangalore-in", name: "Bangalore", emoji: "💻",
    areas: ["Indiranagar", "Koramangala", "Whitefield", "HSR Layout", "Jayanagar", "JP Nagar", "Malleshwaram"],
  },
  {
    id: "jaipur-in", name: "Jaipur", emoji: "🏰",
    areas: ["Pink City", "C-Scheme", "Malviya Nagar", "Mansarovar", "Vaishali Nagar"],
  },
];

const TRENDING_NEIGHBORHOODS = [
  { name: "Koramangala", city: "Bangalore", emoji: "🚀", vibe: "Startup Energy", heat: 96, key: "koramangala" },
  { name: "Bandra", city: "Mumbai", emoji: "🎬", vibe: "Bollywood Soul", heat: 94, key: "bandra" },
  { name: "Hauz Khas", city: "Delhi", emoji: "🎨", vibe: "Bohemian", heat: 91, key: "hauz-khas" },
  { name: "Indiranagar", city: "Bangalore", emoji: "💻", vibe: "Tech + Food", heat: 89, key: "indiranagar" },
  { name: "Chandni Chowk", city: "Delhi", emoji: "🕌", vibe: "Living History", heat: 88, key: "chandni-chowk" },
  { name: "Connaught Place", city: "Delhi", emoji: "🏛", vibe: "Power Center", heat: 85, key: "connaught-place" },
];

// ── DNA HEXAGON RADAR ─────────────────────────────────────────────────
function DNAHexagon({ dna, color }: { dna: Record<string, number>; color: string }) {
  const keys = Object.keys(dna);
  const n = keys.length;
  const cx = 120, cy = 120, r = 85;
  const points = keys.map((_, i) => {
    const angle = (Math.PI * 2 * i) / n - Math.PI / 2;
    return { x: cx + r * Math.cos(angle), y: cy + r * Math.sin(angle) };
  });
  const gridLevels = [0.25, 0.5, 0.75, 1.0];

  function gridPolygon(level: number) {
    return keys.map((_, i) => {
      const angle = (Math.PI * 2 * i) / n - Math.PI / 2;
      return `${cx + r * level * Math.cos(angle)},${cy + r * level * Math.sin(angle)}`;
    }).join(" ");
  }

  const dataPoints = keys.map((k, i) => {
    const angle = (Math.PI * 2 * i) / n - Math.PI / 2;
    const val = (dna[k] || 0) / 100;
    return `${cx + r * val * Math.cos(angle)},${cy + r * val * Math.sin(angle)}`;
  }).join(" ");

  return (
    <svg viewBox="0 0 240 240" className="w-full max-w-[220px] mx-auto">
      {/* Grid */}
      {gridLevels.map(level => (
        <polygon key={level} points={gridPolygon(level)} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth={1} />
      ))}
      {/* Axes */}
      {points.map((p, i) => (
        <line key={i} x1={cx} y1={cy} x2={p.x} y2={p.y} stroke="rgba(255,255,255,0.06)" strokeWidth={1} />
      ))}
      {/* Data area */}
      <motion.polygon
        initial={{ scale: 0, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        style={{ transformOrigin: `${cx}px ${cy}px` }}
        points={dataPoints}
        fill={color + "25"} stroke={color} strokeWidth={2} />
      {/* Data dots */}
      {keys.map((k, i) => {
        const angle = (Math.PI * 2 * i) / n - Math.PI / 2;
        const val = (dna[k] || 0) / 100;
        const px = cx + r * val * Math.cos(angle);
        const py = cy + r * val * Math.sin(angle);
        return (
          <motion.circle key={k} cx={px} cy={py} r={4} fill={color}
            initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.6 + i * 0.08 }} />
        );
      })}
      {/* Labels */}
      {keys.map((k, i) => {
        const angle = (Math.PI * 2 * i) / n - Math.PI / 2;
        const lx = cx + (r + 20) * Math.cos(angle);
        const ly = cy + (r + 20) * Math.sin(angle);
        return (
          <text key={k} x={lx} y={ly} textAnchor="middle" dominantBaseline="middle"
            fill="rgba(255,255,255,0.55)" fontSize={9} fontWeight={600}>
            {k}
          </text>
        );
      })}
      {/* Center pulse */}
      <motion.circle cx={cx} cy={cy} r={6} fill={color}
        animate={{ scale: [1, 1.5, 1], opacity: [0.8, 0.3, 0.8] }}
        transition={{ duration: 2.5, repeat: Infinity }} />
    </svg>
  );
}

// ── LIVE PULSE RING ───────────────────────────────────────────────────
function PulseRing({ score, color }: { score: number; color: string }) {
  return (
    <div className="relative w-20 h-20 mx-auto">
      <svg viewBox="0 0 80 80" className="w-full h-full -rotate-90">
        <circle cx="40" cy="40" r="32" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth={5} />
        <motion.circle cx="40" cy="40" r="32" fill="none" stroke={color} strokeWidth={5}
          strokeLinecap="round"
          strokeDasharray={`${2 * Math.PI * 32}`}
          initial={{ strokeDashoffset: 2 * Math.PI * 32 }}
          animate={{ strokeDashoffset: 2 * Math.PI * 32 * (1 - score / 100) }}
          transition={{ duration: 1.2, ease: "easeOut" }} />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <div className="text-base font-black text-white">{score}</div>
        <div className="text-xs text-white/30">/ 100</div>
      </div>
    </div>
  );
}

// ── MAIN COMPONENT ────────────────────────────────────────────────────
export default function NeighborhoodDNA() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCity, setSelectedCity] = useState("delhi-in");
  const [activeArea, setActiveArea] = useState<string | null>(null);
  const [apiData, setApiData] = useState<any>(null);
  const [apiLoading, setApiLoading] = useState(false);
  const [viewMode, setViewMode] = useState<"local" | "visitor">("visitor");
  const [matchStyle, setMatchStyle] = useState<string[]>(["Food", "Cafes"]);
  const [compareA, setCompareA] = useState("bandra");
  const [compareB, setCompareB] = useState("indiranagar");
  const [showAI, setShowAI] = useState(false);
  const [aiQuery, setAiQuery] = useState("");
  const [aiAnswer, setAiAnswer] = useState<string | null>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<"overview" | "lifestyle" | "food" | "culture" | "compare">("overview");

  const localKey = activeArea?.toLowerCase().replace(/\s+/g, "-") || "";
  const localData = INDIA_NEIGHBORHOODS[localKey] || null;
  const displayData = localData || (apiData ? {
    city: apiData.cityName || "", emoji: "📍", vibe: apiData.vibe || "Urban Character",
    vibeScore: apiData.vibeScore || 78, personality: apiData.personality || "The Authentic Core",
    tagline: `A unique area with its own character and community`,
    bestTime: apiData.bestTime || "Evenings and weekends",
    dna: { Energy: apiData.dna?.food || 75, Culture: apiData.dna?.art || 70, Food: apiData.dna?.food || 75, Business: 65, Nightlife: apiData.dna?.nightlife || 65, History: apiData.dna?.history || 70 },
    hiddenGems: apiData.hiddenGems || [],
    dailyLife: [
      { time: "8 AM", activity: "Morning routines, early spots open", emoji: "🌅" },
      { time: "12 PM", activity: "Midday activity picks up", emoji: "☀️" },
      { time: "6 PM", activity: "Evening energy builds", emoji: "🌆" },
      { time: "9 PM", activity: "Night scene begins", emoji: "🌙" },
    ],
    foodDna: { "Street Food": apiData.dna?.food || 72, "Fine Dining": 68, "Cafes": 75, "Late Night": 65 },
    cultureDna: { Heritage: apiData.dna?.history || 72, "Modern Art": apiData.dna?.art || 70, "Theatre": 60, Festivals: 75 },
    comfortDay: 82, comfortNight: 70,
    whoLivesHere: ["Local residents", "Working professionals", "Families"],
    bestFor: ["Exploration", "Food", "Culture"],
    hiddenLayer: [
      { label: "Local secret", value: apiData.hiddenGems?.[0] || "Ask a local" },
      { label: "Best time", value: apiData.bestTime || "Evenings" },
    ],
    trendDirection: "stable" as const, color: "#00ffcc",
  } : null);

  async function loadArea(areaName: string) {
    setActiveArea(areaName);
    setApiData(null);
    setAiAnswer(null);
    setActiveTab("overview");

    const key = areaName.toLowerCase().replace(/\s+/g, "-");
    if (INDIA_NEIGHBORHOODS[key]) return;

    setApiLoading(true);
    try {
      const res = await fetch(`/api/planner/neighborhood?cityId=${selectedCity}&neighborhood=${encodeURIComponent(areaName.toLowerCase())}`);
      const d = await res.json();
      setApiData(d);
    } finally { setApiLoading(false); }
  }

  async function askDNAAI() {
    if (!aiQuery.trim()) return;
    setAiLoading(true); setAiAnswer(null);
    try {
      const ctx = activeArea ? `About ${activeArea}${displayData?.city ? ", " + displayData.city : ""}. ` : "";
      const res = await fetch("/api/chat/message", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: `${ctx}Neighborhood DNA question: "${aiQuery}". Answer in 2 sentences with specific, local insights.`,
          sessionId: "neighborhood-dna-ai"
        })
      });
      const d = await res.json();
      setAiAnswer(d.message);
    } finally { setAiLoading(false); }
  }

  const currentCity = CITIES_WITH_AREAS.find(c => c.id === selectedCity);
  const matchScore = displayData ? Math.round(
    (matchStyle.includes("Food") ? displayData.dna["Food"] * 0.3 : 0) +
    (matchStyle.includes("Cafes") ? displayData.foodDna?.["Cafes"] * 0.25 : 0) +
    (matchStyle.includes("Quiet") ? (100 - displayData.dna["Energy"]) * 0.25 : 0) +
    (matchStyle.includes("History") ? displayData.dna["History"] * 0.3 : 0) +
    (matchStyle.includes("Nightlife") ? displayData.dna["Nightlife"] * 0.3 : 0) +
    (matchStyle.includes("Art") ? displayData.dna["Culture"] * 0.3 : 0) +
    40
  ) : 0;
  const cappedMatch = Math.min(matchScore, 97);

  const compareDataA = INDIA_NEIGHBORHOODS[compareA];
  const compareDataB = INDIA_NEIGHBORHOODS[compareB];

  const searchFiltered = TRENDING_NEIGHBORHOODS.filter(n =>
    searchQuery === "" ||
    n.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    n.city.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-full" style={{ background: "linear-gradient(180deg, #04111c 0%, #07111f 40%, #0a0f1e 100%)" }}>

      {/* ── HERO ── */}
      <div className="relative overflow-hidden border-b border-white/5">
        {/* Animated street grid background */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-10">
          <svg className="w-full h-full" viewBox="0 0 1200 300" preserveAspectRatio="xMidYMid slice">
            {[0, 80, 160, 240, 320, 400, 480, 560, 640, 720, 800, 880, 960, 1040, 1120, 1200].map(x => (
              <motion.line key={x} x1={x} y1={0} x2={x} y2={300} stroke="#00ffcc" strokeWidth={0.5}
                animate={{ opacity: [0.2, 0.8, 0.2] }}
                transition={{ duration: 3 + Math.random() * 2, repeat: Infinity, delay: x * 0.002 }} />
            ))}
            {[0, 60, 120, 180, 240, 300].map(y => (
              <motion.line key={y} x1={0} y1={y} x2={1200} y2={y} stroke="#00ffcc" strokeWidth={0.5}
                animate={{ opacity: [0.2, 0.6, 0.2] }}
                transition={{ duration: 2 + Math.random() * 2, repeat: Infinity, delay: y * 0.005 }} />
            ))}
            {[[200, 80], [500, 150], [800, 60], [1000, 200], [350, 200], [650, 100]].map(([x, y], i) => (
              <motion.circle key={i} cx={x} cy={y} r={6} fill="#00ffcc"
                animate={{ scale: [1, 2.5, 1], opacity: [0.6, 0.2, 0.6] }}
                transition={{ duration: 3, repeat: Infinity, delay: i * 0.7 }} />
            ))}
          </svg>
        </div>
        <div className="absolute inset-0 pointer-events-none"
          style={{ background: "radial-gradient(ellipse at 40% 50%, #00ffcc06 0%, transparent 60%)" }} />

        <div className="relative px-6 md:px-10 py-8">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <div className="w-3 h-3 rounded-full bg-cyan-400 animate-pulse" />
                <span className="text-xs font-bold text-cyan-400 uppercase tracking-widest">Living Intelligence</span>
              </div>
              <h1 className="text-3xl md:text-4xl font-black text-white leading-tight">
                🧬 Discover The DNA<br />
                <span className="text-transparent bg-clip-text"
                  style={{ backgroundImage: "linear-gradient(135deg, #00ffcc, #a29bfe)" }}>
                  Of Every Neighborhood
                </span>
              </h1>
              <p className="text-white/45 mt-2 text-sm max-w-xl leading-relaxed">
                Every neighborhood has a personality. Nexora reveals it — personality, culture, activity, hidden patterns.
              </p>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {[
                { label: "Areas Analysed", value: "50K+", emoji: "🏙", color: "#00ffcc" },
                { label: "Cities Covered", value: "200+", emoji: "🌍", color: "#a29bfe" },
                { label: "AI Insights", value: "Live", emoji: "🤖", color: "#fdcb6e" },
                { label: "Live Signals", value: "24/7", emoji: "📍", color: "#fd79a8" },
              ].map(s => (
                <div key={s.label} className="bg-[#0d1f33]/70 border border-white/8 rounded-2xl p-3 text-center">
                  <div className="text-xl mb-1">{s.emoji}</div>
                  <div className="text-xl font-black" style={{ color: s.color }}>{s.value}</div>
                  <div className="text-xs text-white/25 mt-0.5">{s.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="px-6 md:px-10 py-5 space-y-5 pb-28">

        {/* ── SEARCH + CITY SELECTOR ── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2 bg-[#0d1f33]/80 border border-white/8 rounded-2xl p-5">
            <div className="text-xs font-bold text-white/30 uppercase tracking-widest mb-3">🔍 Search Any Neighborhood</div>
            <div className="flex items-center gap-2 bg-[#07111f] border border-white/10 rounded-xl px-4 py-3 mb-4 focus-within:border-cyan-500/40 transition-all">
              <Search className="w-4 h-4 text-white/30 flex-shrink-0" />
              <input value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search Connaught Place, Bandra, Indiranagar, Hauz Khas..."
                className="flex-1 bg-transparent text-white placeholder-white/25 text-sm outline-none" />
              {searchQuery && <button onClick={() => setSearchQuery("")}><X className="w-3.5 h-3.5 text-white/30" /></button>}
            </div>

            {/* City Tabs */}
            <div className="flex gap-2 mb-4 overflow-x-auto pb-1">
              {CITIES_WITH_AREAS.map(c => (
                <button key={c.id} onClick={() => { setSelectedCity(c.id); setActiveArea(null); setApiData(null); }}
                  className={`flex items-center gap-1.5 flex-shrink-0 px-3 py-2 rounded-xl text-xs font-bold border transition-all ${selectedCity === c.id ? "border-transparent text-black" : "border-white/10 text-white/40 hover:text-white"}`}
                  style={selectedCity === c.id ? { background: "linear-gradient(135deg, #00ffcc, #0099ff)" } : {}}>
                  {c.emoji} {c.name}
                </button>
              ))}
            </div>

            {/* Area chips */}
            <div className="flex flex-wrap gap-2">
              {(currentCity?.areas || []).map(area => (
                <button key={area} onClick={() => loadArea(area)}
                  className={`text-xs px-3 py-1.5 rounded-xl border font-semibold transition-all ${activeArea === area ? "border-cyan-500/50 bg-cyan-500/12 text-cyan-300" : "border-white/8 text-white/40 hover:text-white hover:border-white/20"}`}>
                  {area}
                </button>
              ))}
            </div>
          </div>

          {/* Trending */}
          <div className="bg-[#0d1f33]/80 border border-white/8 rounded-2xl p-5">
            <div className="flex items-center gap-2 mb-3">
              <Flame className="w-3.5 h-3.5 text-red-400" />
              <div className="text-xs font-bold text-white/40 uppercase tracking-widest">Trending Areas</div>
            </div>
            <div className="space-y-2">
              {(searchQuery ? searchFiltered : TRENDING_NEIGHBORHOODS).slice(0, 5).map((n, i) => (
                <button key={n.name} onClick={() => {
                  const cityId = CITIES_WITH_AREAS.find(c => c.name === n.city)?.id || "delhi-in";
                  setSelectedCity(cityId);
                  loadArea(n.name);
                }}
                  className={`w-full flex items-center gap-2.5 p-2.5 rounded-xl border transition-all text-left ${activeArea === n.name ? "border-cyan-500/30 bg-cyan-500/8" : "border-white/5 hover:border-white/15 hover:bg-white/3"}`}>
                  <span className="text-lg">{n.emoji}</span>
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-bold text-white truncate">{n.name}</div>
                    <div className="text-xs text-white/30">{n.city} · {n.vibe}</div>
                  </div>
                  <div className="text-xs font-black" style={{ color: n.heat > 90 ? "#ff4757" : n.heat > 85 ? "#fdcb6e" : "#00ffcc" }}>{n.heat}</div>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* ── LOADING STATE ── */}
        {apiLoading && (
          <div className="border border-dashed border-cyan-500/20 rounded-2xl p-12 text-center bg-cyan-500/3">
            <motion.div animate={{ rotate: 360 }} transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
              className="w-12 h-12 rounded-full border-2 border-cyan-500/30 border-t-cyan-400 mx-auto mb-3" />
            <div className="text-white/40 text-sm">Reading neighborhood DNA...</div>
          </div>
        )}

        {/* ── DNA PROFILE ── */}
        <AnimatePresence>
          {displayData && !apiLoading && (
            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              className="space-y-4">

              {/* Profile Header */}
              <div className="bg-[#0d1f33]/80 border rounded-2xl p-5"
                style={{ borderColor: displayData.color + "30", boxShadow: `0 0 30px ${displayData.color}08` }}>
                <div className="flex items-start justify-between gap-4 mb-4">
                  <div>
                    <div className="text-xs font-bold uppercase tracking-widest mb-1" style={{ color: displayData.color }}>
                      {displayData.city} · Neighborhood DNA
                    </div>
                    <div className="text-3xl font-black text-white flex items-center gap-2">
                      {displayData.emoji} {activeArea}
                    </div>
                    <div className="text-sm text-white/40 mt-0.5 italic">"{displayData.tagline}"</div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <div className="text-xs text-white/25 mb-0.5">Vibe Score</div>
                    <div className="text-4xl font-black" style={{ color: displayData.color }}>{displayData.vibeScore}</div>
                    <div className={`text-xs font-bold mt-0.5 flex items-center gap-1 justify-end ${displayData.trendDirection === "up" ? "text-green-400" : displayData.trendDirection === "down" ? "text-red-400" : "text-white/30"}`}>
                      {displayData.trendDirection === "up" ? "↑ Rising" : displayData.trendDirection === "down" ? "↓ Declining" : "→ Stable"}
                    </div>
                  </div>
                </div>

                {/* Sub-tabs */}
                <div className="flex gap-2 flex-wrap">
                  {[
                    { id: "overview", label: "🧬 DNA Overview" },
                    { id: "lifestyle", label: "🌅 Daily Life" },
                    { id: "food", label: "🍛 Food DNA" },
                    { id: "culture", label: "🎭 Culture" },
                    { id: "compare", label: "⚖️ Compare" },
                  ].map(tab => (
                    <button key={tab.id} onClick={() => setActiveTab(tab.id as any)}
                      className={`text-xs px-3.5 py-2 rounded-xl font-semibold border transition-all ${activeTab === tab.id ? "text-black border-transparent" : "border-white/10 text-white/40 hover:text-white"}`}
                      style={activeTab === tab.id ? { background: `linear-gradient(135deg, ${displayData.color}, ${displayData.color}aa)` } : {}}>
                      {tab.label}
                    </button>
                  ))}
                </div>
              </div>

              <AnimatePresence mode="wait">

                {/* ── OVERVIEW TAB ── */}
                {activeTab === "overview" && (
                  <motion.div key="overview" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                    className="grid grid-cols-1 lg:grid-cols-3 gap-4">

                    {/* Hexagon DNA */}
                    <div className="bg-[#0d1f33]/80 border border-white/8 rounded-2xl p-5 flex flex-col items-center">
                      <div className="text-xs font-bold text-white/30 uppercase tracking-widest mb-3">DNA Radar</div>
                      <DNAHexagon dna={displayData.dna} color={displayData.color} />
                      <div className="mt-3 text-center">
                        <div className="text-base font-black text-white">{displayData.personality}</div>
                        <div className="text-xs mt-1 px-3 py-1 rounded-full inline-block font-semibold"
                          style={{ color: displayData.color, background: displayData.color + "15", border: `1px solid ${displayData.color}30` }}>
                          {displayData.vibe}
                        </div>
                      </div>
                    </div>

                    {/* DNA Bars + Quick Stats */}
                    <div className="space-y-3">
                      <div className="bg-[#0d1f33]/80 border border-white/8 rounded-2xl p-5">
                        <div className="text-xs font-bold text-white/30 uppercase tracking-widest mb-3">DNA Scores</div>
                        <div className="space-y-3">
                          {Object.entries(displayData.dna).map(([key, val]: [string, any], i) => (
                            <div key={key}>
                              <div className="flex justify-between text-xs mb-1">
                                <span className="text-white/55">{key}</span>
                                <span className="font-black" style={{ color: displayData.color }}>{val}%</span>
                              </div>
                              <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                                <motion.div initial={{ width: 0 }} animate={{ width: `${val}%` }}
                                  transition={{ duration: 0.9, ease: "easeOut", delay: i * 0.08 }}
                                  className="h-full rounded-full" style={{ background: displayData.color }} />
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Comfort Index */}
                      <div className="bg-[#0d1f33]/80 border border-white/8 rounded-2xl p-4">
                        <div className="text-xs font-bold text-white/30 uppercase tracking-widest mb-3">Comfort Index</div>
                        <div className="grid grid-cols-2 gap-3">
                          {[["☀️ Day", displayData.comfortDay, "#fdcb6e"], ["🌙 Night", displayData.comfortNight, "#a29bfe"]].map(([label, val, color]: any) => (
                            <div key={label} className="text-center">
                              <PulseRing score={val} color={color} />
                              <div className="text-xs text-white/35 mt-1">{label}</div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Right column: Hidden Layer + Personality */}
                    <div className="space-y-3">
                      {/* AI Personality */}
                      <div className="bg-[#0d1f33]/80 border border-white/8 rounded-2xl p-5">
                        <div className="text-xs font-bold text-white/30 uppercase tracking-widest mb-3">AI Personality</div>
                        <div className="text-sm font-black text-white mb-2">{displayData.personality}</div>
                        <div className="mb-3">
                          <div className="text-xs text-white/30 mb-2">Best For</div>
                          <div className="flex flex-wrap gap-1.5">
                            {displayData.bestFor.map(b => (
                              <span key={b} className="text-xs px-2 py-0.5 rounded-full border"
                                style={{ color: displayData.color, borderColor: displayData.color + "35", background: displayData.color + "10" }}>
                                {b}
                              </span>
                            ))}
                          </div>
                        </div>
                        <div>
                          <div className="text-xs text-white/30 mb-2">Who Lives Here</div>
                          {displayData.whoLivesHere.map(w => (
                            <div key={w} className="text-xs text-white/50 flex items-center gap-1.5 mb-1">
                              <div className="w-1.5 h-1.5 rounded-full bg-white/25" /> {w}
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Hidden Layer */}
                      <div className="bg-[#0d1f33]/80 border border-purple-500/15 rounded-2xl p-5">
                        <div className="flex items-center gap-2 mb-3">
                          <Sparkles className="w-3.5 h-3.5 text-purple-400" />
                          <div className="text-xs font-bold text-purple-400 uppercase tracking-widest">Hidden Layer</div>
                        </div>
                        <div className="space-y-2">
                          {displayData.hiddenLayer.map(item => (
                            <div key={item.label} className="flex items-start justify-between gap-2">
                              <span className="text-xs text-white/30">{item.label}</span>
                              <span className="text-xs font-bold text-white/70 text-right">{item.value}</span>
                            </div>
                          ))}
                        </div>
                        {/* Hidden Gems */}
                        <div className="mt-3 pt-3 border-t border-white/5">
                          <div className="text-xs text-white/25 mb-2">Hidden Gems</div>
                          {displayData.hiddenGems.slice(0, 3).map(g => (
                            <div key={g} className="text-xs text-white/55 flex items-center gap-1.5 mb-1.5">
                              <Star className="w-2.5 h-2.5 text-yellow-400 flex-shrink-0" /> {g}
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* ── DAILY LIFE TAB ── */}
                {activeTab === "lifestyle" && (
                  <motion.div key="lifestyle" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                    className="grid grid-cols-1 lg:grid-cols-2 gap-4">

                    {/* Timeline */}
                    <div className="bg-[#0d1f33]/80 border border-white/8 rounded-2xl p-5">
                      <div className="text-sm font-bold text-white mb-4">🌅 Daily Life Timeline</div>
                      <div className="relative pl-6">
                        <div className="absolute left-2 top-2 bottom-2 w-px bg-gradient-to-b from-cyan-400/40 to-transparent" />
                        {displayData.dailyLife.map((slot, i) => (
                          <motion.div key={slot.time}
                            initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.12 }}
                            className="flex gap-3 pb-5 last:pb-0">
                            <div className="absolute left-0 w-4 h-4 rounded-full border-2 flex items-center justify-center"
                              style={{ borderColor: displayData.color, background: "#0d1f33", top: i * 64 + 0 }}>
                              <div className="w-1.5 h-1.5 rounded-full" style={{ background: displayData.color }} />
                            </div>
                            <div className="flex-1">
                              <div className="text-xs font-black" style={{ color: displayData.color }}>{slot.time}</div>
                              <div className="text-sm text-white/70 mt-0.5">{slot.emoji} {slot.activity}</div>
                            </div>
                          </motion.div>
                        ))}
                      </div>
                    </div>

                    {/* Resident vs Visitor */}
                    <div className="space-y-3">
                      <div className="bg-[#0d1f33]/80 border border-white/8 rounded-2xl p-5">
                        <div className="flex items-center justify-between mb-4">
                          <div className="text-sm font-bold text-white">View Mode</div>
                          <div className="flex bg-[#07111f] rounded-xl p-1 gap-1">
                            {(["visitor", "local"] as const).map(mode => (
                              <button key={mode} onClick={() => setViewMode(mode)}
                                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all capitalize ${viewMode === mode ? "text-black" : "text-white/40"}`}
                                style={viewMode === mode ? { background: displayData.color } : {}}>
                                {mode === "visitor" ? "👤 Visitor" : "🏠 Local"}
                              </button>
                            ))}
                          </div>
                        </div>
                        <AnimatePresence mode="wait">
                          {viewMode === "visitor" ? (
                            <motion.div key="visitor" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                              <div className="text-xs text-white/30 mb-2">What visitors love</div>
                              {displayData.hiddenGems.map(g => (
                                <div key={g} className="flex items-center gap-2 text-sm text-white/65 mb-2">
                                  <MapPin className="w-3.5 h-3.5 text-cyan-400 flex-shrink-0" /> {g}
                                </div>
                              ))}
                              <div className="mt-3 text-xs text-white/30">Best time to visit</div>
                              <div className="text-sm font-bold" style={{ color: displayData.color }}>{displayData.bestTime}</div>
                            </motion.div>
                          ) : (
                            <motion.div key="local" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                              <div className="text-xs text-white/30 mb-2">How locals actually live here</div>
                              {displayData.hiddenLayer.map(item => (
                                <div key={item.label} className="mb-2">
                                  <div className="text-xs text-white/30">{item.label}</div>
                                  <div className="text-sm text-white/70 font-medium">{item.value}</div>
                                </div>
                              ))}
                              <div className="mt-2 text-xs text-white/30">Who you'll meet</div>
                              <div className="flex flex-wrap gap-1.5 mt-1">
                                {displayData.whoLivesHere.map(w => (
                                  <span key={w} className="text-xs px-2 py-0.5 bg-white/5 border border-white/8 rounded-lg text-white/50">{w}</span>
                                ))}
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>

                      {/* Personal Match */}
                      <div className="bg-[#0d1f33]/80 border border-white/8 rounded-2xl p-5">
                        <div className="text-sm font-bold text-white mb-3">🎯 Your Match Score</div>
                        <div className="text-xs text-white/30 mb-2">I like...</div>
                        <div className="flex flex-wrap gap-1.5 mb-4">
                          {["Food", "Cafes", "Quiet", "History", "Nightlife", "Art"].map(s => (
                            <button key={s} onClick={() => setMatchStyle(prev => prev.includes(s) ? prev.filter(x => x !== s) : [...prev, s])}
                              className={`text-xs px-2.5 py-1 rounded-lg border font-semibold transition-all ${matchStyle.includes(s) ? "text-black border-transparent" : "border-white/10 text-white/35"}`}
                              style={matchStyle.includes(s) ? { background: displayData.color } : {}}>
                              {s}
                            </button>
                          ))}
                        </div>
                        <div className="flex items-center gap-4">
                          <PulseRing score={cappedMatch} color={displayData.color} />
                          <div>
                            <div className="text-2xl font-black" style={{ color: displayData.color }}>{cappedMatch}%</div>
                            <div className="text-xs text-white/30">match for you</div>
                            <div className="text-xs text-white/50 mt-1">
                              {cappedMatch >= 85 ? "Great fit for your style" : cappedMatch >= 70 ? "Good match overall" : "Some things to discover"}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* ── FOOD TAB ── */}
                {activeTab === "food" && (
                  <motion.div key="food" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                    className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-[#0d1f33]/80 border border-white/8 rounded-2xl p-5">
                      <div className="text-sm font-bold text-white mb-4">🍛 Food DNA</div>
                      <div className="space-y-4">
                        {Object.entries(displayData.foodDna).map(([key, val]: [string, any], i) => (
                          <div key={key}>
                            <div className="flex justify-between text-xs mb-1">
                              <span className="text-white/55 font-medium">{key}</span>
                              <span className="font-black text-orange-400">{val}/100</span>
                            </div>
                            <div className="h-2.5 bg-white/5 rounded-full overflow-hidden">
                              <motion.div initial={{ width: 0 }} animate={{ width: `${val}%` }}
                                transition={{ duration: 0.9, ease: "easeOut", delay: i * 0.1 }}
                                className="h-full rounded-full"
                                style={{ background: "linear-gradient(90deg, #e17055, #fdcb6e)" }} />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div className="bg-[#0d1f33]/80 border border-white/8 rounded-2xl p-5">
                      <div className="text-sm font-bold text-white mb-4">🍴 Food Gems</div>
                      {displayData.hiddenGems.map((g, i) => (
                        <div key={g} className="flex items-start gap-3 mb-3 p-3 bg-white/3 rounded-xl border border-white/5">
                          <div className="w-6 h-6 rounded-full bg-orange-400/20 flex items-center justify-center flex-shrink-0">
                            <Utensils className="w-3 h-3 text-orange-400" />
                          </div>
                          <div className="text-sm text-white/65">{g}</div>
                        </div>
                      ))}
                    </div>
                  </motion.div>
                )}

                {/* ── CULTURE TAB ── */}
                {activeTab === "culture" && (
                  <motion.div key="culture" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                    className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-[#0d1f33]/80 border border-white/8 rounded-2xl p-5">
                      <div className="text-sm font-bold text-white mb-4">🎭 Culture DNA</div>
                      <div className="space-y-4">
                        {Object.entries(displayData.cultureDna).map(([key, val]: [string, any], i) => (
                          <div key={key}>
                            <div className="flex justify-between text-xs mb-1">
                              <span className="text-white/55 font-medium">{key}</span>
                              <div className="flex gap-0.5">
                                {[1, 2, 3, 4, 5].map(star => (
                                  <Star key={star} className={`w-3 h-3 ${star <= Math.round(val / 20) ? "text-yellow-400 fill-yellow-400" : "text-white/15"}`} />
                                ))}
                              </div>
                            </div>
                            <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                              <motion.div initial={{ width: 0 }} animate={{ width: `${val}%` }}
                                transition={{ duration: 0.9, ease: "easeOut", delay: i * 0.1 }}
                                className="h-full rounded-full bg-purple-400" />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div className="bg-[#0d1f33]/80 border border-purple-500/15 rounded-2xl p-5">
                      <div className="text-sm font-bold text-white mb-4">🌟 Area Identity</div>
                      <div className="text-2xl font-black text-white mb-1">{displayData.personality}</div>
                      <div className="text-xs text-purple-400 mb-4">{displayData.vibe}</div>
                      <div className="p-3 bg-purple-500/6 border border-purple-500/15 rounded-xl">
                        <div className="text-xs text-white/50 leading-relaxed italic">"{displayData.tagline}"</div>
                      </div>
                      <div className="mt-4">
                        <div className="text-xs text-white/25 mb-2">Best For</div>
                        <div className="flex flex-wrap gap-1.5">
                          {displayData.bestFor.map(b => (
                            <span key={b} className="text-xs px-2.5 py-1 rounded-full border"
                              style={{ color: displayData.color, borderColor: displayData.color + "35", background: displayData.color + "10" }}>
                              {b}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* ── COMPARE TAB ── */}
                {activeTab === "compare" && (
                  <motion.div key="compare" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                    className="space-y-4">
                    <div className="bg-[#0d1f33]/80 border border-white/8 rounded-2xl p-5">
                      <div className="text-sm font-bold text-white mb-4">⚖️ Compare Neighborhoods</div>
                      <div className="flex gap-3 items-end flex-wrap mb-5">
                        <div>
                          <label className="text-xs text-white/30 mb-1.5 block">Area A</label>
                          <select value={compareA} onChange={e => setCompareA(e.target.value)}
                            className="bg-[#07111f] border border-white/10 text-white rounded-xl px-3 py-2.5 text-sm focus:border-cyan-500/40 focus:outline-none">
                            {Object.entries(INDIA_NEIGHBORHOODS).map(([k, v]) => (
                              <option key={k} value={k}>{v.emoji} {k.replace(/-/g, " ").replace(/\b\w/g, c => c.toUpperCase())}</option>
                            ))}
                          </select>
                        </div>
                        <div className="text-white/20 font-black text-xl pb-2">VS</div>
                        <div>
                          <label className="text-xs text-white/30 mb-1.5 block">Area B</label>
                          <select value={compareB} onChange={e => setCompareB(e.target.value)}
                            className="bg-[#07111f] border border-white/10 text-white rounded-xl px-3 py-2.5 text-sm focus:border-cyan-500/40 focus:outline-none">
                            {Object.entries(INDIA_NEIGHBORHOODS).map(([k, v]) => (
                              <option key={k} value={k}>{v.emoji} {k.replace(/-/g, " ").replace(/\b\w/g, c => c.toUpperCase())}</option>
                            ))}
                          </select>
                        </div>
                      </div>
                      {compareDataA && compareDataB && (
                        <div className="grid grid-cols-2 gap-4">
                          {[compareDataA, compareDataB].map((area, ci) => (
                            <div key={ci} className="rounded-xl p-4 border border-white/8 bg-white/2">
                              <div className="text-base font-black text-white mb-1">
                                {area.emoji} {ci === 0 ? compareA : compareB}
                              </div>
                              <div className="text-xs mb-3" style={{ color: area.color }}>{area.vibe}</div>
                              {Object.entries(area.dna).map(([key, val]: [string, any], i) => (
                                <div key={key} className="mb-2">
                                  <div className="flex justify-between text-xs mb-0.5">
                                    <span className="text-white/40">{key}</span>
                                    <span className="font-bold" style={{ color: area.color }}>{val}</span>
                                  </div>
                                  <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                                    <motion.div initial={{ width: 0 }} animate={{ width: `${val}%` }}
                                      transition={{ duration: 0.8, delay: i * 0.07 }}
                                      className="h-full rounded-full" style={{ background: area.color }} />
                                  </div>
                                </div>
                              ))}
                              <div className="mt-3 text-xs text-white/30 italic">"{area.tagline}"</div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Empty state */}
        {!displayData && !apiLoading && (
          <div className="text-center py-16 border border-dashed border-white/8 rounded-2xl text-white/20">
            <div className="text-5xl mb-3">🧬</div>
            <div className="text-sm">Select a city and neighborhood to reveal its DNA</div>
            <div className="text-xs mt-1 text-white/12">Try Bandra, Hauz Khas, or Indiranagar</div>
          </div>
        )}
      </div>

      {/* ── FLOATING ASK DNA AI ── */}
      <div className="fixed bottom-6 right-6 z-40">
        <AnimatePresence>
          {showAI && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 12 }}
              className="mb-3 bg-[#0d1f33] border border-white/15 rounded-2xl p-4 w-80"
              style={{ boxShadow: "0 20px 60px rgba(0,0,0,0.6), 0 0 40px rgba(0,255,204,0.06)" }}>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-cyan-400" />
                  <span className="text-sm font-bold text-white">Ask DNA AI</span>
                  {activeArea && <span className="text-xs text-white/30">· {activeArea}</span>}
                </div>
                <button onClick={() => { setShowAI(false); setAiAnswer(null); }}
                  className="text-white/30 hover:text-white/70"><X className="w-4 h-4" /></button>
              </div>
              <div className="flex gap-2 mb-3">
                <input value={aiQuery} onChange={e => setAiQuery(e.target.value)}
                  onKeyDown={e => { if (e.key === "Enter") askDNAAI(); }}
                  placeholder="Is this good for students? Best time to visit?"
                  className="flex-1 bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs text-white placeholder-white/25 outline-none focus:border-cyan-500/40"
                  autoFocus />
                <button onClick={askDNAAI} disabled={aiLoading || !aiQuery}
                  className="px-3 py-2 rounded-xl text-xs font-bold disabled:opacity-40 text-[#07111f]"
                  style={{ background: "linear-gradient(135deg, #00ffcc, #0099ff)" }}>
                  {aiLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <ArrowUpRight className="w-3.5 h-3.5" />}
                </button>
              </div>
              {["Is this good for students?", "Best time to visit?", "Why is this area popular?", "Is it safe at night?", "Good for families?"].map(q => (
                <button key={q} onClick={() => setAiQuery(q)}
                  className="w-full text-left text-xs text-white/30 hover:text-white/55 py-0.5 transition-colors">
                  → {q}
                </button>
              ))}
              <AnimatePresence>
                {aiAnswer && (
                  <motion.div initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }}
                    className="mt-3 p-3 bg-cyan-500/8 border border-cyan-500/20 rounded-xl text-xs text-white/70 leading-relaxed">
                    {aiAnswer}
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          )}
        </AnimatePresence>
        <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.97 }}
          onClick={() => setShowAI(v => !v)}
          className="flex items-center gap-2.5 px-5 py-3 rounded-2xl font-bold text-sm text-[#07111f]"
          style={{ background: "linear-gradient(135deg, #00ffcc, #0099ff)", boxShadow: "0 0 30px #00ffcc40, 0 8px 32px rgba(0,0,0,0.5)" }}>
          <Sparkles className="w-4 h-4" />
          ✨ Ask DNA AI
        </motion.button>
      </div>
    </div>
  );
}
