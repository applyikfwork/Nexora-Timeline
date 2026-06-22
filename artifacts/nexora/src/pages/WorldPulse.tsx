import React, { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Globe2, Loader2, Zap, TrendingUp, TrendingDown, Minus,
  RefreshCw, Sparkles, Search, Activity, MapPin, Clock,
  ArrowUpRight, ChevronRight, Radio, Cpu, X, BarChart2,
  Car, Star, Cloud, Utensils, Tv, Briefcase
} from "lucide-react";

// ── DATA ─────────────────────────────────────────────────────────────
const WORLD_CITIES_DATA = [
  { id: "delhi-in", name: "Delhi", country: "India", flag: "🇮🇳", lat: 28.6, lng: 77.2, pulse: 92, trend: "up", status: "Festival + Weekend surge", mood: "Energetic", activities: ["Traffic", "Food", "Events", "Shopping"] },
  { id: "mumbai-in", name: "Mumbai", country: "India", flag: "🇮🇳", lat: 19.1, lng: 72.9, pulse: 87, trend: "up", status: "Celebration energy", mood: "Celebratory", activities: ["Nightlife", "Food", "Markets", "Cricket"] },
  { id: "tokyo-jp", name: "Tokyo", country: "Japan", flag: "🇯🇵", lat: 35.68, lng: 139.65, pulse: 94, trend: "up", status: "Peak night activity", mood: "Electric", activities: ["Nightlife", "Tech", "Food", "Transit"] },
  { id: "new-york-us", name: "New York", country: "USA", flag: "🇺🇸", lat: 40.71, lng: -74.01, pulse: 88, trend: "up", status: "Evening rush building", mood: "Hustling", activities: ["Business", "Events", "Food", "Transport"] },
  { id: "dubai-ae", name: "Dubai", country: "UAE", flag: "🇦🇪", lat: 25.2, lng: 55.27, pulse: 79, trend: "stable", status: "Tourism + Business active", mood: "Luxurious", activities: ["Tourism", "Shopping", "Business", "Events"] },
  { id: "london-uk", name: "London", country: "UK", flag: "🇬🇧", lat: 51.51, lng: -0.13, pulse: 65, trend: "down", status: "Evening calm settling", mood: "Relaxed", activities: ["Culture", "Pubs", "Food", "Tourism"] },
  { id: "paris-fr", name: "Paris", country: "France", flag: "🇫🇷", lat: 48.86, lng: 2.35, pulse: 68, trend: "stable", status: "Steady cultural pulse", mood: "Romantic", activities: ["Culture", "Cafes", "Tourism", "Art"] },
  { id: "singapore-sg", name: "Singapore", country: "Singapore", flag: "🇸🇬", lat: 1.35, lng: 103.82, pulse: 83, trend: "up", status: "Business district buzzing", mood: "Productive", activities: ["Business", "Food", "Tech", "Events"] },
  { id: "seoul-kr", name: "Seoul", country: "South Korea", flag: "🇰🇷", lat: 37.57, lng: 126.98, pulse: 86, trend: "up", status: "K-culture event surge", mood: "Trendy", activities: ["Entertainment", "Food", "Fashion", "K-pop"] },
  { id: "sydney-au", name: "Sydney", country: "Australia", flag: "🇦🇺", lat: -33.87, lng: 151.21, pulse: 71, trend: "stable", status: "Morning activity moderate", mood: "Breezy", activities: ["Beach", "Food", "Sports", "Tourism"] },
  { id: "bangalore-in", name: "Bangalore", country: "India", flag: "🇮🇳", lat: 12.97, lng: 77.59, pulse: 81, trend: "up", status: "Tech hub buzzing", mood: "Innovative", activities: ["Tech", "Startups", "Food", "Students"] },
  { id: "cairo-eg", name: "Cairo", country: "Egypt", flag: "🇪🇬", lat: 30.04, lng: 31.24, pulse: 74, trend: "stable", status: "Cultural activity moderate", mood: "Historic", activities: ["Tourism", "Markets", "Culture", "Food"] },
  { id: "berlin-de", name: "Berlin", country: "Germany", flag: "🇩🇪", lat: 52.52, lng: 13.41, pulse: 62, trend: "down", status: "Night culture waking up", mood: "Creative", activities: ["Music", "Art", "Nightlife", "Food"] },
  { id: "sao-paulo-br", name: "São Paulo", country: "Brazil", flag: "🇧🇷", lat: -23.55, lng: -46.63, pulse: 80, trend: "up", status: "Evening energy rising", mood: "Vibrant", activities: ["Food", "Music", "Business", "Events"] },
  { id: "toronto-ca", name: "Toronto", country: "Canada", flag: "🇨🇦", lat: 43.65, lng: -79.38, pulse: 67, trend: "stable", status: "Steady urban rhythm", mood: "Balanced", activities: ["Business", "Food", "Culture", "Sports"] },
];

const REGIONS = [
  { name: "Asia", emoji: "🌏", activity: 88, color: "#ff4757", cities: 6, trend: "up" },
  { name: "Americas", emoji: "🌎", activity: 76, color: "#ffa502", cities: 3, trend: "stable" },
  { name: "Europe", emoji: "🌍", activity: 64, color: "#74b9ff", cities: 4, trend: "down" },
  { name: "Middle East", emoji: "🌙", activity: 79, color: "#fdcb6e", cities: 1, trend: "stable" },
  { name: "Africa", emoji: "🌍", activity: 71, color: "#a29bfe", cities: 1, trend: "up" },
  { name: "Oceania", emoji: "🌊", activity: 58, color: "#55efc4", cities: 1, trend: "stable" },
];

