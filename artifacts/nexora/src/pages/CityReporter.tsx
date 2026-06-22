import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search, Bot, Send, X, Newspaper, Loader2, RefreshCw,
  TrendingUp, Zap, MapPin, Radio, Eye, Clock, ArrowUp,
  ArrowDown, Minus, Users, Flame, Sparkles, ChevronRight,
} from "lucide-react";

// ── Types ──────────────────────────────────────────────────────────────────
interface Signal {
  level?: string; busyZones?: string[]; bestTime?: string; icon: string;
  count?: number; crowd?: string; peakTime?: string; types?: string[];
  condition?: string; outdoorGood?: boolean; airQuality?: string; impactNote?: string;
  pulse?: string; businessActivity?: string; marketActivity?: string; growthSignal?: string;
}
interface TimelineSlot { time: string; label: string; activity: string; level: number }
interface Neighborhood { name: string; activity: number; vibe: string; emoji: string; signal: string }
interface ForecastItem { signal: string; trend: string; confidence: number }
interface CityReport {
  cityName: string; status: string; statusColor: string;
  mood: string; moodScore: number; moodEmoji: string;
  activityLevel: number; aiConfidence: number;
  headline: string; story: string; keyAreas: string[];
  signals: { traffic: Signal; events: Signal; weather: Signal; economy: Signal };
  timeline: TimelineSlot[];
  neighborhoods: Neighborhood[];
  localPulse: string[];
  historicalNote: string;
  futureForecast: { next7Days: ForecastItem[]; overallOutlook: string; aiNote: string };
  generatedAt: string;
}
interface CompareData {
  city1: { name: string; activityScore: number; mood: string; topActivity: string; trafficLevel: string; culturePulse: number; foodScene: number; lifestyle: number; growth: number; uniqueFact: string };
  city2: { name: string; activityScore: number; mood: string; topActivity: string; trafficLevel: string; culturePulse: number; foodScene: number; lifestyle: number; growth: number; uniqueFact: string };
  verdict: string;
}

// ── Config ─────────────────────────────────────────────────────────────────
const STATUS_COLORS: Record<string, string> = {
  green: "#00b894", yellow: "#fdcb6e", orange: "#e17055", blue: "#74b9ff",
};
const SIGNAL_COLORS = { traffic: "#74b9ff", events: "#fd79a8", weather: "#55efc4", economy: "#fdcb6e" };
const SAMPLE_CITIES = ["Jaipur", "Varanasi", "Goa", "Indore", "Kota", "Mysore", "Lucknow", "Surat", "Chandigarh", "Udaipur"];
const CITIZEN_TYPES = [
  { id: "event", label: "Local Event", emoji: "🎉" },
  { id: "issue", label: "City Issue", emoji: "⚠️" },
  { id: "discovery", label: "Cool Discovery", emoji: "✨" },
  { id: "recommendation", label: "Recommendation", emoji: "👍" },
];
const CHAT_STARTERS = ["What's happening right now?", "Best time to visit today?", "Any events tonight?", "Traffic situation?"];

function signalLevelColor(level?: string) {
  if (!level) return "#74b9ff";
  const l = level.toLowerCase();
  if (l.includes("high") || l.includes("very") || l.includes("strong") || l.includes("busy")) return "#e17055";
  if (l.includes("moderate") || l.includes("medium") || l.includes("normal")) return "#fdcb6e";
  return "#00b894";
}

function trendIcon(trend: string) {
  if (trend === "up") return <ArrowUp className="w-3 h-3 text-green-400" />;
  if (trend === "down") return <ArrowDown className="w-3 h-3 text-red-400" />;
  return <Minus className="w-3 h-3 text-white/40" />;
}

