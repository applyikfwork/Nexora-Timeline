import React, { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Radar, Search, MapPin, Clock, Users, Zap, TrendingUp,
  Music, Trophy, Utensils, Sparkles, RefreshCw, ChevronRight,
  X, Bot, Send, Star, Navigation, Calendar, BarChart2,
  GraduationCap, Briefcase, Film, Mic2, ShoppingBag,
  ArrowUpRight, Info, CheckCircle, Loader2, Flag, Heart,
} from "lucide-react";

// ── Types ──────────────────────────────────────────────────────────────────
interface RadarEvent {
  id: string; name: string; category: string; city: string; cityId: string;
  location: string; lat: number; lng: number; x: number; y: number;
  activity: number; crowd: string; startTime: string; endTime: string; peakTime: string;
  crowdByHour: { hour: string; level: number }[];
  impact: { traffic: string; restaurants: string; parking: string; transport: string };
  distance: number; aiTip: string; emoji: string; color: string;
  trending: boolean; tags: string[];
}
interface Festival {
  id: string; name: string; emoji: string; status: string; daysAway: number;
  crowd: string; traffic: string; bestTime: string; aiTip: string;
  shopping: number; energy: number; markets: number; fireworks: number;
  cities: string[]; description: string;
}
interface TrendingEvent {
  id: string; title: string; category: string; heat: number; growth: string;
  city: string; emoji: string; hot: boolean; description: string;
}

// ── Config ─────────────────────────────────────────────────────────────────
const INDIA_CITIES = [
  { id: "delhi-in", name: "Delhi", emoji: "🔥", x: 37, y: 22 },
  { id: "mumbai-in", name: "Mumbai", emoji: "⚡", x: 26, y: 52 },
  { id: "bangalore-in", name: "Bangalore", emoji: "💻", x: 37, y: 72 },
  { id: "chennai-in", name: "Chennai", emoji: "🌊", x: 46, y: 70 },
  { id: "hyderabad-in", name: "Hyderabad", emoji: "🏏", x: 42, y: 60 },
  { id: "kolkata-in", name: "Kolkata", emoji: "🎭", x: 61, y: 38 },
  { id: "jaipur-in", name: "Jaipur", emoji: "🏰", x: 32, y: 28 },
  { id: "pune-in", name: "Pune", emoji: "🎓", x: 29, y: 57 },
  { id: "ahmedabad-in", name: "Ahmedabad", emoji: "💎", x: 24, y: 42 },
  { id: "lucknow-in", name: "Lucknow", emoji: "🌹", x: 48, y: 27 },
];

const CATEGORIES = [
  { id: "all", label: "All Events", emoji: "🌟", color: "#a29bfe" },
  { id: "music", label: "Music", emoji: "🎵", color: "#6c5ce7" },
  { id: "sports", label: "Sports", emoji: "🏏", color: "#00cec9" },
  { id: "culture", label: "Culture", emoji: "🎭", color: "#e17055" },
  { id: "food", label: "Food", emoji: "🍛", color: "#fdcb6e" },
  { id: "festival", label: "Festival", emoji: "🎉", color: "#fd79a8" },
  { id: "business", label: "Business", emoji: "💼", color: "#74b9ff" },
  { id: "market", label: "Market", emoji: "🛍️", color: "#55efc4" },
];

const TIMELINE_SLOTS = [
  { label: "Now", sublabel: "Live events", icon: "🔴" },
  { label: "2 Hours", sublabel: "Starting soon", icon: "🟡" },
  { label: "Tonight", sublabel: "Evening plans", icon: "🌆" },
  { label: "Tomorrow", sublabel: "Plan ahead", icon: "📅" },
  { label: "This Week", sublabel: "Upcoming", icon: "🗓️" },
];

const SAMPLE_SEARCHES = [
  "Events in Delhi today",
  "Food festival near me",
  "Concert this weekend",
  "Cricket events",
  "Navratri celebrations",
  "Tech expo Bangalore",
];

const CROWD_COLORS: Record<string, string> = {
  Low: "#00b894", Medium: "#fdcb6e", High: "#e17055", "Very High": "#d63031",
};

function getCrowdColor(crowd: string) { return CROWD_COLORS[crowd] || "#74b9ff"; }
function getActivityColor(v: number) {
  if (v >= 90) return "#d63031";
  if (v >= 75) return "#e17055";
  if (v >= 55) return "#fdcb6e";
  return "#00b894";
}