const GLOBAL_EVENTS = [
  { country: "India", flag: "🇮🇳", event: "Festival Season", type: "Culture", hot: true },
  { country: "Japan", flag: "🇯🇵", event: "Cultural Exhibition", type: "Culture" },
  { country: "USA", flag: "🇺🇸", event: "Sports Finals", type: "Sports", hot: true },
  { country: "South Korea", flag: "🇰🇷", event: "K-Pop Concert", type: "Entertainment" },
  { country: "Brazil", flag: "🇧🇷", event: "Music Festival", type: "Entertainment" },
  { country: "Germany", flag: "🇩🇪", event: "Tech Conference", type: "Business" },
  { country: "UAE", flag: "🇦🇪", event: "Global Summit", type: "Business" },
  { country: "Egypt", flag: "🇪🇬", event: "Heritage Tour Week", type: "Tourism" },
];

const LIVE_FEED_ITEMS = [
  { city: "Delhi", text: "Metro traffic surging — weekend movement peak", time: "Just now", emoji: "🚇", hot: true },
  { city: "Tokyo", text: "Nightlife district fully active — record foot traffic", time: "2m ago", emoji: "🌃" },
  { city: "Dubai", text: "Global summit opening — 50k+ delegates arrived", time: "5m ago", emoji: "🏛️" },
  { city: "Mumbai", text: "Cricket stadium energy building pre-match", time: "8m ago", emoji: "🏏", hot: true },
  { city: "Seoul", text: "K-pop concert sold out — social media viral", time: "11m ago", emoji: "🎤" },
  { city: "London", text: "Evening calm settling — pub culture active", time: "15m ago", emoji: "🍺" },
  { city: "São Paulo", text: "Night food markets opening — high demand", time: "18m ago", emoji: "🍛" },
  { city: "Bangalore", text: "Startup pitching event — tech community buzzing", time: "22m ago", emoji: "💻" },
  { city: "Singapore", text: "Business district peak — APAC meeting surge", time: "25m ago", emoji: "🏢" },
  { city: "New York", text: "Broadway district filling — shows sold out", time: "30m ago", emoji: "🎭" },
];

const CATEGORIES = [
  { id: "all", label: "🔥 Trending", color: "#ff4757" },
  { id: "movement", label: "🚗 Movement", color: "#fdcb6e" },
  { id: "events", label: "🎉 Events", color: "#a29bfe" },
  { id: "sports", label: "🏏 Sports", color: "#00cec9" },
  { id: "weather", label: "🌧 Weather", color: "#74b9ff" },
  { id: "food", label: "🍛 Food", color: "#fd79a8" },
  { id: "entertainment", label: "🎬 Entertainment", color: "#e17055" },
  { id: "business", label: "💼 Business", color: "#55efc4" },
];

function pulseColor(p: number) {
  if (p > 85) return "#ff4757";
  if (p > 70) return "#ffa502";
  if (p > 50) return "#00ffcc";
  return "#74b9ff";
}

function AnimatedCounter({ target, suffix = "" }: { target: number; suffix?: string }) {
  const [val, setVal] = useState(0);
  useEffect(() => {
    let i = 0;
    const step = target / 60;
    const t = setInterval(() => {
      i += step;
      if (i >= target) { setVal(target); clearInterval(t); }
      else setVal(Math.floor(i));
    }, 20);
    return () => clearInterval(t);
  }, [target]);
  return <>{val.toLocaleString()}{suffix}</>;
}

