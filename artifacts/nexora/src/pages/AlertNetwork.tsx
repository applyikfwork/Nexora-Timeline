import React, { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  AlertTriangle, GraduationCap, BadgeDollarSign, CloudRain, TrafficCone,
  Landmark, Zap, Activity, Search, RefreshCw, Plus, Trash2, X,
  ChevronDown, ChevronUp, CheckCircle2, Clock, Users, Send, Bot,
  Bell, BellOff, Info, Shield, BarChart3, MapPin, Loader2, Radio,
  TrendingUp, FileText, Star,
} from "lucide-react";

// ── Types ─────────────────────────────────────────────────────────────────────
type AlertCategory = "all" | "student" | "scam" | "weather" | "traffic" | "public" | "utility" | "health" | "general";
type AlertLevel = "area" | "city" | "state" | "national";

interface AlertItem {
  id: string; title: string; category: AlertCategory; level: AlertLevel;
  location: string; severity: "critical" | "high" | "medium" | "low";
  importanceScore: number; aiSummary: string;
  whatHappened: string; whyItMatters: string; whoAffected: string;
  recommendedAction: string; verificationStatus: "verified" | "likely" | "community" | "developing";
  sources: string[]; publishedAt: string; isAiGenerated: boolean;
}
interface FeedResult { alerts: AlertItem[]; stats: { activeAlerts: number; localSignals: number; nationalAlerts: number; riskReports: number }; generatedAt: string }
interface DailyBrief { greeting: string; localAlerts: number; nationalAlerts: number; severeRisks: boolean; weatherStatus: string; topAlert: string; trafficStatus: string; examAlert: string; scamAlert: string; mood: string; advice: string; generatedAt: string }
interface ForecastItem { category: string; emoji: string; prediction: string; confidence: number; timeframe: string; reason: string; severity: string }
interface ForecastResult { forecasts: ForecastItem[]; overallRiskLevel: string; overallRiskReason: string; generatedAt: string }
interface CommunityReport { id: string; location: string; description: string; category: string; confidence: number; reportedAt: string; isDuplicate: boolean }
interface WatchlistEntry { id: string; label: string; location: string; categories: string[]; addedAt: string }

// ── Config ────────────────────────────────────────────────────────────────────
const CATEGORIES: { id: AlertCategory; label: string; emoji: string; icon: React.ElementType; color: string }[] = [
  { id: "all", label: "All Alerts", emoji: "🔔", icon: Bell, color: "#a78bfa" },
  { id: "student", label: "Student", emoji: "🎓", icon: GraduationCap, color: "#60a5fa" },
  { id: "scam", label: "Scam & Fraud", emoji: "💰", icon: BadgeDollarSign, color: "#f59e0b" },
  { id: "weather", label: "Weather", emoji: "🌧", icon: CloudRain, color: "#34d399" },
  { id: "traffic", label: "Traffic", emoji: "🚦", icon: TrafficCone, color: "#f87171" },
  { id: "public", label: "Public Notices", emoji: "🏛", icon: Landmark, color: "#c084fc" },
  { id: "utility", label: "Utility", emoji: "⚡", icon: Zap, color: "#fbbf24" },
  { id: "health", label: "Health", emoji: "🏥", icon: Activity, color: "#f472b6" },
];

const LEVELS: { id: AlertLevel; label: string; desc: string }[] = [
  { id: "area", label: "My Area", desc: "Hyperlocal — neighborhood & nearby" },
  { id: "city", label: "City", desc: "City-wide alerts & events" },
  { id: "state", label: "State", desc: "Government & state-wide notices" },
  { id: "national", label: "National", desc: "India-wide alerts & scam trends" },
];

const SEVERITY_CONFIG = {
  critical: { color: "#ef4444", bg: "rgba(239,68,68,0.12)", border: "rgba(239,68,68,0.3)", label: "Critical", dot: "bg-red-500" },
  high:     { color: "#f97316", bg: "rgba(249,115,22,0.10)", border: "rgba(249,115,22,0.28)", label: "High", dot: "bg-orange-500" },
  medium:   { color: "#f59e0b", bg: "rgba(245,158,11,0.08)", border: "rgba(245,158,11,0.24)", label: "Medium", dot: "bg-yellow-500" },
  low:      { color: "#60a5fa", bg: "rgba(96,165,250,0.08)", border: "rgba(96,165,250,0.22)", label: "Low", dot: "bg-blue-400" },
};

const VERIFICATION_CONFIG = {
  verified:   { label: "Verified", color: "#34d399", icon: "✅", desc: "Confirmed by official sources" },
  likely:     { label: "Likely", color: "#fbbf24", icon: "🟡", desc: "Multiple signals corroborate this" },
  community:  { label: "Community Report", color: "#60a5fa", icon: "👥", desc: "Reported by community members" },
  developing: { label: "Developing", color: "#a78bfa", icon: "🔄", desc: "Emerging — monitoring situation" },
};

