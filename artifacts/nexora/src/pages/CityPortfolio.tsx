import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  TrendingUp, TrendingDown, Minus, BarChart3, MapPin, Loader2,
  RefreshCw, Bot, X, Send, Star, Trash2, ArrowUp, ArrowDown,
  CheckCircle2, AlertTriangle, Zap, Globe2, ChevronRight,
  Sparkles, BookmarkPlus, BookmarkCheck,
} from "lucide-react";

// ── Types ───────────────────────────────────────────────────────────────────
interface Metric { score: number; trend: string; label: string; note: string }
interface LifestyleEntry { group: string; fit: number; reason: string }
interface Neighborhood { name: string; vibe: string; activity: number; emoji: string }
interface TimelineEntry { year: string; label: string; note: string }
interface ForecastEntry { outlook: string; confidence: number }
interface CityProfile {
  cityName: string; tagline: string; status: string;
  overallScore: number; healthScore: number; healthLabel: string;
  metrics: { growth: Metric; lifestyle: Metric; opportunity: Metric; culture: Metric; connectivity: Metric };
  economyProfile: { pulse: string; businessActivity: string; startupGrowth: string; marketActivity: string; tourism: string; gdpTrend: string; keyIndustries: string[] };
  lifestyleFor: LifestyleEntry[];
  strengths: string[];
  challenges: string[];
  neighborhoods: Neighborhood[];
  growthTimeline: TimelineEntry[];
  futureForecast: { growth: ForecastEntry; infrastructure: ForecastEntry; lifestyle: ForecastEntry; opportunity: ForecastEntry };
  aiSummary: string;
  generatedAt: string;
}
interface CompareResult {
  city1: { name: string; overallScore: number; growth: number; cost: number; lifestyle: number; future: number; bestFor: string; topAdvantage: string };
  city2: { name: string; overallScore: number; growth: number; cost: number; lifestyle: number; future: number; bestFor: string; topAdvantage: string };
  verdict: string; winner: string;
}

// ── Config ──────────────────────────────────────────────────────────────────
const SAMPLE_CITIES = ["Jaipur", "Indore", "Kota", "Varanasi", "Mysore", "Surat", "Lucknow", "Chandigarh", "Bhopal", "Udaipur", "Pune", "Ahmedabad"];
const METRIC_CONFIG = [
  { key: "growth", label: "Growth", icon: "📈", color: "#00b894" },
  { key: "lifestyle", label: "Lifestyle", icon: "🌿", color: "#74b9ff" },
  { key: "opportunity", label: "Opportunity", icon: "⚡", color: "#fdcb6e" },
  { key: "culture", label: "Culture", icon: "🎨", color: "#fd79a8" },
  { key: "connectivity", label: "Connectivity", icon: "🔗", color: "#a29bfe" },
] as const;
const FORECAST_ICONS: Record<string, string> = {
  High: "🔥", Medium: "📊", Low: "📉",
  Improving: "⬆️", Stable: "➡️", Declining: "⬇️",
  Expanding: "🚀", Contracting: "📉", Changing: "🔄",
};
const CHAT_STARTERS = ["What's the best area to live?", "Is this city good for startups?", "Compare cost vs quality?", "Future outlook?"];

function trendIcon(trend: string, sz = "w-4 h-4") {
  if (trend === "up") return <TrendingUp className={`${sz} text-green-400`} />;
  if (trend === "down") return <TrendingDown className={`${sz} text-red-400`} />;
  return <Minus className={`${sz} text-white/30`} />;
}

function scoreColor(score: number) {
  if (score >= 85) return "#00b894";
  if (score >= 70) return "#74b9ff";
  if (score >= 55) return "#fdcb6e";
  return "#e17055";
}

// Animated score counter
function AnimatedScore({ target, color, size = "text-5xl" }: { target: number; color: string; size?: string }) {
  const [val, setVal] = useState(0);
  useEffect(() => {
    let start = 0;
    const step = Math.ceil(target / 40);
    const t = setInterval(() => {
      start = Math.min(start + step, target);
      setVal(start);
      if (start >= target) clearInterval(t);
    }, 20);
    return () => clearInterval(t);
  }, [target]);
  return <span className={`${size} font-black tabular-nums`} style={{ color }}>{val}</span>;
}