// ── Main Component ─────────────────────────────────────────────────────────
export default function EventRadar() {
  const [cityId, setCityId] = useState("delhi-in");
  const [radarData, setRadarData] = useState<{ events: RadarEvent[]; allEvents: RadarEvent[]; cityName: string; stats: Record<string, number> } | null>(null);
  const [festivals, setFestivals] = useState<Festival[]>([]);
  const [trending, setTrending] = useState<TrendingEvent[]>([]);
  const [aiSummary, setAiSummary] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [aiSummaryLoading, setAiSummaryLoading] = useState(false);
  const [activeCategory, setActiveCategory] = useState("all");
  const [selectedEvent, setSelectedEvent] = useState<RadarEvent | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<RadarEvent[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [scanDone, setScanDone] = useState(false);
  const [plannerEvent, setPlannerEvent] = useState<RadarEvent | null>(null);
  const [plannerResult, setPlannerResult] = useState<any>(null);
  const [plannerLoading, setPlannerLoading] = useState(false);
  const [compareEvents, setCompareEvents] = useState<[RadarEvent | null, RadarEvent | null]>([null, null]);
  const [compareResult, setCompareResult] = useState<any>(null);
  const [compareLoading, setCompareLoading] = useState(false);
  const [activeTimeline, setActiveTimeline] = useState(0);
  const [chatOpen, setChatOpen] = useState(false);
  const [chatMessages, setChatMessages] = useState<{ role: "user" | "ai"; text: string }[]>([
    { role: "ai", text: "👋 Hi! I'm your Event AI. Ask me anything — crowd levels, best time to visit, how to reach, family-friendly info, and more!" },
  ]);
  const [chatInput, setChatInput] = useState("");
  const [chatLoading, setChatLoading] = useState(false);
  const [activeFestival, setActiveFestival] = useState<Festival | null>(null);
  const [radarAngle, setRadarAngle] = useState(0);
  const [pulseEvents, setPulseEvents] = useState<Set<string>>(new Set());
  const [statsAnimated, setStatsAnimated] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Radar sweep animation
  useEffect(() => {
    const t = setInterval(() => setRadarAngle(a => (a + 2) % 360), 30);
    return () => clearInterval(t);
  }, []);

  // Pulse random events
  useEffect(() => {
    if (!radarData) return;
    const t = setInterval(() => {
      const ids = radarData.allEvents.map(e => e.id);
      const randomId = ids[Math.floor(Math.random() * ids.length)];
      setPulseEvents(prev => { const s = new Set(prev); s.add(randomId); return s; });
      setTimeout(() => setPulseEvents(prev => { const s = new Set(prev); s.delete(randomId); return s; }), 1500);
    }, 1200);
    return () => clearInterval(t);
  }, [radarData]);

  // Auto scroll chat
  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [chatMessages]);

  async function loadAll() {
    setLoading(true);
    try {
      const [radarRes, festRes, trendRes] = await Promise.all([
        fetch(`/api/events/radar?cityId=${cityId}`),
        fetch("/api/events/festivals"),
        fetch("/api/events/trending"),
      ]);
      const [r, f, t] = await Promise.all([radarRes.json(), festRes.json(), trendRes.json()]);
      setRadarData(r);
      setFestivals(f.festivals || []);
      setTrending(t.events || []);
      setStatsAnimated(false);
      setTimeout(() => setStatsAnimated(true), 300);
    } finally {
      setLoading(false);
    }
  }

  async function loadAiSummary() {
    setAiSummaryLoading(true);
    try {
      const res = await fetch(`/api/events/ai-summary?cityId=${cityId}`);
      setAiSummary(await res.json());
    } finally {
      setAiSummaryLoading(false);
    }
  }

  useEffect(() => { loadAll(); loadAiSummary(); }, [cityId]);

  async function handleSearch(q: string) {
    setSearchQuery(q);
    if (!q.trim()) { setSearchResults([]); return; }
    setSearchLoading(true);
    try {
      const res = await fetch(`/api/events/search?q=${encodeURIComponent(q)}`);
      const data = await res.json();
      setSearchResults(data.results || []);
    } finally {
      setSearchLoading(false);
    }
  }

  function handleScan() {
    setScanning(true);
    setScanDone(false);
    setTimeout(() => { setScanning(false); setScanDone(true); }, 3000);
  }

  async function handlePlan(event: RadarEvent) {
    setPlannerEvent(event);
    setPlannerResult(null);
    setPlannerLoading(true);
    try {
      const res = await fetch("/api/events/plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ eventId: event.id, cityId }),
      });
      setPlannerResult(await res.json());
    } finally {
      setPlannerLoading(false);
    }
  }

  async function handleCompare() {
    if (!compareEvents[0] || !compareEvents[1]) return;
    setCompareLoading(true);
    setCompareResult(null);
    try {
      const res = await fetch("/api/events/compare", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ event1Id: compareEvents[0].id, event2Id: compareEvents[1].id }),
      });
      setCompareResult(await res.json());
    } finally {
      setCompareLoading(false);
    }
  }

  async function sendChat() {
    if (!chatInput.trim() || chatLoading) return;
    const msg = chatInput.trim();
    setChatInput("");
    setChatMessages(m => [...m, { role: "user", text: msg }]);
    setChatLoading(true);
    try {
      const res = await fetch("/api/events/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: msg, cityId, eventId: selectedEvent?.id }),
      });
      const data = await res.json();
      setChatMessages(m => [...m, { role: "ai", text: data.reply }]);
    } finally {
      setChatLoading(false);
    }
  }

  const filteredEvents = radarData?.events?.filter(e =>
    activeCategory === "all" || e.category === activeCategory
  ) || [];

  const displayEvents = searchQuery && searchResults.length > 0 ? searchResults : filteredEvents;

  // ── Render ───────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen pb-32" style={{ background: "linear-gradient(135deg, #0a0a0f 0%, #0d0d1a 50%, #0a0f0a 100%)" }}>

      {/* ── 1. HERO SECTION ─────────────────────────────────────────── */}
      <section className="relative overflow-hidden" style={{ minHeight: 340 }}>
        {/* Animated BG */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {[...Array(5)].map((_, i) => (
            <motion.div key={i}
              className="absolute rounded-full"
              style={{ width: 300 + i * 120, height: 300 + i * 120, border: `1px solid rgba(255,107,107,${0.06 - i * 0.01})`, left: "50%", top: "50%", transform: "translate(-50%,-50%)" }}
              animate={{ scale: [1, 1.05, 1], opacity: [0.5, 1, 0.5] }}
              transition={{ duration: 3 + i, repeat: Infinity, delay: i * 0.6 }}
            />
          ))}
          {/* Radar sweep */}
          <div className="absolute" style={{ left: "50%", top: "50%", transform: "translate(-50%,-50%)" }}>
            <div style={{
              width: 280, height: 280, borderRadius: "50%",
              background: `conic-gradient(from ${radarAngle}deg, rgba(255,107,107,0.15) 0deg, transparent 60deg)`,
              transition: "background 0.03s",
            }} />
          </div>
          {/* City dots */}
          {INDIA_CITIES.slice(0, 6).map((city, i) => (
            <motion.div key={city.id}
              className="absolute w-2 h-2 rounded-full"
              style={{ left: `${20 + i * 12}%`, top: `${25 + (i % 3) * 20}%`, background: "#ff6b6b", boxShadow: "0 0 8px #ff6b6b" }}
              animate={{ scale: [1, 1.8, 1], opacity: [0.5, 1, 0.5] }}
              transition={{ duration: 2, repeat: Infinity, delay: i * 0.4 }}
            />
          ))}
        </div>

        <div className="relative z-10 px-6 pt-10 pb-6 max-w-6xl mx-auto">
          <div className="flex items-center gap-4 mb-4">
            <motion.div className="w-16 h-16 rounded-2xl flex items-center justify-center border"
              style={{ background: "rgba(255,107,107,0.15)", borderColor: "rgba(255,107,107,0.4)" }}
              animate={{ boxShadow: ["0 0 20px rgba(255,107,107,0.3)", "0 0 40px rgba(255,107,107,0.6)", "0 0 20px rgba(255,107,107,0.3)"] }}
              transition={{ duration: 2, repeat: Infinity }}>
              <span className="text-3xl">📡</span>
            </motion.div>
            <div>
              <h1 className="text-4xl md:text-5xl font-black text-white">Event Radar</h1>
              <p className="text-white/60 mt-1">Discover live events, festivals, gatherings & moments happening around you</p>
            </div>
            <div className="ml-auto flex items-center gap-3">
              <select value={cityId} onChange={e => setCityId(e.target.value)}
                className="px-3 py-2 rounded-xl border text-sm text-white"
                style={{ background: "rgba(255,255,255,0.05)", borderColor: "rgba(255,255,255,0.1)" }}>
                {INDIA_CITIES.map(c => <option key={c.id} value={c.id} style={{ background: "#1a1a2e" }}>{c.emoji} {c.name}</option>)}
              </select>
              <button onClick={() => { loadAll(); loadAiSummary(); }}
                className="w-10 h-10 rounded-xl border flex items-center justify-center transition-colors hover:border-white/30"
                style={{ background: "rgba(255,255,255,0.05)", borderColor: "rgba(255,255,255,0.1)" }}>
                <RefreshCw className={`w-4 h-4 text-white/60 ${loading ? "animate-spin" : ""}`} />
              </button>
            </div>
          </div>

          {/* Animated Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-6">
            {[
              { icon: "🎉", label: "Live Events", value: radarData?.stats?.liveEvents || 0, color: "#ff6b6b" },
              { icon: "📍", label: "Nearby Events", value: radarData?.stats?.nearbyEvents || 0, color: "#a29bfe" },
              { icon: "🔥", label: "Trending Events", value: radarData?.stats?.trendingEvents || 0, color: "#fdcb6e" },
              { icon: "🤖", label: "AI Insights", value: radarData?.stats?.aiInsights || 0, color: "#00cec9" },
            ].map((stat, i) => (
              <motion.div key={stat.label}
                initial={{ opacity: 0, y: 20 }} animate={{ opacity: statsAnimated ? 1 : 0, y: statsAnimated ? 0 : 20 }}
                transition={{ delay: i * 0.1, duration: 0.4 }}
                className="rounded-2xl p-4 border"
                style={{ background: "rgba(255,255,255,0.04)", borderColor: "rgba(255,255,255,0.08)" }}>
                <div className="text-2xl mb-1">{stat.icon}</div>
                <motion.div className="text-2xl font-black" style={{ color: stat.color }}
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 + i * 0.1 }}>
                  {stat.value}
                </motion.div>
                <div className="text-xs text-white/40 mt-1">{stat.label}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <div className="max-w-6xl mx-auto px-4 space-y-8 pt-2">

        {/* ── 2. AI EVENT SEARCH ─────────────────────────────────────── */}
        <section>
          <div className="relative">
            <div className="rounded-2xl border overflow-hidden" style={{ background: "rgba(255,255,255,0.03)", borderColor: "rgba(255,255,255,0.1)" }}>
              <div className="flex items-center gap-3 px-5 py-4">
                <Search className="w-5 h-5 text-white/40 flex-shrink-0" />
                <input value={searchQuery} onChange={e => handleSearch(e.target.value)}
                  placeholder="Search events, places, categories..."
                  className="flex-1 bg-transparent text-white placeholder-white/30 text-lg outline-none"
                />
                {searchLoading && <Loader2 className="w-4 h-4 animate-spin text-white/40" />}
                {searchQuery && <button onClick={() => { setSearchQuery(""); setSearchResults([]); }} className="text-white/40 hover:text-white"><X className="w-4 h-4" /></button>}
              </div>
              <div className="px-5 pb-4 flex flex-wrap gap-2">
                {SAMPLE_SEARCHES.map(s => (
                  <button key={s} onClick={() => handleSearch(s)}
                    className="px-3 py-1.5 rounded-full text-xs border transition-all hover:border-white/30 text-white/50 hover:text-white"
                    style={{ background: "rgba(255,255,255,0.04)", borderColor: "rgba(255,255,255,0.08)" }}>
                    {s}
                  </button>
                ))}
              </div>
            </div>
            {/* Search results dropdown */}
            <AnimatePresence>
              {searchQuery && searchResults.length > 0 && (
                <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
                  className="absolute top-full left-0 right-0 mt-2 rounded-2xl border z-50 overflow-hidden"
                  style={{ background: "#12121f", borderColor: "rgba(255,255,255,0.1)" }}>
                  {searchResults.map(e => (
                    <button key={e.id} onClick={() => { setSelectedEvent(e); setSearchQuery(""); setSearchResults([]); }}
                      className="w-full flex items-center gap-3 px-4 py-3 hover:bg-white/5 transition-colors text-left border-b last:border-b-0"
                      style={{ borderColor: "rgba(255,255,255,0.05)" }}>
                      <span className="text-xl">{e.emoji}</span>
                      <div className="flex-1 min-w-0">
                        <div className="text-white text-sm font-medium truncate">{e.name}</div>
                        <div className="text-white/40 text-xs">{e.city} • {e.category}</div>
                      </div>
                      <div className="text-xs px-2 py-1 rounded-full" style={{ background: getActivityColor(e.activity) + "22", color: getActivityColor(e.activity) }}>
                        {e.activity}%
                      </div>
                    </button>
                  ))}
                </motion.div>
              )}
              {searchQuery && !searchLoading && searchResults.length === 0 && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                  className="absolute top-full left-0 right-0 mt-2 rounded-2xl border z-50 px-4 py-6 text-center text-white/40 text-sm"
                  style={{ background: "#12121f", borderColor: "rgba(255,255,255,0.1)" }}>
                  No events found for "{searchQuery}"
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </section>

        {/* ── 3 + 4. RADAR MAP + SCAN ────────────────────────────────── */}
        <section className="grid md:grid-cols-3 gap-4">
          {/* India Radar Map */}
          <div className="md:col-span-2 rounded-3xl border overflow-hidden" style={{ background: "rgba(255,255,255,0.02)", borderColor: "rgba(255,255,255,0.08)" }}>
            <div className="p-4 border-b flex items-center justify-between" style={{ borderColor: "rgba(255,255,255,0.06)" }}>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-red-400 animate-pulse" />
                <span className="text-white font-semibold">Live Event Radar Map</span>
              </div>
              <div className="flex items-center gap-4 text-xs text-white/40">
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-red-500 inline-block" />High</span>
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-yellow-500 inline-block" />Medium</span>
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-green-500 inline-block" />Low</span>
              </div>
            </div>
            <div className="relative" style={{ height: 360 }}>
              {/* India map SVG outline */}
              <svg viewBox="0 0 100 100" className="absolute inset-0 w-full h-full opacity-10 pointer-events-none">
                <path d="M35,8 L55,8 L68,15 L72,25 L65,32 L70,40 L65,50 L68,58 L62,65 L55,72 L50,80 L45,72 L38,65 L30,58 L25,48 L20,38 L22,28 L30,18 Z" fill="rgba(255,255,255,0.3)" stroke="rgba(255,255,255,0.5)" strokeWidth="0.5" />
              </svg>
              {/* Radar sweep overlay */}
              <div className="absolute inset-0 pointer-events-none" style={{
                background: `conic-gradient(from ${radarAngle}deg at 40% 45%, rgba(255,107,107,0.1) 0deg, transparent 40deg)`,
              }} />
              {/* Event dots on map */}
              {radarData?.allEvents?.map(event => {
                const isPulsing = pulseEvents.has(event.id);
                const isSelected = selectedEvent?.id === event.id;
                const actColor = getActivityColor(event.activity);
                return (
                  <button key={event.id} onClick={() => setSelectedEvent(isSelected ? null : event)}
                    className="absolute transform -translate-x-1/2 -translate-y-1/2 group"
                    style={{ left: `${event.x}%`, top: `${event.y}%`, zIndex: isSelected ? 20 : 10 }}>
                    <div className="relative">
                      {isPulsing && <div className="absolute inset-0 rounded-full animate-ping" style={{ background: actColor, opacity: 0.4, transform: "scale(3)" }} />}
                      <motion.div className="w-4 h-4 rounded-full border-2 border-black flex items-center justify-center cursor-pointer"
                        style={{ background: actColor }}
                        animate={isSelected ? { scale: 1.5 } : { scale: 1 }}
                        whileHover={{ scale: 1.4 }}>
                        <span className="text-[6px]">{event.emoji}</span>
                      </motion.div>
                      {isSelected && (
                        <motion.div initial={{ opacity: 0, scale: 0.8, y: 5 }} animate={{ opacity: 1, scale: 1, y: 0 }}
                          className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-44 rounded-xl border z-30 p-3 text-left"
                          style={{ background: "#12121f", borderColor: actColor + "66" }}>
                          <div className="font-bold text-white text-xs mb-1">{event.emoji} {event.name}</div>
                          <div className="text-white/50 text-xs mb-1">📍 {event.location}</div>
                          <div className="flex items-center gap-2 text-xs mt-2">
                            <span style={{ color: actColor }}>🔥 {event.activity}%</span>
                            <span className="text-white/40">⏰ {event.startTime}–{event.endTime}</span>
                          </div>
                          <div className="mt-1 text-xs" style={{ color: getCrowdColor(event.crowd) }}>
                            👥 Crowd: {event.crowd}
                          </div>
                          <div className="mt-1.5 text-xs text-white/50 italic">🤖 {event.aiTip}</div>
                          <div className="mt-2 text-xs font-medium" style={{ color: "#fdcb6e" }}>
                            ⭐ Peak at {event.peakTime}
                          </div>
                        </motion.div>
                      )}
                    </div>
                  </button>
                );
              })}
              {/* City labels */}
              {INDIA_CITIES.map(city => (
                <div key={city.id} className="absolute text-xs text-white/20 pointer-events-none"
                  style={{ left: `${city.x + 2}%`, top: `${city.y}%` }}>
                  {city.name}
                </div>
              ))}
            </div>
          </div>

          {/* Scan + Info Panel */}
          <div className="space-y-4">
            {/* Radar Scanner */}
            <div className="rounded-3xl border p-5 text-center" style={{ background: "rgba(255,255,255,0.02)", borderColor: "rgba(255,255,255,0.08)" }}>
              <div className="relative w-24 h-24 mx-auto mb-4">
                {[1, 2, 3].map(i => (
                  <motion.div key={i} className="absolute inset-0 rounded-full border"
                    style={{ borderColor: `rgba(255,107,107,${0.4 - i * 0.1})` }}
                    animate={scanning ? { scale: [1, 1.5 + i * 0.3, 1], opacity: [0.8, 0, 0.8] } : {}}
                    transition={{ duration: 1.5, repeat: scanning ? Infinity : 0, delay: i * 0.3 }}
                  />
                ))}
                <div className="absolute inset-0 flex items-center justify-center">
                  <motion.div animate={{ rotate: scanning ? 360 : 0 }} transition={{ duration: 2, repeat: scanning ? Infinity : 0, ease: "linear" }}>
                    <Radar className="w-10 h-10 text-red-400" />
                  </motion.div>
                </div>
              </div>
              <button onClick={handleScan} disabled={scanning}
                className="w-full py-3 rounded-xl font-bold text-sm transition-all"
                style={{ background: scanning ? "rgba(255,107,107,0.2)" : "rgba(255,107,107,0.3)", color: "#ff6b6b", border: "1px solid rgba(255,107,107,0.4)" }}>
                {scanning ? "Scanning..." : scanDone ? "✅ Scan Complete" : "📡 SCAN AREA"}
              </button>
              <AnimatePresence>
                {scanDone && (
                  <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}
                    className="mt-3 space-y-1.5 text-left">
                    {["Events found", "Gatherings", "Activities", "Nearby places"].map((item, i) => (
                      <motion.div key={item} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.1 }}
                        className="flex items-center gap-2 text-xs">
                        <CheckCircle className="w-3 h-3 text-green-400" />
                        <span className="text-white/60">{item} detected</span>
                      </motion.div>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Event quick preview if selected */}
            {selectedEvent && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                className="rounded-3xl border p-4" style={{ background: "rgba(255,255,255,0.02)", borderColor: `${selectedEvent.color}44` }}>
                <div className="flex items-start justify-between mb-3">
                  <div className="text-2xl">{selectedEvent.emoji}</div>
                  <button onClick={() => setSelectedEvent(null)} className="text-white/30 hover:text-white"><X className="w-4 h-4" /></button>
                </div>
                <div className="font-bold text-white text-sm mb-1">{selectedEvent.name}</div>
                <div className="text-xs text-white/50 mb-3">{selectedEvent.location}</div>
                <div className="space-y-1.5 text-xs">
                  <div className="flex justify-between">
                    <span className="text-white/40">Activity</span>
                    <span style={{ color: getActivityColor(selectedEvent.activity) }}>{selectedEvent.activity}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-white/40">Crowd</span>
                    <span style={{ color: getCrowdColor(selectedEvent.crowd) }}>{selectedEvent.crowd}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-white/40">Peak</span>
                    <span className="text-white">{selectedEvent.peakTime}</span>
                  </div>
                </div>
                <button onClick={() => handlePlan(selectedEvent)}
                  className="mt-3 w-full py-2 rounded-xl text-xs font-bold transition-all"
                  style={{ background: `${selectedEvent.color}22`, color: selectedEvent.color, border: `1px solid ${selectedEvent.color}44` }}>
                  ✨ Plan My Visit
                </button>
              </motion.div>
            )}
          </div>
        </section>

        {/* ── 5. CATEGORIES ──────────────────────────────────────────── */}
        <section>
          <div className="flex flex-wrap gap-2">
            {CATEGORIES.map(cat => (
              <motion.button key={cat.id} onClick={() => setActiveCategory(cat.id)}
                whileTap={{ scale: 0.95 }}
                className="flex items-center gap-2 px-4 py-2.5 rounded-full border text-sm font-medium transition-all"
                style={{
                  background: activeCategory === cat.id ? cat.color + "22" : "rgba(255,255,255,0.04)",
                  borderColor: activeCategory === cat.id ? cat.color + "66" : "rgba(255,255,255,0.08)",
                  color: activeCategory === cat.id ? cat.color : "rgba(255,255,255,0.5)",
                }}>
                <span>{cat.emoji}</span>
                <span>{cat.label}</span>
                {activeCategory === cat.id && <span className="w-1.5 h-1.5 rounded-full" style={{ background: cat.color }} />}
              </motion.button>
            ))}
          </div>
        </section>

        {/* ── EVENT CARDS LIST ───────────────────────────────────────── */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="text-center">
              <motion.div animate={{ rotate: 360 }} transition={{ duration: 2, repeat: Infinity, ease: "linear" }}>
                <Radar className="w-10 h-10 text-red-400 mx-auto mb-3" />
              </motion.div>
              <p className="text-white/40 text-sm">Scanning events...</p>
            </div>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 gap-4">
            {displayEvents.map((event, i) => (
              <motion.div key={event.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }}
                className="rounded-3xl border overflow-hidden cursor-pointer group transition-all hover:border-white/20"
                style={{ background: "rgba(255,255,255,0.02)", borderColor: "rgba(255,255,255,0.07)" }}
                onClick={() => setSelectedEvent(selectedEvent?.id === event.id ? null : event)}>
                <div className="p-5">
                  <div className="flex items-start gap-3">
                    <div className="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 text-2xl"
                      style={{ background: event.color + "22", border: `1px solid ${event.color}44` }}>
                      {event.emoji}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-bold text-white">{event.name}</h3>
                        {event.trending && (
                          <span className="text-xs px-2 py-0.5 rounded-full font-medium"
                            style={{ background: "rgba(253,203,110,0.15)", color: "#fdcb6e" }}>
                            🔥 Trending
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-white/50 mt-0.5">📍 {event.location}</div>
                      <div className="flex items-center gap-3 mt-2">
                        <span className="text-xs" style={{ color: getCrowdColor(event.crowd) }}>👥 {event.crowd}</span>
                        <span className="text-xs text-white/40">⏰ {event.startTime}–{event.endTime}</span>
                        <span className="text-xs text-white/40">📏 {event.distance} km</span>
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <div className="text-xl font-black" style={{ color: getActivityColor(event.activity) }}>
                        {event.activity}%
                      </div>
                      <div className="text-xs text-white/30">activity</div>
                    </div>
                  </div>

                  {/* Activity bar */}
                  <div className="mt-3 h-1.5 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.06)" }}>
                    <motion.div className="h-full rounded-full" style={{ background: getActivityColor(event.activity) }}
                      initial={{ width: 0 }} animate={{ width: `${event.activity}%` }} transition={{ delay: i * 0.07 + 0.3 }} />
                  </div>

                  {/* Tags */}
                  <div className="flex flex-wrap gap-1.5 mt-3">
                    {event.tags.map(tag => (
                      <span key={tag} className="text-xs px-2 py-0.5 rounded-full text-white/40"
                        style={{ background: "rgba(255,255,255,0.05)" }}>
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Expanded: crowd by hour + AI tip + plan button */}
                <AnimatePresence>
                  {selectedEvent?.id === event.id && (
                    <motion.div initial={{ height: 0 }} animate={{ height: "auto" }} exit={{ height: 0 }} className="overflow-hidden">
                      <div className="px-5 pb-5 border-t space-y-4" style={{ borderColor: "rgba(255,255,255,0.06)" }}>
                        {/* Crowd by hour */}
                        <div className="pt-4">
                          <div className="text-xs font-semibold text-white/60 mb-3">Expected Crowd by Hour</div>
                          <div className="flex items-end gap-1.5 h-16">
                            {event.crowdByHour.map(h => (
                              <div key={h.hour} className="flex-1 flex flex-col items-center gap-1">
                                <motion.div className="w-full rounded-t-sm" style={{ background: getActivityColor(h.level) }}
                                  initial={{ height: 0 }} animate={{ height: `${(h.level / 100) * 48}px` }} transition={{ delay: 0.3 }} />
                                <span className="text-[9px] text-white/30 whitespace-nowrap">{h.hour}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                        {/* Impact */}
                        <div>
                          <div className="text-xs font-semibold text-white/60 mb-2">Event Impact</div>
                          <div className="grid grid-cols-2 gap-2">
                            {Object.entries(event.impact).map(([k, v]) => (
                              <div key={k} className="flex items-center justify-between px-3 py-2 rounded-xl"
                                style={{ background: "rgba(255,255,255,0.04)" }}>
                                <span className="text-xs text-white/40 capitalize">{k}</span>
                                <span className="text-xs font-medium" style={{ color: v.includes("High") || v.includes("Packed") ? "#e17055" : v.includes("Limited") ? "#fdcb6e" : "#74b9ff" }}>
                                  {v}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                        {/* AI tip */}
                        <div className="flex items-start gap-2 p-3 rounded-xl" style={{ background: "rgba(162,155,254,0.08)", border: "1px solid rgba(162,155,254,0.2)" }}>
                          <Bot className="w-4 h-4 text-purple-400 flex-shrink-0 mt-0.5" />
                          <p className="text-xs text-white/70">{event.aiTip}</p>
                        </div>
                        {/* Actions */}
                        <div className="flex gap-2">
                          <button onClick={e => { e.stopPropagation(); handlePlan(event); }}
                            className="flex-1 py-2.5 rounded-xl text-sm font-bold transition-all"
                            style={{ background: `${event.color}22`, color: event.color, border: `1px solid ${event.color}44` }}>
                            ✨ Plan My Visit
                          </button>
                          <button onClick={e => { e.stopPropagation(); setCompareEvents([event, compareEvents[1]]); }}
                            className="flex-1 py-2.5 rounded-xl text-sm font-bold transition-all"
                            style={{ background: "rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.6)", border: "1px solid rgba(255,255,255,0.1)" }}>
                            ⚖️ Compare
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            ))}
          </div>
        )}

        {/* ── 6. INDIA FESTIVAL INTELLIGENCE ─────────────────────────── */}
        <section>
          <div className="flex items-center gap-3 mb-4">
            <span className="text-2xl">🇮🇳</span>
            <h2 className="text-2xl font-black text-white">Festival Radar</h2>
            <span className="px-3 py-1 rounded-full text-xs font-medium" style={{ background: "rgba(253,203,110,0.15)", color: "#fdcb6e" }}>
              India Intelligence
            </span>
          </div>
          <div className="grid md:grid-cols-3 gap-3">
            {festivals.map((fest, i) => (
              <motion.button key={fest.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}
                onClick={() => setActiveFestival(activeFestival?.id === fest.id ? null : fest)}
                className="rounded-2xl border p-4 text-left transition-all hover:border-white/20"
                style={{
                  background: activeFestival?.id === fest.id ? "rgba(255,255,255,0.05)" : "rgba(255,255,255,0.02)",
                  borderColor: activeFestival?.id === fest.id ? "rgba(255,107,107,0.4)" : "rgba(255,255,255,0.07)",
                }}>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-3xl">{fest.emoji}</span>
                  <span className="text-xs px-2 py-1 rounded-full font-medium"
                    style={{ background: fest.status === "Active Now" || fest.status === "Peak" ? "rgba(0,184,148,0.15)" : "rgba(255,255,255,0.07)", color: fest.status === "Active Now" || fest.status === "Peak" ? "#00b894" : "rgba(255,255,255,0.5)" }}>
                    {fest.status}
                  </span>
                </div>
                <div className="font-bold text-white mb-1">{fest.name}</div>
                <div className="text-xs text-white/40 mb-3">{fest.description.slice(0, 60)}...</div>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-white/40">Crowd</span>
                    <span style={{ color: getCrowdColor(fest.crowd) }}>{fest.crowd}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-white/40">Best Time</span>
                    <span className="text-white">{fest.bestTime}</span>
                  </div>
                </div>
                <AnimatePresence>
                  {activeFestival?.id === fest.id && (
                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                      className="mt-3 overflow-hidden">
                      <div className="pt-3 border-t space-y-3" style={{ borderColor: "rgba(255,255,255,0.06)" }}>
                        <div className="space-y-2">
                          {[
                            { label: "Shopping", value: fest.shopping, color: "#fdcb6e" },
                            { label: "Energy", value: fest.energy, color: "#ff6b6b" },
                            { label: "Markets", value: fest.markets, color: "#55efc4" },
                          ].map(m => (
                            <div key={m.label}>
                              <div className="flex justify-between text-xs mb-1">
                                <span className="text-white/40">{m.label}</span>
                                <span style={{ color: m.color }}>{m.value}%</span>
                              </div>
                              <div className="h-1.5 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.06)" }}>
                                <motion.div className="h-full rounded-full" style={{ background: m.color }}
                                  initial={{ width: 0 }} animate={{ width: `${m.value}%` }} />
                              </div>
                            </div>
                          ))}
                        </div>
                        <div className="flex items-start gap-2 p-2.5 rounded-lg" style={{ background: "rgba(162,155,254,0.08)" }}>
                          <Bot className="w-3 h-3 text-purple-400 mt-0.5 flex-shrink-0" />
                          <p className="text-xs text-white/60">{fest.aiTip}</p>
                        </div>
                        <div className="flex flex-wrap gap-1">
                          {fest.cities.map(c => (
                            <span key={c} className="text-xs px-2 py-0.5 rounded-full text-white/40" style={{ background: "rgba(255,255,255,0.05)" }}>
                              📍 {c}
                            </span>
                          ))}
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.button>
            ))}
          </div>
        </section>

        {/* ── 7. EVENT TIMELINE ──────────────────────────────────────── */}
        <section>
          <div className="flex items-center gap-3 mb-4">
            <Clock className="w-5 h-5 text-purple-400" />
            <h2 className="text-xl font-bold text-white">Event Timeline</h2>
          </div>
          <div className="rounded-3xl border overflow-hidden" style={{ background: "rgba(255,255,255,0.02)", borderColor: "rgba(255,255,255,0.07)" }}>
            {/* Timeline tabs */}
            <div className="flex border-b overflow-x-auto" style={{ borderColor: "rgba(255,255,255,0.06)" }}>
              {TIMELINE_SLOTS.map((slot, i) => (
                <button key={i} onClick={() => setActiveTimeline(i)}
                  className="flex-1 min-w-max px-4 py-3 text-sm font-medium transition-all border-b-2"
                  style={{
                    color: activeTimeline === i ? "#a29bfe" : "rgba(255,255,255,0.4)",
                    borderBottomColor: activeTimeline === i ? "#a29bfe" : "transparent",
                    background: activeTimeline === i ? "rgba(162,155,254,0.08)" : "transparent",
                  }}>
                  {slot.icon} {slot.label}
                </button>
              ))}
            </div>
            <div className="p-5">
              <p className="text-xs text-white/40 mb-4">{TIMELINE_SLOTS[activeTimeline].sublabel}</p>
              <div className="space-y-3">
                {(radarData?.events || []).slice(0, 4).map((event, i) => (
                  <motion.div key={event.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.1 }}
                    className="flex items-center gap-4 p-3 rounded-xl"
                    style={{ background: "rgba(255,255,255,0.03)" }}>
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl flex-shrink-0"
                      style={{ background: event.color + "22" }}>
                      {event.emoji}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-white truncate">{event.name}</div>
                      <div className="text-xs text-white/40">{event.startTime} — {event.city}</div>
                    </div>
                    <div className="text-xs font-medium px-2 py-1 rounded-full flex-shrink-0"
                      style={{ background: getCrowdColor(event.crowd) + "22", color: getCrowdColor(event.crowd) }}>
                      {event.crowd}
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ── 8. AI EVENT SUMMARY ────────────────────────────────────── */}
        <section>
          <div className="rounded-3xl border overflow-hidden" style={{
            background: "linear-gradient(135deg, rgba(162,155,254,0.06), rgba(108,92,231,0.04))",
            borderColor: "rgba(162,155,254,0.2)",
          }}>
            <div className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: "rgba(162,155,254,0.2)" }}>
                  <Bot className="w-5 h-5 text-purple-400" />
                </div>
                <div>
                  <div className="font-bold text-white">{radarData?.cityName || "City"} Today</div>
                  <div className="text-xs text-purple-400">AI Event Summary</div>
                </div>
                {aiSummaryLoading && <Loader2 className="w-4 h-4 animate-spin text-purple-400 ml-auto" />}
              </div>

              {aiSummary && (
                <div className="space-y-4">
                  <div className="flex items-start gap-2">
                    <Sparkles className="w-4 h-4 text-purple-400 mt-0.5 flex-shrink-0" />
                    <p className="text-white/80 text-sm leading-relaxed">{aiSummary.summary}</p>
                  </div>
                  <div>
                    <p className="text-xs text-white/40 mb-3 font-medium uppercase tracking-wider">Expected Impact</p>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      {(aiSummary.impacts || []).map((impact: any) => (
                        <div key={impact.label} className="rounded-xl p-3 text-center" style={{ background: "rgba(255,255,255,0.04)" }}>
                          <div className="text-xl mb-1">{impact.icon}</div>
                          <div className="text-xs text-white/40 mb-1">{impact.label}</div>
                          <div className="text-sm font-bold flex items-center justify-center gap-1"
                            style={{ color: impact.up ? "#e17055" : "#00b894" }}>
                            {impact.level}
                            <ArrowUpRight className={`w-3 h-3 ${!impact.up ? "rotate-180" : ""}`} />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="flex items-center justify-between pt-2 border-t" style={{ borderColor: "rgba(255,255,255,0.06)" }}>
                    <div className="flex items-center gap-3">
                      <div className="text-sm text-white/40">Overall Mood: <span className="text-white font-medium">{aiSummary.overallMood}</span></div>
                      <div className="text-sm text-white/40">Activity: <span style={{ color: getActivityColor(aiSummary.activityScore || 80) }} className="font-medium">{aiSummary.activityScore || 80}%</span></div>
                    </div>
                    <div className="text-xs text-purple-400">🤖 {aiSummary.aiConfidence || 90}% confidence</div>
                  </div>
                </div>
              )}
              {!aiSummary && !aiSummaryLoading && (
                <div className="text-center py-4 text-white/30 text-sm">Loading AI analysis...</div>
              )}
            </div>
          </div>
        </section>

        {/* ── 9 + 10. CROWD PREDICTION + IMPACT ─────────────────────── */}
        {selectedEvent && (
          <section className="grid md:grid-cols-2 gap-4">
            <div className="rounded-3xl border p-5" style={{ background: "rgba(255,255,255,0.02)", borderColor: "rgba(255,255,255,0.07)" }}>
              <h3 className="font-bold text-white mb-4 flex items-center gap-2">
                <Users className="w-4 h-4 text-blue-400" /> Crowd Prediction — {selectedEvent.name}
              </h3>
              <div className="space-y-3">
                {selectedEvent.crowdByHour.map(h => (
                  <div key={h.hour} className="flex items-center gap-3">
                    <span className="text-xs text-white/40 w-10 flex-shrink-0">{h.hour}</span>
                    <div className="flex-1 h-4 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.05)" }}>
                      <motion.div className="h-full rounded-full" style={{ background: getActivityColor(h.level) }}
                        initial={{ width: 0 }} animate={{ width: `${h.level}%` }} transition={{ duration: 0.6 }} />
                    </div>
                    <span className="text-xs font-medium w-14 text-right flex-shrink-0" style={{ color: getActivityColor(h.level) }}>
                      {h.level >= 85 ? "Very High" : h.level >= 65 ? "High" : h.level >= 45 ? "Medium" : "Low"}
                    </span>
                  </div>
                ))}
              </div>
              <div className="mt-4 p-3 rounded-xl text-xs text-white/60 flex items-start gap-2" style={{ background: "rgba(253,203,110,0.08)" }}>
                <Star className="w-3.5 h-3.5 text-yellow-400 mt-0.5 flex-shrink-0" />
                Peak at {selectedEvent.peakTime} — plan your visit accordingly
              </div>
            </div>
            <div className="rounded-3xl border p-5" style={{ background: "rgba(255,255,255,0.02)", borderColor: "rgba(255,255,255,0.07)" }}>
              <h3 className="font-bold text-white mb-4 flex items-center gap-2">
                <BarChart2 className="w-4 h-4 text-green-400" /> Event Impact Analysis
              </h3>
              <div className="space-y-3">
                {Object.entries(selectedEvent.impact).map(([key, val]) => {
                  const color = val.includes("Very") || val.includes("No ") ? "#d63031" : val.includes("High") || val.includes("Packed") ? "#e17055" : val.includes("Limited") ? "#fdcb6e" : "#00b894";
                  const icons: Record<string, string> = { traffic: "🚗", restaurants: "🍽️", parking: "🅿️", transport: "🚇" };
                  const score = val.includes("Very") || val.includes("No ") ? 90 : val.includes("High") || val.includes("Packed") ? 75 : val.includes("Limited") ? 55 : 35;
                  return (
                    <div key={key} className="rounded-xl p-3" style={{ background: "rgba(255,255,255,0.03)" }}>
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-sm text-white/60">{icons[key] || "📍"} {key.charAt(0).toUpperCase() + key.slice(1)}</span>
                        <span className="text-sm font-bold" style={{ color }}>{val}</span>
                      </div>
                      <div className="h-1 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.06)" }}>
                        <motion.div className="h-full rounded-full" style={{ background: color }}
                          initial={{ width: 0 }} animate={{ width: `${score}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </section>
        )}

        {/* ── 11. NEARBY EVENT DISCOVERY ─────────────────────────────── */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <Navigation className="w-5 h-5 text-green-400" />
              <h2 className="text-xl font-bold text-white">Near You</h2>
              <span className="text-xs px-2 py-1 rounded-full font-medium"
                style={{ background: "rgba(0,184,148,0.15)", color: "#00b894" }}>
                🔥 {radarData?.events?.length || 0} Events Found
              </span>
            </div>
          </div>
          <div className="grid md:grid-cols-3 gap-3">
            {(radarData?.events || []).slice(0, 6).map((event, i) => (
              <motion.button key={event.id} initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }}
                onClick={() => setSelectedEvent(event)}
                className="rounded-2xl border p-4 text-left transition-all hover:border-white/20"
                style={{ background: "rgba(255,255,255,0.02)", borderColor: "rgba(255,255,255,0.07)" }}>
                <div className="flex items-center gap-3 mb-2">
                  <span className="text-2xl">{event.emoji}</span>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-white truncate">{event.name}</div>
                    <div className="text-xs text-white/40">{event.city}</div>
                  </div>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-white/40">📏 {event.distance} km away</span>
                  <span style={{ color: getActivityColor(event.activity) }}>{event.activity}% active</span>
                </div>
              </motion.button>
            ))}
          </div>
        </section>

        {/* ── 12. SMART EVENT PLANNER ────────────────────────────────── */}
        <section>
          <div className="rounded-3xl border overflow-hidden" style={{
            background: "linear-gradient(135deg, rgba(0,206,201,0.04), rgba(0,0,0,0))",
            borderColor: "rgba(0,206,201,0.2)",
          }}>
            <div className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: "rgba(0,206,201,0.15)" }}>
                  <Sparkles className="w-5 h-5 text-cyan-400" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-white">Smart Event Planner</h2>
                  <p className="text-xs text-cyan-400">AI-powered visit planning</p>
                </div>
              </div>

              {!plannerEvent && (
                <div className="text-center py-8">
                  <p className="text-white/40 text-sm mb-4">Select an event to generate your personalized visit plan</p>
                  <div className="flex flex-wrap gap-2 justify-center">
                    {(radarData?.events || []).slice(0, 4).map(event => (
                      <button key={event.id} onClick={() => handlePlan(event)}
                        className="flex items-center gap-2 px-4 py-2.5 rounded-xl border text-sm transition-all hover:border-white/20"
                        style={{ background: "rgba(255,255,255,0.04)", borderColor: "rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.7)" }}>
                        <span>{event.emoji}</span> {event.name}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {plannerLoading && (
                <div className="text-center py-8">
                  <Loader2 className="w-8 h-8 animate-spin text-cyan-400 mx-auto mb-3" />
                  <p className="text-white/40 text-sm">AI is planning your visit...</p>
                </div>
              )}

              {plannerResult && plannerEvent && (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-lg font-bold text-white">
                      {plannerEvent.emoji} {plannerResult.eventName}
                    </div>
                    <button onClick={() => { setPlannerEvent(null); setPlannerResult(null); }} className="text-white/30 hover:text-white">
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="grid md:grid-cols-3 gap-3">
                    <div className="rounded-xl p-4" style={{ background: "rgba(0,206,201,0.08)", border: "1px solid rgba(0,206,201,0.2)" }}>
                      <div className="text-xs text-cyan-400 mb-1">Best Arrival</div>
                      <div className="text-white font-bold">{plannerResult.bestArrival}</div>
                    </div>
                    <div className="rounded-xl p-4" style={{ background: "rgba(229,57,53,0.08)", border: "1px solid rgba(229,57,53,0.2)" }}>
                      <div className="text-xs text-red-400 mb-1">Avoid</div>
                      <div className="text-white font-bold">{plannerResult.avoidTimes}</div>
                    </div>
                    <div className="rounded-xl p-4" style={{ background: "rgba(116,185,255,0.08)", border: "1px solid rgba(116,185,255,0.2)" }}>
                      <div className="text-xs text-blue-400 mb-1">Route</div>
                      <div className="text-white font-bold">{plannerResult.route}</div>
                    </div>
                  </div>
                  {plannerResult.crowdWarning && (
                    <div className="flex items-center gap-2 p-3 rounded-xl" style={{ background: "rgba(229,57,53,0.08)", border: "1px solid rgba(229,57,53,0.2)" }}>
                      <span className="text-red-400">⚠️</span>
                      <span className="text-sm text-red-300">{plannerResult.crowdWarning}</span>
                    </div>
                  )}
                  <div>
                    <div className="text-xs font-medium text-white/40 mb-2">AI Tips</div>
                    <div className="grid md:grid-cols-2 gap-2">
                      {(plannerResult.tips || []).map((tip: string, i: number) => (
                        <div key={i} className="flex items-start gap-2 text-sm text-white/70">
                          <CheckCircle className="w-3.5 h-3.5 text-green-400 mt-0.5 flex-shrink-0" />
                          {tip}
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="flex items-center gap-4 text-sm pt-2 border-t" style={{ borderColor: "rgba(255,255,255,0.06)" }}>
                    <span className="text-white/40">⏱️ Duration: <span className="text-white">{plannerResult.estimatedDuration}</span></span>
                    <span className="text-white/40">💰 Budget: <span className="text-white">{plannerResult.budgetEstimate}</span></span>
                    <span className="text-white/40">👨‍👩‍👧 Family: <span style={{ color: plannerResult.familyFriendly ? "#00b894" : "#e17055" }}>{plannerResult.familyFriendly ? "Friendly" : "Adults"}</span></span>
                  </div>
                </motion.div>
              )}
            </div>
          </div>
        </section>

        {/* ── 13. EVENT COMPARE ──────────────────────────────────────── */}
        <section>
          <div className="flex items-center gap-3 mb-4">
            <BarChart2 className="w-5 h-5 text-orange-400" />
            <h2 className="text-xl font-bold text-white">Event Compare</h2>
          </div>
          <div className="rounded-3xl border overflow-hidden" style={{ background: "rgba(255,255,255,0.02)", borderColor: "rgba(255,255,255,0.07)" }}>
            <div className="p-5">
              <div className="grid md:grid-cols-2 gap-4 mb-4">
                {[0, 1].map(slot => (
                  <div key={slot}>
                    <div className="text-xs text-white/40 mb-2">Event {slot + 1}</div>
                    <div className="relative">
                      <select
                        value={compareEvents[slot]?.id || ""}
                        onChange={e => {
                          const ev = radarData?.allEvents?.find(ev => ev.id === e.target.value) || null;
                          setCompareEvents(prev => {
                            const next = [...prev] as [RadarEvent | null, RadarEvent | null];
                            next[slot] = ev;
                            return next;
                          });
                        }}
                        className="w-full px-4 py-3 rounded-xl border text-sm text-white appearance-none"
                        style={{ background: "rgba(255,255,255,0.05)", borderColor: "rgba(255,255,255,0.1)" }}>
                        <option value="" style={{ background: "#1a1a2e" }}>Select an event...</option>
                        {(radarData?.allEvents || []).map(ev => (
                          <option key={ev.id} value={ev.id} style={{ background: "#1a1a2e" }}>
                            {ev.emoji} {ev.name} — {ev.city}
                          </option>
                        ))}
                      </select>
                    </div>
                    {compareEvents[slot] && (
                      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                        className="mt-2 p-3 rounded-xl" style={{ background: `${compareEvents[slot]!.color}11`, border: `1px solid ${compareEvents[slot]!.color}33` }}>
                        <div className="font-medium text-white text-sm">{compareEvents[slot]!.emoji} {compareEvents[slot]!.name}</div>
                        <div className="text-xs text-white/40">{compareEvents[slot]!.city} • {compareEvents[slot]!.crowd} crowd</div>
                      </motion.div>
                    )}
                  </div>
                ))}
              </div>

              <button onClick={handleCompare} disabled={!compareEvents[0] || !compareEvents[1] || compareLoading}
                className="w-full py-3 rounded-xl font-bold text-sm transition-all disabled:opacity-40"
                style={{ background: "rgba(253,203,110,0.15)", color: "#fdcb6e", border: "1px solid rgba(253,203,110,0.3)" }}>
                {compareLoading ? <span className="flex items-center gap-2 justify-center"><Loader2 className="w-4 h-4 animate-spin" /> Comparing...</span> : "⚖️ Compare Events with AI"}
              </button>

              <AnimatePresence>
                {compareResult && (
                  <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="mt-5 space-y-4">
                    <div className="grid md:grid-cols-2 gap-4">
                      {[compareResult.event1, compareResult.event2].map((e: any) => (
                        <div key={e.id} className="rounded-xl p-4 border"
                          style={{ background: compareResult.winner === e.id ? "rgba(0,206,201,0.08)" : "rgba(255,255,255,0.03)", borderColor: compareResult.winner === e.id ? "rgba(0,206,201,0.4)" : "rgba(255,255,255,0.08)" }}>
                          {compareResult.winner === e.id && <div className="text-xs text-cyan-400 font-medium mb-2">⭐ AI Recommends</div>}
                          <div className="font-bold text-white mb-1">{e.emoji} {e.name}</div>
                          <div className="text-xs text-white/40 mb-2">{e.city}</div>
                          <div className="space-y-1.5 text-xs">
                            <div><span className="text-white/40">Vibe: </span><span className="text-white">{e.vibe}</span></div>
                            <div><span className="text-white/40">Best For: </span><span className="text-white">{e.bestFor}</span></div>
                            <div><span className="text-white/40">Cost: </span><span className="text-green-400">{e.costEstimate}</span></div>
                          </div>
                          <p className="text-xs text-white/50 mt-2 italic">{e.verdict}</p>
                        </div>
                      ))}
                    </div>
                    <div className="flex items-start gap-2 p-4 rounded-xl"
                      style={{ background: "rgba(162,155,254,0.08)", border: "1px solid rgba(162,155,254,0.2)" }}>
                      <Bot className="w-4 h-4 text-purple-400 flex-shrink-0 mt-0.5" />
                      <p className="text-sm text-white/80">{compareResult.aiVerdict}</p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </section>

        {/* ── 15. TRENDING EVENTS ────────────────────────────────────── */}
        <section>
          <div className="flex items-center gap-3 mb-4">
            <TrendingUp className="w-5 h-5 text-red-400" />
            <h2 className="text-xl font-bold text-white">Trending India</h2>
            <div className="w-2 h-2 rounded-full bg-red-400 animate-pulse" />
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-3">
            {trending.map((event, i) => (
              <motion.div key={event.id} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.06 }}
                className="rounded-2xl border p-4 group transition-all hover:border-white/20"
                style={{ background: "rgba(255,255,255,0.02)", borderColor: "rgba(255,255,255,0.07)" }}>
                <div className="flex items-start justify-between mb-2">
                  <span className="text-3xl">{event.emoji}</span>
                  {event.hot && <span className="text-xs px-2 py-0.5 rounded-full font-medium" style={{ background: "rgba(255,107,107,0.15)", color: "#ff6b6b" }}>🔥 HOT</span>}
                </div>
                <div className="font-bold text-white text-sm mb-1">{event.title}</div>
                <div className="text-xs text-white/40 mb-3 line-clamp-2">{event.description}</div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-white/40">📍 {event.city}</span>
                  <span className="text-xs font-bold" style={{ color: "#00b894" }}>{event.growth}</span>
                </div>
                <div className="mt-2 h-1 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.06)" }}>
                  <motion.div className="h-full rounded-full" style={{ background: "#ff6b6b" }}
                    initial={{ width: 0 }} animate={{ width: `${event.heat}%` }} transition={{ delay: i * 0.06 + 0.3 }} />
                </div>
              </motion.div>
            ))}
          </div>
        </section>

      </div>{/* end max-w container */}

      {/* ── 16. AI EVENT ASSISTANT FLOATING ───────────────────────── */}
      <div className="fixed bottom-6 right-6 z-50">
        <AnimatePresence>
          {chatOpen && (
            <motion.div initial={{ opacity: 0, scale: 0.8, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.8, y: 20 }}
              className="mb-4 rounded-3xl border overflow-hidden"
              style={{ width: 340, maxHeight: 480, background: "#12121f", borderColor: "rgba(162,155,254,0.3)", boxShadow: "0 20px 60px rgba(0,0,0,0.5)" }}>
              {/* Header */}
              <div className="flex items-center justify-between px-4 py-3 border-b" style={{ borderColor: "rgba(255,255,255,0.06)", background: "rgba(162,155,254,0.1)" }}>
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-xl flex items-center justify-center" style={{ background: "rgba(162,155,254,0.2)" }}>
                    <Bot className="w-4 h-4 text-purple-400" />
                  </div>
                  <div>
                    <div className="text-sm font-bold text-white">Event AI</div>
                    <div className="text-xs text-purple-400">Always online</div>
                  </div>
                </div>
                <button onClick={() => setChatOpen(false)} className="text-white/30 hover:text-white"><X className="w-4 h-4" /></button>
              </div>
              {/* Messages */}
              <div className="overflow-y-auto p-3 space-y-3" style={{ maxHeight: 320 }}>
                {chatMessages.map((msg, i) => (
                  <motion.div key={i} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                    className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                    <div className="max-w-[85%] px-3 py-2 rounded-2xl text-sm"
                      style={{
                        background: msg.role === "user" ? "rgba(162,155,254,0.3)" : "rgba(255,255,255,0.07)",
                        color: "rgba(255,255,255,0.9)",
                        borderRadius: msg.role === "user" ? "16px 16px 4px 16px" : "16px 16px 16px 4px",
                      }}>
                      {msg.text}
                    </div>
                  </motion.div>
                ))}
                {chatLoading && (
                  <div className="flex justify-start">
                    <div className="px-3 py-2 rounded-2xl" style={{ background: "rgba(255,255,255,0.07)" }}>
                      <div className="flex gap-1">
                        {[0, 1, 2].map(i => <div key={i} className="w-1.5 h-1.5 rounded-full bg-purple-400 animate-bounce" style={{ animationDelay: `${i * 0.15}s` }} />)}
                      </div>
                    </div>
                  </div>
                )}
                <div ref={chatEndRef} />
              </div>
              {/* Input */}
              <div className="px-3 pb-3">
                <div className="flex items-center gap-2 p-2 rounded-xl border" style={{ background: "rgba(255,255,255,0.05)", borderColor: "rgba(255,255,255,0.1)" }}>
                  <input value={chatInput} onChange={e => setChatInput(e.target.value)}
                    onKeyDown={e => e.key === "Enter" && sendChat()}
                    placeholder="Ask about events..."
                    className="flex-1 bg-transparent text-sm text-white placeholder-white/30 outline-none" />
                  <button onClick={sendChat} disabled={chatLoading || !chatInput.trim()}
                    className="w-7 h-7 rounded-lg flex items-center justify-center transition-all disabled:opacity-40"
                    style={{ background: "rgba(162,155,254,0.3)" }}>
                    <Send className="w-3.5 h-3.5 text-purple-300" />
                  </button>
                </div>
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {["Will it be crowded?", "Best time to go?", "Family friendly?"].map(q => (
                    <button key={q} onClick={() => { setChatInput(q); }}
                      className="text-xs px-2 py-1 rounded-full border text-white/40 hover:text-white transition-colors"
                      style={{ borderColor: "rgba(255,255,255,0.1)", background: "rgba(255,255,255,0.03)" }}>
                      {q}
                    </button>
                  ))}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        <motion.button onClick={() => setChatOpen(!chatOpen)}
          whileTap={{ scale: 0.95 }} whileHover={{ scale: 1.05 }}
          className="flex items-center gap-2 px-5 py-3.5 rounded-2xl font-bold text-sm shadow-2xl"
          style={{
            background: "linear-gradient(135deg, #6c5ce7, #a29bfe)",
            color: "white",
            boxShadow: "0 8px 32px rgba(108,92,231,0.4)",
          }}
          animate={{ boxShadow: chatOpen ? "0 8px 32px rgba(108,92,231,0.6)" : ["0 8px 32px rgba(108,92,231,0.4)", "0 8px 40px rgba(108,92,231,0.6)", "0 8px 32px rgba(108,92,231,0.4)"] }}
          transition={{ duration: 2, repeat: chatOpen ? 0 : Infinity }}>
          <Bot className="w-5 h-5" />
          <span>{chatOpen ? "Close" : "Ask Event AI"}</span>
          {!chatOpen && <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />}
        </motion.button>
      </div>
    </div>
  );
}
