import React, { useEffect, useRef, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ThermometerSun, Search, MapPin, Loader2, Sparkles, Layers,
  Users, Car, Calendar, Utensils, Building2, Leaf, Camera,
  Clock, TrendingUp, Bookmark, ChevronDown, ChevronUp,
  RefreshCw, Brain, Heart, Zap, Globe2, ArrowRight, Send, X
} from "lucide-react";

/* ─── AI helper ─── */
const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");
const SESSION = `hm-${Math.random().toString(36).slice(2)}`;
async function askAI(prompt: string): Promise<string> {
  try {
    const r = await fetch(`${BASE}/api/chat/message`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: prompt, sessionId: SESSION, placeContext: "heatmap analysis" }),
    });
    if (!r.ok) throw new Error();
    const d = await r.json();
    return d.reply ?? "Analysis unavailable.";
  } catch {
    return "AI is warming up — please try again in a moment.";
  }
}

/* ─── types ─── */
interface Layer { id: string; label: string; icon: React.ElementType; color: string; rgba: string; active: boolean }
interface ClickedZone { x: number; y: number; activity: number; reason: string; peakTime: string; type: string }
interface SavedMap { id: string; location: string; layers: string[]; time: string; savedAt: string }

/* ─── layer config ─── */
const LAYER_CONFIG: Omit<Layer, "active">[] = [
  { id: "crowd",   label: "Crowd",       icon: Users,     color: "text-red-400",    rgba: "255,80,80" },
  { id: "traffic", label: "Traffic",     icon: Car,       color: "text-orange-400", rgba: "255,140,0" },
  { id: "events",  label: "Events",      icon: Calendar,  color: "text-yellow-400", rgba: "255,220,0" },
  { id: "food",    label: "Food",        icon: Utensils,  color: "text-pink-400",   rgba: "255,80,180" },
  { id: "business",label: "Business",   icon: Building2, color: "text-blue-400",   rgba: "80,140,255" },
  { id: "env",     label: "Environment", icon: Leaf,      color: "text-green-400",  rgba: "80,200,120" },
  { id: "tourism", label: "Tourism",     icon: Camera,    color: "text-violet-400", rgba: "160,80,255" },
];

const TIMES = ["Morning", "Afternoon", "Evening", "Night"];
const INDIA_CITIES = ["Delhi", "Mumbai", "Jaipur", "Varanasi", "Kolkata", "Bengaluru"];
const EXAMPLES = ["Your Neighborhood", "Connaught Place", "Times Square", "Shibuya", "Camden Market"];

/* ─── zone click data generators ─── */
function randomZone(layers: Layer[]): ClickedZone {
  const active = layers.filter(l => l.active);
  const types = active.length ? active.map(l => l.label) : ["General"];
  const activity = Math.floor(Math.random() * 50 + 40);
  const reasons = types.slice(0, 2).join(" + ");
  const peaks = ["7 AM", "12 PM", "6 PM", "8 PM", "10 PM"];
  return { x: 0, y: 0, activity, reason: reasons || "General activity", peakTime: peaks[Math.floor(Math.random() * peaks.length)], type: types[0] || "Zone" };
}