// ── LIVE GLOBE (fixed TypeScript) ────────────────────────────────────
function LiveGlobe({ cities, onCityClick }: {
  cities: typeof WORLD_CITIES_DATA;
  onCityClick: (c: typeof WORLD_CITIES_DATA[0]) => void;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef<number>(0);
  const rotRef = useRef(0);
  const citiesRef = useRef(cities);
  citiesRef.current = cities;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctxOrNull = canvas.getContext("2d");
    if (!ctxOrNull) return;
    const ctx = ctxOrNull;
    const W = canvas.width, H = canvas.height;
    const cx = W / 2, cy = H / 2;
    const R = Math.min(W, H) / 2 - 20;

    function project(lat: number, lng: number, rot: number) {
      const phi = ((90 - lat) * Math.PI) / 180;
      const theta = ((lng + rot) * Math.PI) / 180;
      const x = R * Math.sin(phi) * Math.cos(theta);
      const y = R * Math.cos(phi);
      const z = R * Math.sin(phi) * Math.sin(theta);
      return { x: cx + x, y: cy - y, z, visible: z > -R * 0.05 };
    }

    function draw() {
      ctx.clearRect(0, 0, W, H);
      rotRef.current = (rotRef.current + 0.12) % 360;
      const rot = rotRef.current;
      const t = Date.now() / 1000;

      // Atmosphere glow
      const atmo = ctx.createRadialGradient(cx, cy, R * 0.85, cx, cy, R * 1.15);
      atmo.addColorStop(0, "rgba(0,255,204,0)");
      atmo.addColorStop(0.5, "rgba(0,100,255,0.04)");
      atmo.addColorStop(1, "rgba(0,50,150,0)");
      ctx.beginPath(); ctx.arc(cx, cy, R * 1.15, 0, Math.PI * 2);
      ctx.fillStyle = atmo; ctx.fill();

      // Globe body
      const grad = ctx.createRadialGradient(cx - R * 0.25, cy - R * 0.25, 0, cx, cy, R);
      grad.addColorStop(0, "rgba(5,30,50,0.96)");
      grad.addColorStop(0.7, "rgba(2,18,35,0.98)");
      grad.addColorStop(1, "rgba(0,10,25,1)");
      ctx.beginPath(); ctx.arc(cx, cy, R, 0, Math.PI * 2);
      ctx.fillStyle = grad; ctx.fill();

      // Highlight
      const hl = ctx.createRadialGradient(cx - R * 0.3, cy - R * 0.35, 0, cx, cy, R);
      hl.addColorStop(0, "rgba(0,200,255,0.06)");
      hl.addColorStop(0.4, "rgba(0,100,200,0.02)");
      hl.addColorStop(1, "rgba(0,0,0,0)");
      ctx.beginPath(); ctx.arc(cx, cy, R, 0, Math.PI * 2);
      ctx.fillStyle = hl; ctx.fill();

      // Grid lines
      ctx.strokeStyle = "rgba(0,255,204,0.07)";
      ctx.lineWidth = 0.5;
      for (let lat = -60; lat <= 60; lat += 30) {
        ctx.beginPath(); let first = true;
        for (let lng2 = -180; lng2 <= 180; lng2 += 3) {
          const p = project(lat, lng2, rot);
          if (!p.visible) { first = true; continue; }
          first ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y);
          first = false;
        }
        ctx.stroke();
      }
      for (let lng2 = -180; lng2 <= 180; lng2 += 30) {
        ctx.beginPath(); let first = true;
        for (let lat2 = -85; lat2 <= 85; lat2 += 3) {
          const p = project(lat2, lng2, rot);
          if (!p.visible) { first = true; continue; }
          first ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y);
          first = false;
        }
        ctx.stroke();
      }

      // Equator highlight
      ctx.strokeStyle = "rgba(0,255,204,0.12)";
      ctx.lineWidth = 1;
      ctx.beginPath(); let first = true;
      for (let lng2 = -180; lng2 <= 180; lng2 += 2) {
        const p = project(0, lng2, rot);
        if (!p.visible) { first = true; continue; }
        first ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y);
        first = false;
      }
      ctx.stroke();

      // Connection lines between top cities
      const visible = citiesRef.current
        .map(c => ({ ...c, proj: project(c.lat, c.lng, rot) }))
        .filter(c => c.proj.visible && c.proj.z > R * 0.2);
      
      const top = visible.sort((a, b) => b.pulse - a.pulse).slice(0, 4);
      for (let i = 0; i < top.length; i++) {
        for (let j = i + 1; j < top.length; j++) {
          const a = top[i], b = top[j];
          const alpha = Math.max(0, (Math.sin(t * 0.8 + i * 1.2) * 0.5 + 0.5) * 0.12);
          ctx.beginPath();
          ctx.moveTo(a.proj.x, a.proj.y);
          ctx.bezierCurveTo(
            cx, cy - R * 0.3,
            cx, cy - R * 0.3,
            b.proj.x, b.proj.y
          );
          ctx.strokeStyle = `rgba(0,255,204,${alpha})`;
          ctx.lineWidth = 0.8;
          ctx.stroke();
        }
      }

      // City dots
      const sorted = [...citiesRef.current].sort((a, b) => {
        return project(a.lat, a.lng, rot).z - project(b.lat, b.lng, rot).z;
      });
      sorted.forEach(city => {
        const p = project(city.lat, city.lng, rot);
        if (!p.visible) return;
        const color = pulseColor(city.pulse);
        const depth = Math.max(0.3, (p.z + R) / (2 * R));
        const r = (3 + (city.pulse / 100) * 5) * depth;
        const ping = Math.sin(t * 2.5 + city.lat * 0.4) * 0.5 + 0.5;
        const pingR = r + ping * 12 * depth;

        ctx.beginPath(); ctx.arc(p.x, p.y, pingR, 0, Math.PI * 2);
        const hexAlpha = Math.floor(ping * 25).toString(16).padStart(2, "0");
        ctx.fillStyle = color + hexAlpha; ctx.fill();

        ctx.beginPath(); ctx.arc(p.x, p.y, r, 0, Math.PI * 2);
        ctx.fillStyle = color + "cc"; ctx.fill();
        ctx.strokeStyle = color; ctx.lineWidth = 1.5 * depth; ctx.stroke();

        if (depth > 0.55) {
          ctx.fillStyle = `rgba(255,255,255,${0.65 * depth})`;
          ctx.font = `bold ${Math.floor(9 * depth)}px sans-serif`;
          ctx.textAlign = "center";
          ctx.fillText(city.name, p.x, p.y - r - 4);
        }
      });

      // Rim
      ctx.strokeStyle = "rgba(0,255,204,0.15)";
      ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.arc(cx, cy, R, 0, Math.PI * 2); ctx.stroke();

      animRef.current = requestAnimationFrame(draw);
    }

    draw();
    return () => cancelAnimationFrame(animRef.current);
  }, []);

  // Click detection
  function handleClick(e: React.MouseEvent<HTMLCanvasElement>) {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const mx = (e.clientX - rect.left) * scaleX;
    const my = (e.clientY - rect.top) * scaleY;
    const W = canvas.width, H = canvas.height;
    const cx = W / 2, cy = H / 2;
    const R = Math.min(W, H) / 2 - 20;
    const rot = rotRef.current;

    let closest: (typeof WORLD_CITIES_DATA[0]) | null = null;
    let minDist = 30;
    citiesRef.current.forEach(city => {
      const phi = ((90 - city.lat) * Math.PI) / 180;
      const theta = ((city.lng + rot) * Math.PI) / 180;
      const x = cx + R * Math.sin(phi) * Math.cos(theta);
      const y = cy - R * Math.cos(phi);
      const z = R * Math.sin(phi) * Math.sin(theta);
      if (z < -R * 0.05) return;
      const dist = Math.sqrt((mx - x) ** 2 + (my - y) ** 2);
      if (dist < minDist) { minDist = dist; closest = city; }
    });
    if (closest) onCityClick(closest);
  }

  return (
    <canvas
      ref={canvasRef}
      width={500}
      height={500}
      onClick={handleClick}
      className="w-full max-w-md mx-auto cursor-pointer"
      title="Click a city to explore its pulse"
    />
  );
}

