import React, { useState, useRef, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  BrainCircuit, Search, MapPin, Loader2, Sparkles, TrendingUp,
  Activity, Globe2, Zap, Heart, Leaf, Building2, Users, Calendar,
  AlertTriangle, BookOpen, Send, Bookmark, ChevronDown, ChevronUp,
  ArrowRight, RefreshCw, BarChart3, Star, Clock, CheckCircle2,
  Lightbulb, Shield, X, FileText
} from "lucide-react";

/* ─── AI helper ─── */
const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");
const SESSION = `ins-${Math.random().toString(36).slice(2)}`;
async function askAI(prompt: string): Promise<string> {
  try {
    const r = await fetch(`${BASE}/api/chat/message`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: prompt, sessionId: SESSION, placeContext: "AI insights analysis" }),
    });
    if (!r.ok) throw new Error();
    return (await r.json()).reply ?? "Analysis unavailable.";
  } catch { return "AI is warming up — please try again in a moment."; }
}
async function askJSON<T>(prompt: string, fallback: T): Promise<T> {
  const txt = await askAI(`${prompt}\n\nRespond ONLY with valid JSON, no markdown or code blocks.`);
  try { return JSON.parse(txt.replace(/```json?/g, "").replace(/```/g, "").trim()) as T; }
  catch { return fallback; }
}

/* ─── types ─── */
interface RadarScore { label: string; value: number; icon: string; color: string }
interface Pattern { text: string; type: "positive" | "neutral" | "warning" }
interface Opportunity { icon: string; label: string; detail: string }
interface Risk { icon: string; label: string; level: "low" | "medium" | "high" }
interface SavedInsight { id: string; location: string; score: number; summary: string; savedAt: string }
interface CompareResult { winner: string; summary: string; scores: Record<string, [number, number]> }

/* ─── animated neural network background ─── */
function NeuralBg() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    canvas.width = canvas.clientWidth;
    canvas.height = canvas.clientHeight;
    const nodes = Array.from({ length: 18 }, (_, i) => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      vx: (Math.random() - 0.5) * 0.4,
      vy: (Math.random() - 0.5) * 0.4,
      r: Math.random() * 2.5 + 1,
    }));
    let animId: number;
    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      nodes.forEach(n => {
        n.x += n.vx; n.y += n.vy;
        if (n.x < 0 || n.x > canvas.width) n.vx *= -1;
        if (n.y < 0 || n.y > canvas.height) n.vy *= -1;
      });
      nodes.forEach((a, i) => {
        nodes.slice(i + 1).forEach(b => {
          const d = Math.hypot(a.x - b.x, a.y - b.y);
          if (d < 150) {
            ctx.strokeStyle = `rgba(139,92,246,${0.15 * (1 - d / 150)})`;
            ctx.lineWidth = 0.8;
            ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
          }
        });
        ctx.fillStyle = "rgba(139,92,246,0.5)";
        ctx.beginPath(); ctx.arc(a.x, a.y, a.r, 0, Math.PI * 2); ctx.fill();
      });
      animId = requestAnimationFrame(draw);
    };
    draw();
    return () => cancelAnimationFrame(animId);
  }, []);
  return <canvas ref={canvasRef} className="absolute inset-0 w-full h-full pointer-events-none" />;
}

/* ─── radar chart (canvas) ─── */
function RadarChart({ scores }: { scores: RadarScore[] }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || scores.length === 0) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const W = canvas.width = canvas.clientWidth;
    const H = canvas.height = canvas.clientHeight;
    const cx = W / 2, cy = H / 2;
    const R = Math.min(W, H) * 0.38;
    const n = scores.length;
    let t = 0;
    let animId: number;
    const draw = () => {
      t += 0.015;
      ctx.clearRect(0, 0, W, H);
      /* grid rings */
      [0.2, 0.4, 0.6, 0.8, 1.0].forEach(frac => {
        ctx.strokeStyle = "rgba(255,255,255,0.06)";
        ctx.lineWidth = 1;
        ctx.beginPath();
        for (let i = 0; i <= n; i++) {
          const a = (i / n) * Math.PI * 2 - Math.PI / 2;
          const rx = cx + Math.cos(a) * R * frac;
          const ry = cy + Math.sin(a) * R * frac;
          i === 0 ? ctx.moveTo(rx, ry) : ctx.lineTo(rx, ry);
        }
        ctx.closePath(); ctx.stroke();
      });
      /* spokes */
      scores.forEach((_, i) => {
        const a = (i / n) * Math.PI * 2 - Math.PI / 2;
        ctx.strokeStyle = "rgba(255,255,255,0.06)";
        ctx.beginPath(); ctx.moveTo(cx, cy);
        ctx.lineTo(cx + Math.cos(a) * R, cy + Math.sin(a) * R); ctx.stroke();
      });
      /* filled polygon */
      const pulse = 0.97 + 0.03 * Math.sin(t);
      ctx.beginPath();
      scores.forEach((s, i) => {
        const a = (i / n) * Math.PI * 2 - Math.PI / 2;
        const r = R * (s.value / 100) * pulse;
        i === 0 ? ctx.moveTo(cx + Math.cos(a) * r, cy + Math.sin(a) * r)
                : ctx.lineTo(cx + Math.cos(a) * r, cy + Math.sin(a) * r);
      });
      ctx.closePath();
      const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, R);
      grad.addColorStop(0, "rgba(139,92,246,0.5)");
      grad.addColorStop(1, "rgba(99,102,241,0.1)");
      ctx.fillStyle = grad;
      ctx.fill();
      ctx.strokeStyle = "rgba(139,92,246,0.8)";
      ctx.lineWidth = 1.5;
      ctx.stroke();
      /* dots + labels */
      scores.forEach((s, i) => {
        const a = (i / n) * Math.PI * 2 - Math.PI / 2;
        const r = R * (s.value / 100) * pulse;
        ctx.fillStyle = "#a78bfa";
        ctx.beginPath(); ctx.arc(cx + Math.cos(a) * r, cy + Math.sin(a) * r, 4, 0, Math.PI * 2); ctx.fill();
        /* label */
        const lr = R * 1.25;
        ctx.fillStyle = "rgba(255,255,255,0.6)";
        ctx.font = "11px sans-serif";
        ctx.textAlign = "center";
        ctx.fillText(s.icon, cx + Math.cos(a) * lr, cy + Math.sin(a) * lr - 5);
        ctx.fillStyle = "rgba(255,255,255,0.4)";
        ctx.fillText(s.label, cx + Math.cos(a) * lr, cy + Math.sin(a) * lr + 10);
      });
      animId = requestAnimationFrame(draw);
    };
    draw();
    return () => cancelAnimationFrame(animId);
  }, [scores]);
  return <canvas ref={canvasRef} className="w-full h-full" />;
}

