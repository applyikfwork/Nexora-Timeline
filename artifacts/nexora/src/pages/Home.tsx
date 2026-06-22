import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence, useScroll, useTransform } from "framer-motion";
import {
  Search, MapPin, Loader2, Zap, Clock, TrendingUp, Brain, Globe2, Activity,
  ArrowRight, ChevronRight, Play, Sparkles, Navigation, Radio, Star,
  Cpu, Map, BarChart3, Layers, Compass, Users, Building2, BookOpen, Briefcase,
  GraduationCap, Flame, MessageSquare, Send, Check, X
} from "lucide-react";
import { useAppContext } from "@/lib/store";
import { Link } from "wouter";
import { HeroGlobe } from "@/components/HeroGlobe";
import { ParticleField } from "@/components/ParticleField";

/* ─────────────────────────── animated counter ─────────────────────────── */
function Counter({ to, suffix = "" }: { to: number; suffix?: string }) {
  const [val, setVal] = useState(0);
  const ref = useRef<HTMLDivElement>(null);
  const started = useRef(false);
  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => {
      if (e.isIntersecting && !started.current) {
        started.current = true;
        const dur = 1800;
        const steps = 60;
        let i = 0;
        const t = setInterval(() => {
          i++;
          const ease = 1 - Math.pow(1 - i / steps, 3);
          setVal(Math.round(ease * to));
          if (i >= steps) clearInterval(t);
        }, dur / steps);
      }
    }, { threshold: 0.5 });
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, [to]);
  return <div ref={ref}>{val.toLocaleString()}{suffix}</div>;
}

/* ─────────────────────────── smart search bar ─────────────────────────── */
const TRENDING = ["Tokyo", "Dubai", "London", "Paris", "New York"];
const POPULAR = ["Eiffel Tower", "Times Square", "Taj Mahal", "Colosseum", "Shibuya"];

