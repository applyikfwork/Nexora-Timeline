import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAppContext } from "@/lib/store";
import {
  Users, MapPin, Loader2, RefreshCw, Bot, X, Send,
  Minus, Clock, Star, BookmarkPlus, BookmarkCheck,
  Zap, BarChart3, ArrowUp, ArrowDown, ChevronRight,
} from "lucide-react";

// ── Types ───────────────────────────────────────────────────────────────────
interface HourlySlot { hour: string; level: number; label: string }
interface DayPeriod { level: number; label: string; note: string }
interface Prediction { direction: string; level: number; reason: string }
interface BestTime { window: string; crowdLevel: number; label: string }
interface HeatZone { zone: string; crowdLevel: number; status: string; peakTime: string; advice: string }
interface CrowdPersonalityType { label: string; pct: number; emoji: string }

interface CrowdData {
  locationName: string; locationType: string;
  currentCrowd: number; crowdStatus: string; crowdStatusColor: string;
  crowdPersonality: { dominant: string; types: CrowdPersonalityType[] };
  hourlyTimeline: HourlySlot[];
  dailyPattern: { morning: DayPeriod; afternoon: DayPeriod; evening: DayPeriod; night: DayPeriod };
  prediction: { next1h: Prediction; next3h: Prediction; tonight: Prediction; confidence: number };
  crowdReasons: { reason: string; impact: string; emoji: string }[];
  bestTimes: BestTime[];
  worstTimes: BestTime[];
  heatZones: HeatZone[];
  indiaContext: { festivalImpact: string; festivalNote: string; specialFactors: string[] };
  eventNearby: { detected: boolean; eventType: string | null; distanceKm: number; crowdImpact: string };
  aiSummary: string;
  generatedAt: string;
}
interface CompareResult {
  loc1: { name: string; currentCrowd: number; status: string; statusColor: string; peakHour: string; bestVisit: string; crowdType: string; advantage: string };
  loc2: { name: string; currentCrowd: number; status: string; statusColor: string; peakHour: string; bestVisit: string; crowdType: string; advantage: string };
  recommendation: string; winner: string;
}
interface SavedPlace { id: string; locationName: string; category: string }

// ── Config ──────────────────────────────────────────────────────────────────
const STATUS_COLORS: Record<string, string> = { green: "#00b894", yellow: "#fdcb6e", orange: "#e17055", red: "#d63031" };
const STATUS_LABELS: Record<string, string> = { Calm: "🟢 Calm", Moderate: "🟡 Moderate", Busy: "🟠 Busy", "Very Crowded": "🔴 Very Crowded" };
const FESTIVAL_COLOR: Record<string, string> = { None: "#00b894", Low: "#74b9ff", Medium: "#fdcb6e", High: "#e17055", "Very High": "#d63031" };
const SAMPLE_PLACES = ["Chandni Chowk", "Lal Bagh Bengaluru", "Gateway of India", "Amber Fort Jaipur", "Varanasi Ghats", "Mysore Palace", "Colaba Causeway", "Janpath Market", "Lotus Temple Delhi", "Sarojini Nagar"];
const CHAT_STARTERS = ["Should I go now?", "When is less crowded?", "Which area is quieter?", "Best time tomorrow?"];
const SAVE_CATEGORIES = [
  { id: "home", label: "🏠 Home Area" },
  { id: "work", label: "💼 Work" },
  { id: "travel", label: "✈️ Travel" },
  { id: "favorite", label: "⭐ Favourite" },
];

function crowdColor(level: number) {
  if (level >= 80) return "#d63031";
  if (level >= 60) return "#e17055";
  if (level >= 40) return "#fdcb6e";
  return "#00b894";
}

function DirIcon({ d }: { d: string }) {
  if (d === "rising") return <ArrowUp className="w-3.5 h-3.5 text-red-400" />;
  if (d === "falling") return <ArrowDown className="w-3.5 h-3.5 text-green-400" />;
  return <Minus className="w-3.5 h-3.5 text-white/30" />;
}

function AnimCount({ target, color }: { target: number; color: string }) {
  const [v, setV] = useState(0);
  useEffect(() => {
    let c = 0;
    const step = Math.max(1, Math.ceil(target / 35));
    const t = setInterval(() => { c = Math.min(c + step, target); setV(c); if (c >= target) clearInterval(t); }, 18);
    return () => clearInterval(t);
  }, [target]);
  return <span className="text-5xl font-black tabular-nums" style={{ color }}>{v}</span>;
}

function CrowdBar({ level, color, animated = true, h = "h-2" }: { level: number; color: string; animated?: boolean; h?: string }) {
  return (
    <div className={`${h} rounded-full overflow-hidden w-full`} style={{ background: "rgba(255,255,255,0.07)" }}>
      {animated
        ? <motion.div className="h-full rounded-full" style={{ background: color }} initial={{ width: 0 }} animate={{ width: `${level}%` }} transition={{ duration: 0.8 }} />
        : <div className="h-full rounded-full" style={{ background: color, width: `${level}%` }} />}
    </div>
  );
}