const INDIA_STATES = ["Andhra Pradesh","Assam","Bihar","Chhattisgarh","Delhi","Goa","Gujarat","Haryana","Himachal Pradesh","Jharkhand","Karnataka","Kerala","Madhya Pradesh","Maharashtra","Manipur","Meghalaya","Mizoram","Nagaland","Odisha","Punjab","Rajasthan","Sikkim","Tamil Nadu","Telangana","Tripura","Uttar Pradesh","Uttarakhand","West Bengal"];

// ── Radar Animation ───────────────────────────────────────────────────────────
function RadarAnimation({ activeAlerts = 0 }: { activeAlerts?: number }) {
  const [angle, setAngle] = useState(0);
  const [pulses, setPulses] = useState<{ id: number; x: number; y: number; born: number }[]>([]);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const t = setInterval(() => setAngle(a => (a + 2) % 360), 30);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    const t = setInterval(() => {
      if (Math.random() > 0.6) {
        const r = 30 + Math.random() * 60;
        const a = Math.random() * Math.PI * 2;
        setPulses(p => [...p.slice(-6), { id: Date.now(), x: 50 + r * Math.cos(a), y: 50 + r * Math.sin(a), born: Date.now() }]);
      }
    }, 800);
    return () => clearInterval(t);
  }, []);

  const rad = (angle * Math.PI) / 180;
  const cx = 50, cy = 50, r = 80;

  return (
    <div className="relative w-52 h-52 mx-auto">
      <svg viewBox="0 0 100 100" className="w-full h-full">
        <defs>
          <radialGradient id="radarBg" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#4c1d95" stopOpacity="0.3" />
            <stop offset="100%" stopColor="#1e1b4b" stopOpacity="0.1" />
          </radialGradient>
          <radialGradient id="sweepGrad" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#7c3aed" stopOpacity="0.6" />
            <stop offset="100%" stopColor="#7c3aed" stopOpacity="0" />
          </radialGradient>
        </defs>
        <circle cx="50" cy="50" r="48" fill="url(#radarBg)" stroke="#4c1d95" strokeWidth="0.5" />
        {[16, 32, 48].map(rr => <circle key={rr} cx="50" cy="50" r={rr} fill="none" stroke="#4c1d95" strokeWidth="0.3" strokeDasharray="2 2" />)}
        <line x1="50" y1="2" x2="50" y2="98" stroke="#3b0764" strokeWidth="0.3" />
        <line x1="2" y1="50" x2="98" y2="50" stroke="#3b0764" strokeWidth="0.3" />
        <path
          d={`M 50 50 L ${50 + 46 * Math.cos(rad - 0.7)} ${50 + 46 * Math.sin(rad - 0.7)} A 46 46 0 0 1 ${50 + 46 * Math.cos(rad)} ${50 + 46 * Math.sin(rad)} Z`}
          fill="url(#sweepGrad)" opacity="0.7"
        />
        <line x1="50" y1="50" x2={50 + 46 * Math.cos(rad)} y2={50 + 46 * Math.sin(rad)} stroke="#7c3aed" strokeWidth="0.8" />
        {pulses.map(p => (
          <circle key={p.id} cx={p.x} cy={p.y} r="2" fill="#ef4444" opacity="0.9">
            <animate attributeName="opacity" from="0.9" to="0" dur="2s" repeatCount="indefinite" />
            <animate attributeName="r" from="2" to="4" dur="2s" repeatCount="indefinite" />
          </circle>
        ))}
        <circle cx="50" cy="50" r="2.5" fill="#7c3aed" />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="text-center mt-8">
          <div className="text-2xl font-black text-white">{activeAlerts}</div>
          <div className="text-xs text-violet-300 font-medium">ACTIVE</div>
        </div>
      </div>
    </div>
  );
}

