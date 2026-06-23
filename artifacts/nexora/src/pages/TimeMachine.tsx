import React, { useState, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Clock, Search, Loader2, Sparkles, MessageSquare, Bookmark,
  TrendingUp, ChevronRight, ChevronLeft, Zap, Globe2, Brain,
  Building2, Users, Activity, ArrowRight, Star, MapPin, Send,
  RefreshCw, Play, ChevronDown, ChevronUp, Heart
} from "lucide-react";
import { useAppContext } from "@/lib/store";
import { askAI as sharedAskAI, getSessionId } from "@/lib/ai";

/* ─── helpers ─── */
const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");

async function askAI(prompt: string): Promise<string> {
  return sharedAskAI(prompt, "time travel");
}

/* ─── types ─── */
interface Journey { id: string; location: string; year: number; title: string; note: string; savedAt: string }
interface HistoricalEvent { year: number; title: string; description: string; type: "development" | "culture" | "infrastructure" | "milestone" }

/* ─── constants ─── */
const INDIA_CITIES = ["Delhi", "Mumbai", "Bangalore", "Chennai", "Kolkata", "Jaipur", "Varanasi", "Hyderabad", "Pune", "Ahmedabad"];
const EXAMPLE_PLACES = ["Your Hometown", "Tokyo", "Old Delhi", "Times Square", "Shibuya", "Connaught Place", "Baker Street"];
const TIMES = ["6 AM", "9 AM", "12 PM", "3 PM", "6 PM", "9 PM", "12 AM"];

/* ─── animated clock hand ─── */
function ClockIcon({ year }: { year: number }) {
  const progress = (year - 1900) / 150;
  const angle = progress * 360 * 2;
  return (
    <div className="relative w-16 h-16">
      <div className="absolute inset-0 rounded-full border-2 border-amber-500/40 flex items-center justify-center">
        <Clock className="w-6 h-6 text-amber-400/60" />
      </div>
      <div
        className="absolute top-1/2 left-1/2 w-0.5 h-6 bg-amber-400 origin-bottom rounded-full"
        style={{ transform: `translate(-50%, -100%) rotate(${angle}deg)`, marginTop: "-1px" }}
      />
    </div>
  );
}

/* ─── year color helpers ─── */
function getYearColor(year: number) {
  if (year < 1980) return { text: "text-amber-400", border: "border-amber-500/40", bg: "bg-amber-500/10", glow: "shadow-amber-500/20", label: "PAST", hex: "#F59E0B" };
  if (year <= 2026) return { text: "text-blue-400", border: "border-blue-500/40", bg: "bg-blue-500/10", glow: "shadow-blue-500/20", label: "PRESENT", hex: "#3B82F6" };
  return { text: "text-violet-400", border: "border-violet-500/40", bg: "bg-violet-500/10", glow: "shadow-violet-500/20", label: "FUTURE", hex: "#8B5CF6" };
}

/* ─── glass card ─── */
function GlassCard({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`bg-black/40 backdrop-blur-xl border border-white/10 rounded-2xl ${className}`}>
      {children}
    </div>
  );
}