// ── Component ───────────────────────────────────────────────────────────────
export default function CityPortfolio() {
  const [searchInput, setSearchInput] = useState("");
  const [currentCity, setCurrentCity] = useState("");
  const [profile, setProfile] = useState<CityProfile | null>(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<"overview" | "economy" | "lifestyle" | "future">("overview");

  // Compare
  const [cmp1, setCmp1] = useState("");
  const [cmp2, setCmp2] = useState("");
  const [cmpResult, setCmpResult] = useState<CompareResult | null>(null);
  const [cmpLoading, setCmpLoading] = useState(false);

  // AI Full Report
  const [reportText, setReportText] = useState("");
  const [reportLoading, setReportLoading] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);

  // Saved cities
  const [savedCities, setSavedCities] = useState<{ cityName: string; category: string }[]>([]);
  const [isSaved, setIsSaved] = useState(false);

  // Chat
  const [chatOpen, setChatOpen] = useState(false);
  const [chatInput, setChatInput] = useState("");
  const [chatLoading, setChatLoading] = useState(false);
  const [chatMsgs, setChatMsgs] = useState<{ role: "user" | "ai"; text: string }[]>([
    { role: "ai", text: "🏙️ Welcome to City Portfolio! I can help you analyse any Indian city — enter a place above and I'll build a complete AI profile, or ask me anything!" },
  ]);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => { loadSaved(); }, []);
  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [chatMsgs]);
  useEffect(() => {
    if (!currentCity || !savedCities.length) { setIsSaved(false); return; }
    setIsSaved(savedCities.some(s => s.cityName.toLowerCase() === currentCity.toLowerCase()));
  }, [currentCity, savedCities]);

  async function loadSaved() {
    try {
      const r = await fetch("/api/portfolio/saved");
      const d = await r.json();
      setSavedCities(d.saved || []);
    } catch { /* ok */ }
  }

  async function generateProfile(city: string) {
    if (!city.trim()) return;
    setCurrentCity(city.trim());
    setProfile(null);
    setReportText("");
    setReportOpen(false);
    setLoading(true);
    setActiveTab("overview");
    try {
      const r = await fetch("/api/portfolio/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cityName: city.trim() }),
      });
      setProfile(await r.json());
    } finally { setLoading(false); }
  }

  async function runCompare() {
    if (!cmp1.trim() || !cmp2.trim()) return;
    setCmpLoading(true);
    setCmpResult(null);
    try {
      const r = await fetch("/api/portfolio/compare", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ city1: cmp1.trim(), city2: cmp2.trim() }),
      });
      setCmpResult(await r.json());
    } finally { setCmpLoading(false); }
  }

  async function generateReport() {
    if (!currentCity) return;
    setReportLoading(true);
    setReportOpen(true);
    try {
      const r = await fetch("/api/portfolio/report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cityName: currentCity }),
      });
      const d = await r.json();
      setReportText(d.report || "");
    } finally { setReportLoading(false); }
  }

  async function toggleSave() {
    if (!currentCity) return;
    if (isSaved) {
      await fetch(`/api/portfolio/save/${encodeURIComponent(currentCity)}`, { method: "DELETE" });
      setSavedCities(p => p.filter(s => s.cityName.toLowerCase() !== currentCity.toLowerCase()));
      setIsSaved(false);
    } else {
      const r = await fetch("/api/portfolio/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cityName: currentCity, category: "My Cities" }),
      });
      const d = await r.json();
      setSavedCities(p => [...p, d]);
      setIsSaved(true);
    }
  }

  async function sendChat() {
    if (!chatInput.trim() || chatLoading) return;
    const msg = chatInput.trim();
    setChatInput("");
    setChatMsgs(m => [...m, { role: "user", text: msg }]);
    setChatLoading(true);
    try {
      const r = await fetch("/api/reporter/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: msg, cityName: currentCity || undefined }),
      });
      const d = await r.json();
      setChatMsgs(m => [...m, { role: "ai", text: d.reply }]);
    } finally { setChatLoading(false); }
  }

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen pb-32" style={{ background: "linear-gradient(135deg, #0a0a1a 0%, #0a0d1a 60%, #080a18 100%)" }}>

      {/* ── HERO ─────────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden" style={{ minHeight: 280 }}>
        <div className="absolute inset-0 pointer-events-none">
          {/* City lights grid */}
          {[...Array(20)].map((_, i) => (
            <motion.div key={i} className="absolute rounded-full"
              style={{
                width: i % 4 === 0 ? 3 : 1.5,
                height: i % 4 === 0 ? 3 : 1.5,
                background: i % 3 === 0 ? "#74b9ff" : i % 3 === 1 ? "#00b894" : "#fdcb6e",
                left: `${(i * 5.3) % 100}%`,
                top: `${(i * 11) % 100}%`,
                opacity: 0.35,
              }}
              animate={{ opacity: [0.2, 0.7, 0.2] }}
              transition={{ duration: 2 + (i % 3), repeat: Infinity, delay: (i * 0.2) % 2 }} />
          ))}
          {/* Skyline bars */}
          {[...Array(12)].map((_, i) => (
            <motion.div key={i} className="absolute bottom-0"
              style={{ left: `${5 + i * 8.2}%`, width: 24 + (i % 4) * 8, background: `rgba(116,185,255,${0.03 + (i % 3) * 0.015})`, borderRadius: "4px 4px 0 0" }}
              initial={{ height: 0 }}
              animate={{ height: 60 + (i % 5) * 24 }}
              transition={{ duration: 0.8, delay: i * 0.07 }} />
          ))}
          <div className="absolute right-0 top-0 w-96 h-96 rounded-full blur-3xl"
            style={{ background: "radial-gradient(circle, rgba(116,185,255,0.06) 0%, transparent 70%)" }} />
        </div>

        <div className="relative z-10 px-6 pt-10 pb-6 max-w-6xl mx-auto">
          <div className="flex items-center gap-4 mb-5">
            <motion.div className="w-16 h-16 rounded-2xl flex items-center justify-center text-3xl border"
              style={{ background: "rgba(116,185,255,0.12)", borderColor: "rgba(116,185,255,0.35)" }}
              animate={{ boxShadow: ["0 0 20px rgba(116,185,255,0.15)", "0 0 45px rgba(116,185,255,0.4)", "0 0 20px rgba(116,185,255,0.15)"] }}
              transition={{ duration: 2.5, repeat: Infinity }}>
              🏙️
            </motion.div>
            <div>
              <h1 className="text-4xl md:text-5xl font-black text-white">City Portfolio</h1>
              <p className="text-white/50 mt-1">Complete AI profile of any city — growth, lifestyle, opportunity, future.</p>
            </div>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { icon: "🌍", label: "Any Location", sub: "No fixed list", color: "#74b9ff" },
              { icon: "📊", label: "AI Analysis", sub: "Deep profile", color: "#00b894" },
              { icon: "📡", label: "Live Data", sub: "Real-time pulse", color: "#fdcb6e" },
              { icon: "🔮", label: "Future Signals", sub: "2035 outlook", color: "#a29bfe" },
            ].map((s, i) => (
              <motion.div key={s.label} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}
                className="rounded-2xl p-4 border" style={{ background: "rgba(255,255,255,0.03)", borderColor: "rgba(255,255,255,0.06)" }}>
                <div className="text-xl mb-1">{s.icon}</div>
                <div className="font-black text-sm" style={{ color: s.color }}>{s.label}</div>
                <div className="text-xs text-white/30 mt-0.5">{s.sub}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <div className="max-w-6xl mx-auto px-4 space-y-6">

        {/* ── SEARCH ─────────────────────────────────────────────────── */}
        <section>
          <div className="rounded-3xl border overflow-hidden" style={{ background: "rgba(255,255,255,0.025)", borderColor: "rgba(116,185,255,0.3)" }}>
            <div className="flex items-center gap-3 px-5 py-4">
              <motion.div animate={{ scale: [1, 1.15, 1] }} transition={{ duration: 2, repeat: Infinity }}>
                <Globe2 className="w-5 h-5 text-blue-400 flex-shrink-0" />
              </motion.div>
              <input value={searchInput} onChange={e => setSearchInput(e.target.value)}
                onKeyDown={e => e.key === "Enter" && generateProfile(searchInput)}
                placeholder="Search any city, town, district, neighborhood..."
                className="flex-1 bg-transparent text-white placeholder-white/30 text-lg outline-none" />
              {loading && <Loader2 className="w-5 h-5 animate-spin text-blue-400 flex-shrink-0" />}
              {!loading && searchInput && (
                <button onClick={() => generateProfile(searchInput)}
                  className="px-5 py-2 rounded-xl font-bold text-sm"
                  style={{ background: "rgba(116,185,255,0.15)", color: "#74b9ff", border: "1px solid rgba(116,185,255,0.4)" }}>
                  Build Portfolio →
                </button>
              )}
              {profile && !loading && (
                <button onClick={() => generateProfile(currentCity)}
                  className="p-2 rounded-xl border text-white/40 hover:text-white"
                  style={{ borderColor: "rgba(255,255,255,0.1)" }}>
                  <RefreshCw className="w-4 h-4" />
                </button>
              )}
            </div>
            <div className="px-5 pb-4 flex flex-wrap gap-2">
              {SAMPLE_CITIES.map(c => (
                <button key={c} onClick={() => { setSearchInput(c); generateProfile(c); }}
                  className="px-3 py-1.5 rounded-full text-xs border transition-all hover:border-blue-400/50 hover:text-blue-300 text-white/40"
                  style={{ background: "rgba(255,255,255,0.03)", borderColor: "rgba(255,255,255,0.07)" }}>
                  {c}
                </button>
              ))}
            </div>
          </div>
        </section>

        {/* ── LOADING ─────────────────────────────────────────────────── */}
        <AnimatePresence>
          {loading && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="text-center py-14">
              <motion.div animate={{ rotate: 360 }} transition={{ duration: 3, repeat: Infinity, ease: "linear" }}>
                <BarChart3 className="w-10 h-10 text-blue-400 mx-auto" />
              </motion.div>
              <p className="text-white/50 mt-4">Building AI portfolio for <span className="text-blue-400 font-medium">{currentCity}</span>...</p>
              <div className="flex justify-center gap-2 mt-3">
                {["Growth", "Lifestyle", "Economy", "Culture", "Future"].map((s, i) => (
                  <motion.span key={s} className="text-xs text-white/30" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.25 }}>
                    {s} ·
                  </motion.span>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── FULL PROFILE ────────────────────────────────────────────── */}
        {profile && !loading && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-5">

            {/* Overview Card */}
            <div className="rounded-3xl border overflow-hidden" style={{
              background: "linear-gradient(135deg, rgba(116,185,255,0.07), rgba(0,184,148,0.03))",
              borderColor: "rgba(116,185,255,0.3)",
            }}>
              <div className="p-6">
                {/* Top bar */}
                <div className="flex items-start justify-between flex-wrap gap-4 mb-5">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <MapPin className="w-4 h-4 text-blue-400" />
                      <span className="text-xs px-2 py-0.5 rounded-full font-medium" style={{ background: "rgba(116,185,255,0.12)", color: "#74b9ff" }}>{profile.status}</span>
                    </div>
                    <h2 className="text-3xl font-black text-white">{profile.cityName}</h2>
                    <p className="text-white/50 mt-1 italic">"{profile.tagline}"</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <button onClick={toggleSave}
                      className="flex items-center gap-2 px-4 py-2 rounded-xl border text-sm font-medium transition-all"
                      style={{
                        background: isSaved ? "rgba(0,184,148,0.15)" : "rgba(255,255,255,0.05)",
                        borderColor: isSaved ? "rgba(0,184,148,0.4)" : "rgba(255,255,255,0.1)",
                        color: isSaved ? "#00b894" : "rgba(255,255,255,0.5)",
                      }}>
                      {isSaved ? <BookmarkCheck className="w-4 h-4" /> : <BookmarkPlus className="w-4 h-4" />}
                      {isSaved ? "Saved" : "Save"}
                    </button>
                    <button onClick={generateReport} disabled={reportLoading}
                      className="flex items-center gap-2 px-4 py-2 rounded-xl border text-sm font-medium"
                      style={{ background: "rgba(162,155,254,0.12)", borderColor: "rgba(162,155,254,0.35)", color: "#a29bfe" }}>
                      <Sparkles className="w-4 h-4" />
                      Full Report
                    </button>
                  </div>
                </div>

                {/* Score + Health */}
                <div className="grid md:grid-cols-3 gap-5 mb-5">
                  {/* Overall Score */}
                  <div className="flex flex-col items-center justify-center rounded-2xl py-6" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)" }}>
                    <div className="text-xs text-white/40 uppercase tracking-widest mb-2">Overall Score</div>
                    <AnimatedScore target={profile.overallScore} color={scoreColor(profile.overallScore)} />
                    <div className="text-white/30 text-sm mt-1">/ 100</div>
                  </div>
                  {/* Health ring */}
                  <div className="flex flex-col items-center justify-center rounded-2xl py-5" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)" }}>
                    <div className="text-xs text-white/40 uppercase tracking-widest mb-2">City Health</div>
                    <div className="relative w-24 h-24">
                      <svg viewBox="0 0 100 100" className="w-full h-full">
                        <circle cx="50" cy="50" r="40" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="8" />
                        <motion.circle cx="50" cy="50" r="40" fill="none" stroke={scoreColor(profile.healthScore)} strokeWidth="8"
                          strokeLinecap="round" transform="rotate(-90 50 50)"
                          initial={{ strokeDashoffset: 251 }}
                          animate={{ strokeDashoffset: 251 - (profile.healthScore / 100) * 251 }}
                          style={{ strokeDasharray: 251 }} transition={{ duration: 1.2 }} />
                      </svg>
                      <div className="absolute inset-0 flex flex-col items-center justify-center">
                        <span className="text-xl font-black" style={{ color: scoreColor(profile.healthScore) }}>{profile.healthScore}</span>
                      </div>
                    </div>
                    <div className="text-sm font-bold mt-1" style={{ color: scoreColor(profile.healthScore) }}>{profile.healthLabel}</div>
                  </div>
                  {/* Status details */}
                  <div className="rounded-2xl p-4" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)" }}>
                    <div className="text-xs text-white/40 uppercase tracking-widest mb-3">AI Summary</div>
                    <p className="text-xs text-white/65 leading-relaxed">{profile.aiSummary}</p>
                  </div>
                </div>

                {/* Tab nav */}
                <div className="flex gap-2 mb-5 flex-wrap">
                  {(["overview", "economy", "lifestyle", "future"] as const).map(tab => (
                    <button key={tab} onClick={() => setActiveTab(tab)}
                      className="px-4 py-2 rounded-xl text-sm font-medium capitalize transition-all"
                      style={{
                        background: activeTab === tab ? "rgba(116,185,255,0.18)" : "rgba(255,255,255,0.04)",
                        borderColor: activeTab === tab ? "rgba(116,185,255,0.4)" : "rgba(255,255,255,0.08)",
                        color: activeTab === tab ? "#74b9ff" : "rgba(255,255,255,0.45)",
                        border: "1px solid",
                      }}>
                      {tab === "overview" ? "📊 Overview" : tab === "economy" ? "💰 Economy" : tab === "lifestyle" ? "🌿 Lifestyle" : "🔮 Future"}
                    </button>
                  ))}
                </div>

                {/* Tab Content */}
                <AnimatePresence mode="wait">
                  <motion.div key={activeTab} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.2 }}>

                    {/* OVERVIEW TAB */}
                    {activeTab === "overview" && (
                      <div className="space-y-4">
                        {/* Portfolio bars */}
                        <div className="grid md:grid-cols-2 gap-3">
                          {METRIC_CONFIG.map((m, i) => {
                            const metric = profile.metrics[m.key];
                            return (
                              <motion.div key={m.key} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.07 }}
                                className="p-4 rounded-xl" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}>
                                <div className="flex items-center justify-between mb-2">
                                  <div className="flex items-center gap-2">
                                    <span className="text-base">{m.icon}</span>
                                    <span className="text-sm font-medium text-white">{m.label}</span>
                                    <span className="text-xs text-white/30">{metric.label}</span>
                                  </div>
                                  <div className="flex items-center gap-1.5">
                                    {trendIcon(metric.trend, "w-3.5 h-3.5")}
                                    <span className="text-sm font-black" style={{ color: m.color }}>{metric.score}</span>
                                  </div>
                                </div>
                                <div className="h-2 rounded-full overflow-hidden mb-2" style={{ background: "rgba(255,255,255,0.06)" }}>
                                  <motion.div className="h-full rounded-full"
                                    style={{ background: m.color }}
                                    initial={{ width: 0 }} animate={{ width: `${metric.score}%` }}
                                    transition={{ duration: 0.8, delay: i * 0.07 }} />
                                </div>
                                <p className="text-xs text-white/35">{metric.note}</p>
                              </motion.div>
                            );
                          })}
                        </div>

                        {/* Strengths + Challenges */}
                        <div className="grid md:grid-cols-2 gap-4">
                          <div className="p-4 rounded-2xl" style={{ background: "rgba(0,184,148,0.06)", border: "1px solid rgba(0,184,148,0.2)" }}>
                            <div className="flex items-center gap-2 mb-3">
                              <CheckCircle2 className="w-4 h-4 text-green-400" />
                              <span className="font-bold text-white text-sm">Top Strengths</span>
                            </div>
                            <div className="space-y-2">
                              {profile.strengths.map((s, i) => (
                                <motion.div key={i} initial={{ opacity: 0, x: -6 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.07 }}
                                  className="flex items-center gap-2 text-sm text-white/75">
                                  <span className="text-green-400 font-bold text-xs">✓</span> {s}
                                </motion.div>
                              ))}
                            </div>
                          </div>
                          <div className="p-4 rounded-2xl" style={{ background: "rgba(229,112,60,0.06)", border: "1px solid rgba(229,112,60,0.2)" }}>
                            <div className="flex items-center gap-2 mb-3">
                              <AlertTriangle className="w-4 h-4 text-orange-400" />
                              <span className="font-bold text-white text-sm">Areas to Watch</span>
                            </div>
                            <div className="space-y-2">
                              {profile.challenges.map((c, i) => (
                                <motion.div key={i} initial={{ opacity: 0, x: -6 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.07 }}
                                  className="flex items-center gap-2 text-sm text-white/75">
                                  <span className="text-orange-400 font-bold text-xs">⚠</span> {c}
                                </motion.div>
                              ))}
                            </div>
                          </div>
                        </div>

                        {/* Neighborhoods */}
                        <div className="p-4 rounded-2xl" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.07)" }}>
                          <div className="flex items-center gap-2 mb-3">
                            <MapPin className="w-4 h-4 text-blue-400" />
                            <span className="font-bold text-white text-sm">Neighborhood Portfolio</span>
                          </div>
                          <div className="grid md:grid-cols-3 gap-3">
                            {profile.neighborhoods.map((n, i) => (
                              <motion.div key={n.name} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}
                                className="p-3 rounded-xl" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)" }}>
                                <div className="flex items-center gap-2 mb-2">
                                  <span className="text-xl">{n.emoji}</span>
                                  <div>
                                    <div className="text-sm font-medium text-white">{n.name}</div>
                                    <div className="text-xs text-white/35">{n.vibe}</div>
                                  </div>
                                </div>
                                <div className="flex items-center justify-between mb-1">
                                  <span className="text-xs text-white/30">Activity</span>
                                  <span className="text-xs font-bold" style={{ color: scoreColor(n.activity) }}>{n.activity}%</span>
                                </div>
                                <div className="h-1.5 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.06)" }}>
                                  <motion.div className="h-full rounded-full" style={{ background: scoreColor(n.activity) }}
                                    initial={{ width: 0 }} animate={{ width: `${n.activity}%` }} transition={{ duration: 0.7, delay: i * 0.1 }} />
                                </div>
                              </motion.div>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}

                    {/* ECONOMY TAB */}
                    {activeTab === "economy" && (
                      <div className="space-y-4">
                        <div className="grid md:grid-cols-2 gap-4">
                          <div className="p-5 rounded-2xl" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)" }}>
                            <div className="text-sm font-bold text-white mb-4">Economic Pulse</div>
                            <div className="space-y-3">
                              {[
                                { label: "Business Activity", val: profile.economyProfile.businessActivity },
                                { label: "Startup Growth", val: profile.economyProfile.startupGrowth },
                                { label: "Market Activity", val: profile.economyProfile.marketActivity },
                                { label: "Tourism", val: profile.economyProfile.tourism },
                              ].map(row => (
                                <div key={row.label} className="flex items-center justify-between py-2.5 border-b" style={{ borderColor: "rgba(255,255,255,0.05)" }}>
                                  <span className="text-sm text-white/50">{row.label}</span>
                                  <span className="text-sm font-medium text-white">{row.val}</span>
                                </div>
                              ))}
                            </div>
                            <div className="mt-4 flex items-center gap-2">
                              {trendIcon(profile.economyProfile.gdpTrend)}
                              <span className="text-xs text-white/40">GDP Trend: <span className="text-white">{profile.economyProfile.gdpTrend === "up" ? "Positive" : profile.economyProfile.gdpTrend === "down" ? "Negative" : "Stable"}</span></span>
                            </div>
                          </div>
                          <div className="p-5 rounded-2xl" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)" }}>
                            <div className="text-sm font-bold text-white mb-4">Key Industries</div>
                            <div className="space-y-2">
                              {profile.economyProfile.keyIndustries.map((ind, i) => (
                                <motion.div key={ind} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.08 }}
                                  className="flex items-center gap-3 px-3 py-2.5 rounded-xl" style={{ background: "rgba(116,185,255,0.06)", border: "1px solid rgba(116,185,255,0.15)" }}>
                                  <div className="w-2 h-2 rounded-full" style={{ background: "#74b9ff", flexShrink: 0 }} />
                                  <span className="text-sm text-white/80">{ind}</span>
                                </motion.div>
                              ))}
                            </div>
                            <div className="mt-4 flex items-center gap-2 px-3 py-2.5 rounded-xl"
                              style={{ background: `rgba(${profile.economyProfile.pulse === "Strong" ? "0,184,148" : profile.economyProfile.pulse === "Slow" ? "229,112,60" : "116,185,255"},0.1)` }}>
                              <Zap className="w-4 h-4" style={{ color: profile.economyProfile.pulse === "Strong" ? "#00b894" : profile.economyProfile.pulse === "Slow" ? "#e17055" : "#74b9ff" }} />
                              <span className="text-sm font-medium text-white">Overall Pulse: {profile.economyProfile.pulse}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* LIFESTYLE TAB */}
                    {activeTab === "lifestyle" && (
                      <div className="space-y-3">
                        <p className="text-xs text-white/40 mb-2">AI analysis — who thrives in {profile.cityName}</p>
                        {profile.lifestyleFor.map((lf, i) => (
                          <motion.div key={lf.group} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.09 }}
                            className="p-4 rounded-2xl" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}>
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-base font-bold text-white">{lf.group}</span>
                              <div className="flex items-center gap-2">
                                <div className="w-24 h-2 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.06)" }}>
                                  <motion.div className="h-full rounded-full" style={{ background: scoreColor(lf.fit) }}
                                    initial={{ width: 0 }} animate={{ width: `${lf.fit}%` }} transition={{ duration: 0.7, delay: i * 0.09 }} />
                                </div>
                                <span className="text-sm font-black w-8 text-right" style={{ color: scoreColor(lf.fit) }}>{lf.fit}</span>
                              </div>
                            </div>
                            <p className="text-xs text-white/45">{lf.reason}</p>
                          </motion.div>
                        ))}
                      </div>
                    )}

                    {/* FUTURE TAB */}
                    {activeTab === "future" && (
                      <div className="space-y-4">
                        {/* Growth timeline */}
                        <div className="p-4 rounded-2xl" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.07)" }}>
                          <div className="text-sm font-bold text-white mb-4">📈 Growth Tracker</div>
                          <div className="relative">
                            <div className="absolute left-16 top-0 bottom-0 w-px" style={{ background: "rgba(255,255,255,0.06)" }} />
                            <div className="space-y-4">
                              {profile.growthTimeline.map((entry, i) => {
                                const isCurrent = entry.year === "2026";
                                const isFuture = parseInt(entry.year) > 2026;
                                return (
                                  <motion.div key={entry.year} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.09 }}
                                    className="flex items-start gap-4">
                                    <div className={`w-12 text-right text-xs font-black flex-shrink-0 mt-1 ${isCurrent ? "text-blue-400" : isFuture ? "text-purple-400" : "text-white/35"}`}>
                                      {entry.year}
                                    </div>
                                    <div className="relative z-10 mt-1">
                                      <div className="w-3 h-3 rounded-full border-2 flex-shrink-0"
                                        style={{
                                          background: isCurrent ? "#74b9ff" : isFuture ? "#a29bfe" : "transparent",
                                          borderColor: isCurrent ? "#74b9ff" : isFuture ? "#a29bfe" : "rgba(255,255,255,0.2)",
                                          boxShadow: isCurrent ? "0 0 8px rgba(116,185,255,0.5)" : "none",
                                        }} />
                                    </div>
                                    <div className="flex-1 rounded-xl px-3 py-2.5"
                                      style={{
                                        background: isCurrent ? "rgba(116,185,255,0.07)" : isFuture ? "rgba(162,155,254,0.05)" : "rgba(255,255,255,0.02)",
                                        border: `1px solid ${isCurrent ? "rgba(116,185,255,0.25)" : isFuture ? "rgba(162,155,254,0.2)" : "transparent"}`,
                                      }}>
                                      <div className="text-sm font-medium text-white mb-0.5">
                                        {entry.label} {isCurrent && <span className="text-xs text-blue-400 ml-1">← NOW</span>}
                                        {isFuture && <span className="text-xs text-purple-400 ml-1">🔮 AI Prediction</span>}
                                      </div>
                                      <p className="text-xs text-white/45">{entry.note}</p>
                                    </div>
                                  </motion.div>
                                );
                              })}
                            </div>
                          </div>
                        </div>

                        {/* 2035 Forecast */}
                        <div className="p-4 rounded-2xl" style={{ background: "linear-gradient(135deg, rgba(162,155,254,0.07), rgba(0,0,0,0))", border: "1px solid rgba(162,155,254,0.25)" }}>
                          <div className="text-sm font-bold text-white mb-4">🔮 2035 Future City Forecast</div>
                          <div className="grid grid-cols-2 gap-3">
                            {(["growth", "infrastructure", "lifestyle", "opportunity"] as const).map(key => {
                              const fc = profile.futureForecast[key];
                              const icon = FORECAST_ICONS[fc.outlook] || "📊";
                              return (
                                <motion.div key={key} initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
                                  className="p-4 rounded-xl text-center" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(162,155,254,0.15)" }}>
                                  <div className="text-2xl mb-1">{icon}</div>
                                  <div className="text-xs text-white/40 capitalize mb-1">{key}</div>
                                  <div className="text-sm font-bold text-white">{fc.outlook}</div>
                                  <div className="text-xs text-white/30 mt-0.5">{fc.confidence}% confidence</div>
                                </motion.div>
                              );
                            })}
                          </div>
                        </div>
                      </div>
                    )}
                  </motion.div>
                </AnimatePresence>
              </div>
            </div>

            {/* AI Full Report Modal */}
            <AnimatePresence>
              {reportOpen && (
                <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 12 }}
                  className="rounded-2xl border overflow-hidden" style={{ background: "rgba(255,255,255,0.02)", borderColor: "rgba(162,155,254,0.3)" }}>
                  <div className="flex items-center justify-between p-4 border-b" style={{ borderColor: "rgba(255,255,255,0.07)" }}>
                    <div className="flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-purple-400" />
                      <span className="font-bold text-white text-sm">Full AI City Report — {currentCity}</span>
                    </div>
                    <button onClick={() => setReportOpen(false)} className="text-white/30 hover:text-white"><X className="w-4 h-4" /></button>
                  </div>
                  <div className="p-5">
                    {reportLoading ? (
                      <div className="flex items-center gap-3 text-white/50 text-sm py-4">
                        <Loader2 className="w-4 h-4 animate-spin text-purple-400" />
                        Generating comprehensive report...
                      </div>
                    ) : (
                      <div className="text-sm text-white/75 leading-relaxed whitespace-pre-line">{reportText}</div>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

          </motion.div>
        )}

        {/* ── COMPARE CITIES ───────────────────────────────────────────── */}
        <section>
          <div className="flex items-center gap-3 mb-4">
            <BarChart3 className="w-5 h-5 text-yellow-400" />
            <h2 className="text-lg font-bold text-white">Compare City Portfolios</h2>
          </div>
          <div className="rounded-2xl border p-5" style={{ background: "rgba(255,255,255,0.02)", borderColor: "rgba(253,203,110,0.2)" }}>
            <div className="grid md:grid-cols-2 gap-4 mb-4">
              {[{ v: cmp1, set: setCmp1, ph: "City A — e.g. Jaipur" }, { v: cmp2, set: setCmp2, ph: "City B — e.g. Pune" }].map((f, i) => (
                <input key={i} value={f.v} onChange={e => f.set(e.target.value)} placeholder={f.ph}
                  className="w-full px-4 py-3 rounded-xl border text-sm text-white placeholder-white/30 outline-none"
                  style={{ background: "rgba(255,255,255,0.05)", borderColor: "rgba(255,255,255,0.1)" }} />
              ))}
            </div>
            <button onClick={runCompare} disabled={!cmp1.trim() || !cmp2.trim() || cmpLoading}
              className="w-full py-3 rounded-xl font-bold text-sm disabled:opacity-40"
              style={{ background: "rgba(253,203,110,0.12)", color: "#fdcb6e", border: "1px solid rgba(253,203,110,0.3)" }}>
              {cmpLoading
                ? <span className="flex items-center gap-2 justify-center"><Loader2 className="w-4 h-4 animate-spin" />AI comparing portfolios...</span>
                : `📊 Compare ${cmp1 || "City A"} vs ${cmp2 || "City B"}`}
            </button>

            <AnimatePresence>
              {cmpResult && (
                <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="mt-5 space-y-4">
                  <div className="grid md:grid-cols-2 gap-4">
                    {[cmpResult.city1, cmpResult.city2].map((city, ci) => {
                      const col = ci === 0 ? "#74b9ff" : "#fd79a8";
                      const isWinner = city.name.toLowerCase() === cmpResult.winner?.toLowerCase();
                      return (
                        <div key={city.name} className="rounded-2xl border p-4" style={{ background: "rgba(255,255,255,0.03)", borderColor: isWinner ? `${col}55` : `${col}22` }}>
                          <div className="flex items-center justify-between mb-2">
                            <h4 className="font-black text-white text-lg">{city.name}</h4>
                            <div className="flex items-center gap-1.5">
                              {isWinner && <Star className="w-4 h-4 text-yellow-400" fill="currentColor" />}
                              <span className="text-2xl font-black" style={{ color: col }}>{city.overallScore}</span>
                            </div>
                          </div>
                          <p className="text-xs text-white/40 italic mb-3">{city.topAdvantage}</p>
                          {[
                            { l: "Growth", v: city.growth },
                            { l: "Cost Score", v: city.cost },
                            { l: "Lifestyle", v: city.lifestyle },
                            { l: "Future", v: city.future },
                          ].map(row => (
                            <div key={row.l} className="mb-2">
                              <div className="flex justify-between text-xs mb-0.5">
                                <span className="text-white/40">{row.l}</span>
                                <span style={{ color: col }}>{row.v}</span>
                              </div>
                              <div className="h-1 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.06)" }}>
                                <div className="h-full rounded-full" style={{ background: col, width: `${row.v}%` }} />
                              </div>
                            </div>
                          ))}
                          <div className="mt-3 text-xs text-white/35">Best for: <span className="text-white/60">{city.bestFor}</span></div>
                        </div>
                      );
                    })}
                  </div>
                  <div className="flex items-start gap-2 p-4 rounded-2xl"
                    style={{ background: "rgba(162,155,254,0.08)", border: "1px solid rgba(162,155,254,0.2)" }}>
                    <Bot className="w-5 h-5 text-purple-400 flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-white/80">{cmpResult.verdict}</p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </section>

        {/* ── SAVED CITIES ─────────────────────────────────────────────── */}
        {savedCities.length > 0 && (
          <section>
            <div className="flex items-center gap-3 mb-4">
              <BookmarkCheck className="w-5 h-5 text-green-400" />
              <h2 className="text-lg font-bold text-white">My Saved Cities</h2>
              <span className="text-xs text-white/30">{savedCities.length} saved</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {savedCities.map(s => (
                <button key={s.cityName} onClick={() => { setSearchInput(s.cityName); generateProfile(s.cityName); }}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl border text-sm transition-all hover:border-green-400/40"
                  style={{ background: "rgba(0,184,148,0.07)", borderColor: "rgba(0,184,148,0.2)", color: "rgba(255,255,255,0.75)" }}>
                  <span>🏙️</span>
                  <span>{s.cityName}</span>
                  <ChevronRight className="w-3.5 h-3.5 text-white/30" />
                </button>
              ))}
            </div>
          </section>
        )}
      </div>

      {/* ── FLOATING AI CHAT ──────────────────────────────────────────── */}
      <div className="fixed bottom-6 right-6 z-50">
        <AnimatePresence>
          {chatOpen && (
            <motion.div initial={{ opacity: 0, scale: 0.85, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.85, y: 20 }}
              className="mb-4 rounded-3xl border overflow-hidden"
              style={{ width: 340, maxHeight: 500, background: "#0e0e1c", borderColor: "rgba(116,185,255,0.35)", boxShadow: "0 20px 60px rgba(0,0,0,0.5)" }}>
              <div className="flex items-center justify-between px-4 py-3 border-b" style={{ borderColor: "rgba(255,255,255,0.06)", background: "rgba(116,185,255,0.08)" }}>
                <div className="flex items-center gap-2">
                  <motion.div className="w-7 h-7 rounded-xl flex items-center justify-center text-base" style={{ background: "rgba(116,185,255,0.2)" }}
                    animate={{ boxShadow: ["0 0 0 0 rgba(116,185,255,0.4)", "0 0 0 6px transparent"] }} transition={{ duration: 1.5, repeat: Infinity }}>
                    🏙️
                  </motion.div>
                  <div>
                    <div className="text-sm font-bold text-white">City AI Analyst</div>
                    <div className="text-xs text-blue-400">{currentCity ? `Analysing ${currentCity}` : "City Intelligence"}</div>
                  </div>
                </div>
                <button onClick={() => setChatOpen(false)} className="text-white/30 hover:text-white"><X className="w-4 h-4" /></button>
              </div>
              <div className="overflow-y-auto p-3 space-y-3" style={{ maxHeight: 330 }}>
                {chatMsgs.map((msg, i) => (
                  <motion.div key={i} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
                    className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                    <div className="max-w-[85%] px-3 py-2.5 rounded-2xl text-sm leading-relaxed"
                      style={{
                        background: msg.role === "user" ? "rgba(116,185,255,0.2)" : "rgba(255,255,255,0.07)",
                        color: "rgba(255,255,255,0.9)",
                        borderRadius: msg.role === "user" ? "16px 16px 4px 16px" : "16px 16px 16px 4px",
                      }}>
                      {msg.text}
                    </div>
                  </motion.div>
                ))}
                {chatLoading && (
                  <div className="flex justify-start">
                    <div className="px-3 py-2.5 rounded-2xl" style={{ background: "rgba(255,255,255,0.07)", borderRadius: "16px 16px 16px 4px" }}>
                      <div className="flex gap-1">{[0, 1, 2].map(i => <div key={i} className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-bounce" style={{ animationDelay: `${i * 0.15}s` }} />)}</div>
                    </div>
                  </div>
                )}
                <div ref={chatEndRef} />
              </div>
              <div className="px-3 pb-3">
                <div className="flex items-center gap-2 p-2 rounded-xl border mb-2" style={{ background: "rgba(255,255,255,0.05)", borderColor: "rgba(255,255,255,0.1)" }}>
                  <input value={chatInput} onChange={e => setChatInput(e.target.value)} onKeyDown={e => e.key === "Enter" && sendChat()}
                    placeholder={currentCity ? `Ask about ${currentCity}...` : "Ask about any city..."}
                    className="flex-1 bg-transparent text-sm text-white placeholder-white/30 outline-none" />
                  <button onClick={sendChat} disabled={chatLoading || !chatInput.trim()}
                    className="w-7 h-7 rounded-lg flex items-center justify-center disabled:opacity-40"
                    style={{ background: "rgba(116,185,255,0.25)" }}>
                    <Send className="w-3.5 h-3.5 text-blue-300" />
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
          style={{ background: "linear-gradient(135deg, #0984e3, #74b9ff)", color: "white", boxShadow: "0 8px 32px rgba(116,185,255,0.35)" }}
          animate={{ boxShadow: chatOpen ? "0 8px 32px rgba(116,185,255,0.55)" : ["0 8px 32px rgba(116,185,255,0.35)", "0 8px 40px rgba(116,185,255,0.55)", "0 8px 32px rgba(116,185,255,0.35)"] }}
          transition={{ duration: 2, repeat: chatOpen ? 0 : Infinity }}>
          <Bot className="w-5 h-5" />
          <span>{chatOpen ? "Close" : "City AI Analyst"}</span>
          {!chatOpen && <span className="w-2 h-2 rounded-full bg-white animate-pulse" />}
        </motion.button>
      </div>
    </div>
  );
}