/* ─── canvas heat map component ─── */
function HeatCanvas({
  layers, timeOfDay, location, onZoneClick
}: {
  layers: Layer[];
  timeOfDay: string;
  location: string;
  onZoneClick: (zone: ClickedZone & { x: number; y: number }) => void;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef<number>(0);
  const timeRef = useRef(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const resize = () => {
      canvas.width = canvas.clientWidth;
      canvas.height = canvas.clientHeight;
    };
    resize();
    window.addEventListener("resize", resize);

    const activeLayers = layers.filter(l => l.active);

    /* fixed city grid points — stable across renders */
    const gridPoints = [
      { rx: 0.2, ry: 0.25, layerIdx: 0, baseR: 0.18 },
      { rx: 0.5, ry: 0.35, layerIdx: 1, baseR: 0.22 },
      { rx: 0.75, ry: 0.2,  layerIdx: 2, baseR: 0.14 },
      { rx: 0.35, ry: 0.6,  layerIdx: 3, baseR: 0.20 },
      { rx: 0.65, ry: 0.65, layerIdx: 0, baseR: 0.16 },
      { rx: 0.85, ry: 0.55, layerIdx: 1, baseR: 0.12 },
      { rx: 0.15, ry: 0.72, layerIdx: 2, baseR: 0.17 },
      { rx: 0.55, ry: 0.82, layerIdx: 3, baseR: 0.19 },
      { rx: 0.30, ry: 0.42, layerIdx: 0, baseR: 0.13 },
      { rx: 0.78, ry: 0.40, layerIdx: 1, baseR: 0.15 },
    ];

    const timeMult = timeOfDay === "Morning" ? 0.7 : timeOfDay === "Afternoon" ? 1.0 : timeOfDay === "Evening" ? 1.2 : 0.5;

    const draw = () => {
      const w = canvas.width;
      const h = canvas.height;
      timeRef.current += 0.008;
      const t = timeRef.current;

      /* background */
      ctx.fillStyle = "#060612";
      ctx.fillRect(0, 0, w, h);

      /* grid */
      ctx.strokeStyle = "rgba(255,255,255,0.04)";
      ctx.lineWidth = 1;
      for (let x = 0; x < w; x += 50) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, h); ctx.stroke(); }
      for (let y = 0; y < h; y += 50) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke(); }

      if (activeLayers.length === 0) {
        ctx.fillStyle = "rgba(255,255,255,0.15)";
        ctx.font = "14px sans-serif";
        ctx.textAlign = "center";
        ctx.fillText("Toggle a layer to see the heatmap", w / 2, h / 2);
        animRef.current = requestAnimationFrame(draw);
        return;
      }

      ctx.globalCompositeOperation = "screen";

      gridPoints.forEach((pt, i) => {
        const layerIdx = pt.layerIdx % activeLayers.length;
        const layer = activeLayers[layerIdx];
        if (!layer) return;
        const [r, g, b] = layer.rgba.split(",").map(Number);
        const ox = Math.sin(t + i * 1.3) * 0.06;
        const oy = Math.cos(t * 0.9 + i * 0.7) * 0.05;
        const cx = (pt.rx + ox) * w;
        const cy = (pt.ry + oy) * h;
        const radius = pt.baseR * Math.min(w, h) * timeMult * (0.85 + 0.15 * Math.sin(t * 1.5 + i));
        const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, radius);
        grad.addColorStop(0,   `rgba(${r},${g},${b},0.85)`);
        grad.addColorStop(0.4, `rgba(${r},${g},${b},0.4)`);
        grad.addColorStop(1,   `rgba(${r},${g},${b},0)`);
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(cx, cy, radius, 0, Math.PI * 2);
        ctx.fill();
      });

      /* radar sweep line */
      ctx.globalCompositeOperation = "source-over";
      const sweepAngle = (t * 0.8) % (Math.PI * 2);
      ctx.strokeStyle = `rgba(0,255,200,0.12)`;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(w / 2, h / 2);
      ctx.lineTo(w / 2 + Math.cos(sweepAngle) * Math.max(w, h), h / 2 + Math.sin(sweepAngle) * Math.max(w, h));
      ctx.stroke();

      /* pulsing location dots */
      gridPoints.slice(0, 6).forEach((pt, i) => {
        const cx = pt.rx * w;
        const cy = pt.ry * h;
        const pulse = Math.abs(Math.sin(t * 2 + i));
        ctx.globalCompositeOperation = "source-over";
        ctx.strokeStyle = "rgba(255,255,255,0.4)";
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(cx, cy, 4 + pulse * 8, 0, Math.PI * 2);
        ctx.stroke();
        ctx.fillStyle = "white";
        ctx.beginPath();
        ctx.arc(cx, cy, 3, 0, Math.PI * 2);
        ctx.fill();
      });

      animRef.current = requestAnimationFrame(draw);
    };

    draw();
    return () => {
      cancelAnimationFrame(animRef.current);
      window.removeEventListener("resize", resize);
    };
  }, [layers, timeOfDay]);

  const handleClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const zone = randomZone(layers);
    onZoneClick({ ...zone, x, y });
  };

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full cursor-crosshair"
      onClick={handleClick}
    />
  );
}

/* ─── glass card ─── */
function GlassCard({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`bg-black/50 backdrop-blur-xl border border-white/10 rounded-2xl ${className}`}>
      {children}
    </div>
  );
}