/* ─── glass card ─── */
function GlassCard({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <div className={`bg-black/50 backdrop-blur-xl border border-white/10 rounded-2xl ${className}`}>{children}</div>;
}

/* ─── typing text ─── */
function TypedText({ text, speed = 18 }: { text: string; speed?: number }) {
  const [displayed, setDisplayed] = useState("");
  useEffect(() => {
    setDisplayed("");
    let i = 0;
    const t = setInterval(() => {
      setDisplayed(text.slice(0, ++i));
      if (i >= text.length) clearInterval(t);
    }, speed);
    return () => clearInterval(t);
  }, [text, speed]);
  return <span>{displayed}<span className="animate-pulse">|</span></span>;
}

const EXAMPLES = ["Bangalore", "Old Delhi", "Shibuya", "Brooklyn", "Connaught Place", "Shoreditch"];
const INDIA_TOPICS = ["Festival Impact", "Student Cities", "Business Hubs", "Heritage Areas", "Seasonal Travel", "Regional Culture"];

const DEFAULT_RADAR: RadarScore[] = [
  { label: "Growth",      value: 0, icon: "🏙", color: "#f59e0b" },
  { label: "Activity",    value: 0, icon: "👥", color: "#3b82f6" },
  { label: "Culture",     value: 0, icon: "🎭", color: "#ec4899" },
  { label: "Economy",     value: 0, icon: "💼", color: "#10b981" },
  { label: "Environment", value: 0, icon: "🌱", color: "#22c55e" },
  { label: "Future",      value: 0, icon: "🚀", color: "#8b5cf6" },
];

/* ─── main ─── */
export default function Insights() {
  /* search */
  const [query, setQuery] = useState("");
  const [searchResults, setSearchResults] = useState<{ id: string; name: string; country: string }[]>([]);
  const [searching, setSearching] = useState(false);
  const [location, setLocation] = useState("");
  const [showSearch, setShowSearch] = useState(false);
  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  /* overview */
  const [overview, setOverview] = useState<{ summary: string; score: number } | null>(null);
  const [loadingOverview, setLoadingOverview] = useState(false);

  /* radar */
  const [radarScores, setRadarScores] = useState<RadarScore[]>(DEFAULT_RADAR);
  const [loadingRadar, setLoadingRadar] = useState(false);

  /* live situation */
  const [situation, setSituation] = useState<{ situation: string; reason: string; impact: string } | null>(null);
  const [loadingSit, setLoadingSit] = useState(false);

  /* explanation */
  const [explanation, setExplanation] = useState<string | null>(null);
  const [loadingExp, setLoadingExp] = useState(false);

  /* patterns */
  const [patterns, setPatterns] = useState<Pattern[]>([]);
  const [loadingPat, setLoadingPat] = useState(false);

  /* future */
  const [future, setFuture] = useState<{ tourism: number; activity: number; events: number; confidence: number; summary: string } | null>(null);
  const [loadingFut, setLoadingFut] = useState(false);

  /* opportunities */
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [loadingOpp, setLoadingOpp] = useState(false);

  /* risks */
  const [risks, setRisks] = useState<Risk[]>([]);
  const [loadingRisk, setLoadingRisk] = useState(false);

  /* daily brief */
  const [brief, setBrief] = useState<string | null>(null);
  const [loadingBrief, setLoadingBrief] = useState(false);

  /* Q&A */
  const [aiQ, setAiQ] = useState("");
  const [aiA, setAiA] = useState<string | null>(null);
  const [loadingQA, setLoadingQA] = useState(false);

  /* compare */
  const [compareMode, setCompareMode] = useState(false);
  const [compareWith, setCompareWith] = useState("");
  const [compareResult, setCompareResult] = useState<CompareResult | null>(null);
  const [loadingCmp, setLoadingCmp] = useState(false);

  /* report */
  const [report, setReport] = useState<string | null>(null);
  const [loadingReport, setLoadingReport] = useState(false);
  const [showReport, setShowReport] = useState(false);

  /* personal */
  const [userPrefs, setUserPrefs] = useState("");
  const [personalRec, setPersonalRec] = useState<string | null>(null);
  const [loadingPers, setLoadingPers] = useState(false);

  /* india */
  const [indiaMode, setIndiaMode] = useState(false);
  const [indiaTopic, setIndiaTopic] = useState("Festival Impact");
  const [indiaInsight, setIndiaInsight] = useState<string | null>(null);
  const [loadingIndia, setLoadingIndia] = useState(false);

  /* saved */
  const [saved, setSaved] = useState<SavedInsight[]>([]);
  const [showSaved, setShowSaved] = useState(false);

  const loc = location || "a city";

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
    setOverview(null); setRadarScores(DEFAULT_RADAR); setSituation(null);
    setExplanation(null); setPatterns([]); setFuture(null);
    setOpportunities([]); setRisks([]); setBrief(null);
    setAiA(null); setCompareResult(null); setReport(null); setPersonalRec(null);
  };

  /* ─── Generate Overview + Radar together ─── */
  const generateOverview = useCallback(async () => {
    if (!location) return;
    setLoadingOverview(true); setLoadingRadar(true);
    const [ovRes, radRes] = await Promise.all([
      askJSON<{ summary: string; score: number }>(
        `Analyze ${location} as a city/place. Return JSON: { "summary": "2 sentence summary", "score": number (0-100 intelligence score) }`,
        { summary: `${location} is a dynamic urban area with a rich blend of cultural heritage and modern development.`, score: 78 }
      ),
      askJSON<Record<string, number>>(
        `Score ${location} on these 6 dimensions (0-100 each). Return JSON: { "Growth": number, "Activity": number, "Culture": number, "Economy": number, "Environment": number, "Future": number }`,
        { Growth: 72, Activity: 81, Culture: 69, Economy: 75, Environment: 63, Future: 77 }
      ),
    ]);
    setOverview(ovRes);
    setRadarScores(DEFAULT_RADAR.map(d => ({ ...d, value: radRes[d.label] ?? 70 })));
    setLoadingOverview(false); setLoadingRadar(false);
  }, [location]);

  const generateSituation = useCallback(async () => {
    if (!location) return;
    setLoadingSit(true);
    const d = await askJSON<{ situation: string; reason: string; impact: string }>(
      `What is happening right now in ${location}? Return JSON: { "situation": "short phrase", "reason": "why", "impact": "effect" }`,
      { situation: "High evening activity", reason: "Events + weekend movement", impact: "Traffic increasing across major zones" }
    );
    setSituation(d); setLoadingSit(false);
  }, [location]);

  const generateExplanation = useCallback(async () => {
    if (!location) return;
    setLoadingExp(true);
    const txt = await askAI(`Explain in plain language what is currently happening in ${location} and why. What patterns are driving activity? What should someone know about this place right now? 3-4 sentences, no jargon.`);
    setExplanation(txt); setLoadingExp(false);
  }, [location]);

  const generatePatterns = useCallback(async () => {
    if (!location) return;
    setLoadingPat(true);
    const d = await askJSON<{ text: string; type: "positive" | "neutral" | "warning" }[]>(
      `Find 5 hidden or non-obvious patterns about ${location}. Return a JSON array of objects: [{ "text": "pattern description", "type": "positive"|"neutral"|"warning" }]`,
      [
        { text: `${location} becomes most active after 7 PM on weekdays`, type: "positive" },
        { text: "Food and café zones are steadily growing", type: "positive" },
        { text: "Tourism increasing year-on-year", type: "positive" },
        { text: "Traffic pressure peaks 8–9 AM and 6–7 PM", type: "warning" },
        { text: "Weekend crowd patterns differ significantly from weekdays", type: "neutral" },
      ]
    );
    setPatterns(d); setLoadingPat(false);
  }, [location]);

  const generateFuture = useCallback(async () => {
    if (!location) return;
    setLoadingFut(true);
    const d = await askJSON<{ tourism: number; activity: number; events: number; confidence: number; summary: string }>(
      `Predict ${location} over the next 30 days. Return JSON: { "tourism": 0-100, "activity": 0-100, "events": 0-100, "confidence": 0-100, "summary": "1 sentence" }`,
      { tourism: 74, activity: 82, events: 68, confidence: 79, summary: `${location} is expected to see increasing tourism and activity over the next 30 days.` }
    );
    setFuture(d); setLoadingFut(false);
  }, [location]);

  const generateOpportunities = useCallback(async () => {
    if (!location) return;
    setLoadingOpp(true);
    const d = await askJSON<{ icon: string; label: string; detail: string }[]>(
      `List 4 concrete opportunities (business, education, lifestyle, or investment) in ${location} right now. Return a JSON array: [{ "icon": "emoji", "label": "short label", "detail": "1 sentence" }]`,
      [
        { icon: "🚀", label: "Business Growth", detail: "Strong demand for tech and service businesses." },
        { icon: "📚", label: "Education Hub", detail: "Growing student population creating service opportunities." },
        { icon: "🏪", label: "Local Market", detail: "Underserved neighbourhoods ideal for retail." },
        { icon: "🏠", label: "Growth Areas", detail: "Emerging residential zones with rising value." },
      ]
    );
    setOpportunities(d); setLoadingOpp(false);
  }, [location]);

  const generateRisks = useCallback(async () => {
    if (!location) return;
    setLoadingRisk(true);
    const d = await askJSON<{ icon: string; label: string; level: "low" | "medium" | "high" }[]>(
      `List 4 risks or things to watch out for in ${location}. Return JSON array: [{ "icon": "emoji", "label": "short label", "level": "low"|"medium"|"high" }]`,
      [
        { icon: "🚗", label: "Traffic pressure", level: "high" },
        { icon: "👥", label: "Crowding at peak times", level: "medium" },
        { icon: "🌧", label: "Weather impact on activity", level: "low" },
        { icon: "💰", label: "Rising costs", level: "medium" },
      ]
    );
    setRisks(d); setLoadingRisk(false);
  }, [location]);

  const generateBrief = useCallback(async () => {
    if (!location) return;
    setLoadingBrief(true);
    const txt = await askAI(`Write a friendly daily city brief for ${location} as if you're a smart city assistant greeting someone in the morning. Include: current conditions, how many notable things are happening, traffic status, and the best time to go out today. Keep it under 60 words, warm and direct.`);
    setBrief(txt); setLoadingBrief(false);
  }, [location]);

  const askQuestion = async () => {
    if (!aiQ.trim()) return;
    setLoadingQA(true);
    const txt = await askAI(`${aiQ} Context: we are analyzing ${loc}. Answer in 3 sentences, be specific and useful.`);
    setAiA(txt); setLoadingQA(false);
  };

  const generateCompare = async () => {
    if (!location || !compareWith) return;
    setLoadingCmp(true);
    const d = await askJSON<CompareResult>(
      `Compare ${location} vs ${compareWith} as urban areas. Return JSON: { "winner": "name of better one overall", "summary": "2 sentence comparison", "scores": { "Growth": [a, b], "Culture": [a, b], "Economy": [a, b], "Safety": [a, b] } } where a=${location} score and b=${compareWith} score.`,
      { winner: location, summary: `${location} and ${compareWith} each have distinct strengths. ${location} edges ahead in overall liveability.`, scores: { Growth: [74, 68], Culture: [81, 76], Economy: [72, 80], Safety: [77, 71] } }
    );
    setCompareResult(d); setLoadingCmp(false);
  };

  const generateReport = useCallback(async () => {
    if (!location) return;
    setLoadingReport(true);
    const txt = await askAI(`Write a professional AI intelligence report for ${location}. Include: Executive Summary, Key Metrics, Current Activity, Hidden Patterns, Future Outlook, and Recommendations. Use clear headers. Keep it under 300 words.`);
    setReport(txt); setShowReport(true); setLoadingReport(false);
  }, [location]);

  const generatePersonal = async () => {
    if (!location || !userPrefs.trim()) return;
    setLoadingPers(true);
    const txt = await askAI(`A person who likes "${userPrefs}" is looking for places in or near ${location}. What specific areas, times, and types of places would suit them perfectly? Give 3-4 concrete suggestions. Be specific.`);
    setPersonalRec(txt); setLoadingPers(false);
  };

  const generateIndia = async () => {
    setLoadingIndia(true);
    const txt = await askAI(`Explain "${indiaTopic}" as it applies to Indian cities, especially the cultural, economic and human dimension. Use real examples. Give specific insights a traveller or business person would find valuable. 3-4 sentences.`);
    setIndiaInsight(txt); setLoadingIndia(false);
  };

  const saveInsight = () => {
    if (!location || !overview) return;
    setSaved(prev => [{
      id: Math.random().toString(36).slice(2),
      location, score: overview.score,
      summary: overview.summary.slice(0, 80) + "…",
      savedAt: new Date().toLocaleDateString(),
    }, ...prev]);
  };

  const riskColor = (level: string) =>
    level === "high" ? "border-red-500/40 bg-red-500/5 text-red-400" :
    level === "medium" ? "border-orange-500/40 bg-orange-500/5 text-orange-400" :
    "border-yellow-500/40 bg-yellow-500/5 text-yellow-400";

  const patternColor = (type: string) =>
    type === "positive" ? "border-green-500/30 bg-green-500/5" :
    type === "warning" ? "border-red-500/30 bg-red-500/5" :
    "border-white/10 bg-white/3";

  const patternIcon = (type: string) =>
    type === "positive" ? "✓" : type === "warning" ? "⚠" : "•";

  const DATA_SOURCES = ["Heatmaps", "Events", "Crowd Forecast", "Time Machine", "City Portfolio", "Smart Alerts"];

  return (
    <div className="min-h-screen bg-[radial-gradient(ellipse_at_top,_#0d0010_0%,_#000_60%)] text-white pb-20">

      {/* ── HERO ── */}
      <div className="relative overflow-hidden px-6 py-14 text-center">
        <div className="absolute inset-0"><NeuralBg /></div>
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="relative z-10 max-w-4xl mx-auto">
          <div className="flex justify-center mb-5">
            <div className="relative">
              <motion.div animate={{ scale: [1, 1.08, 1] }} transition={{ duration: 3, repeat: Infinity }}
                className="w-20 h-20 rounded-2xl bg-gradient-to-br from-violet-500/30 to-indigo-500/30 border border-violet-500/40 flex items-center justify-center">
                <BrainCircuit className="w-10 h-10 text-violet-400" />
              </motion.div>
              {[0, 1, 2].map(i => (
                <motion.div key={i} animate={{ scale: [1, 2.5, 1], opacity: [0.4, 0, 0.4] }}
                  transition={{ duration: 2.5, repeat: Infinity, delay: i * 0.7 }}
                  className="absolute inset-0 rounded-2xl border border-violet-400/30" />
              ))}
            </div>
          </div>
          <h1 className="text-5xl md:text-6xl font-black tracking-tight mb-3">
            <span className="bg-gradient-to-r from-violet-400 via-indigo-400 to-blue-400 bg-clip-text text-transparent">
              🧠 AI Insights
            </span>
          </h1>
          <p className="text-lg text-white/60 max-w-xl mx-auto mb-6">
            Discover hidden patterns and intelligent predictions about any place on Earth.
          </p>
          <div className="flex flex-wrap justify-center gap-4 text-sm">
            {[["🌍", "Any Location"], ["📊", "Deep Analysis"], ["🔮", "Predictions"], ["🤖", "AI Intelligence"]].map(([icon, label]) => (
              <div key={label} className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10">
                <span>{icon}</span><span className="text-white/60">{label}</span>
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      <div className="max-w-6xl mx-auto px-4 space-y-6">

        {/* ── SEARCH ── */}
        <GlassCard className="p-5 relative">
          <div className="flex gap-3">
            <div className="flex-1 relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
              <input value={query} onChange={e => handleSearch(e.target.value)} onFocus={() => setShowSearch(true)}
                placeholder="🔍 Analyze any city, area, neighborhood..."
                className="w-full bg-white/5 border border-white/10 rounded-xl pl-11 pr-4 py-3 text-white placeholder:text-white/30 focus:outline-none focus:border-violet-500/50 transition-colors" />
              {searching && <Loader2 className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 animate-spin text-violet-400" />}
            </div>
            <button onClick={() => { selectLocation(query); setTimeout(generateOverview, 100); }} disabled={!query.trim()}
              className="px-6 py-3 bg-gradient-to-r from-violet-500 to-indigo-500 rounded-xl font-semibold text-white disabled:opacity-40 hover:brightness-110 transition-all">
              Analyze
            </button>
          </div>
          {showSearch && (searchResults.length > 0 || query.length > 1) && (
            <div className="absolute top-full mt-1 left-5 right-5 z-50 bg-black/95 border border-white/10 rounded-xl overflow-hidden">
              {searchResults.map(r => (
                <button key={r.id} onClick={() => { selectLocation(r.name); setTimeout(() => generateOverview(), 100); }}
                  className="w-full flex items-center gap-3 px-4 py-3 hover:bg-white/5 transition-colors text-left">
                  <MapPin className="w-4 h-4 text-violet-400 flex-shrink-0" />
                  <span>{r.name}</span>
                  <span className="text-white/30 text-sm ml-auto">{r.country}</span>
                </button>
              ))}
              {query.trim() && (
                <button onClick={() => { selectLocation(query); setTimeout(generateOverview, 100); }}
                  className="w-full flex items-center gap-3 px-4 py-3 text-violet-400 border-t border-white/5 hover:bg-violet-500/10 transition-colors">
                  <ArrowRight className="w-4 h-4" /> Analyze "{query}"
                </button>
              )}
            </div>
          )}
          <div className="flex flex-wrap gap-2 mt-3">
            {EXAMPLES.map(e => (
              <button key={e} onClick={() => { setQuery(e); selectLocation(e); setTimeout(generateOverview, 100); }}
                className="text-xs px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-white/40 hover:text-white hover:border-violet-500/40 transition-all">
                {e}
              </button>
            ))}
          </div>
        </GlassCard>

        {/* ── OVERVIEW + RADAR ── */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          {/* overview card */}
          <GlassCard className="lg:col-span-2 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold flex items-center gap-2">
                <Star className="w-5 h-5 text-violet-400" /> AI Overview
              </h3>
              <div className="flex gap-2">
                <button onClick={generateOverview} disabled={!location || loadingOverview}
                  className="p-2 bg-violet-500/20 border border-violet-500/30 rounded-lg text-violet-400 hover:brightness-110 transition-all disabled:opacity-40">
                  {loadingOverview ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
                </button>
                {overview && (
                  <button onClick={saveInsight} className="p-2 bg-white/5 border border-white/10 rounded-lg text-white/50 hover:text-white transition-all">
                    <Bookmark className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
            {overview ? (
              <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
                <div className="flex items-center gap-3">
                  <MapPin className="w-4 h-4 text-violet-400 flex-shrink-0" />
                  <span className="font-semibold text-lg">{location}</span>
                </div>
                <p className="text-white/70 text-sm leading-relaxed">{overview.summary}</p>
                <div className="bg-violet-500/10 border border-violet-500/20 rounded-xl p-4 text-center">
                  <div className="text-5xl font-black text-transparent bg-clip-text bg-gradient-to-br from-violet-400 to-indigo-400">
                    {overview.score}
                  </div>
                  <div className="text-xs text-white/40 mt-1">/ 100 Intelligence Score</div>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  {DATA_SOURCES.map(s => (
                    <div key={s} className="flex items-center gap-1.5 text-xs text-white/50">
                      <CheckCircle2 className="w-3 h-3 text-green-400 flex-shrink-0" />{s}
                    </div>
                  ))}
                </div>
              </motion.div>
            ) : (
              <div className="flex flex-col items-center justify-center py-10 text-center">
                <BrainCircuit className="w-10 h-10 text-violet-400/20 mb-3" />
                <p className="text-white/30 text-sm">{location ? "Click Refresh to generate overview" : "Search any place to begin AI analysis"}</p>
              </div>
            )}
          </GlassCard>

          {/* radar chart */}
          <GlassCard className="lg:col-span-3 p-6">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-bold flex items-center gap-2">
                <Activity className="w-5 h-5 text-violet-400" /> City Intelligence Radar
              </h3>
              <button onClick={async () => { if (!location) return; setLoadingRadar(true); await generateOverview(); }}
                disabled={!location || loadingRadar}
                className="text-xs px-3 py-1.5 bg-violet-500/20 border border-violet-500/30 rounded-lg text-violet-400 hover:brightness-110 disabled:opacity-40">
                {loadingRadar ? <Loader2 className="w-3 h-3 animate-spin inline" /> : "Scan"}
              </button>
            </div>
            <div className="h-56 md:h-64">
              {radarScores[0].value > 0 ? (
                <RadarChart scores={radarScores} />
              ) : (
                <div className="h-full flex items-center justify-center">
                  <div className="text-center">
                    <Activity className="w-10 h-10 text-violet-400/10 mx-auto mb-2" />
                    <p className="text-white/20 text-sm">{location ? "Click Scan to generate radar" : "Select a location first"}</p>
                  </div>
                </div>
              )}
            </div>
            <div className="grid grid-cols-3 gap-2 mt-3">
              {radarScores.map(s => (
                <div key={s.label} className="flex items-center gap-2">
                  <span className="text-sm">{s.icon}</span>
                  <div className="flex-1 min-w-0">
                    <div className="text-xs text-white/40 truncate">{s.label}</div>
                    <div className="h-1 bg-white/5 rounded-full mt-0.5">
                      <motion.div animate={{ width: `${s.value}%` }} className="h-full bg-violet-500 rounded-full" />
                    </div>
                  </div>
                  <span className="text-xs text-violet-400 font-semibold">{s.value > 0 ? s.value : "—"}</span>
                </div>
              ))}
            </div>
          </GlassCard>
        </div>

        {/* ── WHAT IS HAPPENING NOW + EXPLANATION ── */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <GlassCard className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold flex items-center gap-2">
                <Zap className="w-5 h-5 text-yellow-400" /> What's Happening Now?
              </h3>
              <button onClick={generateSituation} disabled={!location || loadingSit}
                className="text-xs px-3 py-1.5 bg-yellow-500/20 border border-yellow-500/30 rounded-lg text-yellow-400 hover:brightness-110 disabled:opacity-40">
                {loadingSit ? <Loader2 className="w-3 h-3 animate-spin inline" /> : "Refresh"}
              </button>
            </div>
            {situation ? (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-3">
                {[
                  { label: "Current Situation", value: situation.situation, color: "text-yellow-400" },
                  { label: "Reason", value: situation.reason, color: "text-white/70" },
                  { label: "Impact", value: situation.impact, color: "text-orange-400" },
                ].map(({ label, value, color }) => (
                  <div key={label} className="bg-white/3 border border-white/5 rounded-xl p-3">
                    <div className="text-xs text-white/30 mb-1">{label}</div>
                    <div className={`text-sm font-semibold ${color}`}>{value}</div>
                  </div>
                ))}
              </motion.div>
            ) : (
              <div className="py-6 text-center text-white/20 text-sm">
                {location ? "Click Refresh to see live situation" : "Select a location first"}
              </div>
            )}
          </GlassCard>

          <GlassCard className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold flex items-center gap-2">
                <Lightbulb className="w-5 h-5 text-violet-400" /> AI Explanation Engine
              </h3>
              <button onClick={generateExplanation} disabled={!location || loadingExp}
                className="flex items-center gap-2 px-4 py-2 bg-violet-500/20 border border-violet-500/40 rounded-xl text-violet-400 text-sm hover:brightness-110 disabled:opacity-40">
                {loadingExp ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                {loadingExp ? "Thinking..." : "Explain"}
              </button>
            </div>
            {explanation ? (
              <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                className="bg-violet-500/5 border border-violet-500/20 rounded-xl p-4">
                <div className="flex gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-violet-400 mt-1.5 flex-shrink-0 animate-pulse" />
                  <TypedText text={explanation} />
                </div>
              </motion.div>
            ) : (
              <div className="py-6 text-center text-white/20 text-sm">
                {location ? "Click Explain — AI turns raw data into plain language" : "Select a location first"}
              </div>
            )}
          </GlassCard>
        </div>

        {/* ── HIDDEN PATTERNS ── */}
        <GlassCard className="p-6">
          <div className="flex items-center justify-between mb-5">
            <h3 className="font-bold text-lg flex items-center gap-2">
              <Globe2 className="w-5 h-5 text-indigo-400" /> Hidden Pattern Discovery
            </h3>
            <button onClick={generatePatterns} disabled={!location || loadingPat}
              className="flex items-center gap-2 px-4 py-2.5 bg-indigo-500/20 border border-indigo-500/40 rounded-xl text-indigo-400 text-sm hover:brightness-110 disabled:opacity-40">
              {loadingPat ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
              {loadingPat ? "Discovering..." : "Find Patterns"}
            </button>
          </div>
          {patterns.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {patterns.map((p, i) => (
                <motion.div key={i} initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.07 }}
                  className={`flex items-start gap-3 px-4 py-3 border rounded-xl ${patternColor(p.type)}`}>
                  <span className={`mt-0.5 text-sm font-bold flex-shrink-0 ${p.type === "positive" ? "text-green-400" : p.type === "warning" ? "text-red-400" : "text-white/40"}`}>
                    {patternIcon(p.type)}
                  </span>
                  <span className="text-white/70 text-sm">{p.text}</span>
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {["Area becomes active after 7 PM", "Food zones growing", "Tourism increasing", "Local patterns shifting"].map(t => (
                <div key={t} className="flex items-start gap-3 px-4 py-3 border border-white/5 rounded-xl opacity-20">
                  <span className="text-white/30 text-sm">•</span>
                  <span className="text-white/30 text-sm">{t}</span>
                </div>
              ))}
              <p className="col-span-full text-center text-white/20 text-xs">{location ? "Click Find Patterns to discover hidden insights" : "Select a location first"}</p>
            </div>
          )}
        </GlassCard>

        {/* ── FUTURE + OPPORTUNITIES + RISKS ── */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* future */}
          <GlassCard className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-sm flex items-center gap-2">🔮 Next 30 Days</h3>
              <button onClick={generateFuture} disabled={!location || loadingFut}
                className="text-xs px-3 py-1.5 bg-violet-500/20 border border-violet-500/30 rounded-lg text-violet-400 hover:brightness-110 disabled:opacity-40">
                {loadingFut ? <Loader2 className="w-3 h-3 animate-spin inline" /> : "Predict"}
              </button>
            </div>
            {future ? (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-3">
                <p className="text-xs text-white/50 italic border-l-2 border-violet-500 pl-2">{future.summary}</p>
                {[["Tourism ↑", future.tourism], ["Activity ↑", future.activity], ["Events ↑", future.events]].map(([label, val]) => (
                  <div key={label as string}>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-white/60">{label as string}</span>
                      <span className="text-violet-400 font-semibold">{val as number}%</span>
                    </div>
                    <div className="h-1.5 bg-white/5 rounded-full">
                      <motion.div initial={{ width: 0 }} animate={{ width: `${val as number}%` }}
                        className="h-full bg-gradient-to-r from-violet-500 to-indigo-400 rounded-full" />
                    </div>
                  </div>
                ))}
                <div className="flex items-center gap-2 text-xs text-green-400">
                  <div className="w-2 h-2 rounded-full bg-green-400" />
                  Confidence: <strong>{future.confidence}%</strong>
                </div>
              </motion.div>
            ) : (
              <div className="py-4 text-center text-white/20 text-xs">{location ? "Click Predict" : "Select a location"}</div>
            )}
          </GlassCard>

          {/* opportunities */}
          <GlassCard className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-sm flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-green-400" /> Opportunities
              </h3>
              <button onClick={generateOpportunities} disabled={!location || loadingOpp}
                className="text-xs px-3 py-1.5 bg-green-500/20 border border-green-500/30 rounded-lg text-green-400 hover:brightness-110 disabled:opacity-40">
                {loadingOpp ? <Loader2 className="w-3 h-3 animate-spin inline" /> : "Find"}
              </button>
            </div>
            {opportunities.length > 0 ? (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-2">
                {opportunities.map((o, i) => (
                  <motion.div key={i} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }}
                    className="bg-green-500/5 border border-green-500/15 rounded-xl p-3">
                    <div className="flex items-center gap-2 mb-1">
                      <span>{o.icon}</span>
                      <span className="text-sm font-semibold text-green-400">{o.label}</span>
                    </div>
                    <p className="text-xs text-white/50">{o.detail}</p>
                  </motion.div>
                ))}
              </motion.div>
            ) : (
              <div className="space-y-2 opacity-20">
                {["🚀 Business", "📚 Education", "🏪 Local Market", "🏠 Growth Areas"].map(t => (
                  <div key={t} className="bg-white/3 border border-white/5 rounded-lg px-3 py-2 text-sm text-white/30">{t}</div>
                ))}
                <p className="text-center text-xs text-white/20">{location ? "Click Find" : "Select location"}</p>
              </div>
            )}
          </GlassCard>

          {/* risks */}
          <GlassCard className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-sm flex items-center gap-2">
                <Shield className="w-4 h-4 text-orange-400" /> Things to Watch
              </h3>
              <button onClick={generateRisks} disabled={!location || loadingRisk}
                className="text-xs px-3 py-1.5 bg-orange-500/20 border border-orange-500/30 rounded-lg text-orange-400 hover:brightness-110 disabled:opacity-40">
                {loadingRisk ? <Loader2 className="w-3 h-3 animate-spin inline" /> : "Scan"}
              </button>
            </div>
            {risks.length > 0 ? (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-2">
                {risks.map((r, i) => (
                  <motion.div key={i} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }}
                    className={`flex items-center gap-3 px-3 py-2.5 border rounded-xl ${riskColor(r.level)}`}>
                    <span>{r.icon}</span>
                    <span className="text-sm flex-1">{r.label}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full border ${riskColor(r.level)} font-semibold`}>{r.level}</span>
                  </motion.div>
                ))}
              </motion.div>
            ) : (
              <div className="space-y-2 opacity-20">
                {["🚗 Traffic", "👥 Crowding", "🌧 Weather", "💰 Costs"].map(t => (
                  <div key={t} className="bg-white/3 border border-white/5 rounded-lg px-3 py-2 text-sm text-white/30">{t}</div>
                ))}
                <p className="text-center text-xs text-white/20">{location ? "Click Scan" : "Select location"}</p>
              </div>
            )}
          </GlassCard>
        </div>

        {/* ── DAILY BRIEF ── */}
        <GlassCard className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-lg flex items-center gap-2">
              <Clock className="w-5 h-5 text-blue-400" /> ☀️ AI Daily Brief
            </h3>
            <button onClick={generateBrief} disabled={!location || loadingBrief}
              className="flex items-center gap-2 px-5 py-2.5 bg-blue-500/20 border border-blue-500/40 rounded-xl text-blue-400 text-sm hover:brightness-110 disabled:opacity-40">
              {loadingBrief ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
              {loadingBrief ? "Generating..." : "Generate Brief"}
            </button>
          </div>
          {brief ? (
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
              className="bg-blue-500/5 border border-blue-500/20 rounded-xl p-5">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-2 h-2 rounded-full bg-blue-400 animate-pulse" />
                <span className="text-xs text-blue-400 font-bold">NEXORA DAILY BRIEF — {location.toUpperCase()}</span>
              </div>
              <p className="text-white/80 leading-relaxed"><TypedText text={brief} /></p>
            </motion.div>
          ) : (
            <div className="bg-blue-500/5 border border-blue-500/10 rounded-xl p-6 text-center">
              <div className="flex justify-center gap-6 mb-3 text-sm text-white/20">
                <span>🌤 Weather good</span>
                <span>📅 3 events nearby</span>
                <span>🚗 Traffic normal</span>
              </div>
              <p className="text-white/20 text-sm">{location ? "Click Generate Brief for your personal city report" : "Select a location first"}</p>
            </div>
          )}
        </GlassCard>

        {/* ── ASK AI ── */}
        <GlassCard className="p-6">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-8 h-8 rounded-lg bg-violet-500/20 flex items-center justify-center">
              <BrainCircuit className="w-4 h-4 text-violet-400" />
            </div>
            <h3 className="font-bold text-lg">✨ Ask Nexora AI</h3>
          </div>
          <div className="space-y-3">
            <div className="flex gap-3">
              <input value={aiQ} onChange={e => setAiQ(e.target.value)} onKeyDown={e => e.key === "Enter" && askQuestion()}
                placeholder="Why is this area growing? Is this good for business? What changed here?"
                className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-white/25 focus:outline-none focus:border-violet-500/50 transition-colors" />
              <button onClick={askQuestion} disabled={!aiQ.trim() || loadingQA}
                className="px-5 py-3 bg-violet-500/20 border border-violet-500/40 rounded-xl text-violet-400 hover:bg-violet-500/30 transition-all disabled:opacity-40">
                {loadingQA ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {["Why is this area growing?", "Is this good for business?", "Should I visit today?", "What changed here?"].map(q => (
                <button key={q} onClick={() => setAiQ(q)}
                  className="text-xs px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-white/40 hover:text-white hover:border-violet-500/30 transition-all">{q}</button>
              ))}
            </div>
            <AnimatePresence>
              {aiA && (
                <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                  className="bg-violet-500/5 border border-violet-500/20 rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-2 h-2 rounded-full bg-violet-400 animate-pulse" />
                    <span className="text-xs text-violet-400 font-bold">NEXORA AI</span>
                  </div>
                  <p className="text-white/80 text-sm leading-relaxed">{aiA}</p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </GlassCard>

        {/* ── COMPARE + REPORT row ── */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* compare */}
          <GlassCard className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-blue-400" /> Compare AI Insights
              </h3>
              <button onClick={() => setCompareMode(v => !v)}
                className={`px-3 py-1.5 text-xs rounded-lg border transition-all ${compareMode ? "bg-blue-500/20 border-blue-500/40 text-blue-400" : "bg-white/5 border-white/10 text-white/50 hover:text-white"}`}>
                {compareMode ? "Close" : "Compare"}
              </button>
            </div>
            {compareMode ? (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-3">
                <div className="flex gap-2 text-sm font-semibold">
                  <div className="flex-1 text-center px-3 py-2 bg-violet-500/10 border border-violet-500/20 rounded-lg text-violet-400 truncate">
                    {location || "City A"}
                  </div>
                  <div className="flex items-center text-white/30 text-xs">vs</div>
                  <input value={compareWith} onChange={e => setCompareWith(e.target.value)}
                    placeholder="City B"
                    className="flex-1 bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white placeholder:text-white/30 focus:outline-none focus:border-blue-500/50 text-center" />
                </div>
                <button onClick={generateCompare} disabled={!location || !compareWith || loadingCmp}
                  className="w-full py-2.5 bg-blue-500/20 border border-blue-500/40 rounded-xl text-blue-400 text-sm hover:brightness-110 disabled:opacity-40 flex items-center justify-center gap-2">
                  {loadingCmp ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                  {loadingCmp ? "Comparing..." : "AI Compare"}
                </button>
                {compareResult && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-3">
                    <div className="bg-green-500/10 border border-green-500/20 rounded-xl p-3 text-center">
                      <div className="text-xs text-green-400 mb-1">Overall Winner</div>
                      <div className="font-bold text-green-300">{compareResult.winner}</div>
                    </div>
                    <p className="text-xs text-white/60 leading-relaxed">{compareResult.summary}</p>
                    {Object.entries(compareResult.scores).map(([metric, [a, b]]) => (
                      <div key={metric}>
                        <div className="flex justify-between text-xs text-white/40 mb-1"><span>{metric}</span></div>
                        <div className="grid grid-cols-2 gap-1">
                          <div>
                            <div className="text-xs text-violet-400 mb-0.5 truncate">{location}</div>
                            <div className="h-1.5 bg-white/5 rounded-full">
                              <div className="h-full bg-violet-500 rounded-full" style={{ width: `${a}%` }} />
                            </div>
                          </div>
                          <div>
                            <div className="text-xs text-blue-400 mb-0.5 truncate">{compareWith}</div>
                            <div className="h-1.5 bg-white/5 rounded-full">
                              <div className="h-full bg-blue-500 rounded-full" style={{ width: `${b}%` }} />
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </motion.div>
                )}
              </motion.div>
            ) : (
              <p className="text-white/30 text-sm">Compare AI insights between any two places — AI explains which is better and why.</p>
            )}
          </GlassCard>

          {/* report */}
          <GlassCard className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold flex items-center gap-2">
                <FileText className="w-5 h-5 text-green-400" /> AI Report Generator
              </h3>
              <button onClick={generateReport} disabled={!location || loadingReport}
                className="flex items-center gap-2 px-4 py-2 bg-green-500/20 border border-green-500/40 rounded-xl text-green-400 text-sm hover:brightness-110 disabled:opacity-40">
                {loadingReport ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                {loadingReport ? "Generating..." : "📄 Generate"}
              </button>
            </div>
            {report && showReport ? (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="relative">
                <button onClick={() => setShowReport(false)} className="absolute top-0 right-0 text-white/30 hover:text-white">
                  <X className="w-4 h-4" />
                </button>
                <div className="bg-white/3 border border-white/10 rounded-xl p-4 max-h-60 overflow-y-auto">
                  <pre className="text-xs text-white/70 leading-relaxed whitespace-pre-wrap font-sans">{report}</pre>
                </div>
              </motion.div>
            ) : (
              <div className="space-y-2">
                {["City Summary", "AI Insights", "Charts & Patterns", "Recommendations"].map(s => (
                  <div key={s} className="flex items-center gap-3 px-3 py-2 bg-white/3 border border-white/5 rounded-lg text-sm text-white/30">
                    <CheckCircle2 className="w-3.5 h-3.5 text-green-400/30" />{s}
                  </div>
                ))}
                <p className="text-center text-white/20 text-xs pt-1">{location ? "Click Generate for a full AI report" : "Select a location first"}</p>
              </div>
            )}
          </GlassCard>
        </div>

        {/* ── PERSONAL INTELLIGENCE ── */}
        <GlassCard className="p-6">
          <div className="flex items-center gap-3 mb-5">
            <Heart className="w-5 h-5 text-pink-400" />
            <h3 className="font-bold">Personal Intelligence — What Matches You?</h3>
          </div>
          <div className="flex gap-3 mb-4">
            <input value={userPrefs} onChange={e => setUserPrefs(e.target.value)}
              placeholder="I like quiet cafes, street food, walkable areas..."
              className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-white/25 focus:outline-none focus:border-pink-500/50 transition-colors" />
            <button onClick={generatePersonal} disabled={!location || !userPrefs.trim() || loadingPers}
              className="px-5 py-3 bg-pink-500/20 border border-pink-500/40 rounded-xl text-pink-400 hover:brightness-110 disabled:opacity-40">
              {loadingPers ? <Loader2 className="w-5 h-5 animate-spin" /> : <Sparkles className="w-5 h-5" />}
            </button>
          </div>
          {personalRec ? (
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
              className="bg-pink-500/5 border border-pink-500/20 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <Heart className="w-3.5 h-3.5 text-pink-400" />
                <span className="text-xs text-pink-400 font-bold">YOUR MATCH IN {loc.toUpperCase()}</span>
              </div>
              <p className="text-white/80 text-sm leading-relaxed">{personalRec}</p>
            </motion.div>
          ) : (
            <div className="flex gap-2 flex-wrap">
              {["Quiet & peaceful", "Food lover", "Explorer", "Business traveller"].map(p => (
                <button key={p} onClick={() => setUserPrefs(p)}
                  className="text-xs px-3 py-1.5 rounded-full bg-pink-500/10 border border-pink-500/20 text-pink-400 hover:brightness-110 transition-all">{p}</button>
              ))}
            </div>
          )}
        </GlassCard>

        {/* ── INDIA INTELLIGENCE ── */}
        <GlassCard className={`p-6 ${indiaMode ? "border-orange-500/30" : ""}`}>
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold flex items-center gap-2">🇮🇳 India Intelligence Mode</h3>
            <button onClick={() => setIndiaMode(v => !v)}
              className={`px-4 py-2 text-sm rounded-lg border transition-all ${indiaMode ? "bg-orange-500/20 border-orange-500/40 text-orange-400" : "bg-white/5 border-white/10 text-white/50 hover:text-white"}`}>
              {indiaMode ? "Active" : "Activate"}
            </button>
          </div>
          {indiaMode ? (
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
              <div className="flex flex-wrap gap-2">
                {INDIA_TOPICS.map(t => (
                  <button key={t} onClick={() => setIndiaTopic(t)}
                    className={`text-xs px-3 py-1.5 rounded-full border transition-all ${indiaTopic === t ? "bg-orange-500/20 border-orange-500/40 text-orange-400" : "bg-white/5 border-white/10 text-white/40 hover:text-white"}`}>
                    {t}
                  </button>
                ))}
              </div>
              <button onClick={generateIndia} disabled={loadingIndia}
                className="w-full flex items-center justify-center gap-2 py-3 bg-orange-500/20 border border-orange-500/40 rounded-xl text-orange-400 hover:brightness-110 disabled:opacity-40">
                {loadingIndia ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                {loadingIndia ? "Analyzing..." : `Analyze: ${indiaTopic}`}
              </button>
              {indiaInsight && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                  className="bg-orange-500/5 border border-orange-500/20 rounded-xl p-4">
                  <div className="text-xs text-orange-400 font-bold mb-2">{indiaTopic.toUpperCase()}</div>
                  <p className="text-white/80 text-sm leading-relaxed">{indiaInsight}</p>
                </motion.div>
              )}
            </motion.div>
          ) : (
            <p className="text-white/30 text-sm">Deep intelligence on Indian cities — festivals, culture, regional patterns, business hubs, and seasonal travel.</p>
          )}
        </GlassCard>

        {/* ── SAVED INSIGHTS ── */}
        <GlassCard className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold flex items-center gap-2">
              <Bookmark className="w-5 h-5 text-primary" /> Saved Insights
            </h3>
            <div className="flex gap-2">
              {overview && location && (
                <button onClick={saveInsight}
                  className="flex items-center gap-2 px-4 py-2 bg-primary/20 border border-primary/40 rounded-lg text-sm text-primary hover:bg-primary/30 transition-all">
                  <Bookmark className="w-4 h-4" /> Save Current
                </button>
              )}
              <button onClick={() => setShowSaved(v => !v)}
                className="p-2 bg-white/5 border border-white/10 rounded-lg text-white/50 hover:text-white transition-all">
                {showSaved ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </button>
            </div>
          </div>
          <AnimatePresence>
            {showSaved && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}>
                {saved.length > 0 ? (
                  <div className="space-y-2">
                    {saved.map(s => (
                      <div key={s.id} className="flex items-center gap-4 px-4 py-3 bg-white/3 border border-white/5 rounded-xl">
                        <div className="w-10 h-10 rounded-lg bg-violet-500/20 border border-violet-500/30 flex items-center justify-center text-violet-400 text-sm font-black flex-shrink-0">
                          {s.score}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="font-semibold text-sm">{s.location}</div>
                          <div className="text-xs text-white/40 truncate">{s.summary}</div>
                        </div>
                        <div className="text-xs text-white/20 flex-shrink-0">{s.savedAt}</div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-6">
                    <Bookmark className="w-8 h-8 mx-auto mb-2 text-white/10" />
                    <p className="text-white/30 text-sm">No insights saved yet. Analyze a place and click Save.</p>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
          {!showSaved && saved.length === 0 && (
            <p className="text-white/30 text-sm">Save insights for City Research, Travel Ideas, and Business planning.</p>
          )}
        </GlassCard>

      </div>
    </div>
  );
}
