import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search, Bot, Send, X, Heart, Star, Loader2, ChevronRight,
  Sparkles, MapPin, TrendingUp, DollarSign, Sun, Briefcase,
  GraduationCap, Users, Zap, Leaf, Camera, Rocket, Shield,
  ArrowUpRight, CheckCircle, RefreshCw, BookOpen, Coffee, Moon,
  Home, Plus, Trash2, BarChart2,
} from "lucide-react";

// ── Types ──────────────────────────────────────────────────────────────────
interface CityProfile {
  cityName: string; country: string; state: string; tier: string;
  personality: string; tagline: string; description: string;
  dna: Record<string, number>;
  climate: { type: string; temp: string; bestMonths: string[]; humidity: string };
  costOfLiving: Record<string, string>;
  opportunities: { topSectors: string[]; startupEcosystem: string; avgSalary: string; jobGrowth: string };
  lifestyle: Record<string, string>;
  education: { topColleges: string[]; schoolDensity: string; coachingCulture: string };
  hiddenGems: string[];
  dayInLife: Record<string, string>;
  futurePrediction: { year: number; growth: string; infrastructure: string; population: string; topTrend: string; aiPrediction: string };
  mood: { label: string; score: number; description: string };
  generatedAt: string;
}

interface MatchResult {
  cityName: string; lifestyle: string[]; score: number; verdict: string; summary: string;
  pros: string[]; cons: string[]; bestAreas: string[]; localInsiderTip: string;
  alternativeCities: string[]; matchBreakdown: Record<string, number>;
  aiMessage: string; generatedAt: string;
}

interface CompareResult {
  city1: { name: string; score: number; personality: string; bestFor: string; cost: string; weather: string; jobs: string; culture: string; verdict: string };
  city2: { name: string; score: number; personality: string; bestFor: string; cost: string; weather: string; jobs: string; culture: string; verdict: string };
  metrics: Record<string, { city1: number; city2: number; label: string }>;
  winner: string; aiVerdict: string; generatedAt: string;
}

interface SavedCity { id: string; cityName: string; score?: number; list: string; savedAt: string }
interface IntelCategory { id: string; label: string; emoji: string; cities: string[]; description: string }

// ── Config ─────────────────────────────────────────────────────────────────
const LIFESTYLE_OPTIONS = [
  { id: "student", label: "Student", emoji: "🎓", color: "#74b9ff" },
  { id: "career", label: "Career Growth", emoji: "💼", color: "#00cec9" },
  { id: "entrepreneur", label: "Entrepreneur", emoji: "🚀", color: "#fdcb6e" },
  { id: "family", label: "Family", emoji: "👨‍👩‍👧", color: "#fd79a8" },
  { id: "traveler", label: "Explorer", emoji: "🌎", color: "#a29bfe" },
  { id: "creative", label: "Creative", emoji: "🎨", color: "#e17055" },
  { id: "peaceful", label: "Peaceful Life", emoji: "🌱", color: "#00b894" },
  { id: "fastpace", label: "Fast-Paced Life", emoji: "🔥", color: "#ff6b6b" },
];

const QUIZ_QUESTIONS = [
  { id: "priority", q: "What matters most to you?", opts: ["Low Cost", "High Salary", "Culture", "Nature", "Nightlife", "Education"] },
  { id: "pace", q: "Preferred city pace?", opts: ["Slow & Peaceful", "Moderate", "Fast-Paced", "Chaotic Energy"] },
  { id: "climate", q: "Climate preference?", opts: ["Hot & Sunny", "Cool Weather", "Rainy & Green", "No Preference"] },
  { id: "budget", q: "Monthly budget?", opts: ["Under ₹15K", "₹15K–30K", "₹30K–50K", "Above ₹50K"] },
];

const DNA_LABELS: Record<string, { icon: string; color: string }> = {
  culture: { icon: "🎭", color: "#fd79a8" },
  career: { icon: "💼", color: "#74b9ff" },
  student: { icon: "🎓", color: "#a29bfe" },
  lifestyle: { icon: "🌟", color: "#fdcb6e" },
  budget: { icon: "💰", color: "#00b894" },
  startup: { icon: "🚀", color: "#e17055" },
  safety: { icon: "🛡️", color: "#00cec9" },
  nature: { icon: "🌿", color: "#55efc4" },
};

const QUICK_CITIES = ["Indore", "Surat", "Kota", "Gwalior", "Lucknow", "Jaipur", "Mysore", "Coimbatore", "Nashik", "Vadodara"];
const SAMPLE_QUESTIONS = ["Is this city good for students?", "Should I move here?", "Best areas to live?", "Compare with my hometown"];

function scoreColor(s: number) {
  if (s >= 85) return "#00b894";
  if (s >= 70) return "#74b9ff";
  if (s >= 55) return "#fdcb6e";
  return "#e17055";
}

function verdictStyle(v: string) {
  if (v?.includes("Perfect")) return { color: "#00b894", bg: "rgba(0,184,148,0.12)", border: "rgba(0,184,148,0.3)" };
  if (v?.includes("Strong")) return { color: "#74b9ff", bg: "rgba(116,185,255,0.12)", border: "rgba(116,185,255,0.3)" };
  if (v?.includes("Good")) return { color: "#a29bfe", bg: "rgba(162,155,254,0.12)", border: "rgba(162,155,254,0.3)" };
  return { color: "#fdcb6e", bg: "rgba(253,203,110,0.12)", border: "rgba(253,203,110,0.3)" };
}