/* ─── main component ─── */
export default function TimeMachine() {
  const { activePlaceName, setActivePlaceName, sessionId } = useAppContext();
  /* search */
  const [query, setQuery] = useState(activePlaceName);
  const [searching, setSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<{ id: string; name: string; country: string }[]>([]);
  const [location, setLocation] = useState(activePlaceName);
  const [showSearch, setShowSearch] = useState(false);

  /* timeline */
  const [year, setYear] = useState(1950);
  const [compareYear, setCompareYear] = useState(2024);
  const [compareMode, setCompareMode] = useState(false);

  /* day-in-year */
  const [dayYear, setDayYear] = useState(1990);
  const [dayTime, setDayTime] = useState("6 PM");
  const [dayStory, setDayStory] = useState<string | null>(null);
  const [loadingDay, setLoadingDay] = useState(false);

  /* ai states */
  const [pastStory, setPastStory] = useState<string | null>(null);
  const [loadingPast, setLoadingPast] = useState(false);
  const [futureData, setFutureData] = useState<{ infrastructure: number; population: number; technology: number; confidence: number; summary: string } | null>(null);
  const [loadingFuture, setLoadingFuture] = useState(false);
  const [evolutionScore, setEvolutionScore] = useState<{ total: number; growth: number; culture: number; technology: number; connectivity: number; summary: string } | null>(null);
  const [loadingEvolution, setLoadingEvolution] = useState(false);
  const [changeReasons, setChangeReasons] = useState<string[]>([]);
  const [loadingReasons, setLoadingReasons] = useState(false);
  const [events, setEvents] = useState<HistoricalEvent[]>([]);
  const [loadingEvents, setLoadingEvents] = useState(false);
  const [beforeAfterText, setBeforeAfterText] = useState<{ before: string; after: string } | null>(null);
  const [loadingBA, setLoadingBA] = useState(false);

  /* ai q&a */
  const [aiQuestion, setAiQuestion] = useState("");
  const [aiAnswer, setAiAnswer] = useState<string | null>(null);
  const [loadingQA, setLoadingQA] = useState(false);

  /* india mode */
  const [indiaMode, setIndiaMode] = useState(false);
  const [indiaCity, setIndiaCity] = useState("Delhi");
  const [indiaStory, setIndiaStory] = useState<string | null>(null);
  const [loadingIndia, setLoadingIndia] = useState(false);

  /* saved journeys — DB-backed */
  const [savedJourneys, setSavedJourneys] = useState<Journey[]>([]);
  const [showSaved, setShowSaved] = useState(false);

  const reloadJourneys = useCallback(async () => {
    try {
      const r = await fetch(`${BASE}/api/saved-journeys?sessionId=${encodeURIComponent(sessionId)}`);
      if (r.ok) {
        const data = await r.json() as { id: number; location: string; fromYear: number; notesJson: string | null; savedAt: string }[];
        setSavedJourneys(data.map(d => ({
          id: String(d.id), location: d.location, year: d.fromYear,
          title: `${d.location} in ${d.fromYear}`,
          note: d.notesJson ? (JSON.parse(d.notesJson) as { note?: string }).note ?? "" : "",
          savedAt: new Date(d.savedAt).toLocaleDateString(),
        })));
      }
    } catch {}
  }, [sessionId]);

  const { useEffect } = React;
  useEffect(() => { reloadJourneys(); }, [reloadJourneys]);

  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  /* ─── search ─── */
  const handleSearchChange = (v: string) => {
    setQuery(v);
    if (searchTimer.current) clearTimeout(searchTimer.current);
    if (v.length < 2) { setSearchResults([]); return; }
    searchTimer.current = setTimeout(async () => {
      setSearching(true);
      try {
        const r = await fetch(`${BASE}/api/places/search?q=${encodeURIComponent(v)}&limit=6`);
        if (r.ok) setSearchResults(await r.json());
      } finally { setSearching(false); }
    }, 300);
  };

  const selectLocation = (name: string) => {
    setLocation(name);
    setQuery(name);
    setActivePlaceName(name);
    setShowSearch(false);
    setSearchResults([]);
    setPastStory(null); setFutureData(null); setEvolutionScore(null);
    setChangeReasons([]); setEvents([]); setBeforeAfterText(null);
  };

  /* ─── AI functions ─── */
  const loc = location || "a city";

  const generatePastStory = useCallback(async () => {
    if (!location) return;
    setLoadingPast(true);
    const txt = await askAI(`Describe ${location} in the year ${year} in 3-4 sentences. Focus on what daily life, architecture, culture, and key activities looked like. Be vivid and specific.`);
    setPastStory(txt);
    setLoadingPast(false);
  }, [location, year]);

  const generateFuture = useCallback(async () => {
    if (!location) return;
    setLoadingFuture(true);
    const txt = await askAI(`Give a future prediction for ${location} in the year ${year > 2026 ? year : 2035}. Return a JSON object with fields: infrastructure (0-100), population (0-100), technology (0-100), confidence (0-100), summary (1 sentence). Only raw JSON.`);
    try {
      const cleaned = txt.replace(/```json?/g, "").replace(/```/g, "").trim();
      setFutureData(JSON.parse(cleaned));
    } catch {
      setFutureData({ infrastructure: 78, population: 82, technology: 85, confidence: 74, summary: `${location} is projected to see significant technological and infrastructure growth.` });
    }
    setLoadingFuture(false);
  }, [location, year]);

  const generateEvolution = useCallback(async () => {
    if (!location) return;
    setLoadingEvolution(true);
    const txt = await askAI(`Score ${location}'s urban evolution. Return JSON: growth (0-100), culture (0-100), technology (0-100), connectivity (0-100), total (average of all), summary (1 short sentence). Only raw JSON.`);
    try {
      const cleaned = txt.replace(/```json?/g, "").replace(/```/g, "").trim();
      setEvolutionScore(JSON.parse(cleaned));
    } catch {
      setEvolutionScore({ total: 78, growth: 82, culture: 71, technology: 84, connectivity: 75, summary: `${location} shows strong urban growth with balanced development.` });
    }
    setLoadingEvolution(false);
  }, [location]);

  const generateReasons = useCallback(async () => {
    if (!location) return;
    setLoadingReasons(true);
    const txt = await askAI(`List 5 main reasons ${location} changed and grew over the decades. Return a JSON array of short phrases (max 8 words each). Only raw JSON array.`);
    try {
      const cleaned = txt.replace(/```json?/g, "").replace(/```/g, "").trim();
      setChangeReasons(JSON.parse(cleaned));
    } catch {
      setChangeReasons(["Population growth", "Economic development", "Transport expansion", "Technology adoption", "Cultural evolution"]);
    }
    setLoadingReasons(false);
  }, [location]);

  const generateEvents = useCallback(async () => {
    if (!location) return;
    setLoadingEvents(true);
    const txt = await askAI(`List 5 important historical milestones for ${location} between 1900 and 2026. Return a JSON array of objects with: year (number), title (string), description (1 sentence), type (one of: development, culture, infrastructure, milestone). Only raw JSON.`);
    try {
      const cleaned = txt.replace(/```json?/g, "").replace(/```/g, "").trim();
      setEvents(JSON.parse(cleaned));
    } catch {
      setEvents([
        { year: 1920, title: "Early Development", description: `${location} began its first major urban expansion.`, type: "development" },
        { year: 1960, title: "Infrastructure Push", description: "Major roads and public transport networks established.", type: "infrastructure" },
        { year: 1985, title: "Cultural Renaissance", description: "Arts, culture, and local identity flourished.", type: "culture" },
        { year: 2005, title: "Tech & Growth Era", description: "Digital economy and rapid modernization transformed the city.", type: "milestone" },
        { year: 2020, title: "Modern Transformation", description: "Smart city initiatives and global connectivity reshaped urban life.", type: "development" },
      ]);
    }
    setLoadingEvents(false);
  }, [location]);

  const generateBeforeAfter = useCallback(async () => {
    if (!location) return;
    setLoadingBA(true);
    const txt = await askAI(`Describe ${location} in two eras. Return JSON: { "before": "description of ${location} in 1970 (2 sentences)", "after": "description of ${location} in 2024 (2 sentences)" }. Only raw JSON.`);
    try {
      const cleaned = txt.replace(/```json?/g, "").replace(/```/g, "").trim();
      setBeforeAfterText(JSON.parse(cleaned));
    } catch {
      setBeforeAfterText({ before: `In the earlier era, ${location} was characterized by traditional architecture, bustling local markets, and a slower pace of life.`, after: `Today, ${location} is a dynamic urban center with modern infrastructure, global connectivity, and a vibrant mixed-use landscape.` });
    }
    setLoadingBA(false);
  }, [location]);

  const generateDayStory = async () => {
    if (!location) return;
    setLoadingDay(true);
    const txt = await askAI(`Describe a typical evening/day in ${location} in the year ${dayYear} at ${dayTime}. What transport did people use? What were they doing? What did the streets look like? 3 sentences, very vivid.`);
    setDayStory(txt);
    setLoadingDay(false);
  };

  const askQuestion = async () => {
    if (!aiQuestion.trim()) return;
    setLoadingQA(true);
    const txt = await askAI(`${aiQuestion} Context: we are exploring ${loc} through time (past, present, future). Answer in 3-4 sentences.`);
    setAiAnswer(txt);
    setLoadingQA(false);
  };

  const generateIndia = async () => {
    setLoadingIndia(true);
    const txt = await askAI(`Describe the transformation of ${indiaCity}, India — from its traditional roots to its modern identity. How has it blended heritage and growth? What makes it unique in India's urban story? 4 sentences.`);
    setIndiaStory(txt);
    setLoadingIndia(false);
  };

  const saveJourney = async () => {
    if (!location) return;
    await fetch(`${BASE}/api/saved-journeys`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        sessionId, location,
        fromYear: year, toYear: year,
        view: "past",
        notesJson: JSON.stringify({ note: pastStory?.slice(0, 120) ?? "Explore this era" }),
      }),
    }).catch(() => {});
    await reloadJourneys();
  };

  const yc = getYearColor(year);
  const yc2 = getYearColor(compareYear);

  /* ─── render ─── */
  return (
    <div className="min-h-screen bg-[radial-gradient(ellipse_at_top,_#0d0a1a_0%,_#000_60%)] text-white pb-20">

      {/* ── HERO ── */}
      <div className="relative overflow-hidden px-6 py-14 md:py-20 text-center">
        <div className="absolute inset-0 pointer-events-none">
          {[...Array(20)].map((_, i) => (
            <motion.div key={i}
              className="absolute w-1 h-1 rounded-full bg-amber-400/30"
              style={{ left: `${Math.random() * 100}%`, top: `${Math.random() * 100}%` }}
              animate={{ opacity: [0, 1, 0], scale: [0, 1.5, 0] }}
              transition={{ duration: 3 + Math.random() * 4, repeat: Infinity, delay: Math.random() * 5 }}
            />
          ))}
        </div>
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="relative z-10 max-w-4xl mx-auto">
          <div className="flex justify-center mb-4">
            <div className="relative">
              <motion.div animate={{ rotate: 360 }} transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                className="w-20 h-20 rounded-full border border-amber-500/30 flex items-center justify-center">
                <Clock className="w-10 h-10 text-amber-400" />
              </motion.div>
              <div className="absolute inset-0 rounded-full bg-amber-500/10 blur-xl" />
            </div>
          </div>
          <h1 className="text-5xl md:text-6xl font-black tracking-tight mb-4">
            <span className="bg-gradient-to-r from-amber-400 via-blue-400 to-violet-400 bg-clip-text text-transparent">
              ⏳ Time Machine
            </span>
          </h1>
          <p className="text-lg text-white/60 max-w-2xl mx-auto mb-8">
            Travel through moments and discover how places evolve. Past → Present → Future.
          </p>
          <div className="flex flex-wrap justify-center gap-6 text-sm">
            {[["🌍", "Any Location"], ["⏳", "Timeline Data"], ["🤖", "AI Reconstruction"], ["🔮", "Future View"]].map(([icon, label]) => (
              <div key={label} className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10">
                <span>{icon}</span><span className="text-white/70">{label}</span>
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      <div className="max-w-6xl mx-auto px-4 space-y-8">

        {/* ── SEARCH ── */}
        <GlassCard className="p-6">
          <div className="flex items-center gap-2 mb-4">
            <MapPin className="w-5 h-5 text-amber-400" />
            <h2 className="text-lg font-bold">Enter Any Place</h2>
          </div>
          <div className="relative">
            <div className="flex gap-3">
              <div className="flex-1 relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/30" />
                <input
                  value={query}
                  onChange={e => handleSearchChange(e.target.value)}
                  onFocus={() => setShowSearch(true)}
                  placeholder="🔍 Enter any place — city, street, neighborhood, landmark..."
                  className="w-full bg-white/5 border border-white/10 rounded-xl pl-12 pr-4 py-3.5 text-white placeholder:text-white/30 focus:outline-none focus:border-amber-500/50 transition-colors"
                />
                {searching && <Loader2 className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 animate-spin text-amber-400" />}
              </div>
              <button
                onClick={() => selectLocation(query)}
                disabled={!query.trim()}
                className="px-6 py-3 bg-gradient-to-r from-amber-500 to-orange-500 rounded-xl font-semibold text-black disabled:opacity-40 disabled:cursor-not-allowed hover:brightness-110 transition-all"
              >
                Explore
              </button>
            </div>
            {showSearch && (searchResults.length > 0 || query.length > 0) && (
              <div className="absolute top-full mt-2 left-0 right-0 z-50 bg-black/90 border border-white/10 rounded-xl overflow-hidden">
                {searchResults.map(r => (
                  <button key={r.id} onClick={() => selectLocation(r.name)}
                    className="w-full flex items-center gap-3 px-4 py-3 hover:bg-white/5 transition-colors text-left">
                    <MapPin className="w-4 h-4 text-amber-400 flex-shrink-0" />
                    <span>{r.name}</span>
                    <span className="text-white/40 text-sm ml-auto">{r.country}</span>
                  </button>
                ))}
                {query.trim() && (
                  <button onClick={() => selectLocation(query)}
                    className="w-full flex items-center gap-3 px-4 py-3 hover:bg-amber-500/10 text-amber-400 border-t border-white/5 transition-colors">
                    <ArrowRight className="w-4 h-4" />
                    <span>Explore "{query}" through time</span>
                  </button>
                )}
              </div>
            )}
          </div>
          <div className="flex flex-wrap gap-2 mt-3">
            {EXAMPLE_PLACES.map(p => (
              <button key={p} onClick={() => { setQuery(p); selectLocation(p); }}
                className="text-xs px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-white/50 hover:text-white hover:border-amber-500/40 transition-all">
                {p}
              </button>
            ))}
          </div>
        </GlassCard>

        {/* ── TIME PORTAL ── */}
        <GlassCard className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <ClockIcon year={year} />
              <div>
                <h2 className="text-2xl font-black">
                  <span className={yc.text}>{year}</span>
                </h2>
                <span className={`text-xs font-bold tracking-widest ${yc.text} opacity-60`}>{yc.label}</span>
              </div>
            </div>
            <div className={`px-4 py-1.5 rounded-full text-xs font-bold border ${yc.border} ${yc.bg} ${yc.text}`}>
              {loc.toUpperCase()}
            </div>
          </div>

          {/* timeline labels */}
          <div className="flex justify-between text-xs text-white/30 mb-2 px-1">
            {[1900, 1950, 2000, 2026, 2075].map(y => (
              <span key={y} className={year === y ? yc.text : ""}>{y}</span>
            ))}
          </div>

          {/* slider */}
          <div className="relative h-8 flex items-center mb-4">
            <div className="absolute inset-x-0 h-1.5 rounded-full overflow-hidden">
              <div className="h-full bg-gradient-to-r from-amber-500 via-blue-500 to-violet-500 opacity-30" />
              <div
                className="h-full bg-gradient-to-r from-amber-500 via-blue-500 to-violet-500 absolute top-0 left-0 transition-all duration-100"
                style={{ width: `${((year - 1900) / 175) * 100}%` }}
              />
            </div>
            <input
              type="range" min={1900} max={2075} value={year}
              onChange={e => setYear(Number(e.target.value))}
              className="w-full appearance-none bg-transparent cursor-pointer relative z-10 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:shadow-lg [&::-webkit-slider-thumb]:cursor-grab"
            />
          </div>

          {/* era buttons */}
          <div className="flex flex-wrap gap-2">
            {[["1900", 1900], ["1950", 1950], ["1980", 1980], ["Now", 2024], ["2035", 2035], ["2050", 2050], ["2075", 2075]].map(([label, y]) => (
              <button key={label} onClick={() => setYear(Number(y))}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${year === Number(y) ? `${yc.bg} ${yc.border} ${yc.text}` : "border-white/10 text-white/40 hover:border-white/20 hover:text-white/70"}`}>
                {label}
              </button>
            ))}
          </div>
        </GlassCard>

        {/* ── PAST VIEW ── */}
        {year < 2026 && (
          <GlassCard className="p-6 border-amber-500/20">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-amber-500/20 flex items-center justify-center">
                  <Clock className="w-4 h-4 text-amber-400" />
                </div>
                <div>
                  <h3 className="font-bold text-amber-400">YEAR: {year}</h3>
                  <p className="text-sm text-white/50">{loc}</p>
                </div>
              </div>
              <button onClick={generatePastStory} disabled={!location || loadingPast}
                className="flex items-center gap-2 px-4 py-2 bg-amber-500/20 border border-amber-500/40 rounded-lg text-amber-400 text-sm hover:bg-amber-500/30 transition-all disabled:opacity-40">
                {loadingPast ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                {loadingPast ? "Generating..." : "AI Story"}
              </button>
            </div>
            {pastStory ? (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                className="bg-amber-500/5 border border-amber-500/20 rounded-xl p-4">
                <p className="text-white/80 leading-relaxed italic">"{pastStory}"</p>
              </motion.div>
            ) : (
              <div className="bg-amber-500/5 border border-amber-500/20 rounded-xl p-6 text-center">
                <Clock className="w-8 h-8 text-amber-400/30 mx-auto mb-2" />
                <p className="text-white/40 text-sm">{location ? `Click "AI Story" to travel to ${loc} in ${year}` : "Select a location first"}</p>
              </div>
            )}
          </GlassCard>
        )}

        {/* ── PRESENT VIEW ── */}
        {year >= 2020 && year <= 2026 && (
          <GlassCard className="p-6 border-blue-500/20">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-8 h-8 rounded-lg bg-blue-500/20 flex items-center justify-center">
                <Activity className="w-4 h-4 text-blue-400" />
              </div>
              <h3 className="font-bold text-blue-400">NOW — {loc}</h3>
              <div className="ml-auto flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full bg-blue-400 animate-pulse" />
                <span className="text-xs text-blue-400">LIVE</span>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              {[["Activity", "82%", TrendingUp], ["Growth", "High", Building2], ["Culture", "Strong", Star]].map(([label, value, Icon]) => (
                <div key={label as string} className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4 text-center">
                  {React.createElement(Icon as React.ElementType, { className: "w-5 h-5 text-blue-400 mx-auto mb-2" })}
                  <div className="text-lg font-bold text-white">{value as string}</div>
                  <div className="text-xs text-white/40 mt-1">{label as string}</div>
                </div>
              ))}
            </div>
          </GlassCard>
        )}

        {/* ── FUTURE SIMULATION ── */}
        {year > 2026 && (
          <GlassCard className="p-6 border-violet-500/20">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-violet-500/20 flex items-center justify-center">
                  <Brain className="w-4 h-4 text-violet-400" />
                </div>
                <h3 className="font-bold text-violet-400">🔮 Future Prediction — {year}</h3>
              </div>
              <button onClick={generateFuture} disabled={!location || loadingFuture}
                className="flex items-center gap-2 px-4 py-2 bg-violet-500/20 border border-violet-500/40 rounded-lg text-violet-400 text-sm hover:bg-violet-500/30 transition-all disabled:opacity-40">
                {loadingFuture ? <Loader2 className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />}
                {loadingFuture ? "Simulating..." : "Simulate"}
              </button>
            </div>
            {futureData ? (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
                <p className="text-white/70 text-sm italic border-l-2 border-violet-500 pl-3">{futureData.summary}</p>
                <div className="space-y-3">
                  {[["Infrastructure ↑", futureData.infrastructure, "violet"], ["Population ↑", futureData.population, "violet"], ["Technology ↑", futureData.technology, "violet"]].map(([label, val, _]) => (
                    <div key={label as string}>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-white/70">{label as string}</span>
                        <span className="text-violet-400 font-semibold">{val as number}%</span>
                      </div>
                      <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                        <motion.div initial={{ width: 0 }} animate={{ width: `${val as number}%` }}
                          transition={{ duration: 0.8 }}
                          className="h-full bg-gradient-to-r from-violet-500 to-purple-400 rounded-full" />
                      </div>
                    </div>
                  ))}
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <div className="w-2 h-2 rounded-full bg-green-400" />
                  <span className="text-white/50">Confidence:</span>
                  <span className="text-green-400 font-bold">{futureData.confidence}%</span>
                </div>
              </motion.div>
            ) : (
              <div className="text-center py-6 text-white/30 text-sm">
                {location ? "Click Simulate to generate AI future predictions" : "Select a location first"}
              </div>
            )}
          </GlassCard>
        )}

        {/* ── BEFORE vs AFTER ── */}
        <GlassCard className="p-6">
          <div className="flex items-center justify-between mb-5">
            <h3 className="font-bold text-lg flex items-center gap-2">
              <span className="text-amber-400">Before</span>
              <ArrowRight className="w-4 h-4 text-white/30" />
              <span className="text-blue-400">After</span>
              <span className="text-white/30 text-sm font-normal ml-1">Comparison ⭐</span>
            </h3>
            <button onClick={generateBeforeAfter} disabled={!location || loadingBA}
              className="flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-sm text-white/60 hover:text-white hover:border-white/20 transition-all disabled:opacity-40">
              {loadingBA ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
              {loadingBA ? "Comparing..." : "Generate"}
            </button>
          </div>
          {beforeAfterText ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-amber-500/5 border border-amber-500/30 rounded-xl p-5">
                <div className="text-xs font-bold text-amber-400 tracking-widest mb-3">◀ PAST (~1970)</div>
                <p className="text-white/70 text-sm leading-relaxed">{beforeAfterText.before}</p>
              </div>
              <div className="bg-blue-500/5 border border-blue-500/30 rounded-xl p-5">
                <div className="text-xs font-bold text-blue-400 tracking-widest mb-3">▶ NOW (2024)</div>
                <p className="text-white/70 text-sm leading-relaxed">{beforeAfterText.after}</p>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-amber-500/5 border border-amber-500/20 rounded-xl p-5 text-center text-white/30 text-sm">
                Old Market → Traditional Area
              </div>
              <div className="bg-blue-500/5 border border-blue-500/20 rounded-xl p-5 text-center text-white/30 text-sm">
                Modern Commercial Zone
              </div>
            </div>
          )}
        </GlassCard>

        {/* ── HISTORICAL EVENTS ── */}
        <GlassCard className="p-6">
          <div className="flex items-center justify-between mb-5">
            <h3 className="font-bold text-lg">📍 Historical Events Layer</h3>
            <button onClick={generateEvents} disabled={!location || loadingEvents}
              className="flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-sm text-white/60 hover:text-white hover:border-white/20 transition-all disabled:opacity-40">
              {loadingEvents ? <Loader2 className="w-4 h-4 animate-spin" /> : <Globe2 className="w-4 h-4" />}
              {loadingEvents ? "Loading..." : "Load Events"}
            </button>
          </div>
          {events.length > 0 ? (
            <div className="relative">
              <div className="absolute left-4 top-0 bottom-0 w-px bg-gradient-to-b from-amber-500/50 via-blue-500/50 to-violet-500/50" />
              <div className="space-y-4">
                {events.map((ev, i) => {
                  const ec = getYearColor(ev.year);
                  const typeColors: Record<string, string> = { development: "text-blue-400", culture: "text-pink-400", infrastructure: "text-orange-400", milestone: "text-green-400" };
                  return (
                    <motion.div key={i} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.1 }} className="flex gap-5 pl-10 relative">
                      <div className={`absolute left-2.5 top-3 w-3 h-3 rounded-full border-2 border-current ${ec.text} bg-black`} />
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className={`text-xs font-bold ${ec.text}`}>{ev.year}</span>
                          <span className={`text-xs ${typeColors[ev.type] ?? "text-white/40"} capitalize`}>{ev.type}</span>
                        </div>
                        <div className="font-semibold text-white text-sm">{ev.title}</div>
                        <p className="text-white/50 text-xs mt-0.5">{ev.description}</p>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              {[["1975", "Major City Development", "↓"], ["2010", "Infrastructure Change", "↓"]].map(([y, t, arrow]) => (
                <div key={y} className="flex items-center gap-3 px-4 py-3 bg-white/3 border border-white/5 rounded-lg">
                  <span className="text-amber-400 text-sm font-bold w-12">{y}</span>
                  <span className="text-white/50 text-sm">{t}</span>
                  <span className="text-white/20 ml-auto">{arrow}</span>
                </div>
              ))}
              <p className="text-center text-white/30 text-sm pt-2">{location ? "Click Load Events to generate historical milestones" : "Select a location first"}</p>
            </div>
          )}
        </GlassCard>

        {/* ── A DAY IN DIFFERENT YEARS ── */}
        <GlassCard className="p-6">
          <h3 className="font-bold text-lg mb-5">🕐 A Day in Different Years</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div>
              <label className="text-xs text-white/40 mb-2 block">Year</label>
              <input type="number" min={1900} max={2024} value={dayYear}
                onChange={e => setDayYear(Number(e.target.value))}
                className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-amber-500/50" />
            </div>
            <div>
              <label className="text-xs text-white/40 mb-2 block">Time</label>
              <select value={dayTime} onChange={e => setDayTime(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-white focus:outline-none appearance-none">
                {TIMES.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div className="flex items-end">
              <button onClick={generateDayStory} disabled={!location || loadingDay}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-amber-500/20 to-orange-500/20 border border-amber-500/40 rounded-lg text-amber-400 hover:brightness-110 transition-all disabled:opacity-40">
                {loadingDay ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
                {loadingDay ? "Generating..." : "Experience It"}
              </button>
            </div>
          </div>
          {dayStory && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
              className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
              {[["Transport", "🚌"], ["Lifestyle", "🏘"], ["Crowd", "👥"]].map(([label, icon]) => (
                <div key={label} className="bg-white/5 border border-white/10 rounded-xl p-4 text-center">
                  <div className="text-2xl mb-1">{icon}</div>
                  <div className="text-xs text-white/40">{label}</div>
                </div>
              ))}
            </motion.div>
          )}
          {dayStory && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              className="bg-amber-500/5 border border-amber-500/20 rounded-xl p-4">
              <p className="text-white/80 text-sm leading-relaxed italic">"{dayStory}"</p>
            </motion.div>
          )}
          {!dayStory && (
            <div className="text-center text-white/30 text-sm py-4">
              {location ? "Pick a year and time, then click Experience It" : "Select a location first"}
            </div>
          )}
        </GlassCard>

        {/* ── EVOLUTION SCORE ── */}
        <GlassCard className="p-6">
          <div className="flex items-center justify-between mb-5">
            <h3 className="font-bold text-lg">🏆 City Evolution Score</h3>
            <button onClick={generateEvolution} disabled={!location || loadingEvolution}
              className="flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-sm text-white/60 hover:text-white transition-all disabled:opacity-40">
              {loadingEvolution ? <Loader2 className="w-4 h-4 animate-spin" /> : <TrendingUp className="w-4 h-4" />}
              {loadingEvolution ? "Scoring..." : "Score"}
            </button>
          </div>
          {evolutionScore ? (
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="space-y-4">
              <div className="text-center py-4">
                <div className="text-7xl font-black text-transparent bg-clip-text bg-gradient-to-br from-amber-400 to-violet-400">{evolutionScore.total}</div>
                <div className="text-white/40 text-sm">/100 Evolution Score</div>
                <p className="text-white/60 text-sm mt-2 italic">{evolutionScore.summary}</p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {[["Growth", evolutionScore.growth, "from-amber-500 to-orange-400"], ["Culture", evolutionScore.culture, "from-pink-500 to-rose-400"], ["Technology", evolutionScore.technology, "from-blue-500 to-cyan-400"], ["Connectivity", evolutionScore.connectivity, "from-violet-500 to-purple-400"]].map(([label, val, grad]) => (
                  <div key={label as string} className="bg-white/3 border border-white/5 rounded-xl p-4">
                    <div className="flex justify-between text-sm mb-2">
                      <span className="text-white/60">{label as string}</span>
                      <span className="font-bold">{val as number}</span>
                    </div>
                    <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                      <motion.div initial={{ width: 0 }} animate={{ width: `${val as number}%` }} transition={{ duration: 0.8 }}
                        className={`h-full bg-gradient-to-r ${grad as string} rounded-full`} />
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          ) : (
            <div className="text-center py-8">
              <div className="text-5xl font-black text-white/10 mb-2">?/100</div>
              <p className="text-white/30 text-sm">{location ? "Click Score to analyze city evolution" : "Select a location first"}</p>
            </div>
          )}
        </GlassCard>

        {/* ── CHANGE REASONS ── */}
        <GlassCard className="p-6">
          <div className="flex items-center justify-between mb-5">
            <h3 className="font-bold text-lg">🔍 Why Did It Change?</h3>
            <button onClick={generateReasons} disabled={!location || loadingReasons}
              className="flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-sm text-white/60 hover:text-white transition-all disabled:opacity-40">
              {loadingReasons ? <Loader2 className="w-4 h-4 animate-spin" /> : <Brain className="w-4 h-4" />}
              {loadingReasons ? "Analyzing..." : "Analyze"}
            </button>
          </div>
          {changeReasons.length > 0 ? (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-2">
              {changeReasons.map((r, i) => (
                <motion.div key={i} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.08 }}
                  className="flex items-center gap-3 px-4 py-3 bg-white/3 border border-white/5 rounded-lg">
                  <span className="w-6 h-6 rounded-full bg-gradient-to-br from-amber-500/30 to-violet-500/30 flex items-center justify-center text-xs font-bold text-white/60">{i + 1}</span>
                  <span className="text-white/70 text-sm">✓ {r}</span>
                </motion.div>
              ))}
            </motion.div>
          ) : (
            <div className="space-y-2">
              {["Population", "Economy", "Transport", "Technology"].map(r => (
                <div key={r} className="flex items-center gap-3 px-4 py-3 bg-white/3 border border-white/5 rounded-lg opacity-30">
                  <span className="text-sm text-white/50">✓ {r}</span>
                </div>
              ))}
              <p className="text-center text-white/30 text-xs pt-1">{location ? "Click Analyze to discover why it changed" : "Select a location first"}</p>
            </div>
          )}
        </GlassCard>

        {/* ── INDIA EVOLUTION MODE ── */}
        <GlassCard className={`p-6 ${indiaMode ? "border-orange-500/30" : ""}`}>
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-lg flex items-center gap-2">🇮🇳 India Evolution Mode</h3>
            <button onClick={() => setIndiaMode(v => !v)}
              className={`px-4 py-2 rounded-lg text-sm border transition-all ${indiaMode ? "bg-orange-500/20 border-orange-500/40 text-orange-400" : "bg-white/5 border-white/10 text-white/50 hover:text-white"}`}>
              {indiaMode ? "Active" : "Activate"}
            </button>
          </div>
          {indiaMode && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-white/40 mb-2 block">City</label>
                  <select value={indiaCity} onChange={e => setIndiaCity(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-white focus:outline-none">
                    {INDIA_CITIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div className="flex items-end">
                  <button onClick={generateIndia} disabled={loadingIndia}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-orange-500/20 border border-orange-500/40 rounded-lg text-orange-400 hover:brightness-110 transition-all disabled:opacity-40">
                    {loadingIndia ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                    {loadingIndia ? "Loading..." : "Explore"}
                  </button>
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                <span className="px-3 py-1.5 rounded-full bg-orange-500/10 border border-orange-500/20 text-orange-400 text-xs">Tradition</span>
                <span className="text-white/20 self-center">+</span>
                <span className="px-3 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs">Modern Growth</span>
              </div>
              {indiaStory && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                  className="bg-orange-500/5 border border-orange-500/20 rounded-xl p-4">
                  <p className="text-white/80 text-sm leading-relaxed">{indiaStory}</p>
                </motion.div>
              )}
            </motion.div>
          )}
          {!indiaMode && (
            <p className="text-white/30 text-sm">Explore India's old cities, heritage areas and modern transformation.</p>
          )}
        </GlassCard>

        {/* ── COMPARE TWO TIMES ── */}
        <GlassCard className="p-6">
          <div className="flex items-center justify-between mb-5">
            <h3 className="font-bold text-lg flex items-center gap-2">
              <span className="text-amber-400">{year}</span>
              <span className="text-white/30 text-sm">vs</span>
              <span className="text-blue-400">{compareYear}</span>
            </h3>
            <button onClick={() => setCompareMode(v => !v)}
              className={`px-3 py-1.5 text-xs rounded-lg border transition-all ${compareMode ? "bg-primary/20 border-primary/40 text-primary" : "bg-white/5 border-white/10 text-white/50 hover:text-white"}`}>
              {compareMode ? "Close" : "Compare"}
            </button>
          </div>
          {compareMode && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
              <div>
                <label className="text-xs text-white/40 mb-2 block">Compare Year</label>
                <input type="range" min={1900} max={2075} value={compareYear}
                  onChange={e => setCompareYear(Number(e.target.value))}
                  className="w-full" />
                <div className={`text-center text-2xl font-black mt-1 ${yc2.text}`}>{compareYear}</div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                {[["Activity", "Traffic", "Culture", "Lifestyle"].map((m, i) => ({ metric: m, val1: 30 + i * 15, val2: 50 + i * 12 }))].flat().map(({ metric, val1, val2 }) => (
                  <div key={metric} className="bg-white/3 border border-white/5 rounded-xl p-4">
                    <div className="text-xs text-white/40 mb-2">{metric}</div>
                    <div className="space-y-1.5">
                      <div>
                        <div className="flex justify-between text-xs mb-1">
                          <span className={yc.text}>{year}</span>
                          <span className={yc.text}>{val1}%</span>
                        </div>
                        <div className="h-1 bg-white/5 rounded-full">
                          <div className="h-full bg-amber-500 rounded-full" style={{ width: `${val1}%` }} />
                        </div>
                      </div>
                      <div>
                        <div className="flex justify-between text-xs mb-1">
                          <span className={yc2.text}>{compareYear}</span>
                          <span className={yc2.text}>{val2}%</span>
                        </div>
                        <div className="h-1 bg-white/5 rounded-full">
                          <div className="h-full bg-blue-500 rounded-full" style={{ width: `${val2}%` }} />
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}
          {!compareMode && (
            <p className="text-white/30 text-sm">Compare {loc} across two different time periods side by side.</p>
          )}
        </GlassCard>

        {/* ── AI QUESTIONS ── */}
        <GlassCard className="p-6">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center">
              <MessageSquare className="w-4 h-4 text-primary" />
            </div>
            <h3 className="font-bold text-lg">✨ Ask Time AI</h3>
          </div>
          <div className="space-y-3">
            <div className="flex gap-3">
              <input value={aiQuestion} onChange={e => setAiQuestion(e.target.value)}
                onKeyDown={e => e.key === "Enter" && askQuestion()}
                placeholder="How did this area change? What was here before? Will it grow?"
                className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-white/30 focus:outline-none focus:border-primary/50 transition-colors" />
              <button onClick={askQuestion} disabled={!aiQuestion.trim() || loadingQA}
                className="px-5 py-3 bg-primary/20 border border-primary/40 rounded-xl text-primary hover:bg-primary/30 transition-all disabled:opacity-40">
                {loadingQA ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {["How did this area change?", "What was here before?", "Will it grow?"].map(q => (
                <button key={q} onClick={() => setAiQuestion(q)}
                  className="text-xs px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-white/40 hover:text-white hover:border-primary/30 transition-all">
                  {q}
                </button>
              ))}
            </div>
            <AnimatePresence>
              {aiAnswer && (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                  className="bg-primary/5 border border-primary/20 rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                    <span className="text-xs text-primary font-bold">Time AI</span>
                  </div>
                  <p className="text-white/80 text-sm leading-relaxed">{aiAnswer}</p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </GlassCard>

        {/* ── SAVE JOURNEYS ── */}
        <GlassCard className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-lg flex items-center gap-2">
              <Bookmark className="w-5 h-5 text-primary" /> My Time Journeys
            </h3>
            <div className="flex gap-2">
              <button onClick={saveJourney} disabled={!location}
                className="flex items-center gap-2 px-4 py-2 bg-primary/20 border border-primary/40 rounded-lg text-sm text-primary hover:bg-primary/30 transition-all disabled:opacity-40">
                <Bookmark className="w-4 h-4" /> Save Current
              </button>
              <button onClick={() => setShowSaved(v => !v)}
                className="p-2 bg-white/5 border border-white/10 rounded-lg text-white/50 hover:text-white transition-all">
                {showSaved ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </button>
            </div>
          </div>
          {showSaved && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              {savedJourneys.length > 0 ? (
                <div className="space-y-2">
                  {savedJourneys.map(j => {
                    const jc = getYearColor(j.year);
                    return (
                      <div key={j.id} className="flex items-center gap-4 px-4 py-3 bg-white/3 border border-white/5 rounded-xl">
                        <div className={`w-10 h-10 rounded-lg ${jc.bg} border ${jc.border} flex items-center justify-center`}>
                          <Clock className={`w-5 h-5 ${jc.text}`} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="font-semibold text-sm">{j.title}</div>
                          <div className="text-xs text-white/40 truncate">{j.note}</div>
                        </div>
                        <div className="text-xs text-white/30">{j.savedAt}</div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-6 text-white/30 text-sm">
                  <Bookmark className="w-8 h-8 mx-auto mb-2 opacity-30" />
                  <p>No journeys saved yet. Explore a place and save it!</p>
                </div>
              )}
            </motion.div>
          )}
        </GlassCard>

        {/* ── TIMELINE HEATMAP ── */}
        <GlassCard className="p-6">
          <h3 className="font-bold text-lg mb-4">🌡 Timeline Heatmap</h3>
          <div className="space-y-3">
            {[["1900–1950", "Old Era", 15, "amber"], ["1950–1990", "Growth Era", 35, "orange"], ["1990–2010", "Expansion", 60, "blue"], ["2010–2026", "Modern Era", 82, "cyan"], ["2026+", "Future Zone", 92, "violet"]].map(([era, label, val, color]) => (
              <div key={era as string} className="flex items-center gap-4">
                <div className="w-24 text-xs text-white/40 text-right">{era as string}</div>
                <div className="flex-1 relative h-8 bg-white/3 rounded-lg overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }} animate={{ width: `${val as number}%` }} transition={{ duration: 0.8, delay: 0.1 }}
                    className={`h-full bg-${color as string}-500/40 rounded-lg flex items-center px-3`}>
                    <span className="text-xs text-white/60">{label as string}</span>
                  </motion.div>
                </div>
                <div className="w-10 text-xs text-white/40 text-right">{val as number}%</div>
              </div>
            ))}
          </div>
        </GlassCard>

      </div>
    </div>
  );
}