// ── Component ──────────────────────────────────────────────────────────────
export default function CityReporter() {
  const [searchInput, setSearchInput] = useState("");
  const [currentCity, setCurrentCity] = useState("");
  const [report, setReport] = useState<CityReport | null>(null);
  const [loading, setLoading] = useState(false);
  const [trending, setTrending] = useState<{ name: string; badge: string; desc?: string }[]>([]);
  const [pulseIdx, setPulseIdx] = useState(0);

  // Compare
  const [cmp1, setCmp1] = useState("");
  const [cmp2, setCmp2] = useState("");
  const [compareResult, setCompareResult] = useState<CompareData | null>(null);
  const [compareLoading, setCompareLoading] = useState(false);

  // Citizen reporter
  const [citizenOpen, setCitizenOpen] = useState(false);
  const [citizenType, setCitizenType] = useState("discovery");
  const [citizenDesc, setCitizenDesc] = useState("");
  const [citizenSubmitted, setCitizenSubmitted] = useState(false);
  const [citizenReports, setCitizenReports] = useState<{ description: string; aiCategory?: string; type: string }[]>([]);

  // Chat
  const [chatOpen, setChatOpen] = useState(false);
  const [chatInput, setChatInput] = useState("");
  const [chatLoading, setChatLoading] = useState(false);
  const [chatMessages, setChatMessages] = useState<{ role: "user" | "ai"; text: string }[]>([
    { role: "ai", text: "📡 Live from Nexora HQ — I can generate real-time intelligence reports for any city, town, or neighborhood in India. Enter any place above and I'll start my analysis!" },
  ]);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Typing headline effect
  const [typedHeadline, setTypedHeadline] = useState("");
  const typingRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => { loadTrending(); }, []);
  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [chatMessages]);

  // Rotate local pulse every 3s
  useEffect(() => {
    if (!report?.localPulse?.length) return;
    const t = setInterval(() => setPulseIdx(i => (i + 1) % report.localPulse.length), 3000);
    return () => clearInterval(t);
  }, [report]);

  // Typing effect for headline
  useEffect(() => {
    if (!report?.headline) return;
    setTypedHeadline("");
    let i = 0;
    if (typingRef.current) clearInterval(typingRef.current);
    typingRef.current = setInterval(() => {
      i++;
      setTypedHeadline(report.headline.slice(0, i));
      if (i >= report.headline.length && typingRef.current) clearInterval(typingRef.current);
    }, 38);
    return () => { if (typingRef.current) clearInterval(typingRef.current); };
  }, [report?.headline]);

  async function loadTrending() {
    try {
      const r = await fetch("/api/reporter/trending");
      const d = await r.json();
      setTrending(d.trending || []);
    } catch { /* ok */ }
  }

  async function generateReport(city: string) {
    if (!city.trim()) return;
    setCurrentCity(city.trim());
    setReport(null);
    setLoading(true);
    setPulseIdx(0);
    try {
      const r = await fetch("/api/reporter/report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cityName: city.trim() }),
      });
      setReport(await r.json());
    } finally { setLoading(false); }
  }

  async function runCompare() {
    if (!cmp1.trim() || !cmp2.trim()) return;
    setCompareLoading(true);
    setCompareResult(null);
    try {
      const r = await fetch("/api/reporter/compare", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ city1: cmp1.trim(), city2: cmp2.trim() }),
      });
      setCompareResult(await r.json());
    } finally { setCompareLoading(false); }
  }

  async function submitCitizen() {
    if (!citizenDesc.trim() || !currentCity) return;
    try {
      const r = await fetch("/api/reporter/citizen", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cityName: currentCity, type: citizenType, description: citizenDesc }),
      });
      const d = await r.json();
      setCitizenReports(p => [d, ...p]);
      setCitizenDesc("");
      setCitizenSubmitted(true);
      setTimeout(() => setCitizenSubmitted(false), 3000);
    } catch { /* ok */ }
  }

  async function sendChat() {
    if (!chatInput.trim() || chatLoading) return;
    const msg = chatInput.trim();
    setChatInput("");
    setChatMessages(m => [...m, { role: "user", text: msg }]);
    setChatLoading(true);
    try {
      const r = await fetch("/api/reporter/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: msg, cityName: currentCity || undefined }),
      });
      const d = await r.json();
      setChatMessages(m => [...m, { role: "ai", text: d.reply }]);
    } finally { setChatLoading(false); }
  }

  const statusCol = report ? (STATUS_COLORS[report.statusColor] || "#00b894") : "#00b894";

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen pb-32" style={{ background: "linear-gradient(135deg, #0a0a1a 0%, #0d0d22 60%, #0a150d 100%)" }}>

      {/* ── HERO ─────────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden" style={{ minHeight: 280 }}>
        <div className="absolute inset-0 pointer-events-none">
          {[...Array(8)].map((_, i) => (
            <motion.div key={i} className="absolute h-px w-full opacity-20"
              style={{ background: `rgba(229,112,60,${0.04 + i * 0.01})`, top: `${10 + i * 11}%` }}
              animate={{ x: [0, 15, 0] }} transition={{ duration: 4 + i, repeat: Infinity }} />
          ))}
          {[...Array(14)].map((_, i) => (
            <motion.div key={i} className="absolute w-1 h-1 rounded-full"
              style={{
                background: i % 3 === 0 ? "#e17055" : i % 3 === 1 ? "#74b9ff" : "#00b894",
                left: `${(i * 7.3) % 100}%`, top: `${(i * 13) % 100}%`, opacity: 0.3,
              }}
              animate={{ opacity: [0.2, 0.7, 0.2], scale: [1, 1.6, 1] }}
              transition={{ duration: 2 + (i % 3), repeat: Infinity, delay: (i * 0.3) % 2 }} />
          ))}
          <div className="absolute right-0 top-0 w-96 h-96 rounded-full blur-3xl"
            style={{ background: "radial-gradient(circle, rgba(229,112,60,0.08) 0%, transparent 70%)" }} />
        </div>

        <div className="relative z-10 px-6 pt-10 pb-6 max-w-6xl mx-auto">
          <div className="flex items-center gap-4 mb-5">
            <motion.div className="w-16 h-16 rounded-2xl flex items-center justify-center text-3xl border"
              style={{ background: "rgba(229,112,60,0.15)", borderColor: "rgba(229,112,60,0.4)" }}
              animate={{ boxShadow: ["0 0 20px rgba(229,112,60,0.2)", "0 0 45px rgba(229,112,60,0.5)", "0 0 20px rgba(229,112,60,0.2)"] }}
              transition={{ duration: 2, repeat: Infinity }}>
              📰
            </motion.div>
            <div>
              <h1 className="text-4xl md:text-5xl font-black text-white">City Reporter</h1>
              <p className="text-white/50 mt-1">AI-generated live intelligence report for any place — city, town, village, or landmark.</p>
            </div>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { icon: "🌍", label: "Any Location", sub: "No fixed list", color: "#74b9ff" },
              { icon: "📡", label: "Live Signals", sub: "Real-time AI", color: "#e17055" },
              { icon: "🤖", label: "AI Reports", sub: "Gemini powered", color: "#a29bfe" },
              { icon: "🇮🇳", label: "India Focus", sub: "Every city", color: "#fdcb6e" },
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
          <div className="rounded-3xl border overflow-hidden" style={{ background: "rgba(255,255,255,0.025)", borderColor: "rgba(229,112,60,0.3)" }}>
            <div className="flex items-center gap-3 px-5 py-4">
              <motion.div animate={{ scale: [1, 1.2, 1] }} transition={{ duration: 1.5, repeat: Infinity }}>
                <Radio className="w-5 h-5 text-orange-400 flex-shrink-0" />
              </motion.div>
              <input value={searchInput} onChange={e => setSearchInput(e.target.value)}
                onKeyDown={e => e.key === "Enter" && generateReport(searchInput)}
                placeholder="Enter any city, town, village, neighborhood, landmark..."
                className="flex-1 bg-transparent text-white placeholder-white/30 text-lg outline-none" />
              {loading && <Loader2 className="w-5 h-5 animate-spin text-orange-400 flex-shrink-0" />}
              {!loading && searchInput && (
                <button onClick={() => generateReport(searchInput)}
                  className="px-5 py-2 rounded-xl font-bold text-sm"
                  style={{ background: "rgba(229,112,60,0.2)", color: "#e17055", border: "1px solid rgba(229,112,60,0.4)" }}>
                  Generate Report →
                </button>
              )}
              {report && !loading && (
                <button onClick={() => generateReport(currentCity)} title="Refresh"
                  className="p-2 rounded-xl border text-white/40 hover:text-white"
                  style={{ borderColor: "rgba(255,255,255,0.1)" }}>
                  <RefreshCw className="w-4 h-4" />
                </button>
              )}
            </div>
            <div className="px-5 pb-4 flex flex-wrap gap-2">
              {SAMPLE_CITIES.map(c => (
                <button key={c} onClick={() => { setSearchInput(c); generateReport(c); }}
                  className="px-3 py-1.5 rounded-full text-xs border transition-all hover:border-orange-400/50 hover:text-orange-300 text-white/40"
                  style={{ background: "rgba(255,255,255,0.03)", borderColor: "rgba(255,255,255,0.07)" }}>
                  {c}
                </button>
              ))}
            </div>
          </div>
        </section>

        {/* ── LOADING ────────────────────────────────────────────────── */}
        <AnimatePresence>
          {loading && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="text-center py-14">
              <motion.div animate={{ rotate: 360 }} transition={{ duration: 2, repeat: Infinity, ease: "linear" }}>
                <Radio className="w-10 h-10 text-orange-400 mx-auto" />
              </motion.div>
              <p className="text-white/50 mt-4">AI reporter scanning <span className="text-orange-400 font-medium">{currentCity}</span>...</p>
              <div className="flex justify-center gap-2 mt-3">
                {["Signals", "Pulse", "Events", "Culture", "Economy"].map((s, i) => (
                  <motion.span key={s} className="text-xs text-white/30" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.3 }}>
                    {s} ·
                  </motion.span>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── FULL REPORT ────────────────────────────────────────────── */}
        {report && !loading && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-5">

            {/* Report Card */}
            <div className="rounded-3xl border overflow-hidden" style={{
              background: "linear-gradient(135deg, rgba(229,112,60,0.07), rgba(116,185,255,0.03))",
              borderColor: "rgba(229,112,60,0.3)",
            }}>
              <div className="p-6">
                {/* Status bar */}
                <div className="flex items-center justify-between flex-wrap gap-3 mb-4">
                  <div className="flex items-center gap-3">
                    <motion.div className="w-2.5 h-2.5 rounded-full" style={{ background: statusCol }}
                      animate={{ boxShadow: [`0 0 0 0 ${statusCol}66`, `0 0 0 8px transparent`] }}
                      transition={{ duration: 1.2, repeat: Infinity }} />
                    <span className="text-sm font-bold text-white">{report.status}</span>
                    <span className="px-2 py-0.5 rounded-full text-xs text-white/40 border" style={{ borderColor: "rgba(255,255,255,0.1)" }}>
                      {report.aiConfidence}% AI confidence
                    </span>
                    <span className="text-xs text-white/25">
                      {new Date(report.generatedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">{report.moodEmoji}</span>
                    <div>
                      <div className="text-xs text-white/35">City Mood</div>
                      <div className="font-bold text-sm" style={{ color: statusCol }}>{report.mood}</div>
                    </div>
                  </div>
                </div>

                {/* Headline */}
                <div className="mb-5">
                  <div className="text-xs text-orange-400 font-medium uppercase tracking-widest mb-1.5">📰 AI HEADLINE</div>
                  <h2 className="text-2xl md:text-3xl font-black text-white leading-tight">
                    {typedHeadline}
                    <motion.span className="text-orange-400" animate={{ opacity: [1, 0] }} transition={{ duration: 0.5, repeat: Infinity }}>|</motion.span>
                  </h2>
                </div>

                {/* Mood meter + bars */}
                <div className="grid md:grid-cols-3 gap-4 mb-5">
                  <div className="flex flex-col items-center justify-center rounded-2xl p-4"
                    style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)" }}>
                    <div className="relative w-28 h-28 mb-2">
                      <svg viewBox="0 0 100 100" className="w-full h-full">
                        <circle cx="50" cy="50" r="42" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="7" />
                        <motion.circle cx="50" cy="50" r="42" fill="none" stroke={statusCol} strokeWidth="7"
                          strokeLinecap="round" transform="rotate(-90 50 50)"
                          initial={{ strokeDashoffset: 264 }}
                          animate={{ strokeDashoffset: 264 - (report.moodScore / 100) * 264 }}
                          style={{ strokeDasharray: 264 }} transition={{ duration: 1.2 }} />
                      </svg>
                      <div className="absolute inset-0 flex flex-col items-center justify-center">
                        <div className="text-2xl">{report.moodEmoji}</div>
                        <div className="text-xl font-black" style={{ color: statusCol }}>{report.moodScore}</div>
                      </div>
                    </div>
                    <div className="text-sm font-bold text-white">{report.mood}</div>
                    <div className="text-xs text-white/30 mt-0.5">City Mood</div>
                  </div>
                  <div className="md:col-span-2 space-y-4">
                    {[
                      { label: "Activity Level", val: report.activityLevel, color: "#e17055" },
                      { label: "AI Confidence", val: report.aiConfidence, color: "#a29bfe" },
                    ].map(b => (
                      <div key={b.label}>
                        <div className="flex justify-between text-xs mb-1.5">
                          <span className="text-white/50">{b.label}</span>
                          <span className="font-bold" style={{ color: b.color }}>{b.val}%</span>
                        </div>
                        <div className="h-2 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.06)" }}>
                          <motion.div className="h-full rounded-full" style={{ background: b.color }}
                            initial={{ width: 0 }} animate={{ width: `${b.val}%` }} transition={{ duration: 0.9 }} />
                        </div>
                      </div>
                    ))}
                    <div>
                      <div className="text-xs text-white/30 mb-2">Active Areas</div>
                      <div className="flex flex-wrap gap-1.5">
                        {report.keyAreas.map(a => (
                          <span key={a} className="px-2.5 py-1 rounded-full text-xs font-medium text-orange-300"
                            style={{ background: "rgba(229,112,60,0.12)", border: "1px solid rgba(229,112,60,0.22)" }}>
                            📍 {a}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Story */}
                <div className="p-4 rounded-2xl" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}>
                  <div className="text-xs text-orange-400 font-medium uppercase tracking-wider mb-2">📰 Today's City Story</div>
                  <p className="text-white/80 leading-relaxed text-sm">{report.story}</p>
                </div>
              </div>
            </div>

            {/* Live Signal Cards */}
            <div className="grid md:grid-cols-2 gap-4">
              {(["traffic", "events", "weather", "economy"] as const).map((key, idx) => {
                const s = report.signals[key];
                const color = SIGNAL_COLORS[key];
                const titles: Record<string, string> = {
                  traffic: "🚗 Movement Report", events: "🎉 Events Report",
                  weather: "🌤️ Environment", economy: "📊 Economy Pulse",
                };
                return (
                  <motion.div key={key} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.09 }}
                    className="rounded-2xl border p-5" style={{ background: "rgba(255,255,255,0.02)", borderColor: `${color}22` }}>
                    <div className="flex items-center gap-2 mb-4">
                      <div className="w-8 h-8 rounded-xl flex items-center justify-center text-lg" style={{ background: `${color}15` }}>{s.icon}</div>
                      <span className="font-bold text-white text-sm">{titles[key]}</span>
                    </div>
                    <div className="space-y-2 text-sm">
                      {key === "traffic" && <>
                        <div className="flex justify-between">
                          <span className="text-white/40">Traffic</span>
                          <span className="font-medium" style={{ color: signalLevelColor(s.level) }}>{s.level}</span>
                        </div>
                        {s.busyZones && <div className="text-xs text-white/30">Busy: {s.busyZones.join(", ")}</div>}
                        {s.bestTime && <div className="mt-2 px-3 py-1.5 rounded-lg text-xs text-white/60" style={{ background: "rgba(255,255,255,0.04)" }}>✅ {s.bestTime}</div>}
                      </>}
                      {key === "events" && <>
                        <div className="flex justify-between">
                          <span className="text-white/40">Events Today</span>
                          <span className="font-black text-lg" style={{ color }}>{s.count}</span>
                        </div>
                        <div className="flex justify-between text-xs">
                          <span className="text-white/30">Crowd: <span className="text-white">{s.crowd}</span></span>
                          <span className="text-white/30">Peak: <span className="text-white">{s.peakTime}</span></span>
                        </div>
                        {s.types && <div className="flex gap-1.5 flex-wrap mt-1">{s.types.map(t => <span key={t} className="text-xs px-2 py-0.5 rounded-full text-pink-300" style={{ background: "rgba(253,121,168,0.1)" }}>{t}</span>)}</div>}
                      </>}
                      {key === "weather" && <>
                        <div className="flex justify-between">
                          <span className="text-white/40">Condition</span>
                          <span className="text-white font-medium">{s.condition}</span>
                        </div>
                        <div className="flex justify-between text-xs">
                          <span className="text-white/30">Air: <span style={{ color: signalLevelColor(s.airQuality) }}>{s.airQuality}</span></span>
                          <span style={{ color: s.outdoorGood ? "#00b894" : "#e17055" }}>{s.outdoorGood ? "✅ Good outdoors" : "⚠️ Stay indoors"}</span>
                        </div>
                        {s.impactNote && <p className="text-xs text-white/40 mt-1">{s.impactNote}</p>}
                      </>}
                      {key === "economy" && <>
                        <div className="flex justify-between">
                          <span className="text-white/40">Pulse</span>
                          <span className="font-medium" style={{ color: signalLevelColor(s.pulse) }}>{s.pulse}</span>
                        </div>
                        <div className="flex justify-between text-xs">
                          <span className="text-white/30">Business: <span className="text-white">{s.businessActivity}</span></span>
                          <span className="text-white/30">Markets: <span className="text-white">{s.marketActivity}</span></span>
                        </div>
                        {s.growthSignal && (
                          <div className="mt-1 flex items-center gap-1 text-xs" style={{ color: s.growthSignal === "Positive" ? "#00b894" : s.growthSignal === "Negative" ? "#e17055" : "#fdcb6e" }}>
                            <TrendingUp className="w-3 h-3" /> Growth: {s.growthSignal}
                          </div>
                        )}
                      </>}
                    </div>
                  </motion.div>
                );
              })}
            </div>

            {/* Local Pulse + Neighborhoods */}
            <div className="grid md:grid-cols-2 gap-4">
              <div className="rounded-2xl border p-5" style={{ background: "rgba(255,255,255,0.02)", borderColor: "rgba(255,255,255,0.07)" }}>
                <div className="flex items-center gap-2 mb-4">
                  <motion.div animate={{ scale: [1, 1.2, 1] }} transition={{ duration: 1, repeat: Infinity }}>
                    <Zap className="w-4 h-4 text-yellow-400" />
                  </motion.div>
                  <span className="font-bold text-white text-sm">Local Pulse Feed</span>
                  <span className="text-xs px-2 py-0.5 rounded-full text-green-400" style={{ background: "rgba(0,184,148,0.12)" }}>● LIVE</span>
                </div>
                <div className="space-y-2" style={{ minHeight: 160 }}>
                  {report.localPulse.map((pulse, i) => (
                    <motion.div key={i} className="px-3 py-2.5 rounded-xl text-sm text-white/80 border transition-all"
                      animate={{ opacity: i === pulseIdx ? 1 : 0.4, x: i === pulseIdx ? 4 : 0 }}
                      style={{
                        background: i === pulseIdx ? "rgba(229,112,60,0.08)" : "rgba(255,255,255,0.02)",
                        borderColor: i === pulseIdx ? "rgba(229,112,60,0.3)" : "rgba(255,255,255,0.05)",
                      }}>
                      {pulse}
                    </motion.div>
                  ))}
                </div>
              </div>

              <div className="rounded-2xl border p-5" style={{ background: "rgba(255,255,255,0.02)", borderColor: "rgba(255,255,255,0.07)" }}>
                <div className="flex items-center gap-2 mb-4">
                  <MapPin className="w-4 h-4 text-blue-400" />
                  <span className="font-bold text-white text-sm">Neighborhood Highlights</span>
                </div>
                <div className="space-y-3">
                  {report.neighborhoods.map((n, i) => (
                    <motion.div key={n.name} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.1 }}
                      className="flex items-center gap-3">
                      <span className="text-xl">{n.emoji}</span>
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm font-medium text-white">{n.name}</span>
                          <span className="text-xs font-bold" style={{ color: n.signal === "high" ? "#e17055" : n.signal === "medium" ? "#fdcb6e" : "#00b894" }}>{n.activity}%</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.06)" }}>
                            <motion.div className="h-full rounded-full"
                              style={{ background: n.signal === "high" ? "#e17055" : n.signal === "medium" ? "#fdcb6e" : "#00b894" }}
                              initial={{ width: 0 }} animate={{ width: `${n.activity}%` }} transition={{ duration: 0.7, delay: i * 0.1 }} />
                          </div>
                          <span className="text-xs text-white/30">{n.vibe}</span>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            </div>

            {/* City Timeline */}
            <div className="rounded-2xl border p-5" style={{ background: "rgba(255,255,255,0.02)", borderColor: "rgba(255,255,255,0.07)" }}>
              <div className="flex items-center gap-2 mb-5">
                <Clock className="w-4 h-4 text-purple-400" />
                <span className="font-bold text-white">City Timeline — Today</span>
              </div>
              <div className="relative">
                <div className="absolute left-16 top-0 bottom-0 w-px" style={{ background: "rgba(255,255,255,0.06)" }} />
                <div className="space-y-4">
                  {report.timeline.map((slot, i) => {
                    const h = new Date().getHours();
                    const slotH = parseInt(slot.time);
                    const nextH = report.timeline[i + 1] ? parseInt(report.timeline[i + 1].time) : 24;
                    const isCurrent = h >= slotH && h < nextH;
                    return (
                      <motion.div key={slot.time} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.07 }}
                        className="flex items-start gap-4">
                        <div className={`w-12 text-right text-xs font-bold flex-shrink-0 mt-1 ${isCurrent ? "text-orange-400" : "text-white/30"}`}>
                          {slot.time}
                        </div>
                        <div className="relative z-10 mt-1">
                          <div className={`w-3 h-3 rounded-full border-2 flex-shrink-0 ${isCurrent ? "border-orange-400" : "border-white/20"}`}
                            style={{ background: isCurrent ? "#e17055" : "transparent", boxShadow: isCurrent ? "0 0 8px rgba(229,112,60,0.6)" : "none" }} />
                        </div>
                        <div className="flex-1 rounded-xl px-3 py-2.5 text-sm"
                          style={{ background: isCurrent ? "rgba(229,112,60,0.08)" : "rgba(255,255,255,0.02)", border: `1px solid ${isCurrent ? "rgba(229,112,60,0.25)" : "transparent"}` }}>
                          <div className="font-medium text-white mb-0.5">
                            {slot.label} {isCurrent && <span className="text-xs text-orange-400 ml-1">← NOW</span>}
                          </div>
                          <div className="text-xs text-white/50 mb-1.5">{slot.activity}</div>
                          <div className="h-1 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.06)" }}>
                            <div className="h-full rounded-full" style={{ background: isCurrent ? "#e17055" : "#74b9ff", width: `${slot.level}%`, opacity: isCurrent ? 1 : 0.5 }} />
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Historical + Future */}
            <div className="grid md:grid-cols-2 gap-4">
              <div className="rounded-2xl border p-5" style={{ background: "rgba(255,255,255,0.02)", borderColor: "rgba(255,255,255,0.07)" }}>
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-xl">📜</span>
                  <span className="font-bold text-white text-sm">Historical Reporter</span>
                </div>
                <div className="px-3 py-3 rounded-xl text-sm text-white/60 italic leading-relaxed"
                  style={{ background: "rgba(255,255,255,0.04)", borderLeft: "2px solid rgba(162,155,254,0.4)" }}>
                  {report.historicalNote}
                </div>
                <p className="text-xs text-white/25 mt-2 flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full inline-block" style={{ background: "#a29bfe" }} />
                  {report.cityName} today — evolved, alive, unique
                </p>
              </div>

              <div className="rounded-2xl border p-5" style={{ background: "linear-gradient(135deg, rgba(162,155,254,0.06), rgba(0,0,0,0))", borderColor: "rgba(162,155,254,0.25)" }}>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className="text-xl">🔮</span>
                    <span className="font-bold text-white text-sm">7-Day Forecast</span>
                  </div>
                  <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: "rgba(0,184,148,0.12)", color: "#00b894" }}>
                    {report.futureForecast.overallOutlook}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2 mb-3">
                  {report.futureForecast.next7Days.map(item => (
                    <div key={item.signal} className="flex items-center justify-between px-3 py-2 rounded-lg"
                      style={{ background: "rgba(255,255,255,0.04)" }}>
                      <div>
                        <div className="text-xs text-white/60">{item.signal}</div>
                        <div className="text-xs text-white/30">{item.confidence}% conf.</div>
                      </div>
                      <div className="flex items-center gap-1">
                        {trendIcon(item.trend)}
                        <span className="text-xs" style={{ color: item.trend === "up" ? "#00b894" : item.trend === "down" ? "#e17055" : "#fdcb6e" }}>{item.trend}</span>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="flex items-start gap-2 text-xs text-white/50 italic">
                  <Bot className="w-3.5 h-3.5 text-purple-400 flex-shrink-0 mt-0.5" />
                  {report.futureForecast.aiNote}
                </div>
              </div>
            </div>

            {/* Citizen Reporter */}
            <div className="rounded-2xl border overflow-hidden" style={{ background: "rgba(255,255,255,0.02)", borderColor: "rgba(255,255,255,0.08)" }}>
              <div className="p-5 border-b flex items-center justify-between" style={{ borderColor: "rgba(255,255,255,0.06)" }}>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: "rgba(0,184,148,0.15)" }}>
                    <Users className="w-4 h-4 text-green-400" />
                  </div>
                  <span className="font-bold text-white">Citizen Reporter</span>
                  <span className="text-xs text-white/30">Report something from {currentCity}</span>
                </div>
                <button onClick={() => setCitizenOpen(!citizenOpen)}
                  className="text-xs px-3 py-1.5 rounded-xl border"
                  style={{ borderColor: "rgba(0,184,148,0.3)", color: "#00b894", background: "rgba(0,184,148,0.08)" }}>
                  {citizenOpen ? "Cancel" : "+ Add Report"}
                </button>
              </div>
              <AnimatePresence>
                {citizenOpen && (
                  <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                    <div className="p-5 space-y-4">
                      <div className="flex gap-2 flex-wrap">
                        {CITIZEN_TYPES.map(t => (
                          <button key={t.id} onClick={() => setCitizenType(t.id)}
                            className="px-3 py-2 rounded-xl text-sm border transition-all"
                            style={{
                              background: citizenType === t.id ? "rgba(0,184,148,0.15)" : "rgba(255,255,255,0.04)",
                              borderColor: citizenType === t.id ? "rgba(0,184,148,0.4)" : "rgba(255,255,255,0.08)",
                              color: citizenType === t.id ? "#00b894" : "rgba(255,255,255,0.5)",
                            }}>
                            {t.emoji} {t.label}
                          </button>
                        ))}
                      </div>
                      <textarea value={citizenDesc} onChange={e => setCitizenDesc(e.target.value)} rows={3}
                        placeholder={`Describe what you're seeing in ${currentCity}...`}
                        className="w-full px-4 py-3 rounded-xl border text-sm text-white placeholder-white/30 outline-none resize-none"
                        style={{ background: "rgba(255,255,255,0.05)", borderColor: "rgba(255,255,255,0.1)" }} />
                      <div className="flex items-center justify-between">
                        <AnimatePresence>
                          {citizenSubmitted && (
                            <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="text-sm text-green-400">
                              ✅ Report submitted! AI is verifying...
                            </motion.span>
                          )}
                        </AnimatePresence>
                        <button onClick={submitCitizen} disabled={!citizenDesc.trim()}
                          className="ml-auto px-5 py-2.5 rounded-xl font-bold text-sm disabled:opacity-40"
                          style={{ background: "rgba(0,184,148,0.2)", color: "#00b894", border: "1px solid rgba(0,184,148,0.3)" }}>
                          Submit Report →
                        </button>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
              {citizenReports.length > 0 && (
                <div className="px-5 pb-4 space-y-2">
                  <p className="text-xs text-white/30 font-medium uppercase tracking-wider mb-2">Recent Citizen Reports</p>
                  {citizenReports.slice(0, 3).map((r, i) => (
                    <div key={i} className="flex items-start gap-2 px-3 py-2 rounded-lg text-xs"
                      style={{ background: "rgba(0,184,148,0.06)", border: "1px solid rgba(0,184,148,0.15)" }}>
                      <span className="text-green-400 flex-shrink-0 mt-0.5">📍</span>
                      <span className="text-white/70">{r.description}</span>
                      {r.aiCategory && <span className="ml-1 text-green-400/60 flex-shrink-0">— {r.aiCategory}</span>}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        )}

        {/* Trending Reports */}
        <section>
          <div className="flex items-center gap-3 mb-4">
            <Flame className="w-5 h-5 text-orange-400" />
            <h2 className="text-lg font-bold text-white">Trending City Reports</h2>
            <span className="text-xs text-white/30">AI highlights</span>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {trending.map((city, i) => (
              <motion.button key={city.name} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}
                onClick={() => { setSearchInput(city.name); generateReport(city.name); }}
                className="text-left rounded-2xl border p-4 transition-all hover:border-orange-400/40"
                style={{ background: "rgba(255,255,255,0.02)", borderColor: "rgba(255,255,255,0.07)" }}>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs px-2 py-0.5 rounded-full font-medium text-orange-300" style={{ background: "rgba(229,112,60,0.12)" }}>
                    {city.badge}
                  </span>
                  <ChevronRight className="w-3.5 h-3.5 text-white/20" />
                </div>
                <div className="font-black text-white">{city.name}</div>
                {city.desc && <div className="text-xs text-white/40 mt-0.5">{city.desc}</div>}
              </motion.button>
            ))}
          </div>
        </section>

        {/* Compare Cities */}
        <section>
          <div className="flex items-center gap-3 mb-4">
            <Eye className="w-5 h-5 text-blue-400" />
            <h2 className="text-lg font-bold text-white">Compare City Reports</h2>
          </div>
          <div className="rounded-2xl border p-5" style={{ background: "rgba(255,255,255,0.02)", borderColor: "rgba(116,185,255,0.2)" }}>
            <div className="grid md:grid-cols-2 gap-4 mb-4">
              {[{ v: cmp1, set: setCmp1, ph: "City A — e.g. Jaipur" }, { v: cmp2, set: setCmp2, ph: "City B — e.g. Lucknow" }].map((f, i) => (
                <input key={i} value={f.v} onChange={e => f.set(e.target.value)} placeholder={f.ph}
                  className="w-full px-4 py-3 rounded-xl border text-sm text-white placeholder-white/30 outline-none"
                  style={{ background: "rgba(255,255,255,0.05)", borderColor: "rgba(255,255,255,0.1)" }} />
              ))}
            </div>
            <button onClick={runCompare} disabled={!cmp1.trim() || !cmp2.trim() || compareLoading}
              className="w-full py-3 rounded-xl font-bold text-sm disabled:opacity-40"
              style={{ background: "rgba(116,185,255,0.12)", color: "#74b9ff", border: "1px solid rgba(116,185,255,0.3)" }}>
              {compareLoading
                ? <span className="flex items-center gap-2 justify-center"><Loader2 className="w-4 h-4 animate-spin" />AI comparing...</span>
                : `📊 Compare ${cmp1 || "City A"} vs ${cmp2 || "City B"}`}
            </button>
            <AnimatePresence>
              {compareResult && (
                <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="mt-5 space-y-4">
                  <div className="grid md:grid-cols-2 gap-4">
                    {[compareResult.city1, compareResult.city2].map((city, ci) => (
                      <div key={city.name} className="rounded-2xl border p-4"
                        style={{ background: "rgba(255,255,255,0.03)", borderColor: ci === 0 ? "rgba(116,185,255,0.25)" : "rgba(253,121,168,0.25)" }}>
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-black text-white">{city.name}</h4>
                          <span className="text-2xl font-black" style={{ color: ci === 0 ? "#74b9ff" : "#fd79a8" }}>{city.activityScore}</span>
                        </div>
                        <p className="text-xs text-white/40 italic mb-3">{city.uniqueFact}</p>
                        {[
                          { l: "Culture", v: city.culturePulse },
                          { l: "Food Scene", v: city.foodScene },
                          { l: "Lifestyle", v: city.lifestyle },
                          { l: "Growth", v: city.growth },
                        ].map(row => (
                          <div key={row.l} className="mb-2">
                            <div className="flex justify-between text-xs mb-0.5">
                              <span className="text-white/40">{row.l}</span>
                              <span style={{ color: ci === 0 ? "#74b9ff" : "#fd79a8" }}>{row.v}</span>
                            </div>
                            <div className="h-1 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.06)" }}>
                              <div className="h-full rounded-full" style={{ background: ci === 0 ? "#74b9ff" : "#fd79a8", width: `${row.v}%` }} />
                            </div>
                          </div>
                        ))}
                      </div>
                    ))}
                  </div>
                  <div className="flex items-start gap-2 p-4 rounded-2xl"
                    style={{ background: "rgba(162,155,254,0.08)", border: "1px solid rgba(162,155,254,0.2)" }}>
                    <Bot className="w-5 h-5 text-purple-400 flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-white/80">{compareResult.verdict}</p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </section>

      </div>

      {/* Floating AI Reporter Chat */}
      <div className="fixed bottom-6 right-6 z-50">
        <AnimatePresence>
          {chatOpen && (
            <motion.div initial={{ opacity: 0, scale: 0.85, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.85, y: 20 }}
              className="mb-4 rounded-3xl border overflow-hidden"
              style={{ width: 340, maxHeight: 500, background: "#0e0e1c", borderColor: "rgba(229,112,60,0.35)", boxShadow: "0 20px 60px rgba(0,0,0,0.5)" }}>
              <div className="flex items-center justify-between px-4 py-3 border-b" style={{ borderColor: "rgba(255,255,255,0.06)", background: "rgba(229,112,60,0.08)" }}>
                <div className="flex items-center gap-2">
                  <motion.div className="w-7 h-7 rounded-xl flex items-center justify-center" style={{ background: "rgba(229,112,60,0.2)" }}
                    animate={{ boxShadow: ["0 0 0 0 rgba(229,112,60,0.4)", "0 0 0 6px transparent"] }} transition={{ duration: 1.5, repeat: Infinity }}>
                    <Newspaper className="w-4 h-4 text-orange-400" />
                  </motion.div>
                  <div>
                    <div className="text-sm font-bold text-white">AI Reporter</div>
                    <div className="text-xs text-orange-400">{currentCity ? `On ground in ${currentCity}` : "Global City Intel"}</div>
                  </div>
                </div>
                <button onClick={() => setChatOpen(false)} className="text-white/30 hover:text-white"><X className="w-4 h-4" /></button>
              </div>
              <div className="overflow-y-auto p-3 space-y-3" style={{ maxHeight: 330 }}>
                {chatMessages.map((msg, i) => (
                  <motion.div key={i} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                    className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                    <div className="max-w-[85%] px-3 py-2.5 rounded-2xl text-sm leading-relaxed"
                      style={{
                        background: msg.role === "user" ? "rgba(229,112,60,0.25)" : "rgba(255,255,255,0.07)",
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
                      <div className="flex gap-1">{[0, 1, 2].map(i => <div key={i} className="w-1.5 h-1.5 rounded-full bg-orange-400 animate-bounce" style={{ animationDelay: `${i * 0.15}s` }} />)}</div>
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
                    style={{ background: "rgba(229,112,60,0.25)" }}>
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
          style={{ background: "linear-gradient(135deg, #c0392b, #e17055)", color: "white", boxShadow: "0 8px 32px rgba(224,112,60,0.4)" }}
          animate={{ boxShadow: chatOpen ? "0 8px 32px rgba(224,112,60,0.6)" : ["0 8px 32px rgba(224,112,60,0.4)", "0 8px 40px rgba(224,112,60,0.6)", "0 8px 32px rgba(224,112,60,0.4)"] }}
          transition={{ duration: 2, repeat: chatOpen ? 0 : Infinity }}>
          <Radio className="w-5 h-5" />
          <span>{chatOpen ? "Close" : "Ask Reporter AI"}</span>
          {!chatOpen && <span className="w-2 h-2 rounded-full bg-white animate-pulse" />}
        </motion.button>
      </div>
    </div>
  );
}