// ── Component ───────────────────────────────────────────────────────────────
export default function CrowdForecast() {
  const { activePlaceName } = useAppContext();
  const [searchInput, setSearchInput] = useState("");
  const [currentPlace, setCurrentPlace] = useState("");
  const [forecast, setForecast] = useState<CrowdData | null>(null);
  const [loading, setLoading] = useState(false);
  const [dots, setDots] = useState<{ x: number; y: number; id: number; color: string }[]>([]);

  const [cmp1, setCmp1] = useState("");
  const [cmp2, setCmp2] = useState("");
  const [cmpResult, setCmpResult] = useState<CompareResult | null>(null);
  const [cmpLoading, setCmpLoading] = useState(false);

  const [saved, setSaved] = useState<SavedPlace[]>([]);
  const [isSaved, setIsSaved] = useState(false);
  const [saveCategory, setSaveCategory] = useState("favorite");
  const [activeZone, setActiveZone] = useState<HeatZone | null>(null);

  const [chatOpen, setChatOpen] = useState(false);
  const [chatInput, setChatInput] = useState("");
  const [chatLoading, setChatLoading] = useState(false);
  const [chatMsgs, setChatMsgs] = useState<{ role: "user" | "ai"; text: string }[]>([
    { role: "ai", text: "👥 Crowd Forecast active! Search any market, temple, mall, street, or city — I'll predict crowd levels, best visit times, and why it's busy. Ask me anything!" },
  ]);
  const chatEndRef = useRef<HTMLDivElement>(null);

  /* Pre-fill search with global city when page loads and nothing typed */
  useEffect(() => {
    if (activePlaceName && !searchInput) setSearchInput(activePlaceName);
  }, [activePlaceName]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => { loadSaved(); }, []);
  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [chatMsgs]);
  useEffect(() => {
    if (!currentPlace || !saved.length) { setIsSaved(false); return; }
    setIsSaved(saved.some(s => s.locationName.toLowerCase() === currentPlace.toLowerCase()));
  }, [currentPlace, saved]);
  useEffect(() => {
    if (!forecast) return;
    const c = forecast.currentCrowd;
    const col = c >= 80 ? "#d63031" : c >= 60 ? "#e17055" : c >= 40 ? "#fdcb6e" : "#00b894";
    setDots(Array.from({ length: Math.ceil(c / 8) }, (_, i) => ({ id: i, x: 5 + Math.random() * 90, y: 5 + Math.random() * 90, color: col })));
  }, [forecast]);

  async function loadSaved() {
    try { const r = await fetch("/api/crowd/saved"); const d = await r.json(); setSaved(d.saved || []); } catch { /* ok */ }
  }

  async function getForecast(place: string) {
    if (!place.trim()) return;
    setCurrentPlace(place.trim()); setForecast(null); setActiveZone(null); setLoading(true);
    try {
      const r = await fetch("/api/crowd/forecast", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ locationName: place.trim() }) });
      setForecast(await r.json());
    } finally { setLoading(false); }
  }

  async function runCompare() {
    if (!cmp1.trim() || !cmp2.trim()) return;
    setCmpLoading(true); setCmpResult(null);
    try {
      const r = await fetch("/api/crowd/compare", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ location1: cmp1.trim(), location2: cmp2.trim() }) });
      setCmpResult(await r.json());
    } finally { setCmpLoading(false); }
  }

  async function toggleSave() {
    if (!currentPlace) return;
    if (isSaved) {
      const s = saved.find(p => p.locationName.toLowerCase() === currentPlace.toLowerCase());
      if (s) { await fetch(`/api/crowd/saved/${s.id}`, { method: "DELETE" }); setSaved(p => p.filter(x => x.id !== s.id)); }
      setIsSaved(false);
    } else {
      const r = await fetch("/api/crowd/saved", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ locationName: currentPlace, category: saveCategory }) });
      const d = await r.json();
      setSaved(p => [...p, d]); setIsSaved(true);
    }
  }

  async function sendChat() {
    if (!chatInput.trim() || chatLoading) return;
    const msg = chatInput.trim(); setChatInput("");
    setChatMsgs(m => [...m, { role: "user", text: msg }]);
    setChatLoading(true);
    try {
      const r = await fetch("/api/reporter/chat", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ message: msg, cityName: currentPlace || undefined }) });
      const d = await r.json();
      setChatMsgs(m => [...m, { role: "ai", text: d.reply }]);
    } finally { setChatLoading(false); }
  }

  const cc = forecast ? crowdColor(forecast.currentCrowd) : "#e17055";
  const currentHour = new Date().getHours();

  return (
    <div className="min-h-screen pb-32" style={{ background: "linear-gradient(135deg, #0a0a1a 0%, #0d0a18 60%, #0a0d1a 100%)" }}>

      {/* ── HERO ──────────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden" style={{ minHeight: 280 }}>
        <div className="absolute inset-0 pointer-events-none">
          {[0, 1, 2].map(i => (
            <motion.div key={i} className="absolute rounded-full"
              style={{ width: 500 + i * 200, height: 500 + i * 200, left: "50%", top: "50%", marginLeft: -(250 + i * 100), marginTop: -(250 + i * 100), border: `1px solid rgba(229,112,85,${0.05 - i * 0.01})` }}
              animate={{ scale: [1, 1.04, 1], opacity: [0.3, 0.7, 0.3] }}
              transition={{ duration: 3 + i, repeat: Infinity, delay: i * 0.6 }} />
          ))}
          {[...Array(22)].map((_, i) => (
            <motion.div key={i} className="absolute rounded-full"
              style={{ width: i % 5 === 0 ? 4 : 2, height: i % 5 === 0 ? 4 : 2, background: i % 4 === 0 ? "#e17055" : i % 4 === 1 ? "#fdcb6e" : i % 4 === 2 ? "#74b9ff" : "#00b894", opacity: 0.3, left: `${(i * 4.7) % 100}%`, top: `${(i * 7.1) % 90}%` }}
              animate={{ x: [0, i % 2 === 0 ? 28 : -28, 0], y: [0, i % 3 === 0 ? 16 : -12, 0], opacity: [0.15, 0.55, 0.15] }}
              transition={{ duration: 3 + (i % 4), repeat: Infinity, delay: (i * 0.28) % 3 }} />
          ))}
        </div>
        <div className="relative z-10 px-6 pt-10 pb-6 max-w-6xl mx-auto">
          <div className="flex items-center gap-4 mb-5">
            <motion.div className="w-16 h-16 rounded-2xl flex items-center justify-center text-3xl border"
              style={{ background: "rgba(229,112,85,0.12)", borderColor: "rgba(229,112,85,0.4)" }}
              animate={{ boxShadow: ["0 0 20px rgba(229,112,85,0.2)", "0 0 45px rgba(229,112,85,0.5)", "0 0 20px rgba(229,112,85,0.2)"] }}
              transition={{ duration: 2.5, repeat: Infinity }}>👥</motion.div>
            <div>
              <h1 className="text-4xl md:text-5xl font-black text-white">Crowd Forecast</h1>
              <p className="text-white/50 mt-1">AI predicts how people move around your world.</p>
            </div>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { icon: "📍", label: "Places Analysed", val: saved.length || "Any", color: "#74b9ff" },
              { icon: "👥", label: "Live Movement", val: "AI tracked", color: "#e17055" },
              { icon: "🔮", label: "Predictions", val: "Hourly", color: "#a29bfe" },
              { icon: "🌍", label: "Any Location", val: "India-first", color: "#00b894" },
            ].map((s, i) => (
              <motion.div key={s.label} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}
                className="rounded-2xl p-4 border" style={{ background: "rgba(255,255,255,0.03)", borderColor: "rgba(255,255,255,0.06)" }}>
                <div className="text-xl mb-1">{s.icon}</div>
                <div className="font-black text-sm" style={{ color: s.color }}>{s.val}</div>
                <div className="text-xs text-white/30 mt-0.5">{s.label}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <div className="max-w-6xl mx-auto px-4 space-y-5">

        {/* ── SEARCH ─────────────────────────────────────────────────── */}
        <section>
          <div className="rounded-3xl border overflow-hidden" style={{ background: "rgba(255,255,255,0.025)", borderColor: "rgba(229,112,85,0.3)" }}>
            <div className="flex items-center gap-3 px-5 py-4">
              <motion.div animate={{ scale: [1, 1.2, 1] }} transition={{ duration: 1.8, repeat: Infinity }}>
                <Users className="w-5 h-5 text-orange-400 flex-shrink-0" />
              </motion.div>
              <input value={searchInput} onChange={e => setSearchInput(e.target.value)}
                onKeyDown={e => e.key === "Enter" && getForecast(searchInput)}
                placeholder="Search any market, temple, mall, street, city, landmark..."
                className="flex-1 bg-transparent text-white placeholder-white/30 text-lg outline-none" />
              {loading && <Loader2 className="w-5 h-5 animate-spin text-orange-400 flex-shrink-0" />}
              {!loading && searchInput && (
                <button onClick={() => getForecast(searchInput)}
                  className="px-5 py-2 rounded-xl font-bold text-sm"
                  style={{ background: "rgba(229,112,85,0.15)", color: "#e17055", border: "1px solid rgba(229,112,85,0.4)" }}>
                  Forecast →
                </button>
              )}
              {forecast && !loading && (
                <button onClick={() => getForecast(currentPlace)} className="p-2 rounded-xl border text-white/40 hover:text-white" style={{ borderColor: "rgba(255,255,255,0.1)" }}>
                  <RefreshCw className="w-4 h-4" />
                </button>
              )}
            </div>
            <div className="px-5 pb-4 flex flex-wrap gap-2">
              {SAMPLE_PLACES.map(p => (
                <button key={p} onClick={() => { setSearchInput(p); getForecast(p); }}
                  className="px-3 py-1.5 rounded-full text-xs border transition-all hover:border-orange-400/40 hover:text-orange-300 text-white/40"
                  style={{ background: "rgba(255,255,255,0.03)", borderColor: "rgba(255,255,255,0.07)" }}>
                  {p}
                </button>
              ))}
            </div>
          </div>
        </section>

        {/* ── LOADING ─────────────────────────────────────────────────── */}
        <AnimatePresence>
          {loading && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="text-center py-12">
              <div className="relative w-16 h-16 mx-auto mb-4">
                {[0, 1, 2].map(i => (
                  <motion.div key={i} className="absolute inset-0 rounded-full border-2 border-orange-400"
                    animate={{ scale: [1, 2, 2], opacity: [0.6, 0, 0] }}
                    transition={{ duration: 1.4, repeat: Infinity, delay: i * 0.46 }} />
                ))}
                <div className="absolute inset-0 flex items-center justify-center">
                  <Users className="w-8 h-8 text-orange-400" />
                </div>
              </div>
              <p className="text-white/50">AI predicting crowd for <span className="text-orange-400 font-medium">{currentPlace}</span>...</p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── MAIN FORECAST ────────────────────────────────────────────── */}
        {forecast && !loading && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-5">
            <div className="rounded-3xl border overflow-hidden" style={{ background: "linear-gradient(135deg, rgba(229,112,85,0.07), rgba(116,185,255,0.03))", borderColor: `${cc}44` }}>
              <div className="p-6">

                {/* Header */}
                <div className="flex items-start justify-between flex-wrap gap-4 mb-5">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <MapPin className="w-4 h-4 text-orange-400" />
                      <span className="text-xs px-2 py-0.5 rounded-full font-medium" style={{ background: "rgba(229,112,85,0.12)", color: "#e17055" }}>{forecast.locationType}</span>
                    </div>
                    <h2 className="text-3xl font-black text-white">{forecast.locationName}</h2>
                    <p className="text-white/50 mt-1 text-sm italic">{forecast.aiSummary}</p>
                  </div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <select value={saveCategory} onChange={e => setSaveCategory(e.target.value)}
                      className="text-xs rounded-xl border px-2 py-1.5 outline-none"
                      style={{ background: "rgba(255,255,255,0.05)", borderColor: "rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.6)" }}>
                      {SAVE_CATEGORIES.map(c => <option key={c.id} value={c.id}>{c.label}</option>)}
                    </select>
                    <button onClick={toggleSave}
                      className="flex items-center gap-2 px-4 py-2 rounded-xl border text-sm font-medium"
                      style={{ background: isSaved ? "rgba(0,184,148,0.15)" : "rgba(255,255,255,0.05)", borderColor: isSaved ? "rgba(0,184,148,0.4)" : "rgba(255,255,255,0.1)", color: isSaved ? "#00b894" : "rgba(255,255,255,0.5)" }}>
                      {isSaved ? <BookmarkCheck className="w-4 h-4" /> : <BookmarkPlus className="w-4 h-4" />}
                      {isSaved ? "Saved" : "Save"}
                    </button>
                  </div>
                </div>

                {/* Top 3-col grid */}
                <div className="grid md:grid-cols-3 gap-5 mb-5">
                  {/* Animated score + dots */}
                  <div className="relative flex flex-col items-center justify-center rounded-2xl py-6 overflow-hidden" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)" }}>
                    <div className="absolute inset-0 overflow-hidden">
                      {dots.map(d => (
                        <motion.div key={d.id} className="absolute w-1.5 h-1.5 rounded-full"
                          style={{ background: d.color, opacity: 0.22, left: `${d.x}%`, top: `${d.y}%` }}
                          animate={{ x: [0, 8 - Math.random() * 16, 0], y: [0, 8 - Math.random() * 16, 0] }}
                          transition={{ duration: 2.5 + Math.random() * 2, repeat: Infinity }} />
                      ))}
                    </div>
                    <div className="relative z-10 text-center">
                      <div className="text-xs text-white/40 uppercase tracking-widest mb-2">Current Crowd</div>
                      <AnimCount target={forecast.currentCrowd} color={cc} />
                      <div className="text-white/30 text-sm mt-1">/ 100</div>
                      <div className="mt-2 px-3 py-1 rounded-full text-xs font-bold" style={{ background: `${cc}18`, color: cc }}>
                        {STATUS_LABELS[forecast.crowdStatus] || forecast.crowdStatus}
                      </div>
                    </div>
                  </div>

                  {/* Crowd personality */}
                  <div className="rounded-2xl p-4" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)" }}>
                    <div className="text-xs text-white/40 uppercase tracking-widest mb-2">Crowd Personality</div>
                    <div className="text-sm font-bold text-white mb-3">Mainly <span style={{ color: "#a29bfe" }}>{forecast.crowdPersonality.dominant}</span></div>
                    <div className="space-y-2.5">
                      {forecast.crowdPersonality.types.map(t => (
                        <div key={t.label}>
                          <div className="flex items-center justify-between mb-1">
                            <div className="flex items-center gap-1.5">
                              <span>{t.emoji}</span>
                              <span className="text-xs text-white/55">{t.label}</span>
                            </div>
                            <span className="text-xs font-bold text-white/60">{t.pct}%</span>
                          </div>
                          <CrowdBar level={t.pct} color="#a29bfe" h="h-1.5" />
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Best/worst times */}
                  <div className="rounded-2xl p-4 space-y-3" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)" }}>
                    <div className="text-xs text-white/40 uppercase tracking-widest mb-1">Visit Timing</div>
                    {forecast.bestTimes.map((bt, i) => (
                      <div key={i} className="flex items-center justify-between px-3 py-2 rounded-xl"
                        style={{ background: "rgba(0,184,148,0.08)", border: "1px solid rgba(0,184,148,0.18)" }}>
                        <div>
                          <div className="text-xs text-green-400 font-medium">{bt.label}</div>
                          <div className="text-sm font-bold text-white">{bt.window}</div>
                        </div>
                        <div className="text-xs font-black" style={{ color: crowdColor(bt.crowdLevel) }}>{bt.crowdLevel}%</div>
                      </div>
                    ))}
                    {forecast.worstTimes[0] && (
                      <div className="px-3 py-2 rounded-xl" style={{ background: "rgba(214,48,49,0.07)", border: "1px solid rgba(214,48,49,0.18)" }}>
                        <div className="text-xs text-red-400 font-medium mb-0.5">Avoid</div>
                        <div className="text-sm font-bold text-white">{forecast.worstTimes[0].window}</div>
                        <div className="text-xs text-white/40">{forecast.worstTimes[0].crowdLevel}% expected</div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Prediction strip */}
                <div className="grid md:grid-cols-3 gap-3 mb-4">
                  {([["Next 1 Hour", forecast.prediction.next1h], ["Next 3 Hours", forecast.prediction.next3h], ["Tonight", forecast.prediction.tonight]] as [string, Prediction][]).map(([label, p]) => (
                    <div key={label} className="p-3 rounded-2xl" style={{ background: "rgba(162,155,254,0.07)", border: "1px solid rgba(162,155,254,0.18)" }}>
                      <div className="flex items-center gap-2 mb-1">
                        <DirIcon d={p.direction} />
                        <span className="text-xs font-bold text-purple-400">{label}</span>
                      </div>
                      <div className="text-xl font-black" style={{ color: crowdColor(p.level) }}>{p.level}<span className="text-sm text-white/30">%</span></div>
                      <p className="text-xs text-white/40 mt-1">{p.reason}</p>
                    </div>
                  ))}
                </div>
                <div className="flex items-center gap-3 mb-5 px-3 py-2 rounded-xl" style={{ background: "rgba(162,155,254,0.06)", border: "1px solid rgba(162,155,254,0.15)" }}>
                  <span className="text-xs text-purple-400">AI Confidence</span>
                  <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.07)" }}>
                    <motion.div className="h-full rounded-full bg-purple-400" initial={{ width: 0 }} animate={{ width: `${forecast.prediction.confidence}%` }} transition={{ duration: 0.9 }} />
                  </div>
                  <span className="text-xs font-black text-purple-400">{forecast.prediction.confidence}%</span>
                </div>

                {/* Hourly timeline bars */}
                <div className="mb-5">
                  <div className="text-xs text-white/40 uppercase tracking-widest mb-3 flex items-center gap-2">
                    <Clock className="w-3.5 h-3.5" /> Hourly Crowd Timeline
                  </div>
                  <div className="grid grid-cols-9 gap-1.5">
                    {forecast.hourlyTimeline.map((slot, i) => {
                      const slotColor = crowdColor(slot.level);
                      const slotH = parseInt(slot.hour);
                      const isPM = slot.hour.includes("PM");
                      const hour24 = isPM && slotH !== 12 ? slotH + 12 : !isPM && slotH === 12 ? 0 : slotH;
                      const isNow = Math.abs(currentHour - hour24) <= 1;
                      return (
                        <div key={slot.hour} className="flex flex-col items-center gap-1">
                          <div className="text-center whitespace-nowrap text-white/30" style={{ fontSize: 9 }}>{slot.hour}</div>
                          <div className="relative w-full" style={{ height: 80 }}>
                            <div className="absolute bottom-0 w-full rounded-sm overflow-hidden" style={{ height: "100%", background: "rgba(255,255,255,0.05)" }}>
                              <motion.div className="absolute bottom-0 w-full rounded-sm"
                                style={{ background: slotColor, opacity: isNow ? 1 : 0.65 }}
                                initial={{ height: 0 }} animate={{ height: `${slot.level}%` }} transition={{ duration: 0.6, delay: i * 0.04 }} />
                            </div>
                            {isNow && <div className="absolute -top-1.5 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-white" style={{ boxShadow: "0 0 6px white" }} />}
                          </div>
                          <div className="font-black tabular-nums" style={{ color: slotColor, fontSize: 9 }}>{slot.level}</div>
                        </div>
                      );
                    })}
                  </div>
                  <div className="flex items-center gap-1 justify-center mt-1.5">
                    <div className="w-1.5 h-1.5 rounded-full bg-white opacity-70" />
                    <span className="text-white/25 text-xs">= Now</span>
                  </div>
                </div>

                {/* Daily pattern */}
                <div className="grid grid-cols-4 gap-2 mb-5">
                  {[
                    { label: "Morning", icon: "🌅", data: forecast.dailyPattern.morning },
                    { label: "Afternoon", icon: "☀️", data: forecast.dailyPattern.afternoon },
                    { label: "Evening", icon: "🌆", data: forecast.dailyPattern.evening },
                    { label: "Night", icon: "🌙", data: forecast.dailyPattern.night },
                  ].map(({ label, icon, data }) => (
                    <div key={label} className="p-3 rounded-2xl text-center" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}>
                      <div className="text-xl mb-1">{icon}</div>
                      <div className="text-xs text-white/40 mb-1.5">{label}</div>
                      <div className="text-lg font-black" style={{ color: crowdColor(data.level) }}>{data.level}%</div>
                      <div className="text-xs font-medium mt-0.5" style={{ color: crowdColor(data.level) }}>{data.label}</div>
                      <div className="mt-2"><CrowdBar level={data.level} color={crowdColor(data.level)} h="h-1" /></div>
                      <p className="text-white/30 mt-2 leading-tight" style={{ fontSize: 9 }}>{data.note}</p>
                    </div>
                  ))}
                </div>

                {/* Why crowded */}
                <div className="p-4 rounded-2xl mb-5" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.07)" }}>
                  <div className="text-xs text-white/40 uppercase tracking-widest mb-3 flex items-center gap-2">
                    <Zap className="w-3.5 h-3.5 text-yellow-400" /> Why is it crowded?
                  </div>
                  <div className="grid md:grid-cols-2 gap-2">
                    {forecast.crowdReasons.map((r, i) => (
                      <motion.div key={i} initial={{ opacity: 0, x: -6 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.07 }}
                        className="flex items-center gap-2.5 px-3 py-2 rounded-xl"
                        style={{
                          background: r.impact === "High" ? "rgba(214,48,49,0.07)" : r.impact === "Medium" ? "rgba(253,203,110,0.06)" : "rgba(116,185,255,0.05)",
                          border: `1px solid ${r.impact === "High" ? "rgba(214,48,49,0.18)" : r.impact === "Medium" ? "rgba(253,203,110,0.14)" : "rgba(116,185,255,0.12)"}`,
                        }}>
                        <span className="text-xl">{r.emoji}</span>
                        <div className="flex-1 text-sm text-white/75">{r.reason}</div>
                        <span className="text-xs font-bold px-1.5 py-0.5 rounded-full"
                          style={{ background: r.impact === "High" ? "rgba(214,48,49,0.15)" : r.impact === "Medium" ? "rgba(253,203,110,0.12)" : "rgba(116,185,255,0.1)", color: r.impact === "High" ? "#d63031" : r.impact === "Medium" ? "#fdcb6e" : "#74b9ff" }}>
                          {r.impact}
                        </span>
                      </motion.div>
                    ))}
                  </div>
                </div>

                {/* Heat zones */}
                <div className="p-4 rounded-2xl mb-5" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.07)" }}>
                  <div className="text-xs text-white/40 uppercase tracking-widest mb-3 flex items-center gap-2">
                    <MapPin className="w-3.5 h-3.5 text-red-400" /> Crowd Heat Zones
                  </div>
                  <div className="grid md:grid-cols-3 gap-3">
                    {forecast.heatZones.map((z, i) => {
                      const zc = crowdColor(z.crowdLevel);
                      const isActive = activeZone?.zone === z.zone;
                      return (
                        <motion.div key={z.zone} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.08 }}
                          className="p-3 rounded-2xl cursor-pointer transition-all"
                          style={{ background: isActive ? `${zc}12` : "rgba(255,255,255,0.03)", border: `1px solid ${isActive ? `${zc}40` : "rgba(255,255,255,0.07)"}` }}
                          onClick={() => setActiveZone(isActive ? null : z)}>
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-bold text-white">{z.zone}</span>
                            <span className="text-xs px-2 py-0.5 rounded-full font-bold" style={{ background: `${zc}18`, color: zc }}>{z.status}</span>
                          </div>
                          <CrowdBar level={z.crowdLevel} color={zc} h="h-1.5" />
                          <div className="flex justify-between mt-2">
                            <span className="text-xs text-white/30">Peak: {z.peakTime}</span>
                            <span className="text-xs font-black" style={{ color: zc }}>{z.crowdLevel}%</span>
                          </div>
                          <AnimatePresence>
                            {isActive && (
                              <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                                className="overflow-hidden mt-2 pt-2 border-t" style={{ borderColor: "rgba(255,255,255,0.07)" }}>
                                <p className="text-xs text-white/60">{z.advice}</p>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </motion.div>
                      );
                    })}
                  </div>
                </div>

                {/* India context + Event nearby */}
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="p-4 rounded-2xl" style={{ background: "linear-gradient(135deg, rgba(255,153,0,0.07), rgba(19,136,8,0.04))", border: "1px solid rgba(255,153,0,0.2)" }}>
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-lg">🇮🇳</span>
                      <span className="text-xs font-bold text-orange-400 uppercase tracking-wider">India Smart Mode</span>
                    </div>
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-xs text-white/40">Festival Impact:</span>
                      <span className="text-xs font-black px-2 py-0.5 rounded-full"
                        style={{ background: `${FESTIVAL_COLOR[forecast.indiaContext.festivalImpact] || "#74b9ff"}15`, color: FESTIVAL_COLOR[forecast.indiaContext.festivalImpact] || "#74b9ff" }}>
                        {forecast.indiaContext.festivalImpact}
                      </span>
                    </div>
                    <p className="text-xs text-white/55 mb-2">{forecast.indiaContext.festivalNote}</p>
                    {forecast.indiaContext.specialFactors.map((f, i) => (
                      <div key={i} className="flex items-center gap-1.5 text-xs text-white/40 mt-1">
                        <span className="text-orange-400/60">•</span> {f}
                      </div>
                    ))}
                  </div>
                  <div className="p-4 rounded-2xl" style={{ background: forecast.eventNearby.detected ? "rgba(116,185,255,0.07)" : "rgba(255,255,255,0.02)", border: `1px solid ${forecast.eventNearby.detected ? "rgba(116,185,255,0.25)" : "rgba(255,255,255,0.07)"}` }}>
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-lg">{forecast.eventNearby.detected ? "🎉" : "📡"}</span>
                      <span className="text-xs font-bold text-blue-400 uppercase tracking-wider">Event Impact</span>
                    </div>
                    {forecast.eventNearby.detected ? (
                      <>
                        <div className="text-sm font-bold text-white mb-1">{forecast.eventNearby.eventType}</div>
                        <div className="text-xs text-white/50">Distance: {forecast.eventNearby.distanceKm} km</div>
                        <div className="flex items-center gap-2 mt-2">
                          <span className="text-xs text-white/40">Crowd Impact:</span>
                          <span className="text-xs font-bold" style={{ color: forecast.eventNearby.crowdImpact === "High" ? "#d63031" : forecast.eventNearby.crowdImpact === "Medium" ? "#fdcb6e" : "#74b9ff" }}>{forecast.eventNearby.crowdImpact}</span>
                        </div>
                      </>
                    ) : (
                      <p className="text-xs text-white/35">No major events detected nearby. Crowd patterns are organic.</p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* ── COMPARE ──────────────────────────────────────────────────── */}
        <section>
          <div className="flex items-center gap-3 mb-3">
            <BarChart3 className="w-5 h-5 text-purple-400" />
            <h2 className="text-lg font-bold text-white">Compare Crowd Levels</h2>
          </div>
          <div className="rounded-2xl border p-5" style={{ background: "rgba(255,255,255,0.02)", borderColor: "rgba(162,155,254,0.2)" }}>
            <div className="grid md:grid-cols-2 gap-4 mb-4">
              {[{ v: cmp1, set: setCmp1, ph: "Place A — e.g. Chandni Chowk" }, { v: cmp2, set: setCmp2, ph: "Place B — e.g. Sarojini Nagar" }].map((f, i) => (
                <input key={i} value={f.v} onChange={e => f.set(e.target.value)} placeholder={f.ph}
                  className="w-full px-4 py-3 rounded-xl border text-sm text-white placeholder-white/30 outline-none"
                  style={{ background: "rgba(255,255,255,0.05)", borderColor: "rgba(255,255,255,0.1)" }} />
              ))}
            </div>
            <button onClick={runCompare} disabled={!cmp1.trim() || !cmp2.trim() || cmpLoading}
              className="w-full py-3 rounded-xl font-bold text-sm disabled:opacity-40"
              style={{ background: "rgba(162,155,254,0.12)", color: "#a29bfe", border: "1px solid rgba(162,155,254,0.3)" }}>
              {cmpLoading
                ? <span className="flex items-center gap-2 justify-center"><Loader2 className="w-4 h-4 animate-spin" />Comparing...</span>
                : `👥 Compare ${cmp1 || "Place A"} vs ${cmp2 || "Place B"}`}
            </button>
            <AnimatePresence>
              {cmpResult && (
                <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="mt-5 space-y-4">
                  <div className="grid md:grid-cols-2 gap-4">
                    {[cmpResult.loc1, cmpResult.loc2].map((loc, ci) => {
                      const lc = STATUS_COLORS[loc.statusColor] || "#fdcb6e";
                      const isWinner = loc.name.toLowerCase() === cmpResult.winner?.toLowerCase();
                      return (
                        <div key={loc.name} className="rounded-2xl border p-4" style={{ background: "rgba(255,255,255,0.03)", borderColor: isWinner ? `${lc}55` : `${lc}22` }}>
                          <div className="flex items-center justify-between mb-2">
                            <h4 className="font-black text-white">{loc.name}</h4>
                            <div className="flex items-center gap-1.5">
                              {isWinner && <Star className="w-4 h-4 text-green-400" fill="currentColor" />}
                              <span className="text-2xl font-black" style={{ color: lc }}>{loc.currentCrowd}%</span>
                            </div>
                          </div>
                          <div className="mb-3"><CrowdBar level={loc.currentCrowd} color={lc} animated={false} /></div>
                          <div className="space-y-1.5 text-xs">
                            {[["Status", loc.status, lc], ["Peak Hour", loc.peakHour, "rgba(255,255,255,0.7)"], ["Best Visit", loc.bestVisit, "#00b894"], ["Crowd Type", loc.crowdType, "rgba(255,255,255,0.6)"]].map(([k, v, c]) => (
                              <div key={String(k)} className="flex justify-between text-white/50">
                                <span>{k}</span><span style={{ color: String(c) }}>{v}</span>
                              </div>
                            ))}
                          </div>
                          <div className="mt-3 text-xs text-white/35 italic">{loc.advantage}</div>
                        </div>
                      );
                    })}
                  </div>
                  <div className="flex items-start gap-2 p-4 rounded-2xl" style={{ background: "rgba(162,155,254,0.08)", border: "1px solid rgba(162,155,254,0.2)" }}>
                    <Bot className="w-5 h-5 text-purple-400 flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-white/80">{cmpResult.recommendation}</p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </section>

        {/* ── SAVED PLACES ─────────────────────────────────────────────── */}
        {saved.length > 0 && (
          <section>
            <div className="flex items-center gap-3 mb-3">
              <BookmarkCheck className="w-4 h-4 text-green-400" />
              <span className="font-bold text-white">My Saved Places</span>
              <span className="text-xs text-white/30">{saved.length} saved</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {saved.map(p => (
                <button key={p.id} onClick={() => { setSearchInput(p.locationName); getForecast(p.locationName); }}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl border text-sm transition-all hover:border-orange-400/40"
                  style={{ background: "rgba(229,112,85,0.07)", borderColor: "rgba(229,112,85,0.2)", color: "rgba(255,255,255,0.75)" }}>
                  <span>👥</span><span>{p.locationName}</span><ChevronRight className="w-3.5 h-3.5 text-white/30" />
                </button>
              ))}
            </div>
          </section>
        )}
      </div>

      {/* ── FLOATING CROWD AI ─────────────────────────────────────────── */}
      <div className="fixed bottom-6 right-6 z-50">
        <AnimatePresence>
          {chatOpen && (
            <motion.div initial={{ opacity: 0, scale: 0.85, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.85, y: 20 }}
              className="mb-4 rounded-3xl border overflow-hidden"
              style={{ width: 340, maxHeight: 500, background: "#0e0e1c", borderColor: "rgba(229,112,85,0.35)", boxShadow: "0 20px 60px rgba(0,0,0,0.5)" }}>
              <div className="flex items-center justify-between px-4 py-3 border-b" style={{ borderColor: "rgba(255,255,255,0.06)", background: "rgba(229,112,85,0.07)" }}>
                <div className="flex items-center gap-2">
                  <motion.div className="w-7 h-7 rounded-xl flex items-center justify-center" style={{ background: "rgba(229,112,85,0.2)" }}
                    animate={{ boxShadow: ["0 0 0 0 rgba(229,112,85,0.4)", "0 0 0 6px transparent"] }} transition={{ duration: 1.5, repeat: Infinity }}>
                    👥
                  </motion.div>
                  <div>
                    <div className="text-sm font-bold text-white">Crowd AI</div>
                    <div className="text-xs text-orange-400">{currentPlace ? `Forecasting ${currentPlace}` : "Any location"}</div>
                  </div>
                </div>
                <button onClick={() => setChatOpen(false)} className="text-white/30 hover:text-white"><X className="w-4 h-4" /></button>
              </div>
              <div className="overflow-y-auto p-3 space-y-3" style={{ maxHeight: 330 }}>
                {chatMsgs.map((msg, i) => (
                  <motion.div key={i} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                    <div className="max-w-[85%] px-3 py-2.5 rounded-2xl text-sm leading-relaxed"
                      style={{ background: msg.role === "user" ? "rgba(229,112,85,0.2)" : "rgba(255,255,255,0.07)", color: "rgba(255,255,255,0.9)", borderRadius: msg.role === "user" ? "16px 16px 4px 16px" : "16px 16px 16px 4px" }}>
                      {msg.text}
                    </div>
                  </motion.div>
                ))}
                {chatLoading && (
                  <div className="flex justify-start">
                    <div className="px-3 py-2.5 rounded-2xl" style={{ background: "rgba(255,255,255,0.07)", borderRadius: "16px 16px 16px 4px" }}>
                      <div className="flex gap-1">{[0, 1, 2].map(i => <div key={i} className="w-1.5 h-1.5 rounded-full bg-orange-400 animate-bounce" style={{ animationDelay: `${i * 0.15}s` }} />)}</div>
                    </div>
                  </div>
                )}
                <div ref={chatEndRef} />
              </div>
              <div className="px-3 pb-3">
                <div className="flex items-center gap-2 p-2 rounded-xl border mb-2" style={{ background: "rgba(255,255,255,0.05)", borderColor: "rgba(255,255,255,0.1)" }}>
                  <input value={chatInput} onChange={e => setChatInput(e.target.value)} onKeyDown={e => e.key === "Enter" && sendChat()}
                    placeholder={currentPlace ? `Ask about ${currentPlace}...` : "Ask about crowd levels..."}
                    className="flex-1 bg-transparent text-sm text-white placeholder-white/30 outline-none" />
                  <button onClick={sendChat} disabled={chatLoading || !chatInput.trim()}
                    className="w-7 h-7 rounded-lg flex items-center justify-center disabled:opacity-40"
                    style={{ background: "rgba(229,112,85,0.22)" }}>
                    <Send className="w-3.5 h-3.5 text-orange-300" />
                  </button>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {CHAT_STARTERS.map(q => (
                    <button key={q} onClick={() => setChatInput(q)}
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
        <motion.button onClick={() => setChatOpen(!chatOpen)} whileTap={{ scale: 0.95 }} whileHover={{ scale: 1.05 }}
          className="flex items-center gap-2 px-5 py-3.5 rounded-2xl font-bold text-sm shadow-2xl"
          style={{ background: "linear-gradient(135deg, #e17055, #fdcb6e)", color: "#1a1a2e", boxShadow: "0 8px 32px rgba(225,112,85,0.4)" }}
          animate={{ boxShadow: chatOpen ? "0 8px 32px rgba(225,112,85,0.6)" : ["0 8px 32px rgba(225,112,85,0.4)", "0 8px 40px rgba(225,112,85,0.6)", "0 8px 32px rgba(225,112,85,0.4)"] }}
          transition={{ duration: 2, repeat: chatOpen ? 0 : Infinity }}>
          <Users className="w-5 h-5" />
          <span>{chatOpen ? "Close" : "Crowd AI"}</span>
          {!chatOpen && <span className="w-2 h-2 rounded-full bg-white animate-pulse" />}
        </motion.button>
      </div>
    </div>
  );
}