// ── MAIN COMPONENT ───────────────────────────────────────────────────
export default function WorldPulse() {
  const [cities] = useState(WORLD_CITIES_DATA);
  const [selected, setSelected] = useState<typeof WORLD_CITIES_DATA[0] | null>(null);
  const [activeCategory, setActiveCategory] = useState("all");
  const [timeValue, setTimeValue] = useState(18);
  const [showAIChat, setShowAIChat] = useState(false);
  const [aiQuery, setAiQuery] = useState("");
  const [aiAnswer, setAiAnswer] = useState<string | null>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiSummary, setAiSummary] = useState<string | null>(null);
  const [summaryLoading, setSummaryLoading] = useState(false);
  const [compareA, setCompareA] = useState("india");
  const [compareB, setCompareB] = useState("usa");
  const [liveSignals, setLiveSignals] = useState(24500);
  const feedRef = useRef<HTMLDivElement>(null);

  // Animate signal count
  useEffect(() => {
    const t = setInterval(() => setLiveSignals(s => s + Math.floor(Math.random() * 20) - 8), 2000);
    return () => clearInterval(t);
  }, []);

  // Auto-scroll live feed
  useEffect(() => {
    const el = feedRef.current;
    if (!el) return;
    let pos = 0;
    const t = setInterval(() => {
      pos += 0.5;
      if (pos >= el.scrollHeight - el.clientHeight) pos = 0;
      el.scrollTop = pos;
    }, 40);
    return () => clearInterval(t);
  }, []);

  const avgPulse = Math.round(cities.reduce((s, c) => s + c.pulse, 0) / cities.length);
  const surging = cities.filter(c => c.trend === "up").length;

  async function loadAISummary() {
    if (aiSummary) return;
    setSummaryLoading(true);
    try {
      const res = await fetch("/api/chat/message", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: "Generate a 3-sentence AI World Brief. Describe current global activity levels: Asia is very active, Europe is calm, Americas building momentum, India specifically has festival and weekend energy. Make it sound like a real-time intelligence briefing.",
          sessionId: "world-pulse-summary"
        })
      });
      const d = await res.json();
      setAiSummary(d.message || null);
    } catch { setAiSummary("Asia is leading global activity with India and Japan driving intense urban energy. Europe is in a calmer evening mode while the Americas are building momentum toward peak hours. AI signals show a strong upward trend across emerging markets tonight."); }
    finally { setSummaryLoading(false); }
  }

  useEffect(() => { loadAISummary(); }, []);

  async function askWorldAI() {
    if (!aiQuery.trim()) return;
    setAiLoading(true); setAiAnswer(null);
    try {
      const res = await fetch("/api/chat/message", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: `World Pulse Intelligence Query: "${aiQuery}". Answer in 2 concise sentences with specific city/country mentions and activity data.`,
          sessionId: "world-ai-ask"
        })
      });
      const d = await res.json();
      setAiAnswer(d.message || "Nexora AI is processing global signals...");
    } catch { setAiAnswer("Global intelligence gathering in progress. India, Tokyo and New York are currently leading activity worldwide."); }
    finally { setAiLoading(false); }
  }

  const timeLabel = (v: number) => v === 0 ? "12 AM" : v < 12 ? `${v} AM` : v === 12 ? "12 PM" : `${v - 12} PM`;
  const timeContext = (v: number) => {
    if (v < 7) return "🌙 Most cities sleeping — night owl zones active";
    if (v < 11) return "☕ Morning rush — Asia/Middle East leading";
    if (v < 14) return "🌞 Midday peak — global synchronization";
    if (v < 18) return "🏃 Afternoon push — business hours driving signals";
    if (v < 22) return "🔥 Evening surge — entertainment, food, events peak";
    return "🌃 Night culture — Tokyo, Seoul, NYC dominating";
  };

  return (
    <div className="min-h-full" style={{ background: "linear-gradient(180deg, #050d1a 0%, #07111f 100%)" }}>

      {/* ── HERO ── */}
      <div className="relative overflow-hidden border-b border-white/5">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 left-0 w-full h-full opacity-30"
            style={{ background: "radial-gradient(ellipse at 20% 50%, #00ffcc08 0%, transparent 60%), radial-gradient(ellipse at 80% 20%, #0066ff06 0%, transparent 50%)" }} />
        </div>

        <div className="relative px-6 md:px-10 pt-8 pb-6">
          <div className="flex flex-col lg:flex-row gap-8 items-start">
            {/* Left: title + globe */}
            <div className="flex-1 space-y-6">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
                  <span className="text-xs font-bold text-cyan-400 uppercase tracking-widest">Live Intelligence</span>
                </div>
                <h1 className="text-4xl md:text-5xl font-black text-white leading-tight">
                  🌎 Live Pulse<br />
                  <span className="text-transparent bg-clip-text" style={{ backgroundImage: "linear-gradient(135deg, #00ffcc, #0099ff)" }}>
                    Of The World
                  </span>
                </h1>
                <p className="text-white/50 mt-3 text-sm max-w-md leading-relaxed">
                  Real-time AI intelligence showing how places are moving, changing, and evolving — every second of every day.
                </p>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {[
                  { label: "Countries", value: 195, emoji: "🌍", color: "#00ffcc" },
                  { label: "Active Signals", value: liveSignals, emoji: "🔥", color: "#ff4757" },
                  { label: "Avg Global Pulse", value: avgPulse, emoji: "📡", color: "#ffa502", suffix: "%" },
                  { label: "AI Monitoring", value: "LIVE", emoji: "🤖", color: "#a29bfe", noCount: true },
                ].map(stat => (
                  <div key={stat.label} className="bg-[#0d1f33]/80 backdrop-blur border border-white/8 rounded-2xl p-4 text-center">
                    <div className="text-xl mb-1">{stat.emoji}</div>
                    <div className="text-2xl font-black" style={{ color: stat.color }}>
                      {stat.noCount ? <span>{stat.value}</span> : <AnimatedCounter target={stat.value as number} suffix={stat.suffix || ""} />}
                    </div>
                    <div className="text-xs text-white/35 mt-1">{stat.label}</div>
                  </div>
                ))}
              </div>

              {/* Categories */}
              <div className="flex gap-2 flex-wrap">
                {CATEGORIES.map(cat => (
                  <button key={cat.id} onClick={() => setActiveCategory(cat.id)}
                    className={`text-xs px-3 py-1.5 rounded-xl font-semibold transition-all border ${activeCategory === cat.id ? "text-black border-transparent" : "border-white/10 text-white/50 hover:text-white bg-transparent"}`}
                    style={activeCategory === cat.id ? { background: cat.color } : {}}>
                    {cat.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Right: Globe */}
            <div className="w-full lg:w-[420px] flex flex-col items-center">
              <div className="relative w-full">
                <div className="absolute inset-0 rounded-full pointer-events-none"
                  style={{ background: "radial-gradient(circle at center, #00ffcc06 0%, transparent 70%)" }} />
                <LiveGlobe cities={cities} onCityClick={c => setSelected(c)} />
              </div>
              <div className="text-xs text-white/20 text-center mt-1">
                Click any city point to explore its pulse
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="px-6 md:px-10 py-8 space-y-8">

        {/* ── SELECTED CITY PANEL ── */}
        <AnimatePresence>
          {selected && (
            <motion.div
              initial={{ opacity: 0, y: -12, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -12, scale: 0.98 }}
              className="relative overflow-hidden rounded-3xl p-6 border"
              style={{
                background: `linear-gradient(135deg, ${pulseColor(selected.pulse)}08 0%, #0d1f33 50%, ${pulseColor(selected.pulse)}05 100%)`,
                borderColor: `${pulseColor(selected.pulse)}25`
              }}
            >
              <button onClick={() => setSelected(null)}
                className="absolute top-4 right-4 text-white/30 hover:text-white/70 transition-colors">
                <X className="w-4 h-4" />
              </button>
              <div className="flex items-start gap-5 flex-wrap">
                <div className="relative flex-shrink-0">
                  <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-3xl border"
                    style={{ background: `${pulseColor(selected.pulse)}12`, borderColor: `${pulseColor(selected.pulse)}30` }}>
                    {selected.flag}
                  </div>
                  <motion.div
                    animate={{ scale: [1, 1.4, 1], opacity: [0.5, 0, 0.5] }}
                    transition={{ duration: 2, repeat: Infinity }}
                    className="absolute inset-0 rounded-2xl border"
                    style={{ borderColor: pulseColor(selected.pulse) }}
                  />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-1">
                    <h2 className="text-2xl font-black text-white">{selected.name}</h2>
                    <span className="text-sm text-white/40">{selected.country}</span>
                  </div>
                  <div className="flex items-center gap-3 mb-3">
                    <div className="text-4xl font-black" style={{ color: pulseColor(selected.pulse) }}>
                      {selected.pulse}%
                    </div>
                    <div>
                      <div className="text-sm font-bold text-white">
                        {selected.pulse > 85 ? "Very Active" : selected.pulse > 70 ? "Active" : "Moderate"}
                      </div>
                      <div className="text-xs text-white/40">Current Pulse</div>
                    </div>
                  </div>
                  <div className="text-sm text-white/50 italic mb-3">"{selected.status}"</div>
                  <div className="flex flex-wrap gap-2">
                    {selected.activities.map(a => (
                      <span key={a} className="text-xs px-2.5 py-1 rounded-full bg-white/6 border border-white/8 text-white/60">{a}</span>
                    ))}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-xs text-white/30 uppercase tracking-widest mb-1">Mood</div>
                  <div className="text-lg font-bold text-white">{selected.mood}</div>
                  <div className="flex items-center gap-1 justify-end mt-2">
                    {selected.trend === "up" ? <TrendingUp className="w-4 h-4 text-green-400" /> :
                     selected.trend === "down" ? <TrendingDown className="w-4 h-4 text-red-400" /> :
                     <Minus className="w-4 h-4 text-white/30" />}
                    <span className="text-xs capitalize text-white/40">{selected.trend}</span>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── TWO COLUMN: RANKINGS + LIVE FEED ── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* City Rankings */}
          <div className="lg:col-span-2 bg-[#0d1f33]/80 border border-white/8 rounded-2xl p-5">
            <div className="flex items-center justify-between mb-4">
              <div className="text-sm font-bold text-white/50 uppercase tracking-widest flex items-center gap-2">
                <Zap className="w-4 h-4 text-cyan-400" /> City Rankings by Pulse
              </div>
              <div className="text-xs text-white/25">{cities.length} cities monitored</div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-h-80 overflow-y-auto pr-1">
              {[...cities].sort((a, b) => b.pulse - a.pulse).map((city, i) => (
                <button key={city.id} onClick={() => setSelected(selected?.id === city.id ? null : city)}
                  className={`flex items-center gap-3 p-3 rounded-xl transition-all text-left border ${selected?.id === city.id ? "border-cyan-500/30 bg-cyan-500/8" : "border-transparent hover:bg-white/5 hover:border-white/8"}`}>
                  <div className="text-xs font-black text-white/20 w-4 flex-shrink-0">#{i + 1}</div>
                  <div className="text-xl">{city.flag}</div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-bold text-white leading-tight">{city.name}</div>
                    <div className="w-full h-1 bg-white/5 rounded-full mt-1.5 overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${city.pulse}%` }}
                        transition={{ duration: 0.8, delay: i * 0.03 }}
                        className="h-full rounded-full"
                        style={{ background: pulseColor(city.pulse) }}
                      />
                    </div>
                  </div>
                  <div className="text-sm font-black flex-shrink-0" style={{ color: pulseColor(city.pulse) }}>
                    {city.pulse}%
                  </div>
                  {city.trend === "up" ? <TrendingUp className="w-3 h-3 text-green-400 flex-shrink-0" /> :
                   city.trend === "down" ? <TrendingDown className="w-3 h-3 text-red-400 flex-shrink-0" /> :
                   <Minus className="w-3 h-3 text-white/20 flex-shrink-0" />}
                </button>
              ))}
            </div>
          </div>

          {/* Live Timeline Feed */}
          <div className="bg-[#0d1f33]/80 border border-white/8 rounded-2xl p-5 flex flex-col">
            <div className="flex items-center gap-2 mb-4 flex-shrink-0">
              <div className="w-2 h-2 rounded-full bg-red-400 animate-pulse" />
              <div className="text-sm font-bold text-white/50 uppercase tracking-widest">Live Feed</div>
            </div>
            <div ref={feedRef} className="flex-1 overflow-hidden space-y-0" style={{ maxHeight: 320 }}>
              {[...LIVE_FEED_ITEMS, ...LIVE_FEED_ITEMS].map((item, i) => (
                <div key={i} className="flex items-start gap-3 py-2.5 border-b border-white/4 last:border-0">
                  <span className="text-lg flex-shrink-0">{item.emoji}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 mb-0.5">
                      <span className="text-xs font-bold text-white/70">{item.city}</span>
                      {item.hot && <span className="text-xs text-red-400 font-bold">🔥</span>}
                    </div>
                    <div className="text-xs text-white/40 leading-relaxed">{item.text}</div>
                  </div>
                  <div className="text-xs text-white/20 flex-shrink-0 mt-0.5">{item.time}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── WORLD ACTIVITY RINGS ── */}
        <div className="bg-[#0d1f33]/80 border border-white/8 rounded-2xl p-6">
          <div className="flex items-center gap-2 mb-5">
            <Activity className="w-4 h-4 text-orange-400" />
            <div className="text-sm font-bold text-white/50 uppercase tracking-widest">World Activity Rings</div>
            <div className="ml-auto text-xs text-white/25">Heartbeat by Region</div>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {REGIONS.map((region, i) => (
              <motion.div key={region.name}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.08 }}
                className="flex flex-col items-center gap-3">
                <div className="relative w-20 h-20">
                  <svg viewBox="0 0 80 80" className="w-full h-full -rotate-90">
                    <circle cx={40} cy={40} r={32} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth={6} />
                    <motion.circle cx={40} cy={40} r={32} fill="none"
                      stroke={region.color} strokeWidth={6}
                      strokeLinecap="round"
                      strokeDasharray={`${2 * Math.PI * 32}`}
                      initial={{ strokeDashoffset: 2 * Math.PI * 32 }}
                      animate={{ strokeDashoffset: 2 * Math.PI * 32 * (1 - region.activity / 100) }}
                      transition={{ duration: 1.2, delay: i * 0.1, ease: "easeOut" }}
                      style={{ filter: `drop-shadow(0 0 4px ${region.color}60)` }}
                    />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-sm font-black text-white">{region.activity}%</span>
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-sm font-bold text-white">{region.emoji} {region.name}</div>
                  <div className="text-xs text-white/30">{region.cities} cities</div>
                  <div className="flex items-center justify-center gap-1 mt-1">
                    {region.trend === "up" ? <TrendingUp className="w-3 h-3 text-green-400" /> :
                     region.trend === "down" ? <TrendingDown className="w-3 h-3 text-red-400" /> :
                     <Minus className="w-3 h-3 text-white/25" />}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* ── AI WORLD BRIEF + INDIA FOCUS ── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

          {/* AI World Brief */}
          <div className="bg-[#0d1f33]/80 border border-cyan-500/15 rounded-2xl p-6"
            style={{ boxShadow: "0 0 40px rgba(0,255,204,0.04)" }}>
            <div className="flex items-center gap-2 mb-4">
              <Sparkles className="w-4 h-4 text-cyan-400" />
              <div className="text-sm font-bold text-cyan-400 uppercase tracking-widest">🌍 AI World Brief</div>
              {summaryLoading && <Loader2 className="w-3.5 h-3.5 text-cyan-400 animate-spin ml-auto" />}
            </div>
            {summaryLoading ? (
              <div className="space-y-3">
                {[90, 75, 85, 60].map((w, i) => (
                  <div key={i} className="h-3 rounded-full bg-white/5 animate-pulse" style={{ width: `${w}%` }} />
                ))}
              </div>
            ) : (
              <div className="space-y-3">
                <p className="text-sm text-white/70 leading-relaxed">
                  {aiSummary || "Asia is leading global activity tonight with India and Japan driving the highest urban energy. Europe is settling into its evening rhythm while the Americas build toward peak hours. AI monitors 24,500+ signals across 195 countries in real-time."}
                </p>
                <div className="pt-3 border-t border-white/5 grid grid-cols-2 gap-3">
                  {[
                    { label: "Highest Activity", value: "India 🇮🇳", color: "#ff4757" },
                    { label: "Most Calm", value: "Europe 🌍", color: "#74b9ff" },
                    { label: "Rising Fast", value: "Seoul 🇰🇷", color: "#00ffcc" },
                    { label: "Night Zone", value: "Tokyo 🇯🇵", color: "#a29bfe" },
                  ].map(s => (
                    <div key={s.label} className="bg-white/4 rounded-xl p-3">
                      <div className="text-xs text-white/30 mb-0.5">{s.label}</div>
                      <div className="text-sm font-bold" style={{ color: s.color }}>{s.value}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* India Focus */}
          <div className="bg-[#0d1f33]/80 border border-orange-500/15 rounded-2xl p-6"
            style={{ boxShadow: "0 0 40px rgba(255,100,0,0.04)" }}>
            <div className="flex items-center gap-2 mb-4">
              <span className="text-lg">🇮🇳</span>
              <div className="text-sm font-bold text-orange-400 uppercase tracking-widest">India Focus Pulse</div>
              <div className="ml-auto flex items-center gap-1">
                <div className="w-1.5 h-1.5 rounded-full bg-red-400 animate-pulse" />
                <span className="text-xs text-red-400 font-bold">HOT</span>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3 mb-4">
              {cities.filter(c => c.country === "India").map(city => (
                <button key={city.id} onClick={() => setSelected(city)}
                  className="flex items-center gap-2 p-3 bg-white/4 rounded-xl border border-white/5 hover:border-orange-500/25 transition-all group text-left">
                  <div className="text-xl">{city.pulse > 85 ? "🔥" : city.pulse > 75 ? "⚡" : "✨"}</div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-bold text-white group-hover:text-orange-300 transition-colors">{city.name}</div>
                    <div className="text-xs font-bold" style={{ color: pulseColor(city.pulse) }}>{city.pulse}%</div>
                  </div>
                </button>
              ))}
            </div>
            <div className="space-y-1.5">
              {[
                { icon: "🎉", label: "Festival Season", val: 95 },
                { icon: "🏏", label: "Cricket Excitement", val: 98 },
                { icon: "🛍", label: "Market Activity", val: 88 },
                { icon: "✈️", label: "Travel Surge", val: 82 },
                { icon: "🎓", label: "Student Activity", val: 79 },
              ].map(item => (
                <div key={item.label} className="flex items-center gap-2">
                  <span className="text-sm w-5">{item.icon}</span>
                  <span className="text-xs text-white/50 flex-1">{item.label}</span>
                  <div className="w-20 h-1 bg-white/5 rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }} animate={{ width: `${item.val}%` }}
                      transition={{ duration: 0.8, delay: 0.3 }}
                      className="h-full rounded-full bg-orange-400/70"
                    />
                  </div>
                  <span className="text-xs font-bold text-orange-400 w-8 text-right">{item.val}%</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── GLOBAL EVENTS + FUTURE PREDICTIONS ── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

          {/* Global Events Radar */}
          <div className="bg-[#0d1f33]/80 border border-white/8 rounded-2xl p-5">
            <div className="flex items-center gap-2 mb-4">
              <Radio className="w-4 h-4 text-purple-400" />
              <div className="text-sm font-bold text-white/50 uppercase tracking-widest">🌐 Global Events Radar</div>
            </div>
            <div className="space-y-2">
              {GLOBAL_EVENTS.map((ev, i) => (
                <motion.div key={i}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.06 }}
                  className="flex items-center gap-3 p-3 bg-white/3 rounded-xl border border-white/5 hover:bg-white/6 transition-all">
                  <span className="text-xl">{ev.flag}</span>
                  <div className="flex-1">
                    <div className="text-sm font-semibold text-white">{ev.country}</div>
                    <div className="text-xs text-white/40">{ev.event}</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${ev.hot ? "bg-red-500/20 text-red-400 border border-red-500/25" : "bg-white/5 text-white/30 border border-white/8"}`}>
                      {ev.type}
                    </span>
                    {ev.hot && <div className="w-1.5 h-1.5 rounded-full bg-red-400 animate-pulse" />}
                  </div>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Future Pulse Prediction + Compare */}
          <div className="space-y-4">
            {/* Predictions */}
            <div className="bg-[#0d1f33]/80 border border-pink-500/15 rounded-2xl p-5">
              <div className="flex items-center gap-2 mb-4">
                <Cpu className="w-4 h-4 text-pink-400" />
                <div className="text-sm font-bold text-pink-400 uppercase tracking-widest">🔮 Future Pulse — Next 3 Hours</div>
              </div>
              <div className="space-y-3">
                {[
                  { country: "India 🇮🇳", dir: "↑", val: "+8%", reason: "Weekend + Events + Weather", conf: 89, color: "#ff4757" },
                  { country: "Tokyo 🇯🇵", dir: "↑", val: "+12%", reason: "Night culture peaking", conf: 92, color: "#00ffcc" },
                  { country: "Europe 🌍", dir: "↓", val: "-5%", reason: "Night calm incoming", conf: 85, color: "#74b9ff" },
                  { country: "Americas 🌎", dir: "↑", val: "+15%", reason: "Prime time evening surge", conf: 78, color: "#ffa502" },
                ].map(p => (
                  <div key={p.country} className="flex items-center gap-3 p-2.5 bg-white/3 rounded-xl">
                    <div className="flex-1">
                      <div className="text-sm font-bold text-white">{p.country}</div>
                      <div className="text-xs text-white/35">{p.reason}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-black" style={{ color: p.color }}>{p.dir} {p.val}</div>
                      <div className="text-xs text-white/25">{p.conf}% conf</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Compare World */}
            <div className="bg-[#0d1f33]/80 border border-white/8 rounded-2xl p-5">
              <div className="flex items-center gap-2 mb-4">
                <BarChart2 className="w-4 h-4 text-cyan-400" />
                <div className="text-sm font-bold text-white/50 uppercase tracking-widest">Compare World</div>
              </div>
              {(() => {
                const regionData: Record<string, { label: string; activity: number; mood: string; weather: string; events: number }> = {
                  india: { label: "India 🇮🇳", activity: 90, mood: "Celebration", weather: "Pleasant", events: 12 },
                  usa: { label: "USA 🇺🇸", activity: 76, mood: "Hustling", weather: "Varied", events: 8 },
                  europe: { label: "Europe 🌍", activity: 64, mood: "Relaxed", weather: "Cool", events: 5 },
                  asia: { label: "E. Asia 🌏", activity: 88, mood: "Electric", weather: "Clear", events: 10 },
                };
                const a = regionData[compareA] || regionData.india;
                const b = regionData[compareB] || regionData.usa;
                return (
                  <div>
                    <div className="flex gap-2 mb-4">
                      {[["a", compareA, setCompareA], ["b", compareB, setCompareB]].map(([side, val, set]: any) => (
                        <select key={side} value={val} onChange={e => set(e.target.value)}
                          className="flex-1 bg-[#07111f] border border-white/10 text-white rounded-xl px-3 py-2 text-xs focus:border-cyan-500/40 focus:outline-none">
                          {Object.entries(regionData).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                        </select>
                      ))}
                    </div>
                    <div className="space-y-2">
                      {[
                        ["Activity", a.activity, b.activity, "%"],
                        ["Events", a.events * 8, b.events * 8, ""],
                        ["Mood Score", 85, 76, ""],
                      ].map(([label, av, bv]: any) => (
                        <div key={label}>
                          <div className="flex justify-between text-xs text-white/35 mb-1">
                            <span>{a.label.split(" ")[0]}: {av}{label === "Activity" ? "%" : ""}</span>
                            <span className="font-bold text-white/50">{label}</span>
                            <span>{b.label.split(" ")[0]}: {bv}{label === "Activity" ? "%" : ""}</span>
                          </div>
                          <div className="flex h-1.5 gap-0.5">
                            <div className="flex-1 bg-white/5 rounded-l-full overflow-hidden flex justify-end">
                              <div className="h-full rounded-l-full bg-cyan-400" style={{ width: `${av}%` }} />
                            </div>
                            <div className="flex-1 bg-white/5 rounded-r-full overflow-hidden">
                              <div className="h-full rounded-r-full bg-purple-400" style={{ width: `${bv}%` }} />
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })()}
            </div>
          </div>
        </div>

        {/* ── TIME SLIDER ── */}
        <div className="bg-[#0d1f33]/80 border border-white/8 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2 text-sm font-bold text-white/50 uppercase tracking-widest">
              <Clock className="w-4 h-4 text-cyan-400" />
              World Time Explorer
            </div>
            <div className="text-sm font-bold text-cyan-400">{timeLabel(timeValue)}</div>
          </div>
          <input
            type="range" min={0} max={23} value={timeValue}
            onChange={e => setTimeValue(Number(e.target.value))}
            className="w-full h-1.5 rounded-full outline-none appearance-none cursor-pointer"
            style={{
              background: `linear-gradient(to right, #00ffcc ${(timeValue / 23) * 100}%, rgba(255,255,255,0.08) ${(timeValue / 23) * 100}%)`
            }}
          />
          <div className="flex justify-between mt-2 text-xs text-white/20">
            <span>12 AM</span><span>6 AM</span><span>12 PM</span><span>6 PM</span><span className="text-cyan-400 font-semibold">NOW</span>
          </div>
          <div className="mt-3 text-center text-xs text-white/40 bg-white/3 rounded-xl py-2.5 px-4">
            {timeContext(timeValue)}
          </div>
        </div>

      </div>

      {/* ── FLOATING AI ASK BUTTON ── */}
      <div className="fixed bottom-6 right-6 z-40">
        <AnimatePresence>
          {showAIChat && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 12 }}
              className="mb-3 bg-[#0d1f33] border border-white/15 rounded-2xl p-4 w-80"
              style={{ boxShadow: "0 20px 60px rgba(0,0,0,0.6), 0 0 40px rgba(0,255,204,0.06)" }}
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-cyan-400" />
                  <span className="text-sm font-bold text-white">Ask World AI</span>
                </div>
                <button onClick={() => { setShowAIChat(false); setAiAnswer(null); }} className="text-white/30 hover:text-white/70">
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="flex gap-2 mb-3">
                <input
                  value={aiQuery}
                  onChange={e => setAiQuery(e.target.value)}
                  onKeyDown={e => { if (e.key === "Enter") askWorldAI(); }}
                  placeholder="Which city is most active right now?"
                  className="flex-1 bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs text-white placeholder-white/25 outline-none focus:border-cyan-500/40"
                  autoFocus
                />
                <button onClick={askWorldAI} disabled={aiLoading || !aiQuery}
                  className="px-3 py-2 rounded-xl text-xs font-bold disabled:opacity-40 transition-all text-[#07111f]"
                  style={{ background: "linear-gradient(135deg, #00ffcc, #0099ff)" }}>
                  {aiLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <ArrowUpRight className="w-3.5 h-3.5" />}
                </button>
              </div>
              {["Which country is most active?", "Why is India so active?", "Best city to visit tonight?"].map(q => (
                <button key={q} onClick={() => { setAiQuery(q); }}
                  className="w-full text-left text-xs text-white/35 hover:text-white/60 py-1 transition-colors">
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

        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.97 }}
          onClick={() => setShowAIChat(v => !v)}
          className="flex items-center gap-2.5 px-5 py-3 rounded-2xl font-bold text-sm text-[#07111f] shadow-2xl"
          style={{
            background: "linear-gradient(135deg, #00ffcc, #0099ff)",
            boxShadow: "0 0 30px #00ffcc40, 0 8px 32px rgba(0,0,0,0.5)"
          }}
        >
          <Sparkles className="w-4 h-4" />
          ✨ Ask World AI
        </motion.button>
      </div>
    </div>
  );
}