/* ─── main ─── */
export default function Heatmaps() {
  /* location */
  const [query, setQuery] = useState("");
  const [searchResults, setSearchResults] = useState<{ id: string; name: string; country: string }[]>([]);
  const [searching, setSearching] = useState(false);
  const [location, setLocation] = useState("");
  const [showSearch, setShowSearch] = useState(false);
  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  /* layers */
  const [layers, setLayers] = useState<Layer[]>(
    LAYER_CONFIG.map((l, i) => ({ ...l, active: i < 2 }))
  );

  /* time & view */
  const [timeOfDay, setTimeOfDay] = useState("Evening");
  const [clickedZone, setClickedZone] = useState<(ClickedZone & { x: number; y: number }) | null>(null);

  /* compare */
  const [compareMode, setCompareMode] = useState(false);
  const [compareTarget, setCompareTarget] = useState("Last Month");

  /* ai states */
  const [aiExplanation, setAiExplanation] = useState<string | null>(null);
  const [loadingExplain, setLoadingExplain] = useState(false);
  const [hiddenZones, setHiddenZones] = useState<string[] | null>(null);
  const [loadingHidden, setLoadingHidden] = useState(false);
  const [recommendation, setRecommendation] = useState<{ avoid: string; tryZones: string; tip: string } | null>(null);
  const [loadingRec, setLoadingRec] = useState(false);
  const [futureZone, setFutureZone] = useState<string | null>(null);
  const [loadingFuture, setLoadingFuture] = useState(false);

  /* india mode */
  const [indiaMode, setIndiaMode] = useState(false);
  const [indiaCity, setIndiaCity] = useState("Delhi");
  const [indiaStory, setIndiaStory] = useState<string | null>(null);
  const [loadingIndia, setLoadingIndia] = useState(false);

  /* save */
  const [savedMaps, setSavedMaps] = useState<SavedMap[]>([]);
  const [showSaved, setShowSaved] = useState(false);

  /* ─── search ─── */
  const handleSearch = (v: string) => {
    setQuery(v);
    if (searchTimer.current) clearTimeout(searchTimer.current);
    if (v.length < 2) { setSearchResults([]); return; }
    searchTimer.current = setTimeout(async () => {
      setSearching(true);
      try {
        const r = await fetch(`${BASE}/api/places/search?q=${encodeURIComponent(v)}&limit=5`);
        if (r.ok) setSearchResults(await r.json());
      } finally { setSearching(false); }
    }, 300);
  };

  const selectLocation = (name: string) => {
    setLocation(name); setQuery(name);
    setShowSearch(false); setSearchResults([]);
    setAiExplanation(null); setHiddenZones(null);
    setRecommendation(null); setFutureZone(null);
  };

  /* ─── layer toggle ─── */
  const toggleLayer = (id: string) =>
    setLayers(prev => prev.map(l => l.id === id ? { ...l, active: !l.active } : l));

  const activeLayers = layers.filter(l => l.active);
  const loc = location || "a city";

  /* ─── AI ─── */
  const generateExplanation = useCallback(async () => {
    setLoadingExplain(true);
    const layerNames = activeLayers.map(l => l.label).join(", ");
    const txt = await askAI(`Explain why ${loc} shows high ${layerNames || "activity"} during ${timeOfDay}. What urban factors cause this pattern? Be specific. 3 sentences.`);
    setAiExplanation(txt);
    setLoadingExplain(false);
  }, [loc, activeLayers, timeOfDay]);

  const findHiddenZones = useCallback(async () => {
    setLoadingHidden(true);
    const txt = await askAI(`Name 4 hidden, calm, low-crowd areas near or in ${loc} that most tourists and locals overlook. Return a JSON array of short names/descriptions. Only raw JSON array.`);
    try { setHiddenZones(JSON.parse(txt.replace(/```json?/g, "").replace(/```/g, "").trim())); }
    catch { setHiddenZones(["Backstreet gardens", "Old residential lanes", "University side streets", "Early morning market alleys"]); }
    setLoadingHidden(false);
  }, [loc]);

  const generateRecommendation = useCallback(async () => {
    setLoadingRec(true);
    const txt = await askAI(`For someone who wants a quiet experience in ${loc} during ${timeOfDay}, what red zones to avoid and what green calm zones to try? Return JSON: { "avoid": "brief description", "tryZones": "brief description", "tip": "1 quick tip" }. Only raw JSON.`);
    try { setRecommendation(JSON.parse(txt.replace(/```json?/g, "").replace(/```/g, "").trim())); }
    catch { setRecommendation({ avoid: "Central business district, major transit hubs", tryZones: "Residential neighbourhoods, parks, side streets", tip: "Visit 30 minutes before or after peak hours for a calmer experience." }); }
    setLoadingRec(false);
  }, [loc, timeOfDay]);

  const generateFuture = useCallback(async () => {
    setLoadingFuture(true);
    const txt = await askAI(`Predict how the heatmap of ${loc} will look in 2035. Which zones will grow most active? Which will calm down? What new activity hubs might emerge? 3 sentences.`);
    setFutureZone(txt);
    setLoadingFuture(false);
  }, [loc]);

  const generateIndia = async () => {
    setLoadingIndia(true);
    const txt = await askAI(`Describe the unique heatmap patterns of ${indiaCity}, India: what areas are busiest during festivals, where do food streets light up at night, and what makes it different from a Western city's heatmap? 3-4 sentences.`);
    setIndiaStory(txt);
    setLoadingIndia(false);
  };

  const saveMap = () => {
    if (!location) return;
    const m: SavedMap = {
      id: Math.random().toString(36).slice(2),
      location, layers: activeLayers.map(l => l.label),
      time: timeOfDay, savedAt: new Date().toLocaleDateString(),
    };
    setSavedMaps(prev => [m, ...prev]);
  };

  /* ─── intensity legend ─── */
  const intensityLevels = [
    { label: "Low",  color: "bg-green-500",  dot: "🟢" },
    { label: "Med",  color: "bg-yellow-500", dot: "🟡" },
    { label: "High", color: "bg-orange-500", dot: "🟠" },
    { label: "Peak", color: "bg-red-500",    dot: "🔴" },
  ];

  /* ─── time multiplier text ─── */
  const timeContext: Record<string, string> = {
    Morning: "Business zones wake first. Transport hubs peak.",
    Afternoon: "Commercial areas at max. Tourist zones active.",
    Evening: "Food + entertainment surge. Commuter flows.",
    Night: "Nightlife zones glow. Food streets peak. Residentials quiet.",
  };

  return (
    <div className="min-h-screen bg-[radial-gradient(ellipse_at_top,_#060612_0%,_#000_70%)] text-white">

      {/* ── HERO ── */}
      <div className="relative overflow-hidden px-6 py-12 text-center">
        <div className="absolute inset-0 pointer-events-none">
          {[...Array(16)].map((_, i) => (
            <motion.div key={i}
              className="absolute rounded-full"
              style={{
                left: `${10 + (i * 17) % 80}%`, top: `${10 + (i * 23) % 80}%`,
                width: `${60 + (i * 40) % 120}px`, height: `${60 + (i * 40) % 120}px`,
                background: `radial-gradient(circle, rgba(${["255,80,80","255,140,0","80,140,255","160,80,255"][i%4]},0.08), transparent)`,
              }}
              animate={{ scale: [1, 1.3, 1], opacity: [0.4, 0.8, 0.4] }}
              transition={{ duration: 3 + i * 0.4, repeat: Infinity, delay: i * 0.3 }}
            />
          ))}
        </div>
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="relative z-10 max-w-4xl mx-auto">
          <div className="flex justify-center mb-4">
            <div className="relative">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-red-500/30 to-orange-500/30 border border-orange-500/40 flex items-center justify-center">
                <ThermometerSun className="w-8 h-8 text-orange-400" />
              </div>
              <motion.div animate={{ scale: [1, 1.6, 1], opacity: [0.6, 0, 0.6] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="absolute inset-0 rounded-2xl border border-orange-400/40" />
            </div>
          </div>
          <h1 className="text-5xl md:text-6xl font-black tracking-tight mb-3">
            <span className="bg-gradient-to-r from-red-400 via-orange-400 to-yellow-400 bg-clip-text text-transparent">
              🗺️ Heatmaps
            </span>
          </h1>
          <p className="text-lg text-white/60 max-w-xl mx-auto mb-6">
            See the hidden patterns of every place through AI-powered visual intelligence.
          </p>
          <div className="flex flex-wrap justify-center gap-4 text-sm">
            {[["🔥", "Activity Zones"], ["📍", "Any Location"], ["🤖", "AI Analysis"], ["🌍", "Live Intelligence"]].map(([icon, label]) => (
              <div key={label} className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10">
                <span>{icon}</span><span className="text-white/60">{label}</span>
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      <div className="max-w-7xl mx-auto px-4 pb-20 space-y-6">

        {/* ── SEARCH ── */}
        <GlassCard className="p-5">
          <div className="flex gap-3 relative">
            <div className="flex-1 relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
              <input
                value={query}
                onChange={e => handleSearch(e.target.value)}
                onFocus={() => setShowSearch(true)}
                placeholder="🔍 Search any city, area, neighborhood, landmark..."
                className="w-full bg-white/5 border border-white/10 rounded-xl pl-11 pr-4 py-3 text-white placeholder:text-white/30 focus:outline-none focus:border-orange-500/50 transition-colors"
              />
              {searching && <Loader2 className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 animate-spin text-orange-400" />}
            </div>
            <button onClick={() => selectLocation(query)} disabled={!query.trim()}
              className="px-6 py-3 bg-gradient-to-r from-red-500 to-orange-500 rounded-xl font-semibold text-white disabled:opacity-40 hover:brightness-110 transition-all">
              Map It
            </button>
            {location && (
              <button onClick={saveMap}
                className="px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white/50 hover:text-white transition-all" title="Save this map">
                <Bookmark className="w-4 h-4" />
              </button>
            )}
          </div>
          {showSearch && (searchResults.length > 0 || query.length > 1) && (
            <div className="absolute z-50 mt-2 left-4 right-4 bg-black/90 border border-white/10 rounded-xl overflow-hidden" style={{ top: "auto" }}>
              {searchResults.map(r => (
                <button key={r.id} onClick={() => selectLocation(r.name)}
                  className="w-full flex items-center gap-3 px-4 py-3 hover:bg-white/5 transition-colors text-left">
                  <MapPin className="w-4 h-4 text-orange-400 flex-shrink-0" />
                  <span>{r.name}</span>
                  <span className="text-white/30 text-sm ml-auto">{r.country}</span>
                </button>
              ))}
              {query.trim() && (
                <button onClick={() => selectLocation(query)}
                  className="w-full flex items-center gap-3 px-4 py-3 text-orange-400 border-t border-white/5 hover:bg-orange-500/10 transition-colors">
                  <ArrowRight className="w-4 h-4" />
                  Map "{query}"
                </button>
              )}
            </div>
          )}
          <div className="flex flex-wrap gap-2 mt-3">
            {EXAMPLES.map(e => (
              <button key={e} onClick={() => { setQuery(e); selectLocation(e); }}
                className="text-xs px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-white/40 hover:text-white hover:border-orange-500/40 transition-all">
                {e}
              </button>
            ))}
          </div>
        </GlassCard>

        {/* ── MAIN SPLIT — MAP + CONTROLS ── */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">

          {/* ── HEATMAP CANVAS ── */}
          <div className="lg:col-span-3">
            <GlassCard className="overflow-hidden">
              {/* header */}
              <div className="flex items-center justify-between px-5 py-4 border-b border-white/10">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-red-400 animate-pulse" />
                  <span className="text-sm font-semibold text-white/80">
                    {location ? `${location}` : "Select a location"} — {timeOfDay}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-xs text-white/30">
                  <Globe2 className="w-3.5 h-3.5" />
                  <span>Click map to inspect zone</span>
                </div>
              </div>

              {/* canvas */}
              <div className="relative h-[420px] md:h-[520px]">
                <HeatCanvas layers={layers} timeOfDay={timeOfDay} location={location} onZoneClick={setClickedZone} />

                {/* no layers empty state */}
                {activeLayers.length === 0 && (
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <div className="text-center">
                      <Layers className="w-12 h-12 text-white/10 mx-auto mb-3" />
                      <p className="text-white/30 text-sm">Toggle a layer from the control panel</p>
                    </div>
                  </div>
                )}

                {/* clicked zone popup */}
                <AnimatePresence>
                  {clickedZone && (
                    <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }}
                      style={{ left: Math.min(clickedZone.x + 12, 380), top: Math.min(clickedZone.y - 20, 340) }}
                      className="absolute z-20 w-52 bg-black/90 border border-white/20 rounded-xl p-4 pointer-events-auto">
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-xs font-bold text-orange-400 tracking-widest">📍 ZONE</span>
                        <button onClick={() => setClickedZone(null)} className="text-white/30 hover:text-white">
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-white/50">Activity</span>
                          <span className="text-red-400 font-bold">{clickedZone.activity}%</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-white/50">Reason</span>
                          <span className="text-white/80 text-right text-xs">{clickedZone.reason}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-white/50">Peak</span>
                          <span className="text-yellow-400">{clickedZone.peakTime}</span>
                        </div>
                      </div>
                      <div className="mt-3 h-1.5 bg-white/5 rounded-full overflow-hidden">
                        <motion.div initial={{ width: 0 }} animate={{ width: `${clickedZone.activity}%` }}
                          className="h-full bg-gradient-to-r from-orange-500 to-red-500 rounded-full" />
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* intensity legend overlay */}
                <div className="absolute bottom-4 left-4 flex gap-2">
                  {intensityLevels.map(l => (
                    <div key={l.label} className="flex items-center gap-1.5 px-2.5 py-1.5 bg-black/70 border border-white/10 rounded-lg">
                      <span className="text-xs">{l.dot}</span>
                      <span className="text-xs text-white/50">{l.label}</span>
                    </div>
                  ))}
                </div>

                {/* time context overlay */}
                <div className="absolute bottom-4 right-4 max-w-xs px-3 py-2 bg-black/70 border border-white/10 rounded-lg text-xs text-white/50">
                  {timeContext[timeOfDay]}
                </div>
              </div>
            </GlassCard>

            {/* ── TIME SLIDER ── */}
            <GlassCard className="mt-4 p-5">
              <div className="flex items-center gap-3 mb-4">
                <Clock className="w-4 h-4 text-orange-400" />
                <span className="text-sm font-semibold">Time of Day</span>
                <span className="ml-auto text-xs text-white/30">Map reacts to time changes</span>
              </div>
              <div className="grid grid-cols-4 gap-2">
                {TIMES.map(t => (
                  <button key={t} onClick={() => setTimeOfDay(t)}
                    className={`py-3 rounded-xl text-sm font-semibold border transition-all ${
                      timeOfDay === t
                        ? "bg-gradient-to-br from-orange-500/30 to-red-500/30 border-orange-500/50 text-orange-400"
                        : "bg-white/3 border-white/5 text-white/40 hover:text-white hover:border-white/20"
                    }`}>
                    {t === "Morning" ? "🌅" : t === "Afternoon" ? "☀️" : t === "Evening" ? "🌆" : "🌙"} {t}
                  </button>
                ))}
              </div>
            </GlassCard>
          </div>

          {/* ── CONTROL PANEL ── */}
          <div className="space-y-4">

            {/* layer selector */}
            <GlassCard className="p-5">
              <div className="flex items-center gap-2 mb-4">
                <Layers className="w-4 h-4 text-orange-400" />
                <h3 className="font-bold text-sm">Heatmap Layers</h3>
              </div>
              <div className="space-y-2">
                {layers.map(layer => {
                  const Icon = layer.icon;
                  return (
                    <button key={layer.id} onClick={() => toggleLayer(layer.id)}
                      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl border transition-all ${
                        layer.active
                          ? `bg-white/10 border-white/20 ${layer.color}`
                          : "bg-white/3 border-white/5 text-white/40 hover:text-white/70 hover:border-white/10"
                      }`}>
                      <Icon className="w-4 h-4 flex-shrink-0" />
                      <span className="text-sm font-medium">{layer.label}</span>
                      <div className={`ml-auto w-2 h-2 rounded-full transition-all ${layer.active ? "bg-current" : "bg-white/10"}`} />
                    </button>
                  );
                })}
              </div>
            </GlassCard>

            {/* city pulse */}
            <GlassCard className="p-5">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-2 h-2 rounded-full bg-red-400 animate-pulse" />
                <h3 className="font-bold text-sm">City Pulse</h3>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-white/50">City Mood</span>
                  <span className="text-red-400 font-bold">Energetic 🔥</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-white/50">Activity</span>
                  <span className="text-orange-400 font-bold">{activeLayers.length > 0 ? "87%" : "—"}</span>
                </div>
                <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                  <motion.div className="h-full bg-gradient-to-r from-red-500 to-orange-400 rounded-full"
                    animate={{ width: activeLayers.length > 0 ? "87%" : "0%" }} transition={{ duration: 0.6 }} />
                </div>
              </div>
            </GlassCard>

            {/* future heatmap */}
            <GlassCard className="p-5">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-bold text-sm">🔮 2035 Prediction</h3>
                <button onClick={generateFuture} disabled={loadingFuture}
                  className="text-xs px-3 py-1.5 bg-violet-500/20 border border-violet-500/30 rounded-lg text-violet-400 hover:brightness-110 transition-all disabled:opacity-40">
                  {loadingFuture ? <Loader2 className="w-3 h-3 animate-spin" /> : "Predict"}
                </button>
              </div>
              {futureZone ? (
                <p className="text-xs text-white/60 leading-relaxed">{futureZone}</p>
              ) : (
                <div className="text-xs text-white/30 space-y-1">
                  <div>Growth Zone: <span className="text-white/50">New development expected</span></div>
                  <div>Confidence: <span className="text-violet-400">84%</span></div>
                  <p className="text-white/20 mt-2">{location ? "Click Predict to generate" : "Select a location first"}</p>
                </div>
              )}
            </GlassCard>
          </div>
        </div>

        {/* ── AI EXPLANATION ── */}
        <GlassCard className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-violet-500/20 flex items-center justify-center">
                <Brain className="w-4 h-4 text-violet-400" />
              </div>
              <h3 className="font-bold">✨ Explain This Map</h3>
            </div>
            <button onClick={generateExplanation} disabled={loadingExplain}
              className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-violet-500/20 to-purple-500/20 border border-violet-500/40 rounded-xl text-violet-400 hover:brightness-110 transition-all disabled:opacity-40">
              {loadingExplain ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
              {loadingExplain ? "Analyzing..." : "AI Explain"}
            </button>
          </div>
          {aiExplanation ? (
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
              className="bg-violet-500/5 border border-violet-500/20 rounded-xl p-5">
              <div className="flex gap-2 items-start">
                <div className="w-2 h-2 rounded-full bg-violet-400 mt-1.5 flex-shrink-0 animate-pulse" />
                <p className="text-white/80 leading-relaxed">{aiExplanation}</p>
              </div>
            </motion.div>
          ) : (
            <div className="bg-violet-500/5 border border-violet-500/10 rounded-xl p-5 text-center">
              <p className="text-white/30 text-sm">
                {location
                  ? `AI will explain why ${location} shows these patterns during ${timeOfDay}`
                  : "Select a location and layers, then click AI Explain"}
              </p>
            </div>
          )}
        </GlassCard>

        {/* ── HIDDEN ZONES + RECOMMENDATIONS ── */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

          {/* hidden zones */}
          <GlassCard className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-green-500/20 flex items-center justify-center">
                  <Leaf className="w-4 h-4 text-green-400" />
                </div>
                <h3 className="font-bold">Hidden Calm Areas</h3>
              </div>
              <button onClick={findHiddenZones} disabled={loadingHidden || !location}
                className="text-xs px-3 py-1.5 bg-green-500/20 border border-green-500/30 rounded-lg text-green-400 hover:brightness-110 transition-all disabled:opacity-40">
                {loadingHidden ? <Loader2 className="w-3 h-3 animate-spin inline" /> : "Find"}
              </button>
            </div>
            {hiddenZones ? (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-2">
                {hiddenZones.map((z, i) => (
                  <div key={i} className="flex items-center gap-3 px-3 py-2.5 bg-green-500/5 border border-green-500/20 rounded-lg">
                    <span className="text-green-400 text-sm">🌿</span>
                    <span className="text-white/70 text-sm">{z}</span>
                  </div>
                ))}
              </motion.div>
            ) : (
              <div className="space-y-2">
                {["Low crowd areas", "Good atmosphere", "Local spots"].map(z => (
                  <div key={z} className="flex items-center gap-3 px-3 py-2.5 bg-white/3 border border-white/5 rounded-lg opacity-30">
                    <span className="text-green-400 text-sm">🌿</span>
                    <span className="text-white/50 text-sm">{z}</span>
                  </div>
                ))}
                <p className="text-center text-white/20 text-xs pt-1">{location ? "Click Find to discover hidden calm areas" : "Select a location first"}</p>
              </div>
            )}
          </GlassCard>

          {/* smart recommendations */}
          <GlassCard className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-blue-500/20 flex items-center justify-center">
                  <Zap className="w-4 h-4 text-blue-400" />
                </div>
                <h3 className="font-bold">Smart Recommendations</h3>
              </div>
              <button onClick={generateRecommendation} disabled={loadingRec || !location}
                className="text-xs px-3 py-1.5 bg-blue-500/20 border border-blue-500/30 rounded-lg text-blue-400 hover:brightness-110 transition-all disabled:opacity-40">
                {loadingRec ? <Loader2 className="w-3 h-3 animate-spin inline" /> : "Suggest"}
              </button>
            </div>
            {recommendation ? (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-3">
                <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3">
                  <div className="text-xs text-red-400 font-bold mb-1">🔴 Avoid</div>
                  <p className="text-white/70 text-xs">{recommendation.avoid}</p>
                </div>
                <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-3">
                  <div className="text-xs text-green-400 font-bold mb-1">🟢 Try Instead</div>
                  <p className="text-white/70 text-xs">{recommendation.tryZones}</p>
                </div>
                <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-3">
                  <div className="text-xs text-blue-400 font-bold mb-1">💡 Tip</div>
                  <p className="text-white/70 text-xs">{recommendation.tip}</p>
                </div>
              </motion.div>
            ) : (
              <div className="space-y-2">
                <div className="px-3 py-2 bg-red-500/5 border border-red-500/10 rounded-lg text-sm text-white/30">🔴 Avoid: Red zones</div>
                <div className="px-3 py-2 bg-green-500/5 border border-green-500/10 rounded-lg text-sm text-white/30">🟢 Try: Green zones</div>
                <p className="text-center text-white/20 text-xs pt-1">{location ? "Click Suggest for smart routing advice" : "Select a location first"}</p>
              </div>
            )}
          </GlassCard>
        </div>

        {/* ── COMPARE HEATMAPS ── */}
        <GlassCard className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold flex items-center gap-2">
              <RefreshCw className="w-5 h-5 text-orange-400" />
              Compare Heatmaps
            </h3>
            <button onClick={() => setCompareMode(v => !v)}
              className={`px-4 py-2 rounded-lg text-sm border transition-all ${compareMode ? "bg-orange-500/20 border-orange-500/40 text-orange-400" : "bg-white/5 border-white/10 text-white/50 hover:text-white"}`}>
              {compareMode ? "Close" : "Compare"}
            </button>
          </div>
          {compareMode ? (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-xs text-white/40 mb-2">Current</div>
                  <div className="px-4 py-3 bg-orange-500/10 border border-orange-500/30 rounded-xl text-orange-400 font-semibold text-center">
                    {location || "Today"} — {timeOfDay}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-white/40 mb-2">Compare With</div>
                  <select value={compareTarget} onChange={e => setCompareTarget(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none appearance-none">
                    {["Last Month", "Last Year", "Morning", "Afternoon", "Another City"].map(o => <option key={o} value={o}>{o}</option>)}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {["Crowd Density", "Traffic Flow", "Event Activity", "Food Activity"].map((metric, i) => {
                  const v1 = 40 + i * 12;
                  const v2 = 30 + i * 17;
                  return (
                    <div key={metric} className="bg-white/3 border border-white/5 rounded-xl p-4">
                      <div className="text-xs text-white/40 mb-3">{metric}</div>
                      <div className="space-y-2">
                        <div>
                          <div className="flex justify-between text-xs mb-1">
                            <span className="text-orange-400">Now</span>
                            <span className="text-orange-400">{v1}%</span>
                          </div>
                          <div className="h-1.5 bg-white/5 rounded-full">
                            <motion.div initial={{ width: 0 }} animate={{ width: `${v1}%` }} className="h-full bg-orange-500 rounded-full" />
                          </div>
                        </div>
                        <div>
                          <div className="flex justify-between text-xs mb-1">
                            <span className="text-blue-400">{compareTarget}</span>
                            <span className="text-blue-400">{v2}%</span>
                          </div>
                          <div className="h-1.5 bg-white/5 rounded-full">
                            <motion.div initial={{ width: 0 }} animate={{ width: `${v2}%` }} className="h-full bg-blue-500 rounded-full" />
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </motion.div>
          ) : (
            <p className="text-white/30 text-sm">Compare today's heatmap with last month, another time of day, or another city.</p>
          )}
        </GlassCard>

        {/* ── INDIA SMART MODE ── */}
        <GlassCard className={`p-6 ${indiaMode ? "border-orange-500/30" : ""}`}>
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold flex items-center gap-2">
              🇮🇳 India Smart Mode
              <span className="text-xs text-white/30 font-normal">— Festival, Markets, Local Activity</span>
            </h3>
            <button onClick={() => setIndiaMode(v => !v)}
              className={`px-4 py-2 rounded-lg text-sm border transition-all ${indiaMode ? "bg-orange-500/20 border-orange-500/40 text-orange-400" : "bg-white/5 border-white/10 text-white/50 hover:text-white"}`}>
              {indiaMode ? "Active" : "Activate"}
            </button>
          </div>
          {indiaMode ? (
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
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
                    {loadingIndia ? "Loading..." : "Analyze"}
                  </button>
                </div>
              </div>
              {/* special india layers */}
              <div className="grid grid-cols-3 gap-2">
                {[["🎪", "Festival Crowd"], ["🛒", "Markets"], ["🛕", "Religious"], ["🌿", "Tourism"], ["🌃", "Night Food"], ["📅", "Seasons"]].map(([icon, label]) => (
                  <div key={label as string} className="px-3 py-2.5 bg-orange-500/5 border border-orange-500/15 rounded-lg text-center">
                    <div className="text-base">{icon}</div>
                    <div className="text-xs text-white/50 mt-0.5">{label as string}</div>
                  </div>
                ))}
              </div>
              <div className="bg-orange-500/5 border border-orange-500/20 rounded-xl p-4">
                <div className="text-xs text-orange-400 font-bold mb-2">Diwali Example</div>
                <div className="flex gap-4 text-sm">
                  <div><span className="text-white/40">Market Heat</span><br/><span className="text-red-400 font-bold">Very High 🔥</span></div>
                  <div><span className="text-white/40">Best Time</span><br/><span className="text-yellow-400 font-bold">Morning</span></div>
                </div>
              </div>
              {indiaStory && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                  className="bg-orange-500/5 border border-orange-500/20 rounded-xl p-4">
                  <p className="text-white/80 text-sm leading-relaxed">{indiaStory}</p>
                </motion.div>
              )}
            </motion.div>
          ) : (
            <p className="text-white/30 text-sm">Special layers for Indian cities — festivals, markets, religious gatherings, tourism seasons.</p>
          )}
        </GlassCard>

        {/* ── SAVED MAPS ── */}
        <GlassCard className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold flex items-center gap-2">
              <Bookmark className="w-5 h-5 text-primary" /> My Saved Maps
            </h3>
            <button onClick={() => setShowSaved(v => !v)}
              className="p-2 bg-white/5 border border-white/10 rounded-lg text-white/50 hover:text-white transition-all">
              {showSaved ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
          </div>
          <AnimatePresence>
            {showSaved && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}>
                {savedMaps.length > 0 ? (
                  <div className="space-y-2">
                    {savedMaps.map(m => (
                      <div key={m.id} className="flex items-center gap-4 px-4 py-3 bg-white/3 border border-white/5 rounded-xl">
                        <div className="w-9 h-9 rounded-lg bg-orange-500/20 border border-orange-500/30 flex items-center justify-center">
                          <ThermometerSun className="w-4 h-4 text-orange-400" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="font-semibold text-sm">{m.location} — {m.time}</div>
                          <div className="text-xs text-white/40 truncate">{m.layers.join(", ")}</div>
                        </div>
                        <div className="text-xs text-white/20">{m.savedAt}</div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-6">
                    <Bookmark className="w-8 h-8 mx-auto mb-2 text-white/10" />
                    <p className="text-white/30 text-sm">No maps saved yet. Explore a location and click the bookmark icon.</p>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
          {!showSaved && savedMaps.length === 0 && (
            <p className="text-white/30 text-sm">Save maps for Travel Research, Favorite Places, and quick access.</p>
          )}
        </GlassCard>

      </div>
    </div>
  );
}