// ── Alert Card ────────────────────────────────────────────────────────────────
function AlertCard({ alert, onDismiss }: { alert: AlertItem; onDismiss?: () => void }) {
  const [expanded, setExpanded] = useState(false);
  const sev = SEVERITY_CONFIG[alert.severity] || SEVERITY_CONFIG.low;
  const ver = VERIFICATION_CONFIG[alert.verificationStatus] || VERIFICATION_CONFIG.developing;
  const cat = CATEGORIES.find(c => c.id === alert.category);
  const score = alert.importanceScore ?? 50;
  const scoreColor = score >= 80 ? "#ef4444" : score >= 60 ? "#f97316" : score >= 40 ? "#f59e0b" : "#60a5fa";

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.97 }}
      className="relative rounded-2xl border overflow-hidden"
      style={{ background: sev.bg, borderColor: sev.border }}
    >
      {/* Score bar */}
      <div className="h-0.5 bg-white/5">
        <div className="h-full transition-all" style={{ width: `${score}%`, background: scoreColor }} />
      </div>

      <div className="p-4">
        {/* Header */}
        <div className="flex items-start justify-between gap-3 mb-2">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <span className="text-xs font-bold px-2 py-0.5 rounded-full" style={{ background: sev.bg, color: sev.color, border: `1px solid ${sev.border}` }}>{sev.label}</span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-white/5 border border-white/10" style={{ color: ver.color }}>{ver.icon} {ver.label}</span>
              {cat && <span className="text-xs text-white/40">{cat.emoji} {cat.label}</span>}
            </div>
            <h3 className="font-bold text-white text-sm leading-snug">{alert.title}</h3>
          </div>
          <div className="flex-shrink-0 flex items-center gap-1.5">
            <div className="text-center">
              <div className="text-lg font-black" style={{ color: scoreColor }}>{score}</div>
              <div className="text-xs text-white/30 leading-none">score</div>
            </div>
            {onDismiss && (
              <button onClick={onDismiss} className="p-1 rounded-lg text-white/20 hover:text-white/60 hover:bg-white/5 transition-all">
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* AI Summary */}
        <p className="text-xs text-white/70 mb-3 leading-relaxed">{alert.aiSummary}</p>
        {alert.isAiGenerated && (
          <p className="text-xs text-white/30 mb-2 italic">⚠ AI Summary — Please verify through official sources before taking action.</p>
        )}

        {/* Meta */}
        <div className="flex items-center gap-3 text-xs text-white/35 mb-3">
          <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{alert.location}</span>
          <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{new Date(alert.publishedAt).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}</span>
          {alert.sources.length > 0 && <span>Source: {alert.sources[0]}</span>}
        </div>

        {/* Expand toggle */}
        <button onClick={() => setExpanded(e => !e)}
          className="flex items-center gap-1.5 text-xs text-violet-400 hover:text-violet-300 transition-colors font-medium">
          <Bot className="w-3.5 h-3.5" />
          {expanded ? "Less" : "AI Explanation"}
          {expanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
        </button>

        <AnimatePresence>
          {expanded && (
            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
              <div className="mt-3 pt-3 border-t border-white/8 space-y-2">
                {[
                  { q: "What happened?", a: alert.whatHappened },
                  { q: "Why it matters?", a: alert.whyItMatters },
                  { q: "Who is affected?", a: alert.whoAffected },
                  { q: "Recommended action?", a: alert.recommendedAction },
                ].map(({ q, a }) => (
                  <div key={q} className="flex gap-2">
                    <span className="text-xs text-violet-400 font-semibold flex-shrink-0 w-32">{q}</span>
                    <span className="text-xs text-white/60">{a}</span>
                  </div>
                ))}
                <div className="mt-2 pt-2 border-t border-white/5">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs text-white/30">Verification:</span>
                    <span className="text-xs font-medium" style={{ color: ver.color }}>{ver.icon} {ver.label}</span>
                    <span className="text-xs text-white/25">— {ver.desc}</span>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function AlertNetwork() {
  const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");
  const api = (path: string) => `${BASE}/api${path}`;

  // Location
  const [country] = useState("India");
  const [state, setState] = useState("");
  const [city, setCity] = useState("");
  const [area, setArea] = useState("");

  // Level & category
  const [level, setLevel] = useState<AlertLevel>("city");
  const [category, setCategory] = useState<AlertCategory>("all");

  // Feed
  const [feed, setFeed] = useState<FeedResult | null>(null);
  const [feedLoading, setFeedLoading] = useState(false);
  const [dismissedIds, setDismissedIds] = useState<Set<string>>(new Set());

  // Daily brief
  const [brief, setBrief] = useState<DailyBrief | null>(null);
  const [briefLoading, setBriefLoading] = useState(false);

  // Forecast
  const [forecast, setForecast] = useState<ForecastResult | null>(null);
  const [forecastLoading, setForecastLoading] = useState(false);

  // Community
  const [commReports, setCommReports] = useState<CommunityReport[]>([]);
  const [commLocation, setCommLocation] = useState("");
  const [commDesc, setCommDesc] = useState("");
  const [commCategory, setCommCategory] = useState("general");
  const [commSubmitting, setCommSubmitting] = useState(false);
  const [commSuccess, setCommSuccess] = useState(false);
  const [commOpen, setCommOpen] = useState(false);

  // Watchlist
  const [watchlist, setWatchlist] = useState<WatchlistEntry[]>([]);
  const [wlInput, setWlInput] = useState("");
  const [wlAdding, setWlAdding] = useState(false);

  // Tabs
  const [rightTab, setRightTab] = useState<"brief" | "forecast" | "community" | "watchlist">("brief");

  // Search
  const [locationInput, setLocationInput] = useState("");

  const loadFeed = useCallback(async (lvl = level, cat = category) => {
    setFeedLoading(true);
    try {
      const params = new URLSearchParams({ country, state, city: city || locationInput, area, level: lvl, category: cat });
      const r = await fetch(api(`/alert-network/feed?${params}`));
      if (r.ok) setFeed(await r.json());
    } catch {}
    finally { setFeedLoading(false); }
  }, [country, state, city, area, level, category, locationInput]);

  const loadBrief = useCallback(async () => {
    setBriefLoading(true);
    try {
      const r = await fetch(api("/alert-network/brief"), { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ country, state, city: city || locationInput, area }) });
      if (r.ok) setBrief(await r.json());
    } catch {}
    finally { setBriefLoading(false); }
  }, [country, state, city, area, locationInput]);

  const loadForecast = useCallback(async () => {
    setForecastLoading(true);
    try {
      const r = await fetch(api("/alert-network/forecast"), { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ country, state, city: city || locationInput }) });
      if (r.ok) setForecast(await r.json());
    } catch {}
    finally { setForecastLoading(false); }
  }, [country, state, city, locationInput]);

  const loadCommunity = useCallback(async () => {
    try {
      const loc = city || locationInput || state || country;
      const r = await fetch(api(`/alert-network/community?location=${encodeURIComponent(loc)}`));
      if (r.ok) { const d = await r.json(); setCommReports(d.reports || []); }
    } catch {}
  }, [country, state, city, locationInput]);

  const loadWatchlist = useCallback(async () => {
    try {
      const r = await fetch(api("/alert-network/watchlist"));
      if (r.ok) { const d = await r.json(); setWatchlist(d.watchlist || []); }
    } catch {}
  }, []);

  useEffect(() => { loadFeed(); loadBrief(); loadForecast(); loadCommunity(); loadWatchlist(); }, []);

  async function submitCommunity() {
    if (!commDesc.trim() || !commLocation.trim()) return;
    setCommSubmitting(true);
    try {
      const r = await fetch(api("/alert-network/community"), {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ location: commLocation, description: commDesc, category: commCategory }),
      });
      if (r.ok) { setCommSuccess(true); setCommDesc(""); setCommLocation(""); setCommCategory("general"); loadCommunity(); setTimeout(() => setCommSuccess(false), 3000); }
    } finally { setCommSubmitting(false); }
  }

  async function addToWatchlist() {
    if (!wlInput.trim()) return;
    setWlAdding(true);
    try {
      const r = await fetch(api("/alert-network/watchlist"), {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ location: wlInput.trim(), label: wlInput.trim(), categories: ["student", "scam", "weather", "traffic"] }),
      });
      if (r.ok) { setWlInput(""); loadWatchlist(); }
    } finally { setWlAdding(false); }
  }

  async function removeFromWatchlist(id: string) {
    await fetch(api(`/alert-network/watchlist/${id}`), { method: "DELETE" }).catch(() => {});
    setWatchlist(p => p.filter(w => w.id !== id));
  }

  function handleSearch() {
    setCity(locationInput);
    loadFeed(level, category);
    loadBrief();
    loadForecast();
    loadCommunity();
  }

  const visibleAlerts = (feed?.alerts ?? []).filter(a => !dismissedIds.has(a.id));
  const stats = feed?.stats ?? { activeAlerts: 0, localSignals: 0, nationalAlerts: 0, riskReports: 0 };

  const riskColor = (level: string) => ({ low: "#34d399", moderate: "#fbbf24", elevated: "#f97316", high: "#ef4444" }[level] ?? "#60a5fa");

  return (
    <div className="min-h-screen bg-[#05000a] text-white">
      {/* Legal Disclaimer Banner */}
      <div className="bg-amber-500/10 border-b border-amber-500/20 px-4 py-2">
        <p className="text-xs text-amber-300/80 text-center max-w-4xl mx-auto">
          <span className="font-bold">⚠ AI-Generated Intelligence Notice</span> — Some insights, summaries, predictions, and risk assessments are generated by AI. Always verify important information through official sources before taking action. Nexora does not guarantee accuracy and is not responsible for decisions made based on this information.
        </p>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">

        {/* ── Hero ─────────────────────────────────────────────────────────── */}
        <div className="relative rounded-3xl overflow-hidden border border-violet-500/20 bg-gradient-to-br from-[#0d0020] via-[#120025] to-[#06000f]">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,rgba(124,58,237,0.12),transparent_60%)]" />
          <div className="relative p-6 md:p-8">
            <div className="flex flex-col lg:flex-row items-center gap-8">
              <div className="flex-shrink-0">
                <RadarAnimation activeAlerts={stats.activeAlerts} />
              </div>
              <div className="flex-1 text-center lg:text-left">
                <div className="flex items-center gap-2 justify-center lg:justify-start mb-2">
                  <span className="text-xs px-3 py-1 rounded-full bg-red-500/15 border border-red-500/30 text-red-400 font-bold tracking-widest uppercase animate-pulse">● Live</span>
                </div>
                <h1 className="text-3xl md:text-4xl font-black tracking-tight text-white mb-2">
                  🚨 Alert Network
                </h1>
                <p className="text-lg text-violet-300 font-medium mb-1">Know what matters before everyone else.</p>
                <p className="text-sm text-white/40 mb-6 max-w-lg">AI-powered public awareness — monitors risks, scams, student notices, weather, traffic, civic issues and important local/national developments.</p>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {[
                    { label: "Active Alerts", value: stats.activeAlerts, color: "#ef4444" },
                    { label: "Local Signals", value: stats.localSignals, color: "#f97316" },
                    { label: "National Alerts", value: stats.nationalAlerts, color: "#a78bfa" },
                    { label: "AI Risk Reports", value: stats.riskReports, color: "#34d399" },
                  ].map(s => (
                    <div key={s.label} className="text-center p-3 rounded-2xl bg-white/4 border border-white/8">
                      <div className="text-2xl font-black" style={{ color: s.color }}>{s.value}</div>
                      <div className="text-xs text-white/40 mt-0.5">{s.label}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ── Location & Controls ───────────────────────────────────────────── */}
        <div className="rounded-2xl border border-white/8 bg-black/30 p-5">
          <h2 className="text-sm font-bold text-white/60 uppercase tracking-widest mb-4">📍 Your Location Context</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
            <div>
              <label className="text-xs text-white/40 mb-1 block">Country</label>
              <input value={country} readOnly className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white/60" />
            </div>
            <div>
              <label className="text-xs text-white/40 mb-1 block">State</label>
              <select value={state} onChange={e => setState(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-violet-500/50 transition-colors">
                <option value="">— Select State —</option>
                {INDIA_STATES.map(s => <option key={s} value={s} className="bg-[#0d0010]">{s}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs text-white/40 mb-1 block">City</label>
              <input value={city} onChange={e => setCity(e.target.value)}
                placeholder="e.g. Delhi, Pune, Lucknow"
                className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-violet-500/50 transition-colors" />
            </div>
            <div>
              <label className="text-xs text-white/40 mb-1 block">Area / Neighborhood</label>
              <input value={area} onChange={e => setArea(e.target.value)}
                placeholder="e.g. Nangloi, Koramangala"
                className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-violet-500/50 transition-colors" />
            </div>
          </div>
          <div className="flex gap-3 flex-wrap">
            <div className="flex-1 min-w-48 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30 pointer-events-none" />
              <input value={locationInput} onChange={e => setLocationInput(e.target.value)}
                onKeyDown={e => e.key === "Enter" && handleSearch()}
                placeholder="Quick search any location, topic, or area…"
                className="w-full bg-white/5 border border-white/10 rounded-xl pl-9 pr-3 py-2 text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-violet-500/50 transition-colors" />
            </div>
            <button onClick={handleSearch} disabled={feedLoading}
              className="flex items-center gap-2 px-5 py-2 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-sm font-medium transition-colors disabled:opacity-60">
              {feedLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Radio className="w-4 h-4" />}
              Scan for Alerts
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          {/* ── Left: Feed ───────────────────────────────────────────────────── */}
          <div className="xl:col-span-2 space-y-4">

            {/* Intelligence Level Tabs */}
            <div className="flex gap-1 bg-white/3 p-1 rounded-2xl border border-white/8">
              {LEVELS.map(l => (
                <button key={l.id} onClick={() => { setLevel(l.id); loadFeed(l.id, category); }}
                  className={`flex-1 py-2.5 px-3 rounded-xl text-xs font-bold transition-all ${level === l.id ? "bg-violet-600 text-white shadow-lg shadow-violet-500/20" : "text-white/40 hover:text-white/70"}`}
                  title={l.desc}>
                  {l.label}
                </button>
              ))}
            </div>

            {/* Category Filter */}
            <div className="flex gap-2 flex-wrap">
              {CATEGORIES.map(c => (
                <button key={c.id} onClick={() => { setCategory(c.id); loadFeed(level, c.id); }}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition-all border ${
                    category === c.id
                      ? "border-violet-500/40 bg-violet-500/15 text-white"
                      : "border-white/8 bg-white/3 text-white/40 hover:text-white/70"
                  }`}>
                  <span>{c.emoji}</span> {c.label}
                </button>
              ))}
            </div>

            {/* Feed Header */}
            <div className="flex items-center justify-between">
              <h2 className="font-bold text-white">
                {feedLoading ? "Scanning alerts…" : `${visibleAlerts.length} Alerts`}
                <span className="ml-2 text-xs text-white/30">{level === "area" ? "Hyperlocal" : level === "city" ? "City-wide" : level === "state" ? "State" : "National"}</span>
              </h2>
              <button onClick={() => loadFeed()} disabled={feedLoading}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs text-white/50 hover:text-white border border-white/8 hover:border-white/20 transition-all">
                <RefreshCw className={`w-3.5 h-3.5 ${feedLoading ? "animate-spin" : ""}`} /> Refresh
              </button>
            </div>

            {/* Alert Feed */}
            {feedLoading && !feed && (
              <div className="space-y-3">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="h-36 rounded-2xl bg-white/3 border border-white/6 animate-pulse" />
                ))}
              </div>
            )}

            <AnimatePresence mode="popLayout">
              {visibleAlerts.length > 0 ? (
                <div className="space-y-3">
                  {visibleAlerts.map(a => (
                    <AlertCard key={a.id} alert={a} onDismiss={() => setDismissedIds(s => new Set([...s, a.id]))} />
                  ))}
                </div>
              ) : !feedLoading && (
                <div className="text-center py-12 text-white/30">
                  <Radio className="w-10 h-10 mx-auto mb-3 opacity-30" />
                  <p className="font-medium">No alerts found for this filter</p>
                  <p className="text-sm mt-1">Try a different location or click Scan for Alerts</p>
                </div>
              )}
            </AnimatePresence>

            {/* Alert Timeline Indicator */}
            {feed && (
              <div className="rounded-2xl border border-white/6 bg-white/2 p-4">
                <h3 className="text-xs font-bold text-white/40 uppercase tracking-widest mb-3 flex items-center gap-2"><Clock className="w-3.5 h-3.5" /> Alert Timeline</h3>
                <div className="flex gap-4 text-xs text-white/40">
                  {["Now", "Today", "This Week", "This Month"].map((t, i) => (
                    <button key={t} className={`py-1 px-2 rounded-lg border transition-all ${i === 0 ? "border-violet-500/30 bg-violet-500/10 text-violet-400" : "border-transparent hover:border-white/10"}`}>{t}</button>
                  ))}
                </div>
                <p className="text-xs text-white/25 mt-2">Feed updated: {feed.generatedAt ? new Date(feed.generatedAt).toLocaleTimeString("en-IN") : "—"}</p>
              </div>
            )}
          </div>

          {/* ── Right: Panels ─────────────────────────────────────────────────── */}
          <div className="space-y-4">
            {/* Panel Tabs */}
            <div className="flex gap-1 bg-white/3 p-1 rounded-2xl border border-white/8">
              {([
                { id: "brief", label: "Daily Brief", icon: FileText },
                { id: "forecast", label: "Forecast", icon: TrendingUp },
                { id: "community", label: "Reports", icon: Users },
                { id: "watchlist", label: "Watchlist", icon: Star },
              ] as const).map(t => (
                <button key={t.id} onClick={() => setRightTab(t.id)}
                  className={`flex-1 py-2 px-1 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1 ${rightTab === t.id ? "bg-violet-600 text-white" : "text-white/40 hover:text-white/70"}`}>
                  <t.icon className="w-3 h-3" /> {t.label}
                </button>
              ))}
            </div>

            {/* Daily Brief Panel */}
            <AnimatePresence mode="wait">
              {rightTab === "brief" && (
                <motion.div key="brief" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="rounded-2xl border border-white/8 bg-black/30 p-5 space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="font-bold text-white flex items-center gap-2"><FileText className="w-4 h-4 text-violet-400" /> AI Daily Brief</h3>
                    <button onClick={loadBrief} disabled={briefLoading} className="text-xs text-white/40 hover:text-white p-1.5 rounded-lg hover:bg-white/5 transition-all">
                      <RefreshCw className={`w-3.5 h-3.5 ${briefLoading ? "animate-spin" : ""}`} />
                    </button>
                  </div>

                  {briefLoading && !brief && (
                    <div className="space-y-2">{[...Array(4)].map((_, i) => <div key={i} className="h-8 rounded-xl bg-white/5 animate-pulse" />)}</div>
                  )}

                  {brief && (
                    <div className="space-y-3">
                      <div className="p-3 rounded-xl bg-violet-500/8 border border-violet-500/15">
                        <p className="text-sm font-bold text-violet-300">{brief.greeting}</p>
                        <p className="text-2xl mt-1">{brief.mood}</p>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div className="p-2.5 rounded-xl bg-white/4 border border-white/8 text-center">
                          <div className="text-xl font-black text-orange-400">{brief.localAlerts}</div>
                          <div className="text-xs text-white/40">Local Alerts</div>
                        </div>
                        <div className="p-2.5 rounded-xl bg-white/4 border border-white/8 text-center">
                          <div className="text-xl font-black text-violet-400">{brief.nationalAlerts}</div>
                          <div className="text-xs text-white/40">National</div>
                        </div>
                      </div>
                      {brief.severeRisks && <div className="p-2.5 rounded-xl bg-red-500/10 border border-red-500/20 text-xs text-red-400 font-medium flex items-center gap-2"><AlertTriangle className="w-3.5 h-3.5" /> Severe risk active — stay informed</div>}
                      {[
                        { icon: "🌤", label: "Weather", val: brief.weatherStatus },
                        { icon: "🚦", label: "Traffic", val: brief.trafficStatus },
                        brief.examAlert ? { icon: "🎓", label: "Exam Alert", val: brief.examAlert } : null,
                        brief.scamAlert ? { icon: "💰", label: "Scam Watch", val: brief.scamAlert } : null,
                        { icon: "💡", label: "Today's Advice", val: brief.advice },
                      ].filter(Boolean).map(item => (
                        <div key={item!.label} className="flex gap-2.5 text-xs">
                          <span className="flex-shrink-0 text-base">{item!.icon}</span>
                          <div>
                            <span className="text-white/40 font-semibold">{item!.label}: </span>
                            <span className="text-white/70">{item!.val}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </motion.div>
              )}

              {/* Risk Forecast Panel */}
              {rightTab === "forecast" && (
                <motion.div key="forecast" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="rounded-2xl border border-white/8 bg-black/30 p-5 space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="font-bold text-white flex items-center gap-2"><TrendingUp className="w-4 h-4 text-violet-400" /> AI Risk Forecast</h3>
                    <button onClick={loadForecast} disabled={forecastLoading} className="text-xs text-white/40 hover:text-white p-1.5 rounded-lg hover:bg-white/5 transition-all">
                      <RefreshCw className={`w-3.5 h-3.5 ${forecastLoading ? "animate-spin" : ""}`} />
                    </button>
                  </div>

                  {forecastLoading && !forecast && (
                    <div className="space-y-2">{[...Array(3)].map((_, i) => <div key={i} className="h-16 rounded-xl bg-white/5 animate-pulse" />)}</div>
                  )}

                  {forecast && (
                    <div className="space-y-3">
                      <div className="p-3 rounded-xl border text-center" style={{ borderColor: `${riskColor(forecast.overallRiskLevel)}33`, background: `${riskColor(forecast.overallRiskLevel)}10` }}>
                        <div className="text-xs text-white/40 mb-0.5">Overall Risk</div>
                        <div className="text-base font-black uppercase" style={{ color: riskColor(forecast.overallRiskLevel) }}>{forecast.overallRiskLevel}</div>
                        <div className="text-xs text-white/50 mt-1">{forecast.overallRiskReason}</div>
                      </div>
                      {forecast.forecasts.map((f, i) => (
                        <div key={i} className="p-3 rounded-xl bg-white/3 border border-white/6">
                          <div className="flex items-start justify-between gap-2 mb-1.5">
                            <span className="text-sm font-semibold text-white flex items-center gap-1.5">{f.emoji} {f.category}</span>
                            <div className="text-right flex-shrink-0">
                              <div className="text-xs font-black text-violet-400">{f.confidence}%</div>
                              <div className="text-xs text-white/30">{f.timeframe}</div>
                            </div>
                          </div>
                          <p className="text-xs text-white/65 mb-1">{f.prediction}</p>
                          <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                            <div className="h-full bg-violet-500 rounded-full transition-all" style={{ width: `${f.confidence}%` }} />
                          </div>
                          <p className="text-xs text-white/30 mt-1 italic">{f.reason}</p>
                        </div>
                      ))}
                      <p className="text-xs text-white/25 text-center">Updated: {new Date(forecast.generatedAt).toLocaleTimeString("en-IN")}</p>
                    </div>
                  )}
                </motion.div>
              )}

              {/* Community Reports Panel */}
              {rightTab === "community" && (
                <motion.div key="community" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="rounded-2xl border border-white/8 bg-black/30 p-5 space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="font-bold text-white flex items-center gap-2"><Users className="w-4 h-4 text-violet-400" /> Community Reports</h3>
                    <button onClick={() => setCommOpen(o => !o)}
                      className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white font-medium transition-colors">
                      <Plus className="w-3.5 h-3.5" /> Submit
                    </button>
                  </div>

                  <AnimatePresence>
                    {commOpen && (
                      <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                        <div className="space-y-2 pb-3 border-b border-white/8">
                          <input value={commLocation} onChange={e => setCommLocation(e.target.value)} placeholder="Location (e.g. Nangloi, Delhi)"
                            className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs text-white placeholder:text-white/20 focus:outline-none focus:border-violet-500/50" />
                          <textarea value={commDesc} onChange={e => setCommDesc(e.target.value)} placeholder="Describe what you observed… (road damage, power cut, suspicious activity, local issue…)"
                            rows={3} className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs text-white placeholder:text-white/20 focus:outline-none focus:border-violet-500/50 resize-none" />
                          <select value={commCategory} onChange={e => setCommCategory(e.target.value)}
                            className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-violet-500/50">
                            <option value="general" className="bg-[#0d0010]">General</option>
                            <option value="traffic" className="bg-[#0d0010]">Traffic / Road</option>
                            <option value="utility" className="bg-[#0d0010]">Utility / Power / Water</option>
                            <option value="public" className="bg-[#0d0010]">Civic / Public Issue</option>
                            <option value="health" className="bg-[#0d0010]">Health / Safety</option>
                            <option value="scam" className="bg-[#0d0010]">Suspicious / Scam Alert</option>
                          </select>
                          <div className="text-xs text-white/30 italic">AI will categorize & assign confidence. Duplicate reports are detected automatically.</div>
                          {commSuccess && <div className="flex items-center gap-1.5 text-xs text-green-400 font-medium"><CheckCircle2 className="w-3.5 h-3.5" /> Report submitted! AI processing…</div>}
                          <button onClick={submitCommunity} disabled={commSubmitting || !commDesc.trim() || !commLocation.trim()}
                            className="w-full flex items-center justify-center gap-2 py-2 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-xs font-bold transition-colors disabled:opacity-50">
                            {commSubmitting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                            Submit Report
                          </button>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  <div className="space-y-2 max-h-80 overflow-y-auto">
                    {commReports.length === 0 && (
                      <p className="text-xs text-white/30 text-center py-4">No community reports yet. Be the first to report!</p>
                    )}
                    {commReports.map(r => (
                      <div key={r.id} className="p-3 rounded-xl bg-white/3 border border-white/6">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <span className="text-xs px-2 py-0.5 rounded-full bg-blue-500/15 border border-blue-500/20 text-blue-400 font-medium">👥 Community</span>
                          {r.isDuplicate && <span className="text-xs text-white/30">Similar report exists</span>}
                          <span className="text-xs text-white/30 ml-auto">Confidence: {r.confidence}%</span>
                        </div>
                        <div className="flex items-center gap-1.5 mb-1">
                          <MapPin className="w-3 h-3 text-violet-400 flex-shrink-0" />
                          <span className="text-xs text-violet-300 font-medium">{r.location}</span>
                          <span className="text-xs text-white/25">• {r.category}</span>
                        </div>
                        <p className="text-xs text-white/65">{r.description}</p>
                        <p className="text-xs text-white/25 mt-1">{new Date(r.reportedAt).toLocaleString("en-IN")}</p>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}

              {/* Watchlist Panel */}
              {rightTab === "watchlist" && (
                <motion.div key="watchlist" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="rounded-2xl border border-white/8 bg-black/30 p-5 space-y-4">
                  <h3 className="font-bold text-white flex items-center gap-2"><Bell className="w-4 h-4 text-violet-400" /> Smart Watchlist</h3>
                  <p className="text-xs text-white/35">Follow locations to get relevant alerts — My Area, City, Exam Zone, etc.</p>
                  <div className="flex gap-2">
                    <input value={wlInput} onChange={e => setWlInput(e.target.value)}
                      onKeyDown={e => e.key === "Enter" && addToWatchlist()}
                      placeholder="Add a location to watch…"
                      className="flex-1 bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs text-white placeholder:text-white/20 focus:outline-none focus:border-violet-500/50" />
                    <button onClick={addToWatchlist} disabled={wlAdding || !wlInput.trim()}
                      className="px-3 py-2 rounded-xl bg-violet-600 hover:bg-violet-500 text-white transition-colors disabled:opacity-50">
                      {wlAdding ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                    </button>
                  </div>
                  <div className="space-y-2">
                    {watchlist.length === 0 && <p className="text-xs text-white/30 text-center py-3">No locations watched yet. Add areas you care about.</p>}
                    {watchlist.map(w => (
                      <div key={w.id} className="flex items-center gap-2 p-2.5 rounded-xl bg-white/3 border border-white/6">
                        <MapPin className="w-3.5 h-3.5 text-violet-400 flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <div className="text-xs font-semibold text-white truncate">{w.label}</div>
                          <div className="text-xs text-white/30">{w.categories.slice(0, 3).join(", ")}</div>
                        </div>
                        <button onClick={() => removeFromWatchlist(w.id)} className="text-white/20 hover:text-red-400 transition-colors p-1">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>

                  {/* Category subscriptions */}
                  <div>
                    <h4 className="text-xs font-bold text-white/40 uppercase tracking-widest mb-2">Alert Categories to Follow</h4>
                    <div className="flex flex-wrap gap-2">
                      {CATEGORIES.filter(c => c.id !== "all").map(c => (
                        <div key={c.id} className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border border-white/8 bg-white/3 text-xs text-white/50">
                          {c.emoji} {c.label}
                        </div>
                      ))}
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Quick Categories Reference */}
            <div className="rounded-2xl border border-white/6 bg-black/20 p-4">
              <h3 className="text-xs font-bold text-white/40 uppercase tracking-widest mb-3 flex items-center gap-2"><Shield className="w-3.5 h-3.5" /> Alert Categories</h3>
              <div className="space-y-2">
                {CATEGORIES.filter(c => c.id !== "all").map(c => (
                  <div key={c.id} className="flex items-center gap-2.5 text-xs">
                    <span className="text-base flex-shrink-0">{c.emoji}</span>
                    <span className="text-white/60 font-medium">{c.label}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* ── Bottom Disclaimer ─────────────────────────────────────────────── */}
        <div className="rounded-2xl border border-amber-500/15 bg-amber-500/5 p-5">
          <h3 className="flex items-center gap-2 text-amber-400 font-bold text-sm mb-2"><Info className="w-4 h-4" /> AI-Generated Intelligence Notice</h3>
          <p className="text-xs text-amber-300/60 leading-relaxed">
            Some insights, summaries, predictions, classifications, and risk assessments on this page are generated by AI. Always verify important information through official sources before taking action. Community reports have not been independently verified. Nexora does not guarantee completeness or accuracy and is not responsible for decisions made based on this information.
          </p>
        </div>
      </div>
    </div>
  );
}