function SmartSearch() {
  const [query, setQuery] = useState("");
  const [focused, setFocused] = useState(false);
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const { geoCity } = useAppContext();

  useEffect(() => {
    if (!query || query.length < 2) { setResults([]); return; }
    setLoading(true);
    const t = setTimeout(async () => {
      try {
        const r = await fetch(`/api/places/search?q=${encodeURIComponent(query)}&limit=5`);
        const d = await r.json();
        setResults(d);
      } finally { setLoading(false); }
    }, 280);
    return () => clearTimeout(t);
  }, [query]);

  useEffect(() => {
    function outside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setFocused(false);
    }
    document.addEventListener("mousedown", outside);
    return () => document.removeEventListener("mousedown", outside);
  }, []);

  const showDropdown = focused;
  const hasResults = results.length > 0;

  return (
    <div ref={ref} className="relative w-full max-w-2xl mx-auto z-30">
      {/* Glow ring */}
      <div className={`absolute -inset-0.5 rounded-2xl blur transition-all duration-500 ${focused ? "opacity-100 bg-gradient-to-r from-primary via-blue-500 to-secondary" : "opacity-0"}`} />

      <div className={`relative flex items-center bg-black/60 backdrop-blur-2xl border rounded-2xl px-5 py-4 transition-all duration-300 ${focused ? "border-primary/50 shadow-[0_0_40px_rgba(0,255,200,0.15)]" : "border-white/10"}`}>
        <Search className={`w-5 h-5 mr-3 flex-shrink-0 transition-colors ${focused ? "text-primary" : "text-white/30"}`} />
        <input
          value={query}
          onChange={e => setQuery(e.target.value)}
          onFocus={() => setFocused(true)}
          placeholder="Search any city, landmark, neighborhood..."
          className="flex-1 bg-transparent text-white text-lg placeholder:text-white/30 focus:outline-none"
        />
        {loading && <Loader2 className="w-5 h-5 text-primary animate-spin flex-shrink-0" />}
        {!loading && query && (
          <button onClick={() => { setQuery(""); setResults([]); }} className="text-white/30 hover:text-white transition-colors">
            <X className="w-4 h-4" />
          </button>
        )}
        {!query && (
          <div className="hidden md:flex items-center gap-1 text-xs text-white/20 flex-shrink-0">
            <span className="px-1.5 py-0.5 rounded bg-white/5 border border-white/10">⌘</span>
            <span className="px-1.5 py-0.5 rounded bg-white/5 border border-white/10">K</span>
          </div>
        )}
      </div>

      <AnimatePresence>
        {showDropdown && (
          <motion.div initial={{ opacity: 0, y: 8, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 8, scale: 0.98 }}
            transition={{ duration: 0.15 }}
            className="absolute top-full mt-2 left-0 right-0 bg-black/90 backdrop-blur-2xl border border-white/10 rounded-2xl shadow-[0_20px_60px_rgba(0,0,0,0.6)] overflow-hidden">

            {hasResults ? (
              <div className="p-2">
                <div className="px-3 py-2 text-xs text-white/30 uppercase tracking-widest font-bold">Results</div>
                {results.map((p: any) => (
                  <Link key={p.id} href="/map"
                    onClick={() => { setFocused(false); setQuery(p.name); }}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-white/5 transition-colors group">
                    <div className="w-8 h-8 rounded-lg bg-primary/15 flex items-center justify-center flex-shrink-0 group-hover:bg-primary/25 transition-colors">
                      <MapPin className="w-4 h-4 text-primary" />
                    </div>
                    <div>
                      <div className="text-white font-medium text-sm">{p.name}</div>
                      <div className="text-xs text-white/40">{p.state ? `${p.state}, ` : ""}{p.country}</div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-white/20 ml-auto group-hover:text-primary transition-colors" />
                  </Link>
                ))}
              </div>
            ) : (
              <div className="p-2">
                {geoCity && (
                  <div>
                    <div className="px-3 py-2 text-xs text-white/30 uppercase tracking-widest font-bold flex items-center gap-1.5">
                      <Navigation className="w-3 h-3 text-primary" /> Your Location
                    </div>
                    <Link href="/map" onClick={() => setFocused(false)}
                      className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-primary/10 transition-colors group border border-primary/0 hover:border-primary/20">
                      <div className="w-8 h-8 rounded-lg bg-primary/15 flex items-center justify-center">
                        <Navigation className="w-4 h-4 text-primary" />
                      </div>
                      <div>
                        <div className="text-primary font-bold text-sm">{geoCity.name}</div>
                        <div className="text-xs text-white/40">{geoCity.country} · Your city</div>
                      </div>
                    </Link>
                  </div>
                )}

                <div className="mt-1">
                  <div className="px-3 py-2 text-xs text-white/30 uppercase tracking-widest font-bold flex items-center gap-1.5">
                    <Flame className="w-3 h-3 text-orange-400" /> Trending Now
                  </div>
                  <div className="flex gap-2 px-3 pb-2 flex-wrap">
                    {TRENDING.map(c => (
                      <button key={c} onClick={() => setQuery(c)}
                        className="px-3 py-1.5 bg-orange-500/10 hover:bg-orange-500/20 border border-orange-500/20 rounded-lg text-xs text-orange-300 transition-all hover:scale-105">
                        🔥 {c}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="mt-1">
                  <div className="px-3 py-2 text-xs text-white/30 uppercase tracking-widest font-bold flex items-center gap-1.5">
                    <Star className="w-3 h-3 text-yellow-400" /> Popular Places
                  </div>
                  <div className="flex gap-2 px-3 pb-3 flex-wrap">
                    {POPULAR.map(p => (
                      <button key={p} onClick={() => setQuery(p)}
                        className="px-3 py-1.5 bg-yellow-500/10 hover:bg-yellow-500/20 border border-yellow-500/20 rounded-lg text-xs text-yellow-300 transition-all hover:scale-105">
                        ⭐ {p}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ─────────────────────────── AI quick cards ─────────────────────────── */
const QUICK_CARDS = [
  { href: "/pulse", emoji: "🔥", title: "Live Activity", desc: "Discover what's happening right now", gradient: "from-red-500/20 to-orange-500/10", border: "border-red-500/20 hover:border-red-400/50", glow: "hover:shadow-[0_0_30px_rgba(239,68,68,0.15)]" },
  { href: "/timelines", emoji: "⏳", title: "Time Machine", desc: "Travel through a city's history", gradient: "from-purple-500/20 to-blue-500/10", border: "border-purple-500/20 hover:border-purple-400/50", glow: "hover:shadow-[0_0_30px_rgba(168,85,247,0.15)]" },
  { href: "/forecast", emoji: "🔮", title: "AI Forecast", desc: "See what's likely to happen next", gradient: "from-primary/20 to-teal-500/10", border: "border-primary/20 hover:border-primary/50", glow: "hover:shadow-[0_0_30px_rgba(0,255,200,0.15)]" },
  { href: "/chat", emoji: "🤖", title: "Ask Nexora AI", desc: "Chat with your city intelligence", gradient: "from-blue-500/20 to-primary/10", border: "border-blue-500/20 hover:border-blue-400/50", glow: "hover:shadow-[0_0_30px_rgba(59,130,246,0.15)]" },
  { href: "/compatibility", emoji: "📈", title: "Compare Cities", desc: "AI-powered city matchmaking", gradient: "from-yellow-500/20 to-orange-500/10", border: "border-yellow-500/20 hover:border-yellow-400/50", glow: "hover:shadow-[0_0_30px_rgba(234,179,8,0.15)]" },
  { href: "/viral", emoji: "🌎", title: "Viral Hub", desc: "Vibe cards, battles & quizzes", gradient: "from-pink-500/20 to-purple-500/10", border: "border-pink-500/20 hover:border-pink-400/50", glow: "hover:shadow-[0_0_30px_rgba(236,72,153,0.15)]" },
];

/* ─────────────────────────── trending cities ─────────────────────────── */
const TRENDING_CITIES = [
  { id: "delhi-in", name: "Delhi", country: "India", temp: "38°C", mood: "Energetic", crowd: 87, activity: "Rush Hour", color: "from-orange-500/30 to-red-500/10", emoji: "🇮🇳" },
  { id: "tokyo-jp", name: "Tokyo", country: "Japan", temp: "26°C", mood: "Buzzing", crowd: 94, activity: "Concert Night", color: "from-pink-500/30 to-purple-500/10", emoji: "🇯🇵" },
  { id: "dubai-ae", name: "Dubai", country: "UAE", temp: "42°C", mood: "Surging", crowd: 91, activity: "Weekend Peak", color: "from-yellow-500/30 to-orange-500/10", emoji: "🇦🇪" },
  { id: "london-uk", name: "London", country: "UK", temp: "18°C", mood: "Active", crowd: 76, activity: "Evening Rush", color: "from-blue-500/30 to-primary/10", emoji: "🇬🇧" },
  { id: "mumbai-in", name: "Mumbai", country: "India", temp: "34°C", mood: "Vibrant", crowd: 85, activity: "Evening Peak", color: "from-primary/30 to-blue-500/10", emoji: "🇮🇳" },
  { id: "singapore-sg", name: "Singapore", country: "Singapore", temp: "31°C", mood: "Steady", crowd: 69, activity: "Afternoon", color: "from-teal-500/30 to-primary/10", emoji: "🇸🇬" },
  { id: "paris-fr", name: "Paris", country: "France", temp: "22°C", mood: "Elegant", crowd: 72, activity: "Tourist Hours", color: "from-purple-500/30 to-pink-500/10", emoji: "🇫🇷" },
  { id: "seoul-kr", name: "Seoul", country: "South Korea", temp: "24°C", mood: "Lit", crowd: 83, activity: "Night Scene", color: "from-red-500/30 to-orange-500/10", emoji: "🇰🇷" },
];

/* ─────────────────────────── AI conversation demo ─────────────────────── */
const DEMO_CONVERSATION = [
  { role: "user", text: "Will Delhi be crowded tonight?" },
  { role: "ai", text: "Yes — expect significant crowds. Here's why:", delay: 1200 },
  { role: "factors", factors: ["🎉 Weekend Night", "🎵 Live Concert — Jawaharlal Stadium", "🌧️ Rain just ended — people heading out", "🍽️ Restaurant rush 7-10 PM"], delay: 2000 },
  { role: "confidence", value: 93, delay: 2800 },
];

function AIConversationDemo() {
  const [step, setStep] = useState(0);
  const [typing, setTyping] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const started = useRef(false);

  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => {
      if (e.isIntersecting && !started.current) {
        started.current = true;
        setStep(1);
        setTyping(true);
        setTimeout(() => { setTyping(false); setStep(2); }, 1200);
        setTimeout(() => setStep(3), 2200);
        setTimeout(() => setStep(4), 3200);
      }
    }, { threshold: 0.4 });
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, []);

  return (
    <div ref={ref} className="bg-black/40 backdrop-blur-xl border border-white/10 rounded-2xl p-6 space-y-4 min-h-64">
      <div className="flex items-center gap-2 mb-4">
        <div className="w-2 h-2 rounded-full bg-red-500" />
        <div className="w-2 h-2 rounded-full bg-yellow-500" />
        <div className="w-2 h-2 rounded-full bg-green-500" />
        <span className="text-xs text-white/30 ml-2">Nexora AI Chat</span>
      </div>

      <AnimatePresence>
        {step >= 1 && (
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="flex justify-end">
            <div className="bg-primary/20 border border-primary/30 rounded-2xl rounded-tr-sm px-4 py-2.5 max-w-xs">
              <p className="text-white text-sm">Will Delhi be crowded tonight?</p>
            </div>
          </motion.div>
        )}

        {typing && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-full bg-primary/20 border border-primary/30 flex items-center justify-center flex-shrink-0">
              <Brain className="w-3.5 h-3.5 text-primary" />
            </div>
            <div className="bg-white/5 border border-white/10 rounded-2xl rounded-tl-sm px-4 py-2.5">
              <div className="flex gap-1">
                <div className="w-1.5 h-1.5 rounded-full bg-white/40 animate-bounce" style={{ animationDelay: "0ms" }} />
                <div className="w-1.5 h-1.5 rounded-full bg-white/40 animate-bounce" style={{ animationDelay: "150ms" }} />
                <div className="w-1.5 h-1.5 rounded-full bg-white/40 animate-bounce" style={{ animationDelay: "300ms" }} />
              </div>
            </div>
          </motion.div>
        )}

        {step >= 2 && (
          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="flex items-start gap-2">
            <div className="w-7 h-7 rounded-full bg-primary/20 border border-primary/30 flex items-center justify-center flex-shrink-0 mt-0.5">
              <Brain className="w-3.5 h-3.5 text-primary" />
            </div>
            <div className="bg-white/5 border border-white/10 rounded-2xl rounded-tl-sm px-4 py-2.5">
              <p className="text-white text-sm">Yes — expect significant crowds. Here's why:</p>
            </div>
          </motion.div>
        )}

        {step >= 3 && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="ml-9">
            <div className="grid grid-cols-2 gap-2">
              {["🎉 Weekend Night", "🎵 Live Concert", "🌧️ Rain just ended", "🍽️ Restaurant rush"].map((f, i) => (
                <motion.div key={i} initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.1 }}
                  className="bg-primary/10 border border-primary/20 rounded-xl px-3 py-2 text-xs text-white/70">
                  {f}
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}

        {step >= 4 && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="ml-9">
            <div className="bg-green-500/10 border border-green-500/20 rounded-xl p-3 flex items-center gap-3">
              <div className="text-green-400 font-black text-2xl">93%</div>
              <div>
                <div className="text-xs text-green-400 font-bold">Confidence Score</div>
                <div className="text-xs text-white/40">Based on historical patterns + live signals</div>
              </div>
              <div className="ml-auto">
                <div className="w-8 h-8 rounded-full bg-green-500/20 border border-green-500/30 flex items-center justify-center">
                  <Check className="w-4 h-4 text-green-400" />
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ─────────────────────────── why nexora comparison ─────────────────────── */
const COMPARISONS = [
  { them: "Google Maps", themCap: "Shows location", us: "Explains location", icon: "🗺️" },
  { them: "Weather App", themCap: "Shows temperature", us: "Explains weather impact on life", icon: "🌦️" },
  { them: "News App", themCap: "Shows events", us: "Explains why events matter", icon: "📰" },
  { them: "Travel Guide", themCap: "Static information", us: "Live AI intelligence", icon: "✈️" },
];

/* ─────────────────────────── timeline preview ─────────────────────────── */
const TIMELINE = [
  { time: "8:00 AM", event: "Metro Rush Hour", icon: "🚇", intensity: 90, color: "bg-red-500" },
  { time: "10:00 AM", event: "Office Hours Begin", icon: "💼", intensity: 70, color: "bg-yellow-500" },
  { time: "1:00 PM", event: "Lunch Time Peak", icon: "🍱", intensity: 85, color: "bg-orange-500" },
  { time: "3:00 PM", event: "Afternoon Lull", icon: "☕", intensity: 40, color: "bg-blue-500" },
  { time: "5:00 PM", event: "Traffic Peak", icon: "🚗", intensity: 95, color: "bg-red-600" },
  { time: "8:00 PM", event: "Restaurants Busy", icon: "🍽️", intensity: 88, color: "bg-primary" },
  { time: "11:00 PM", event: "Nightlife Active", icon: "🌙", intensity: 75, color: "bg-purple-500" },
];

/* ─────────────────────────── feature showcase ─────────────────────────── */
const FEATURES = [
  { icon: Globe2, emoji: "🌍", title: "Live Intelligence", desc: "Real-time city data, crowd levels, traffic, weather impact, and social pulse — updated every minute.", gradient: "from-primary/20 to-blue-500/10", border: "border-primary/20" },
  { icon: Clock, emoji: "⏳", title: "Time Machine", desc: "Travel back through any city's history. See how places changed, what events shaped them, and what patterns repeat.", gradient: "from-purple-500/20 to-blue-500/10", border: "border-purple-500/20" },
  { icon: Brain, emoji: "🤖", title: "AI Stories", desc: "Nexora AI generates living narratives about cities — weaving data, culture, events, and predictions into readable insights.", gradient: "from-blue-500/20 to-primary/10", border: "border-blue-500/20" },
  { icon: BarChart3, emoji: "📊", title: "Analytics", desc: "City portfolio tracking, vibe scores, crowd heatmaps, and trend analysis — like Bloomberg for cities.", gradient: "from-yellow-500/20 to-orange-500/10", border: "border-yellow-500/20" },
  { icon: Zap, emoji: "📡", title: "Predictions", desc: "AI forecasts upcoming crowd surges, weather impact, event effects, and city mood shifts hours in advance.", gradient: "from-orange-500/20 to-red-500/10", border: "border-orange-500/20" },
  { icon: Layers, emoji: "🔥", title: "Heatmaps", desc: "Visual overlays showing crowd density, activity zones, noise levels, and energy concentration across city neighborhoods.", gradient: "from-red-500/20 to-pink-500/10", border: "border-red-500/20" },
];

/* ─────────────────────────── user personas ─────────────────────────── */
const PERSONAS = [
  { icon: Compass, label: "Travelers", color: "text-primary border-primary/30 bg-primary/10", desc: "Plan smarter trips with live crowd intelligence and AI itineraries tailored to your preferences." },
  { icon: Cpu, label: "Researchers", color: "text-purple-400 border-purple-400/30 bg-purple-400/10", desc: "Access historical urban data, AI-generated city narratives, and cross-city comparison analytics." },
  { icon: Briefcase, label: "Businesses", color: "text-yellow-400 border-yellow-400/30 bg-yellow-400/10", desc: "Scout new markets, track competitor city activity, and understand local pulse before expansion." },
  { icon: Building2, label: "Urban Planners", color: "text-blue-400 border-blue-400/30 bg-blue-400/10", desc: "Analyze crowd flow, event impact, and neighborhood trends with visual heatmaps and forecasts." },
  { icon: GraduationCap, label: "Students", color: "text-green-400 border-green-400/30 bg-green-400/10", desc: "Explore city history, urban evolution, and AI-powered timelines for academic research." },
  { icon: Users, label: "Locals", color: "text-pink-400 border-pink-400/30 bg-pink-400/10", desc: "Know your city better — discover local events, crowd forecasts, and hidden neighborhood gems." },
];

/* ─────────────────────────── main component ─────────────────────────── */
export default function Home() {
  const { geoCity, geoStatus } = useAppContext();
  const [spotlightData, setSpotlightData] = useState<any>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setSpotlightData({
      city: "Kyoto",
      country: "Japan",
      mood: "Peaceful",
      story: "Morning rain has made Fushimi Inari's stone paths glisten. The usual tourist surge has paused — locals are sipping matcha in quieter tea houses while clouds drift over Arashiyama bamboo groves.",
      pulse: 62,
      emoji: "🏯",
    });
  }, []);

  return (
    <div className="relative overflow-hidden bg-background">
      {/* ── SECTION 1: IMMERSIVE HERO ── */}
      <section className="relative min-h-screen flex flex-col overflow-hidden">
        {/* Animated backgrounds */}
        <ParticleField />
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-primary/5 rounded-full blur-[120px] animate-pulse" style={{ animationDuration: "8s" }} />
          <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] bg-blue-500/5 rounded-full blur-[100px] animate-pulse" style={{ animationDuration: "12s", animationDelay: "3s" }} />
          <div className="absolute top-1/3 right-0 w-[300px] h-[800px] bg-purple-500/3 rounded-full blur-[120px]" />
        </div>

        {/* Aurora gradient overlay */}
        <div className="absolute inset-0 pointer-events-none" style={{
          background: "radial-gradient(ellipse 80% 40% at 50% 0%, rgba(0,255,200,0.04) 0%, transparent 60%)",
        }} />

        {/* Content */}
        <div className="relative z-10 flex flex-col items-center pt-10 pb-0 px-6">
          {/* Live badge */}
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
            className="flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 border border-primary/25 text-primary text-xs font-bold uppercase tracking-widest mb-8">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-primary" />
            </span>
            18 AI Features · Live Intelligence Active
          </motion.div>

          {/* Hero title */}
          <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3, duration: 0.8 }}
            className="text-5xl md:text-7xl lg:text-8xl font-black text-center text-white leading-[1.05] tracking-tight max-w-5xl mb-6">
            Discover the{" "}
            <span className="relative">
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-blue-400 to-secondary">Living Story</span>
              <motion.span
                className="absolute -bottom-1 left-0 right-0 h-px bg-gradient-to-r from-primary/0 via-primary to-primary/0"
                initial={{ scaleX: 0 }} animate={{ scaleX: 1 }} transition={{ delay: 1.2, duration: 1 }} />
            </span>
            {" "}of Every Place on Earth.
          </motion.h1>

          <motion.p initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}
            className="text-lg md:text-xl text-white/50 text-center max-w-2xl mb-10 font-light leading-relaxed">
            Real-time intelligence, historical timelines, AI reasoning, and future predictions —<br className="hidden md:block" /> all powered by Nexora AI.
          </motion.p>

          {/* Smart search */}
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }} className="w-full max-w-2xl mb-6">
            <SmartSearch />
          </motion.div>

          {/* CTA row */}
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.8 }} className="flex flex-wrap items-center gap-4 mb-10">
            <Link href="/pulse"
              className="flex items-center gap-2 px-6 py-3 bg-primary text-black font-black rounded-xl hover:bg-primary/90 transition-all shadow-[0_0_30px_rgba(0,255,200,0.3)] hover:shadow-[0_0_50px_rgba(0,255,200,0.5)] hover:scale-105">
              <Radio className="w-4 h-4" /> Explore Live Pulse
            </Link>
            <Link href="/chat"
              className="flex items-center gap-2 px-6 py-3 bg-white/5 border border-white/15 text-white font-medium rounded-xl hover:bg-white/10 hover:border-white/30 transition-all">
              <MessageSquare className="w-4 h-4" /> Ask Nexora AI
            </Link>
            {geoCity && (
              <span className="flex items-center gap-1.5 text-sm text-primary/60">
                <Navigation className="w-3.5 h-3.5" /> Showing for {geoCity.name}
              </span>
            )}
          </motion.div>
        </div>

        {/* Globe + stats hero layout */}
        <div className="relative z-10 flex flex-col lg:flex-row items-center gap-8 px-6 lg:px-16 pb-10 max-w-7xl mx-auto w-full">
          {/* Globe */}
          <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.4, duration: 1 }}
            className="flex-1 min-w-0 w-full lg:w-auto">
            <HeroGlobe />
          </motion.div>

          {/* Right side stats & info */}
          <motion.div initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.6, duration: 0.8 }}
            className="flex-1 space-y-5 w-full lg:max-w-sm">
            {/* Live stats */}
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: "Locations", value: 10000000, suffix: "+", color: "text-primary" },
                { label: "Countries", value: 150, suffix: "+", color: "text-blue-400" },
                { label: "AI Insights", value: 52000000, suffix: "+", color: "text-purple-400" },
                { label: "Updates/min", value: 1200, suffix: "", color: "text-yellow-400" },
              ].map(s => (
                <div key={s.label} className="bg-black/40 border border-white/8 rounded-2xl p-4 text-center backdrop-blur-xl hover:border-white/20 transition-colors">
                  <div className={`text-2xl font-black tabular-nums ${s.color}`}>
                    <Counter to={s.value} suffix={s.suffix} />
                  </div>
                  <div className="text-xs text-white/35 uppercase tracking-wider mt-0.5">{s.label}</div>
                </div>
              ))}
            </div>

            {/* Live city pills */}
            <div className="bg-black/40 border border-white/8 rounded-2xl p-4 backdrop-blur-xl">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                <span className="text-xs text-white/40 uppercase tracking-wider font-bold">Live Right Now</span>
              </div>
              <div className="space-y-2">
                {[
                  { city: "Tokyo", pulse: 94, status: "Concert Night", color: "text-red-400" },
                  { city: "Dubai", pulse: 91, status: "Weekend Surge", color: "text-orange-400" },
                  { city: "New York", pulse: 88, status: "Evening Rush", color: "text-yellow-400" },
                  { city: "Mumbai", pulse: 85, status: "Peak Hour", color: "text-primary" },
                ].map((c) => (
                  <div key={c.city} className="flex items-center gap-3">
                    <span className={`font-black w-8 text-right ${c.color}`}>{c.pulse}</span>
                    <div className="flex-1 h-1.5 bg-white/5 rounded-full overflow-hidden">
                      <motion.div initial={{ width: 0 }} animate={{ width: `${c.pulse}%` }} transition={{ delay: 1, duration: 1, ease: "easeOut" }}
                        className="h-full rounded-full" style={{ background: `currentColor`, opacity: 0.6 }} />
                    </div>
                    <span className="text-xs text-white/50 w-24 text-right">{c.city}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* AI Spotlight teaser */}
            {spotlightData && (
              <div className="bg-gradient-to-br from-purple-500/15 to-blue-500/10 border border-purple-500/20 rounded-2xl p-4">
                <div className="text-xs text-purple-400/60 uppercase tracking-wider font-bold mb-1">✨ Today's Spotlight</div>
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-2xl">{spotlightData.emoji}</span>
                  <div>
                    <div className="font-black text-white">{spotlightData.city}</div>
                    <div className="text-xs text-white/40">{spotlightData.mood} · Pulse {spotlightData.pulse}</div>
                  </div>
                </div>
                <p className="text-xs text-white/55 leading-relaxed line-clamp-2">{spotlightData.story}</p>
              </div>
            )}
          </motion.div>
        </div>
      </section>

      {/* ── SECTION 2: AI QUICK CARDS ── */}
      <section className="py-20 px-6 relative">
        <div className="absolute inset-0 bg-gradient-to-b from-background via-card/20 to-background pointer-events-none" />
        <div className="max-w-6xl mx-auto relative z-10">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-12">
            <div className="inline-flex items-center gap-2 text-primary text-xs font-bold uppercase tracking-widest mb-3 border border-primary/20 rounded-full px-3 py-1 bg-primary/5">
              <Sparkles className="w-3 h-3" /> What Can You Do
            </div>
            <h2 className="text-4xl md:text-5xl font-black text-white mb-3">Your City Command Center</h2>
            <p className="text-white/40 max-w-xl mx-auto">Six powerful entry points into the world's most comprehensive city intelligence platform.</p>
          </motion.div>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {QUICK_CARDS.map((card, i) => (
              <motion.div key={card.href} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.08 }}>
                <Link href={card.href}
                  className={`group flex flex-col gap-4 p-6 bg-gradient-to-br ${card.gradient} border ${card.border} ${card.glow} rounded-2xl transition-all duration-300 hover:scale-[1.03] hover:-translate-y-1 cursor-pointer block`}>
                  <div className="text-4xl">{card.emoji}</div>
                  <div>
                    <div className="font-black text-white text-lg mb-1 group-hover:text-primary transition-colors">{card.title}</div>
                    <div className="text-sm text-white/50 leading-relaxed">{card.desc}</div>
                  </div>
                  <div className="flex items-center gap-1 text-xs text-white/30 group-hover:text-primary transition-colors mt-auto">
                    Explore <ChevronRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── SECTION 3: TRENDING CITIES ── */}
      <section className="py-20 relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-6">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="flex items-center justify-between mb-8">
            <div>
              <div className="flex items-center gap-2 text-orange-400 text-xs font-bold uppercase tracking-widest mb-2">
                <Flame className="w-3.5 h-3.5" /> Trending Today
              </div>
              <h2 className="text-3xl md:text-4xl font-black text-white">Cities on Fire Right Now</h2>
            </div>
            <Link href="/pulse" className="hidden md:flex items-center gap-2 text-sm text-primary/70 hover:text-primary transition-colors">
              View all <ArrowRight className="w-4 h-4" />
            </Link>
          </motion.div>

          {/* Horizontal scroll */}
          <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide snap-x snap-mandatory">
            {TRENDING_CITIES.map((city, i) => (
              <motion.div key={city.id} initial={{ opacity: 0, x: 20 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.06 }}>
                <Link href="/pulse"
                  className={`group flex-shrink-0 w-60 bg-gradient-to-br ${city.color} border border-white/10 hover:border-white/25 rounded-2xl p-5 snap-start block transition-all hover:scale-[1.02] hover:-translate-y-1 cursor-pointer`}>
                  <div className="flex items-start justify-between mb-3">
                    <span className="text-3xl">{city.emoji}</span>
                    <div className="flex items-center gap-1">
                      <div className={`w-2 h-2 rounded-full animate-pulse ${city.crowd > 85 ? "bg-red-500" : city.crowd > 70 ? "bg-yellow-500" : "bg-primary"}`} />
                      <span className={`text-xs font-black ${city.crowd > 85 ? "text-red-400" : city.crowd > 70 ? "text-yellow-400" : "text-primary"}`}>{city.crowd}</span>
                    </div>
                  </div>
                  <div className="font-black text-white text-xl mb-0.5">{city.name}</div>
                  <div className="text-xs text-white/40 mb-3">{city.country}</div>
                  <div className="space-y-1.5">
                    <div className="flex justify-between text-xs">
                      <span className="text-white/40">Temp</span>
                      <span className="text-white font-medium">{city.temp}</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-white/40">Mood</span>
                      <span className="text-white font-medium">{city.mood}</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-white/40">Now</span>
                      <span className="text-orange-300 font-medium">{city.activity}</span>
                    </div>
                  </div>
                  <div className="mt-3 h-1.5 bg-white/10 rounded-full overflow-hidden">
                    <div className="h-full bg-white/30 rounded-full" style={{ width: `${city.crowd}%` }} />
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── SECTION 4: LIVE TIMELINE PREVIEW ── */}
      <section className="py-20 px-6 relative">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-primary/3 to-transparent pointer-events-none" />
        <div className="max-w-6xl mx-auto relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <motion.div initial={{ opacity: 0, x: -20 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }}>
              <div className="inline-flex items-center gap-2 text-primary text-xs font-bold uppercase tracking-widest mb-4 border border-primary/20 rounded-full px-3 py-1 bg-primary/5">
                <Clock className="w-3 h-3" /> Timeline Intelligence
              </div>
              <h2 className="text-4xl md:text-5xl font-black text-white mb-4 leading-tight">A City's Day, Told by AI.</h2>
              <p className="text-white/50 text-lg mb-8 leading-relaxed">
                Nexora maps every city's daily rhythm — from morning rush to midnight pulse — using real signals and historical patterns.
              </p>
              <Link href="/timelines"
                className="inline-flex items-center gap-2 px-5 py-3 bg-primary/15 border border-primary/30 text-primary font-bold rounded-xl hover:bg-primary/25 transition-all">
                <Play className="w-4 h-4" /> Explore Timelines
              </Link>
            </motion.div>

            <motion.div initial={{ opacity: 0, x: 20 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }}
              className="relative">
              <div className="relative bg-black/40 backdrop-blur-xl border border-white/10 rounded-2xl p-6 overflow-hidden">
                <div className="absolute top-0 right-0 w-40 h-40 bg-primary/5 rounded-full -translate-y-1/2 translate-x-1/2 pointer-events-none" />
                <div className="text-xs text-white/30 uppercase tracking-wider font-bold mb-5 flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                  Delhi · Today's Timeline
                </div>
                <div className="relative pl-5">
                  <div className="absolute left-0 top-2 bottom-2 w-px bg-gradient-to-b from-primary/60 via-primary/20 to-primary/5" />
                  {TIMELINE.map((item, i) => (
                    <motion.div key={i} initial={{ opacity: 0, x: 10 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.08 }}
                      className="relative flex items-center gap-4 mb-4">
                      <div className="absolute -left-5 w-2.5 h-2.5 rounded-full border-2 border-background" style={{ backgroundColor: "#00ffcc" }} />
                      <div className="text-xs text-white/30 w-16 flex-shrink-0 font-mono">{item.time}</div>
                      <div className="text-lg">{item.icon}</div>
                      <div className="flex-1">
                        <div className="text-sm text-white font-medium">{item.event}</div>
                        <div className="h-1 bg-white/5 rounded-full mt-1.5 overflow-hidden">
                          <motion.div initial={{ width: 0 }} whileInView={{ width: `${item.intensity}%` }} viewport={{ once: true }} transition={{ delay: i * 0.08 + 0.3, duration: 0.8 }}
                            className={`h-full rounded-full ${item.color}`} />
                        </div>
                      </div>
                      <div className="text-xs font-black" style={{ color: item.intensity > 80 ? "#ff6666" : item.intensity > 60 ? "#ffbb00" : "#00ffcc" }}>
                        {item.intensity}
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ── SECTION 5: AI CONVERSATION DEMO ── */}
      <section className="py-20 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <motion.div initial={{ opacity: 0, x: -20 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} className="order-2 lg:order-1">
              <AIConversationDemo />
            </motion.div>
            <motion.div initial={{ opacity: 0, x: 20 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} className="order-1 lg:order-2">
              <div className="inline-flex items-center gap-2 text-blue-400 text-xs font-bold uppercase tracking-widest mb-4 border border-blue-400/20 rounded-full px-3 py-1 bg-blue-400/5">
                <Brain className="w-3 h-3" /> AI Intelligence
              </div>
              <h2 className="text-4xl md:text-5xl font-black text-white mb-4 leading-tight">Ask Anything About Any City.</h2>
              <p className="text-white/50 text-lg leading-relaxed mb-6">
                Nexora AI understands context, patterns, and real-time signals. Ask about crowds, weather impact, events, historical significance — and get answers that actually make sense.
              </p>
              <div className="space-y-3">
                {["Will Delhi be crowded tonight?", "Best time to visit Tokyo in July?", "How has Mumbai changed in 10 years?"].map((q, i) => (
                  <div key={i} className="flex items-center gap-3 px-4 py-2.5 bg-white/3 border border-white/8 rounded-xl text-sm text-white/50 hover:text-white/70 hover:border-white/20 transition-colors cursor-default">
                    <MessageSquare className="w-4 h-4 text-primary/40 flex-shrink-0" />
                    {q}
                  </div>
                ))}
              </div>
              <Link href="/chat" className="inline-flex items-center gap-2 mt-6 px-5 py-3 bg-blue-500/15 border border-blue-500/30 text-blue-400 font-bold rounded-xl hover:bg-blue-500/25 transition-all">
                <Send className="w-4 h-4" /> Try AI Chat
              </Link>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ── SECTION 6: WHY NEXORA ── */}
      <section className="py-20 px-6 relative">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-primary/3 to-transparent pointer-events-none" />
        <div className="max-w-5xl mx-auto relative z-10">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-14">
            <div className="inline-flex items-center gap-2 text-primary text-xs font-bold uppercase tracking-widest mb-4 border border-primary/20 rounded-full px-3 py-1 bg-primary/5">
              <Star className="w-3 h-3" /> The Difference
            </div>
            <h2 className="text-4xl md:text-5xl font-black text-white mb-3">Beyond Maps. Beyond News.</h2>
            <p className="text-white/40 max-w-xl mx-auto">Other tools show you data. Nexora explains what it means.</p>
          </motion.div>

          <div className="space-y-4">
            {COMPARISONS.map((row, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 15 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }}
                className="grid grid-cols-1 md:grid-cols-3 gap-3 items-center">
                <div className="bg-white/3 border border-white/8 rounded-2xl p-5 flex items-center gap-4">
                  <span className="text-2xl">{row.icon}</span>
                  <div>
                    <div className="text-white/30 text-xs mb-0.5">{row.them}</div>
                    <div className="text-white/60 font-medium text-sm">{row.themCap}</div>
                  </div>
                  <X className="w-5 h-5 text-red-500/60 ml-auto flex-shrink-0" />
                </div>
                <div className="flex items-center justify-center">
                  <div className="flex items-center gap-2 text-white/20">
                    <div className="h-px w-8 bg-white/10" />
                    <ArrowRight className="w-5 h-5" />
                    <div className="h-px w-8 bg-white/10" />
                  </div>
                </div>
                <div className="bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/25 rounded-2xl p-5 flex items-center gap-4">
                  <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                    <Zap className="w-4 h-4 text-primary" />
                  </div>
                  <div>
                    <div className="text-primary/60 text-xs mb-0.5">Nexora</div>
                    <div className="text-white font-bold text-sm">{row.us}</div>
                  </div>
                  <Check className="w-5 h-5 text-primary ml-auto flex-shrink-0" />
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── SECTION 7: FEATURE SHOWCASE ── */}
      <section className="py-20 px-6">
        <div className="max-w-6xl mx-auto">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-14">
            <div className="inline-flex items-center gap-2 text-purple-400 text-xs font-bold uppercase tracking-widest mb-4 border border-purple-400/20 rounded-full px-3 py-1 bg-purple-400/5">
              <Layers className="w-3 h-3" /> Platform Features
            </div>
            <h2 className="text-4xl md:text-5xl font-black text-white mb-3">Everything You Need to Understand Cities.</h2>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {FEATURES.map((f, i) => {
              const Icon = f.icon;
              return (
                <motion.div key={f.title} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.08 }}
                  className={`group bg-gradient-to-br ${f.gradient} border ${f.border} rounded-2xl p-6 hover:scale-[1.02] hover:-translate-y-1 transition-all duration-300 cursor-default`}>
                  <div className="text-3xl mb-4">{f.emoji}</div>
                  <h3 className="text-xl font-black text-white mb-2 group-hover:text-primary transition-colors">{f.title}</h3>
                  <p className="text-white/50 text-sm leading-relaxed">{f.desc}</p>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── SECTION 8: WHO USES NEXORA ── */}
      <section className="py-20 px-6 relative">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-white/2 to-transparent pointer-events-none" />
        <div className="max-w-6xl mx-auto relative z-10">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-14">
            <div className="inline-flex items-center gap-2 text-yellow-400 text-xs font-bold uppercase tracking-widest mb-4 border border-yellow-400/20 rounded-full px-3 py-1 bg-yellow-400/5">
              <Users className="w-3 h-3" /> Who Uses Nexora
            </div>
            <h2 className="text-4xl md:text-5xl font-black text-white mb-3">Built for Everyone Who's Curious About Cities.</h2>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {PERSONAS.map((p, i) => {
              const Icon = p.icon;
              return (
                <motion.div key={p.label} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.08 }}
                  className={`group p-5 border rounded-2xl ${p.color} hover:scale-[1.02] transition-all duration-300 cursor-default backdrop-blur-sm`}>
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center border border-current/20 bg-current/10">
                      <Icon className="w-5 h-5" />
                    </div>
                    <span className="font-black text-lg">{p.label}</span>
                  </div>
                  <p className="text-sm opacity-70 leading-relaxed">{p.desc}</p>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── SECTION 9: CTA FOOTER BANNER ── */}
      <section className="py-24 px-6 relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px] bg-primary/5 rounded-full blur-[100px]" />
          <div className="absolute top-1/2 left-1/4 -translate-y-1/2 w-[300px] h-[300px] bg-blue-500/5 rounded-full blur-[80px]" />
        </div>
        <div className="max-w-4xl mx-auto relative z-10 text-center">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
            <div className="text-6xl mb-6">🌍</div>
            <h2 className="text-4xl md:text-6xl font-black text-white mb-4 leading-tight">
              I've Never Seen a<br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-secondary">City Platform Like This.</span>
            </h2>
            <p className="text-xl text-white/40 mb-10 font-light">Join thousands exploring Earth's cities with AI intelligence.</p>
            <div className="flex flex-wrap items-center justify-center gap-4">
              <Link href="/pulse"
                className="flex items-center gap-2 px-8 py-4 bg-primary text-black font-black rounded-2xl text-lg hover:bg-primary/90 transition-all shadow-[0_0_40px_rgba(0,255,200,0.3)] hover:shadow-[0_0_60px_rgba(0,255,200,0.5)] hover:scale-105">
                <Globe2 className="w-5 h-5" /> Start Exploring Free
              </Link>
              <Link href="/viral"
                className="flex items-center gap-2 px-8 py-4 bg-white/5 border border-white/15 text-white font-bold rounded-2xl text-lg hover:bg-white/10 transition-all">
                <Zap className="w-5 h-5" /> Try Viral Features
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="border-t border-white/5 bg-black/40 backdrop-blur-xl px-6 py-12">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-10">
            <div className="col-span-2 md:col-span-1">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 rounded-lg bg-primary/20 border border-primary/30 flex items-center justify-center">
                  <Globe2 className="w-4 h-4 text-primary" />
                </div>
                <span className="font-black text-white text-lg">Nexora</span>
              </div>
              <p className="text-white/30 text-sm leading-relaxed">The living intelligence platform for every city on Earth.</p>
              <div className="flex items-center gap-2 mt-4">
                <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                <span className="text-xs text-white/30">All systems operational</span>
              </div>
            </div>
            {[
              { title: "Explore", links: ["Live Pulse", "Time Machine", "AI Forecast", "World Map", "City Battle"] },
              { title: "AI Features", links: ["Ask Nexora", "Vibe Cards", "City Reporter", "Poetry AI", "Compatibility"] },
              { title: "Platform", links: ["City Portfolio", "Timelines", "Capsules", "Leaderboard", "Heatmaps"] },
            ].map(col => (
              <div key={col.title}>
                <div className="text-white font-bold text-sm mb-4 uppercase tracking-wider">{col.title}</div>
                <ul className="space-y-2">
                  {col.links.map(l => (
                    <li key={l}>
                      <Link href="/" className="text-white/30 hover:text-white/70 transition-colors text-sm">
                        {l}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          <div className="flex flex-col md:flex-row items-center justify-between gap-4 pt-8 border-t border-white/5">
            <p className="text-white/20 text-xs">© 2026 Nexora · City Intelligence Platform · Powered by Gemini AI</p>
            <div className="flex gap-6 text-xs text-white/20">
              <span className="hover:text-white/50 cursor-pointer transition-colors">Privacy</span>
              <span className="hover:text-white/50 cursor-pointer transition-colors">Terms</span>
              <span className="hover:text-white/50 cursor-pointer transition-colors">API</span>
              <span className="hover:text-white/50 cursor-pointer transition-colors">Status</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