// ── Main Component ─────────────────────────────────────────────────────────
export default function CityCompatibility() {
  // Search & profile
  const [searchInput, setSearchInput] = useState("");
  const [cityQuery, setCityQuery] = useState("");
  const [profile, setProfile] = useState<CityProfile | null>(null);
  const [profileLoading, setProfileLoading] = useState(false);

  // Lifestyle & quiz
  const [selectedLifestyle, setSelectedLifestyle] = useState<string[]>(["student"]);
  const [quizAnswers, setQuizAnswers] = useState<Record<string, string>>({});
  const [quizStep, setQuizStep] = useState(0);
  const [quizDone, setQuizDone] = useState(false);

  // Match
  const [matchResult, setMatchResult] = useState<MatchResult | null>(null);
  const [matchLoading, setMatchLoading] = useState(false);

  // Compare
  const [compareCity1, setCompareCity1] = useState("");
  const [compareCity2, setCompareCity2] = useState("");
  const [compareResult, setCompareResult] = useState<CompareResult | null>(null);
  const [compareLoading, setCompareLoading] = useState(false);

  // Intelligence & saved
  const [intel, setIntel] = useState<IntelCategory[]>([]);
  const [intelLoading, setIntelLoading] = useState(true);
  const [activeIntel, setActiveIntel] = useState("students");
  const [savedCities, setSavedCities] = useState<SavedCity[]>([]);
  const [activeSaveList, setActiveSaveList] = useState<"dream" | "travel" | "future" | "home">("dream");

  // AI Chat
  const [chatOpen, setChatOpen] = useState(false);
  const [chatMessages, setChatMessages] = useState<{ role: "user" | "ai"; text: string }[]>([
    { role: "ai", text: "👋 Hello! I'm your AI City Expert. Ask me about any Indian city — metros, Tier-2, small towns, or even your hometown. I can help you decide where to study, work, or move!" },
  ]);
  const [chatInput, setChatInput] = useState("");
  const [chatLoading, setChatLoading] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // UI state
  const [activeTab, setActiveTab] = useState<"profile" | "dna" | "cost" | "future" | "life">("profile");
  const [statsAnimated, setStatsAnimated] = useState(false);

  useEffect(() => { loadIntelligence(); loadSaved(); }, []);
  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [chatMessages]);

  async function loadIntelligence() {
    setIntelLoading(true);
    try {
      const res = await fetch("/api/city/intelligence");
      const data = await res.json();
      setIntel(data.categories || []);
    } finally {
      setIntelLoading(false);
    }
  }

  async function loadSaved() {
    try {
      const res = await fetch("/api/city/saved");
      const data = await res.json();
      setSavedCities(data.cities || []);
    } catch { /* ok */ }
  }

  async function searchCity(name: string) {
    if (!name.trim()) return;
    setCityQuery(name);
    setProfile(null);
    setMatchResult(null);
    setProfileLoading(true);
    setStatsAnimated(false);
    try {
      const res = await fetch("/api/city/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cityName: name.trim() }),
      });
      const data = await res.json();
      setProfile(data);
      setTimeout(() => setStatsAnimated(true), 200);
    } finally {
      setProfileLoading(false);
    }
  }

  async function runMatch() {
    if (!cityQuery || selectedLifestyle.length === 0) return;
    setMatchLoading(true);
    setMatchResult(null);
    try {
      const res = await fetch("/api/city/match", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cityName: cityQuery, lifestyle: selectedLifestyle, priorities: quizAnswers }),
      });
      setMatchResult(await res.json());
    } finally {
      setMatchLoading(false);
    }
  }

  async function runCompare() {
    if (!compareCity1.trim() || !compareCity2.trim()) return;
    setCompareLoading(true);
    setCompareResult(null);
    try {
      const res = await fetch("/api/city/compare", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ city1: compareCity1.trim(), city2: compareCity2.trim(), lifestyle: selectedLifestyle }),
      });
      setCompareResult(await res.json());
    } finally {
      setCompareLoading(false);
    }
  }

  async function saveCity(cityName: string, score?: number, list: "dream" | "travel" | "future" | "home" = "dream") {
    try {
      const res = await fetch("/api/city/saved", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cityName, score, list }),
      });
      const data = await res.json();
      setSavedCities(prev => [...prev.filter(c => !(c.cityName.toLowerCase() === cityName.toLowerCase() && c.list === list)), data]);
    } catch { /* ok */ }
  }

  async function removeSaved(id: string) {
    try {
      await fetch(`/api/city/saved/${id}`, { method: "DELETE" });
      setSavedCities(prev => prev.filter(c => c.id !== id));
    } catch { /* ok */ }
  }

  async function sendChat() {
    if (!chatInput.trim() || chatLoading) return;
    const msg = chatInput.trim();
    setChatInput("");
    setChatMessages(m => [...m, { role: "user", text: msg }]);
    setChatLoading(true);
    try {
      const res = await fetch("/api/city/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: msg, cityName: cityQuery || undefined }),
      });
      const data = await res.json();
      setChatMessages(m => [...m, { role: "ai", text: data.reply }]);
    } finally {
      setChatLoading(false);
    }
  }

  function handleQuizAnswer(qId: string, answer: string) {
    const updated = { ...quizAnswers, [qId]: answer };
    setQuizAnswers(updated);
    if (quizStep < QUIZ_QUESTIONS.length - 1) {
      setQuizStep(s => s + 1);
    } else {
      setQuizDone(true);
    }
  }

  const isSaved = (cityName: string) => savedCities.some(c => c.cityName.toLowerCase() === cityName.toLowerCase());

  // ── Render ───────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen pb-32" style={{ background: "linear-gradient(135deg, #0a0a1a 0%, #0d0d20 60%, #0a1a10 100%)" }}>

      {/* ── HERO ──────────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden" style={{ minHeight: 300 }}>
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          {/* Floating India map glow */}
          <div className="absolute right-0 top-0 w-96 h-96 opacity-10" style={{ background: "radial-gradient(circle, #74b9ff 0%, transparent 70%)" }} />
          {/* Animated connection lines */}
          {[...Array(6)].map((_, i) => (
            <motion.div key={i} className="absolute h-px"
              style={{ width: `${80 + i * 30}px`, background: `linear-gradient(90deg, transparent, rgba(116,185,255,${0.15 + i * 0.02}), transparent)`, left: `${10 + i * 12}%`, top: `${25 + i * 10}%`, transform: "rotate(-20deg)" }}
              animate={{ opacity: [0.3, 0.8, 0.3], x: [0, 20, 0] }}
              transition={{ duration: 3 + i * 0.5, repeat: Infinity, delay: i * 0.4 }}
            />
          ))}
          {/* Floating city cards */}
          {["Delhi", "Indore", "Kota", "Surat"].map((c, i) => (
            <motion.div key={c} className="absolute px-3 py-1.5 rounded-full text-xs border text-white/40"
              style={{ background: "rgba(255,255,255,0.04)", borderColor: "rgba(255,255,255,0.08)", left: `${15 + i * 18}%`, top: `${20 + (i % 2) * 40}%` }}
              animate={{ y: [0, -8, 0] }}
              transition={{ duration: 2.5 + i * 0.3, repeat: Infinity, delay: i * 0.5 }}>
              📍 {c}
            </motion.div>
          ))}
        </div>

        <div className="relative z-10 px-6 pt-10 pb-6 max-w-6xl mx-auto">
          <div className="flex items-center gap-4 mb-4">
            <motion.div className="w-16 h-16 rounded-2xl flex items-center justify-center text-3xl border"
              style={{ background: "rgba(116,185,255,0.12)", borderColor: "rgba(116,185,255,0.3)" }}
              animate={{ boxShadow: ["0 0 20px rgba(116,185,255,0.2)", "0 0 40px rgba(116,185,255,0.4)", "0 0 20px rgba(116,185,255,0.2)"] }}
              transition={{ duration: 2.5, repeat: Infinity }}>
              🏙️
            </motion.div>
            <div>
              <h1 className="text-4xl md:text-5xl font-black text-white">Find Your Perfect City Match</h1>
              <p className="text-white/50 mt-1">AI understands every city — from metros to small towns. Any city. Any town. Anywhere.</p>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-6">
            {[
              { icon: "🌍", label: "Cities Analysed", value: "1000+", color: "#74b9ff" },
              { icon: "🇮🇳", label: "India First", value: "Tier 1–4", color: "#fdcb6e" },
              { icon: "🤖", label: "AI Matching", value: "Gemini", color: "#a29bfe" },
              { icon: "📍", label: "Any Location", value: "Free Search", color: "#00b894" },
            ].map((s, i) => (
              <motion.div key={s.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}
                className="rounded-2xl p-4 border" style={{ background: "rgba(255,255,255,0.03)", borderColor: "rgba(255,255,255,0.07)" }}>
                <div className="text-2xl mb-1">{s.icon}</div>
                <div className="text-lg font-black" style={{ color: s.color }}>{s.value}</div>
                <div className="text-xs text-white/40 mt-0.5">{s.label}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <div className="max-w-6xl mx-auto px-4 space-y-8 pt-2">

        {/* ── CITY SEARCH ENGINE ──────────────────────────────────────── */}
        <section>
          <div className="rounded-3xl border overflow-hidden" style={{ background: "rgba(255,255,255,0.02)", borderColor: "rgba(116,185,255,0.2)" }}>
            <div className="flex items-center gap-3 px-5 py-4">
              <Search className="w-5 h-5 text-blue-400 flex-shrink-0" />
              <input
                value={searchInput}
                onChange={e => setSearchInput(e.target.value)}
                onKeyDown={e => e.key === "Enter" && searchCity(searchInput)}
                placeholder="Search any city or place... Pune, Kota, Varanasi, your hometown..."
                className="flex-1 bg-transparent text-white placeholder-white/30 text-lg outline-none"
              />
              {profileLoading && <Loader2 className="w-5 h-5 animate-spin text-blue-400" />}
              {searchInput && !profileLoading && (
                <button onClick={() => searchCity(searchInput)}
                  className="px-5 py-2 rounded-xl font-bold text-sm transition-all"
                  style={{ background: "rgba(116,185,255,0.2)", color: "#74b9ff", border: "1px solid rgba(116,185,255,0.3)" }}>
                  Analyse →
                </button>
              )}
            </div>
            <div className="px-5 pb-4">
              <p className="text-xs text-white/30 mb-2">Try these:</p>
              <div className="flex flex-wrap gap-2">
                {QUICK_CITIES.map(c => (
                  <button key={c} onClick={() => { setSearchInput(c); searchCity(c); }}
                    className="px-3 py-1.5 rounded-full text-xs border transition-all hover:border-blue-400/50 hover:text-blue-300 text-white/40"
                    style={{ background: "rgba(255,255,255,0.03)", borderColor: "rgba(255,255,255,0.07)" }}>
                    {c}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ── LIFESTYLE DNA ────────────────────────────────────────────── */}
        <section>
          <div className="flex items-center gap-3 mb-4">
            <Sparkles className="w-5 h-5 text-yellow-400" />
            <h2 className="text-xl font-bold text-white">My Lifestyle DNA</h2>
            <span className="text-xs text-white/40">(select all that apply)</span>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {LIFESTYLE_OPTIONS.map(opt => {
              const active = selectedLifestyle.includes(opt.id);
              return (
                <motion.button key={opt.id} whileTap={{ scale: 0.97 }}
                  onClick={() => setSelectedLifestyle(prev => prev.includes(opt.id) ? prev.filter(x => x !== opt.id) : [...prev, opt.id])}
                  className="py-4 px-4 rounded-2xl border text-left transition-all"
                  style={{
                    background: active ? opt.color + "15" : "rgba(255,255,255,0.02)",
                    borderColor: active ? opt.color + "55" : "rgba(255,255,255,0.07)",
                  }}>
                  <div className="text-2xl mb-1">{opt.emoji}</div>
                  <div className="text-sm font-medium" style={{ color: active ? opt.color : "rgba(255,255,255,0.6)" }}>
                    {opt.label}
                  </div>
                  {active && <div className="mt-1 w-4 h-1 rounded-full" style={{ background: opt.color }} />}
                </motion.button>
              );
            })}
          </div>
        </section>

        {/* ── PERSONALITY QUIZ ──────────────────────────────────────────── */}
        <section>
          <div className="rounded-3xl border overflow-hidden" style={{ background: "rgba(255,255,255,0.02)", borderColor: "rgba(162,155,254,0.2)" }}>
            <div className="p-5 border-b flex items-center justify-between" style={{ borderColor: "rgba(255,255,255,0.06)" }}>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: "rgba(162,155,254,0.2)" }}>
                  <BookOpen className="w-4 h-4 text-purple-400" />
                </div>
                <span className="font-bold text-white">Personality Quiz</span>
                {quizDone && <span className="text-xs px-2 py-0.5 rounded-full font-medium" style={{ background: "rgba(0,184,148,0.15)", color: "#00b894" }}>✓ Complete</span>}
              </div>
              {quizDone && (
                <button onClick={() => { setQuizStep(0); setQuizDone(false); setQuizAnswers({}); }}
                  className="text-xs text-white/40 hover:text-white transition-colors">Reset</button>
              )}
            </div>
            <div className="p-5">
              {!quizDone ? (
                <>
                  <div className="flex items-center justify-between mb-4">
                    <p className="text-sm font-medium text-white">{QUIZ_QUESTIONS[quizStep].q}</p>
                    <span className="text-xs text-white/40">{quizStep + 1}/{QUIZ_QUESTIONS.length}</span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {QUIZ_QUESTIONS[quizStep].opts.map(opt => (
                      <button key={opt} onClick={() => handleQuizAnswer(QUIZ_QUESTIONS[quizStep].id, opt)}
                        className={`px-4 py-2.5 rounded-xl text-sm border font-medium transition-all hover:border-purple-400/50 hover:text-purple-300 ${quizAnswers[QUIZ_QUESTIONS[quizStep].id] === opt ? "border-purple-400/50 text-purple-300" : "text-white/50 border-white/08"}`}
                        style={{ background: quizAnswers[QUIZ_QUESTIONS[quizStep].id] === opt ? "rgba(162,155,254,0.12)" : "rgba(255,255,255,0.03)", borderColor: quizAnswers[QUIZ_QUESTIONS[quizStep].id] === opt ? "rgba(162,155,254,0.4)" : "rgba(255,255,255,0.08)" }}>
                        {opt}
                      </button>
                    ))}
                  </div>
                  <div className="mt-4 h-1 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.06)" }}>
                    <div className="h-full rounded-full transition-all duration-500" style={{ background: "#a29bfe", width: `${((quizStep + 1) / QUIZ_QUESTIONS.length) * 100}%` }} />
                  </div>
                </>
              ) : (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-wrap gap-2">
                  {Object.entries(quizAnswers).map(([k, v]) => (
                    <span key={k} className="px-3 py-1.5 rounded-full text-xs border text-purple-300" style={{ background: "rgba(162,155,254,0.1)", borderColor: "rgba(162,155,254,0.3)" }}>
                      ✓ {v}
                    </span>
                  ))}
                  <p className="w-full text-xs text-white/40 mt-2">Your preferences will refine AI city matching.</p>
                </motion.div>
              )}
            </div>
          </div>
        </section>

        {/* ── AI CITY PROFILE ───────────────────────────────────────────── */}
        <AnimatePresence>
          {profileLoading && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="text-center py-20">
              <motion.div animate={{ scale: [1, 1.1, 1] }} transition={{ duration: 1.5, repeat: Infinity }}>
                <Bot className="w-12 h-12 text-blue-400 mx-auto mb-4" />
              </motion.div>
              <p className="text-white/50">Gemini AI is analysing <span className="text-blue-400 font-medium">{cityQuery}</span>...</p>
              <p className="text-white/30 text-sm mt-1">Generating full city profile, DNA, cost analysis, future prediction</p>
            </motion.div>
          )}
        </AnimatePresence>

        {profile && !profileLoading && (
          <motion.section initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            {/* City Header Card */}
            <div className="rounded-3xl border overflow-hidden mb-4" style={{
              background: "linear-gradient(135deg, rgba(116,185,255,0.06), rgba(162,155,254,0.04))",
              borderColor: "rgba(116,185,255,0.25)",
            }}>
              <div className="p-6">
                <div className="flex items-start justify-between flex-wrap gap-4">
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-3xl border"
                      style={{ background: "rgba(116,185,255,0.12)", borderColor: "rgba(116,185,255,0.25)" }}>
                      🏙️
                    </div>
                    <div>
                      <div className="flex items-center gap-3 flex-wrap">
                        <h2 className="text-3xl font-black text-white">{profile.cityName}</h2>
                        <span className="px-3 py-1 rounded-full text-xs border font-medium" style={{ background: "rgba(116,185,255,0.1)", borderColor: "rgba(116,185,255,0.3)", color: "#74b9ff" }}>
                          {profile.tier}
                        </span>
                        <span className="px-3 py-1 rounded-full text-xs border text-white/50" style={{ borderColor: "rgba(255,255,255,0.1)" }}>
                          {profile.state}, {profile.country}
                        </span>
                      </div>
                      <p className="text-blue-400 font-medium mt-1">{profile.personality}</p>
                      <p className="text-white/60 text-sm mt-0.5 italic">"{profile.tagline}"</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button onClick={() => saveCity(profile.cityName, undefined, activeSaveList)}
                      className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium border transition-all ${isSaved(profile.cityName) ? "text-pink-400 border-pink-400/40" : "text-white/50 border-white/10 hover:border-white/30"}`}
                      style={{ background: isSaved(profile.cityName) ? "rgba(253,121,168,0.1)" : "rgba(255,255,255,0.04)" }}>
                      <Heart className={`w-4 h-4 ${isSaved(profile.cityName) ? "fill-pink-400" : ""}`} />
                      {isSaved(profile.cityName) ? "Saved" : "Save"}
                    </button>
                    <button onClick={() => runMatch()}
                      className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold border transition-all"
                      style={{ background: "rgba(116,185,255,0.15)", borderColor: "rgba(116,185,255,0.4)", color: "#74b9ff" }}>
                      <Sparkles className="w-4 h-4" />
                      Match Me
                    </button>
                  </div>
                </div>
                <p className="text-white/60 text-sm mt-4 leading-relaxed">{profile.description}</p>

                {/* Mood bar */}
                <div className="mt-4 flex items-center gap-3 p-3 rounded-xl" style={{ background: "rgba(255,255,255,0.04)" }}>
                  <span className="text-xl">🌡️</span>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium text-white">City Mood: <span style={{ color: scoreColor(profile.mood.score) }}>{profile.mood.label}</span></span>
                      <span className="text-xs text-white/40">{profile.mood.score}/100</span>
                    </div>
                    <div className="h-1.5 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.06)" }}>
                      <motion.div className="h-full rounded-full" style={{ background: scoreColor(profile.mood.score) }}
                        initial={{ width: 0 }} animate={{ width: `${profile.mood.score}%` }} transition={{ duration: 0.8 }} />
                    </div>
                  </div>
                  <span className="text-xs text-white/40 max-w-32 text-right">{profile.mood.description}</span>
                </div>
              </div>

              {/* Tab nav */}
              <div className="flex border-t overflow-x-auto" style={{ borderColor: "rgba(255,255,255,0.06)" }}>
                {[
                  { id: "profile", label: "Overview", icon: "🏙️" },
                  { id: "dna", label: "City DNA", icon: "🧬" },
                  { id: "cost", label: "Cost", icon: "💰" },
                  { id: "future", label: "2035 Prediction", icon: "🔮" },
                  { id: "life", label: "Day in Life", icon: "☀️" },
                ].map(tab => (
                  <button key={tab.id} onClick={() => setActiveTab(tab.id as typeof activeTab)}
                    className="flex-1 min-w-max px-4 py-3 text-sm font-medium transition-all border-b-2"
                    style={{
                      color: activeTab === tab.id ? "#74b9ff" : "rgba(255,255,255,0.4)",
                      borderBottomColor: activeTab === tab.id ? "#74b9ff" : "transparent",
                      background: activeTab === tab.id ? "rgba(116,185,255,0.06)" : "transparent",
                    }}>
                    {tab.icon} {tab.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Tab Content */}
            <AnimatePresence mode="wait">
              {activeTab === "profile" && (
                <motion.div key="profile" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="grid md:grid-cols-2 gap-4">
                  {/* Opportunities */}
                  <div className="rounded-2xl border p-5" style={{ background: "rgba(255,255,255,0.02)", borderColor: "rgba(255,255,255,0.07)" }}>
                    <h3 className="font-bold text-white mb-4 flex items-center gap-2"><Briefcase className="w-4 h-4 text-cyan-400" />Opportunities</h3>
                    <div className="space-y-3 text-sm">
                      <div><span className="text-white/40">Top Sectors: </span><span className="text-white">{profile.opportunities.topSectors.join(", ")}</span></div>
                      <div><span className="text-white/40">Startup Ecosystem: </span><span style={{ color: "#fdcb6e" }}>{profile.opportunities.startupEcosystem}</span></div>
                      <div><span className="text-white/40">Avg Salary: </span><span className="text-green-400 font-medium">{profile.opportunities.avgSalary}</span></div>
                      <div><span className="text-white/40">Job Growth: </span><span style={{ color: scoreColor(profile.dna.career) }}>{profile.opportunities.jobGrowth}</span></div>
                    </div>
                  </div>
                  {/* Climate */}
                  <div className="rounded-2xl border p-5" style={{ background: "rgba(255,255,255,0.02)", borderColor: "rgba(255,255,255,0.07)" }}>
                    <h3 className="font-bold text-white mb-4 flex items-center gap-2"><Sun className="w-4 h-4 text-yellow-400" />Climate</h3>
                    <div className="space-y-3 text-sm">
                      <div><span className="text-white/40">Type: </span><span className="text-white">{profile.climate.type}</span></div>
                      <div><span className="text-white/40">Temperature: </span><span className="text-orange-400">{profile.climate.temp}</span></div>
                      <div><span className="text-white/40">Humidity: </span><span className="text-white">{profile.climate.humidity}</span></div>
                      <div className="flex flex-wrap gap-1.5">
                        {profile.climate.bestMonths.map(m => <span key={m} className="px-2 py-0.5 rounded-full text-xs text-green-400" style={{ background: "rgba(0,184,148,0.1)" }}>{m}</span>)}
                      </div>
                    </div>
                  </div>
                  {/* Education */}
                  <div className="rounded-2xl border p-5" style={{ background: "rgba(255,255,255,0.02)", borderColor: "rgba(255,255,255,0.07)" }}>
                    <h3 className="font-bold text-white mb-4 flex items-center gap-2"><GraduationCap className="w-4 h-4 text-purple-400" />Education</h3>
                    <div className="space-y-2 text-sm">
                      {profile.education.topColleges.map((c, i) => <div key={i} className="text-white/70 flex gap-2"><Star className="w-3 h-3 text-yellow-400 mt-0.5 flex-shrink-0" />{c}</div>)}
                      <div className="mt-2"><span className="text-white/40">Coaching Culture: </span><span className="text-white">{profile.education.coachingCulture}</span></div>
                    </div>
                  </div>
                  {/* Hidden Gems */}
                  <div className="rounded-2xl border p-5" style={{ background: "rgba(255,255,255,0.02)", borderColor: "rgba(255,255,255,0.07)" }}>
                    <h3 className="font-bold text-white mb-4 flex items-center gap-2"><Sparkles className="w-4 h-4 text-yellow-400" />Hidden Gems</h3>
                    <div className="space-y-2">
                      {profile.hiddenGems.map((gem, i) => (
                        <div key={i} className="flex items-start gap-2 text-sm text-white/70">
                          <span className="text-yellow-400 flex-shrink-0">✦</span>{gem}
                        </div>
                      ))}
                    </div>
                  </div>
                </motion.div>
              )}

              {activeTab === "dna" && (
                <motion.div key="dna" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                  className="rounded-2xl border p-5" style={{ background: "rgba(255,255,255,0.02)", borderColor: "rgba(255,255,255,0.07)" }}>
                  <h3 className="font-bold text-white mb-5 flex items-center gap-2">🧬 City DNA — {profile.cityName}</h3>
                  <div className="space-y-4">
                    {Object.entries(profile.dna).map(([key, val]) => {
                      const meta = DNA_LABELS[key] || { icon: "📊", color: "#74b9ff" };
                      return (
                        <div key={key}>
                          <div className="flex items-center justify-between mb-1.5">
                            <span className="text-sm text-white/70">{meta.icon} {key.charAt(0).toUpperCase() + key.slice(1)}</span>
                            <span className="text-sm font-bold" style={{ color: meta.color }}>{val}%</span>
                          </div>
                          <div className="h-2.5 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.06)" }}>
                            <motion.div className="h-full rounded-full" style={{ background: `linear-gradient(90deg, ${meta.color}88, ${meta.color})` }}
                              initial={{ width: 0 }} animate={{ width: `${val}%` }} transition={{ duration: 0.7, delay: Object.keys(profile.dna).indexOf(key) * 0.08 }} />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </motion.div>
              )}

              {activeTab === "cost" && (
                <motion.div key="cost" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                  className="rounded-2xl border p-5" style={{ background: "rgba(255,255,255,0.02)", borderColor: "rgba(255,255,255,0.07)" }}>
                  <h3 className="font-bold text-white mb-4 flex items-center gap-2"><DollarSign className="w-4 h-4 text-green-400" />Monthly Living Cost — {profile.cityName}</h3>
                  <div className="grid md:grid-cols-2 gap-4">
                    {Object.entries(profile.costOfLiving).map(([k, v]) => {
                      const icons: Record<string, string> = { monthlyEstimate: "📊", rent1BHK: "🏠", food: "🍽️", transport: "🚌", lifestyle: "🌟" };
                      const labels: Record<string, string> = { monthlyEstimate: "Total Monthly", rent1BHK: "1 BHK Rent", food: "Food Budget", transport: "Transport", lifestyle: "Leisure" };
                      const isTotal = k === "monthlyEstimate";
                      return (
                        <div key={k} className={`rounded-xl p-4 ${isTotal ? "md:col-span-2" : ""}`}
                          style={{ background: isTotal ? "rgba(0,184,148,0.08)" : "rgba(255,255,255,0.04)", border: `1px solid ${isTotal ? "rgba(0,184,148,0.25)" : "rgba(255,255,255,0.06)"}` }}>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <span className="text-xl">{icons[k] || "💰"}</span>
                              <span className="text-sm text-white/60">{labels[k] || k}</span>
                            </div>
                            <span className={`font-bold ${isTotal ? "text-green-400 text-lg" : "text-white text-sm"}`}>{v}</span>
                          </div>
                          {isTotal && <p className="text-xs text-white/30 mt-1">Average estimate for comfortable living in {profile.cityName}</p>}
                        </div>
                      );
                    })}
                  </div>
                </motion.div>
              )}

              {activeTab === "future" && (
                <motion.div key="future" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                  className="rounded-2xl border p-5" style={{ background: "linear-gradient(135deg, rgba(162,155,254,0.06), rgba(0,0,0,0))", borderColor: "rgba(162,155,254,0.2)" }}>
                  <div className="flex items-center gap-3 mb-5">
                    <span className="text-2xl">🔮</span>
                    <div>
                      <h3 className="font-bold text-white">{profile.cityName} — 2035 Vision</h3>
                      <p className="text-xs text-purple-400">AI-powered city prediction</p>
                    </div>
                  </div>
                  <div className="grid md:grid-cols-2 gap-4 mb-4">
                    {[
                      { label: "Growth Outlook", value: profile.futurePrediction.growth, color: "#00b894", icon: "📈" },
                      { label: "Population Trend", value: profile.futurePrediction.population, color: "#74b9ff", icon: "👥" },
                      { label: "Top Trend", value: profile.futurePrediction.topTrend, color: "#fdcb6e", icon: "⚡" },
                      { label: "Infrastructure", value: profile.futurePrediction.infrastructure, color: "#a29bfe", icon: "🏗️" },
                    ].map(item => (
                      <div key={item.label} className="rounded-xl p-4" style={{ background: "rgba(255,255,255,0.04)" }}>
                        <div className="flex items-center gap-2 mb-1">
                          <span>{item.icon}</span>
                          <span className="text-xs text-white/40">{item.label}</span>
                        </div>
                        <p className="text-sm font-medium" style={{ color: item.color }}>{item.value}</p>
                      </div>
                    ))}
                  </div>
                  <div className="p-4 rounded-xl flex items-start gap-3" style={{ background: "rgba(162,155,254,0.08)", border: "1px solid rgba(162,155,254,0.2)" }}>
                    <Bot className="w-5 h-5 text-purple-400 flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-white/80 leading-relaxed">{profile.futurePrediction.aiPrediction}</p>
                  </div>
                </motion.div>
              )}

              {activeTab === "life" && (
                <motion.div key="life" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                  className="rounded-2xl border p-5" style={{ background: "rgba(255,255,255,0.02)", borderColor: "rgba(255,255,255,0.07)" }}>
                  <h3 className="font-bold text-white mb-5">☀️ A Day in {profile.cityName}</h3>
                  <div className="space-y-4">
                    {[
                      { time: "Morning", icon: <Coffee className="w-4 h-4 text-yellow-400" />, text: profile.dayInLife.morning, color: "#fdcb6e" },
                      { time: "Afternoon", icon: <Sun className="w-4 h-4 text-orange-400" />, text: profile.dayInLife.afternoon, color: "#e17055" },
                      { time: "Evening", icon: <TrendingUp className="w-4 h-4 text-blue-400" />, text: profile.dayInLife.evening, color: "#74b9ff" },
                      { time: "Night", icon: <Moon className="w-4 h-4 text-purple-400" />, text: profile.dayInLife.night, color: "#a29bfe" },
                    ].map((slot, i) => (
                      <motion.div key={slot.time} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.1 }}
                        className="flex gap-4 items-start">
                        <div className="w-24 flex-shrink-0 flex items-center gap-2">
                          {slot.icon}
                          <span className="text-sm font-medium" style={{ color: slot.color }}>{slot.time}</span>
                        </div>
                        <div className="flex-1 p-3 rounded-xl text-sm text-white/70" style={{ background: "rgba(255,255,255,0.04)" }}>
                          {slot.text}
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.section>
        )}

        {/* ── AI MATCH SCORE ───────────────────────────────────────────── */}
        {cityQuery && !profileLoading && (
          <section>
            <div className="flex items-center gap-3 mb-4">
              <Heart className="w-5 h-5 text-pink-400" />
              <h2 className="text-xl font-bold text-white">AI City Match Score</h2>
            </div>
            {!matchResult && !matchLoading && (
              <div className="rounded-3xl border p-6 text-center" style={{ background: "rgba(255,255,255,0.02)", borderColor: "rgba(253,121,168,0.2)" }}>
                <p className="text-white/50 mb-4">Get your personalized match score for <span className="text-pink-400 font-medium">{cityQuery}</span></p>
                <button onClick={runMatch}
                  className="flex items-center gap-2 mx-auto px-6 py-3 rounded-2xl font-bold transition-all"
                  style={{ background: "rgba(253,121,168,0.2)", color: "#fd79a8", border: "1px solid rgba(253,121,168,0.4)" }}>
                  <Sparkles className="w-5 h-5" />
                  Calculate My Match with AI
                </button>
              </div>
            )}
            {matchLoading && (
              <div className="text-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-pink-400 mx-auto mb-3" />
                <p className="text-white/40">Gemini AI is calculating your match...</p>
              </div>
            )}
            {matchResult && (
              <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }}>
                <div className="rounded-3xl border overflow-hidden" style={{
                  background: "linear-gradient(135deg, rgba(253,121,168,0.06), rgba(108,92,231,0.04))",
                  borderColor: `${verdictStyle(matchResult.verdict).border}`,
                }}>
                  <div className="p-6">
                    <div className="flex flex-col md:flex-row items-center gap-6 mb-6">
                      {/* Score ring */}
                      <div className="relative flex-shrink-0">
                        <svg viewBox="0 0 120 120" className="w-32 h-32">
                          <circle cx="60" cy="60" r="50" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="8" />
                          <motion.circle cx="60" cy="60" r="50" fill="none" stroke={scoreColor(matchResult.score)} strokeWidth="8"
                            strokeLinecap="round" transform="rotate(-90 60 60)"
                            initial={{ strokeDashoffset: 314 }}
                            animate={{ strokeDashoffset: 314 - (matchResult.score / 100) * 314 }}
                            style={{ strokeDasharray: 314 }}
                            transition={{ duration: 1.2, ease: "easeOut" }} />
                        </svg>
                        <div className="absolute inset-0 flex flex-col items-center justify-center">
                          <motion.div className="text-3xl font-black" style={{ color: scoreColor(matchResult.score) }}
                            initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}>
                            {matchResult.score}%
                          </motion.div>
                          <div className="text-xs text-white/40">Match</div>
                        </div>
                      </div>
                      <div className="flex-1 text-center md:text-left">
                        <div className="flex items-center gap-3 flex-wrap mb-2 justify-center md:justify-start">
                          <h3 className="text-3xl font-black text-white">{matchResult.cityName}</h3>
                          <span className="px-3 py-1 rounded-full text-sm font-bold border"
                            style={{ background: verdictStyle(matchResult.verdict).bg, borderColor: verdictStyle(matchResult.verdict).border, color: verdictStyle(matchResult.verdict).color }}>
                            {matchResult.verdict}
                          </span>
                        </div>
                        <p className="text-white/70 text-sm leading-relaxed mb-3">{matchResult.summary}</p>
                        <div className="p-3 rounded-xl text-sm italic text-white/60 flex items-start gap-2"
                          style={{ background: "rgba(162,155,254,0.08)", border: "1px solid rgba(162,155,254,0.15)" }}>
                          <Bot className="w-4 h-4 text-purple-400 flex-shrink-0 mt-0.5" />
                          {matchResult.aiMessage}
                        </div>
                      </div>
                    </div>

                    {/* Match breakdown bars */}
                    <div className="mb-5">
                      <p className="text-xs text-white/40 font-medium uppercase tracking-wider mb-3">Match Breakdown</p>
                      <div className="grid md:grid-cols-5 gap-3">
                        {Object.entries(matchResult.matchBreakdown).map(([key, val]) => (
                          <div key={key} className="rounded-xl p-3 text-center" style={{ background: "rgba(255,255,255,0.04)" }}>
                            <div className="text-xs text-white/40 mb-1 capitalize">{key}</div>
                            <div className="text-lg font-bold" style={{ color: scoreColor(val) }}>{val}%</div>
                            <div className="mt-1.5 h-1 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.06)" }}>
                              <motion.div className="h-full rounded-full" style={{ background: scoreColor(val) }}
                                initial={{ width: 0 }} animate={{ width: `${val}%` }} transition={{ duration: 0.6 }} />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="rounded-2xl p-4" style={{ background: "rgba(0,184,148,0.06)", border: "1px solid rgba(0,184,148,0.2)" }}>
                        <p className="text-xs font-medium text-green-400 mb-3">✓ Why You'd Love It</p>
                        <div className="space-y-2">
                          {matchResult.pros.map((p, i) => (
                            <div key={i} className="flex items-start gap-2 text-sm text-white/70">
                              <CheckCircle className="w-3.5 h-3.5 text-green-400 mt-0.5 flex-shrink-0" />{p}
                            </div>
                          ))}
                        </div>
                      </div>
                      <div className="space-y-3">
                        <div className="rounded-2xl p-4" style={{ background: "rgba(229,57,53,0.06)", border: "1px solid rgba(229,57,53,0.2)" }}>
                          <p className="text-xs font-medium text-red-400 mb-2">Challenges to Consider</p>
                          {matchResult.cons.map((c, i) => <p key={i} className="text-sm text-white/60">▸ {c}</p>)}
                        </div>
                        <div className="rounded-2xl p-4" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)" }}>
                          <p className="text-xs font-medium text-yellow-400 mb-2">💡 Insider Tip</p>
                          <p className="text-sm text-white/60">{matchResult.localInsiderTip}</p>
                        </div>
                      </div>
                    </div>

                    <div className="mt-4 flex items-center gap-4 flex-wrap">
                      <div>
                        <p className="text-xs text-white/30 mb-1">Best areas in {matchResult.cityName}</p>
                        <div className="flex flex-wrap gap-1.5">
                          {matchResult.bestAreas.map(a => <span key={a} className="text-xs px-2 py-1 rounded-full text-blue-300" style={{ background: "rgba(116,185,255,0.1)" }}>📍 {a}</span>)}
                        </div>
                      </div>
                      <div className="ml-auto">
                        <p className="text-xs text-white/30 mb-1">Also consider</p>
                        <div className="flex gap-1.5">
                          {matchResult.alternativeCities.map(c => (
                            <button key={c} onClick={() => { setSearchInput(c); searchCity(c); }}
                              className="text-xs px-3 py-1 rounded-full border text-white/50 hover:text-white transition-colors"
                              style={{ background: "rgba(255,255,255,0.04)", borderColor: "rgba(255,255,255,0.1)" }}>
                              {c} →
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </section>
        )}

        {/* ── CITY COMPARE ─────────────────────────────────────────────── */}
        <section>
          <div className="flex items-center gap-3 mb-4">
            <BarChart2 className="w-5 h-5 text-orange-400" />
            <h2 className="text-xl font-bold text-white">City vs City</h2>
            <span className="text-xs text-white/40">AI-powered comparison</span>
          </div>
          <div className="rounded-3xl border overflow-hidden" style={{ background: "rgba(255,255,255,0.02)", borderColor: "rgba(255,255,255,0.08)" }}>
            <div className="p-5">
              <div className="grid md:grid-cols-2 gap-4 mb-4">
                {[
                  { val: compareCity1, set: setCompareCity1, label: "City A", placeholder: "Pune, Indore, any city..." },
                  { val: compareCity2, set: setCompareCity2, label: "City B", placeholder: "Bangalore, Jaipur, any city..." },
                ].map((field, i) => (
                  <div key={i}>
                    <p className="text-xs text-white/40 mb-2">{field.label}</p>
                    <input value={field.val} onChange={e => field.set(e.target.value)}
                      placeholder={field.placeholder}
                      className="w-full px-4 py-3 rounded-xl border text-sm text-white placeholder-white/30 outline-none"
                      style={{ background: "rgba(255,255,255,0.05)", borderColor: "rgba(255,255,255,0.1)" }} />
                  </div>
                ))}
              </div>
              <button onClick={runCompare} disabled={!compareCity1.trim() || !compareCity2.trim() || compareLoading}
                className="w-full py-3 rounded-xl font-bold text-sm transition-all disabled:opacity-40"
                style={{ background: "rgba(253,203,110,0.15)", color: "#fdcb6e", border: "1px solid rgba(253,203,110,0.3)" }}>
                {compareLoading
                  ? <span className="flex items-center gap-2 justify-center"><Loader2 className="w-4 h-4 animate-spin" />Gemini is comparing...</span>
                  : `⚖️ Compare ${compareCity1 || "City A"} vs ${compareCity2 || "City B"} with AI`}
              </button>

              <AnimatePresence>
                {compareResult && (
                  <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="mt-5 space-y-5">
                    {/* City cards */}
                    <div className="grid md:grid-cols-2 gap-4">
                      {[compareResult.city1, compareResult.city2].map(city => (
                        <div key={city.name} className="rounded-2xl border p-4"
                          style={{ background: compareResult.winner === city.name ? "rgba(0,206,201,0.07)" : "rgba(255,255,255,0.03)", borderColor: compareResult.winner === city.name ? "rgba(0,206,201,0.4)" : "rgba(255,255,255,0.08)" }}>
                          {compareResult.winner === city.name && <p className="text-xs text-cyan-400 font-medium mb-2">⭐ AI Recommends</p>}
                          <div className="flex items-center justify-between mb-3">
                            <h4 className="font-black text-white text-lg">{city.name}</h4>
                            <span className="text-2xl font-black" style={{ color: scoreColor(city.score) }}>{city.score}%</span>
                          </div>
                          <p className="text-xs text-blue-400 mb-3">{city.personality}</p>
                          <div className="space-y-1.5 text-xs">
                            <div><span className="text-white/40">Best For: </span><span className="text-white">{city.bestFor}</span></div>
                            <div><span className="text-white/40">Monthly Cost: </span><span className="text-green-400">{city.cost}</span></div>
                            <div><span className="text-white/40">Jobs: </span><span className="text-white">{city.jobs}</span></div>
                            <div><span className="text-white/40">Culture: </span><span className="text-white">{city.culture}</span></div>
                          </div>
                          <p className="text-xs text-white/50 italic mt-3">{city.verdict}</p>
                        </div>
                      ))}
                    </div>

                    {/* Metrics comparison */}
                    <div className="rounded-2xl border p-4" style={{ background: "rgba(255,255,255,0.02)", borderColor: "rgba(255,255,255,0.07)" }}>
                      <p className="text-xs font-medium text-white/40 uppercase tracking-wider mb-4">Head-to-Head Metrics</p>
                      <div className="space-y-3">
                        {Object.entries(compareResult.metrics).map(([key, vals]) => (
                          <div key={key}>
                            <div className="flex justify-between text-xs text-white/40 mb-1.5">
                              <span>{compareResult.city1.name}</span>
                              <span className="font-medium text-white/60 capitalize">{vals.label || key}</span>
                              <span>{compareResult.city2.name}</span>
                            </div>
                            <div className="relative h-4 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.06)" }}>
                              <motion.div className="absolute left-0 top-0 h-full rounded-full"
                                style={{ background: "#74b9ff", width: `${vals.city1}%`, opacity: 0.7 }}
                                initial={{ width: 0 }} animate={{ width: `${vals.city1}%` }} />
                              <motion.div className="absolute right-0 top-0 h-full rounded-full"
                                style={{ background: "#fd79a8", width: `${vals.city2}%`, opacity: 0.7 }}
                                initial={{ width: 0 }} animate={{ width: `${vals.city2}%` }} />
                              <div className="absolute inset-0 flex items-center justify-between px-2 text-xs font-bold">
                                <span className="text-white/90">{vals.city1}</span>
                                <span className="text-white/90">{vals.city2}</span>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="flex items-start gap-2 p-4 rounded-2xl"
                      style={{ background: "rgba(162,155,254,0.08)", border: "1px solid rgba(162,155,254,0.2)" }}>
                      <Bot className="w-5 h-5 text-purple-400 flex-shrink-0 mt-0.5" />
                      <p className="text-sm text-white/80">{compareResult.aiVerdict}</p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </section>

        {/* ── INDIA CITY INTELLIGENCE ───────────────────────────────────── */}
        <section>
          <div className="flex items-center gap-3 mb-4">
            <span className="text-2xl">🇮🇳</span>
            <h2 className="text-xl font-bold text-white">India City Intelligence</h2>
            {intelLoading && <Loader2 className="w-4 h-4 animate-spin text-white/40" />}
          </div>
          {/* Category tabs */}
          <div className="flex flex-wrap gap-2 mb-4">
            {intel.map(cat => (
              <button key={cat.id} onClick={() => setActiveIntel(cat.id)}
                className="flex items-center gap-2 px-4 py-2.5 rounded-full border text-sm font-medium transition-all"
                style={{
                  background: activeIntel === cat.id ? "rgba(116,185,255,0.15)" : "rgba(255,255,255,0.03)",
                  borderColor: activeIntel === cat.id ? "rgba(116,185,255,0.4)" : "rgba(255,255,255,0.08)",
                  color: activeIntel === cat.id ? "#74b9ff" : "rgba(255,255,255,0.5)",
                }}>
                <span>{cat.emoji}</span><span>{cat.label}</span>
              </button>
            ))}
          </div>
          {intel.filter(c => c.id === activeIntel).map(cat => (
            <motion.div key={cat.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
              className="rounded-2xl border p-5" style={{ background: "rgba(255,255,255,0.02)", borderColor: "rgba(255,255,255,0.07)" }}>
              <p className="text-sm text-white/50 mb-4">{cat.description}</p>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {cat.cities.map((city, i) => (
                  <motion.button key={city} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.06 }}
                    onClick={() => { setSearchInput(city); searchCity(city); }}
                    className="flex items-center gap-3 p-3 rounded-xl border text-left transition-all hover:border-blue-400/40"
                    style={{ background: "rgba(255,255,255,0.03)", borderColor: "rgba(255,255,255,0.07)" }}>
                    <span className="text-xl">{cat.emoji}</span>
                    <div>
                      <div className="text-sm font-medium text-white">{city}</div>
                      <div className="text-xs text-white/30">Tap to explore →</div>
                    </div>
                  </motion.button>
                ))}
              </div>
            </motion.div>
          ))}
        </section>

        {/* ── SAVED CITIES ──────────────────────────────────────────────── */}
        <section>
          <div className="flex items-center gap-3 mb-4">
            <Home className="w-5 h-5 text-pink-400" />
            <h2 className="text-xl font-bold text-white">My Cities</h2>
          </div>
          <div className="rounded-3xl border overflow-hidden" style={{ background: "rgba(255,255,255,0.02)", borderColor: "rgba(253,121,168,0.2)" }}>
            <div className="p-5">
              {/* List tabs */}
              <div className="flex gap-2 mb-4 flex-wrap">
                {(["dream", "travel", "future", "home"] as const).map(list => (
                  <button key={list} onClick={() => setActiveSaveList(list)}
                    className="px-4 py-2 rounded-xl text-sm font-medium border transition-all capitalize"
                    style={{
                      background: activeSaveList === list ? "rgba(253,121,168,0.15)" : "rgba(255,255,255,0.04)",
                      borderColor: activeSaveList === list ? "rgba(253,121,168,0.4)" : "rgba(255,255,255,0.08)",
                      color: activeSaveList === list ? "#fd79a8" : "rgba(255,255,255,0.5)",
                    }}>
                    {list === "dream" ? "✨ Dream" : list === "travel" ? "✈️ Travel" : list === "future" ? "🔮 Future Move" : "🏠 Home"}
                  </button>
                ))}
              </div>
              {cityQuery && profile && (
                <button onClick={() => saveCity(profile.cityName, matchResult?.score, activeSaveList)}
                  className="mb-4 flex items-center gap-2 px-4 py-2 rounded-xl text-sm border transition-all"
                  style={{ background: "rgba(253,121,168,0.08)", borderColor: "rgba(253,121,168,0.3)", color: "#fd79a8" }}>
                  <Plus className="w-4 h-4" /> Add {profile.cityName} to {activeSaveList} list
                </button>
              )}
              {savedCities.filter(c => c.list === activeSaveList).length === 0 ? (
                <div className="text-center py-8 text-white/30">
                  <Heart className="w-8 h-8 mx-auto mb-2 opacity-30" />
                  <p className="text-sm">No cities saved here yet. Search and save cities you love.</p>
                </div>
              ) : (
                <div className="grid md:grid-cols-3 gap-3">
                  {savedCities.filter(c => c.list === activeSaveList).map(city => (
                    <div key={city.id} className="flex items-center justify-between p-3 rounded-xl border"
                      style={{ background: "rgba(255,255,255,0.04)", borderColor: "rgba(255,255,255,0.08)" }}>
                      <div className="flex items-center gap-2">
                        <button onClick={() => { setSearchInput(city.cityName); searchCity(city.cityName); }}
                          className="text-sm font-medium text-white hover:text-blue-400 transition-colors">
                          📍 {city.cityName}
                        </button>
                        {city.score && <span className="text-xs font-bold" style={{ color: scoreColor(city.score) }}>{city.score}%</span>}
                      </div>
                      <button onClick={() => removeSaved(city.id)} className="text-white/20 hover:text-red-400 transition-colors">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </section>

      </div>

      {/* ── AI CITY ASSISTANT FLOATING ────────────────────────────────── */}
      <div className="fixed bottom-6 right-6 z-50">
        <AnimatePresence>
          {chatOpen && (
            <motion.div initial={{ opacity: 0, scale: 0.85, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.85, y: 20 }}
              className="mb-4 rounded-3xl border overflow-hidden"
              style={{ width: 340, maxHeight: 500, background: "#0e0e1c", borderColor: "rgba(116,185,255,0.3)", boxShadow: "0 20px 60px rgba(0,0,0,0.5)" }}>
              <div className="flex items-center justify-between px-4 py-3 border-b" style={{ borderColor: "rgba(255,255,255,0.06)", background: "rgba(116,185,255,0.08)" }}>
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-xl flex items-center justify-center" style={{ background: "rgba(116,185,255,0.2)" }}>
                    <Bot className="w-4 h-4 text-blue-400" />
                  </div>
                  <div>
                    <div className="text-sm font-bold text-white">City AI</div>
                    <div className="text-xs text-blue-400">Knows every Indian city</div>
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
                        background: msg.role === "user" ? "rgba(116,185,255,0.25)" : "rgba(255,255,255,0.07)",
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
                      <div className="flex gap-1 items-center">
                        {[0, 1, 2].map(i => <div key={i} className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-bounce" style={{ animationDelay: `${i * 0.15}s` }} />)}
                      </div>
                    </div>
                  </div>
                )}
                <div ref={chatEndRef} />
              </div>
              <div className="px-3 pb-3">
                <div className="flex items-center gap-2 p-2 rounded-xl border mb-2" style={{ background: "rgba(255,255,255,0.05)", borderColor: "rgba(255,255,255,0.1)" }}>
                  <input value={chatInput} onChange={e => setChatInput(e.target.value)}
                    onKeyDown={e => e.key === "Enter" && sendChat()}
                    placeholder={cityQuery ? `Ask about ${cityQuery}...` : "Ask about any Indian city..."}
                    className="flex-1 bg-transparent text-sm text-white placeholder-white/30 outline-none" />
                  <button onClick={sendChat} disabled={chatLoading || !chatInput.trim()}
                    className="w-7 h-7 rounded-lg flex items-center justify-center transition-all disabled:opacity-40"
                    style={{ background: "rgba(116,185,255,0.25)" }}>
                    <Send className="w-3.5 h-3.5 text-blue-300" />
                  </button>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {SAMPLE_QUESTIONS.map(q => (
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
          style={{ background: "linear-gradient(135deg, #0984e3, #74b9ff)", color: "white", boxShadow: "0 8px 32px rgba(9,132,227,0.4)" }}
          animate={{ boxShadow: chatOpen ? "0 8px 32px rgba(9,132,227,0.6)" : ["0 8px 32px rgba(9,132,227,0.4)", "0 8px 40px rgba(9,132,227,0.6)", "0 8px 32px rgba(9,132,227,0.4)"] }}
          transition={{ duration: 2, repeat: chatOpen ? 0 : Infinity }}>
          <Sparkles className="w-5 h-5" />
          <span>{chatOpen ? "Close" : "Ask City AI"}</span>
          {!chatOpen && <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />}
        </motion.button>
      </div>
    </div>
  );
}
