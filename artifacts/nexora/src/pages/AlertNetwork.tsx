import React, { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  GraduationCap, BadgeDollarSign, CloudRain, TrafficCone, Landmark,
  Zap, Activity, Search, RefreshCw, Plus, Trash2, X, ChevronDown,
  ChevronRight, CheckCircle2, Clock, Users, Send, Bot, Bell,
  Info, Shield, MapPin, Loader2, Radio, TrendingUp, FileText,
  TrendingDown, AlertTriangle, Flame, Wind, DropletIcon, Megaphone,
  Star, Settings2, ExternalLink, Eye, MessageSquare, BookOpen,
} from "lucide-react";

// ── Types ─────────────────────────────────────────────────────────────────────
type AlertCat = "all" | "student" | "scam" | "weather" | "traffic" | "public" | "utility" | "health" | "general";
type AlertLevel = "area" | "city" | "state" | "national";

interface AlertItem {
  id: string; title: string; category: AlertCat; level: AlertLevel;
  location: string; severity: "critical" | "high" | "medium" | "low";
  importanceScore: number; aiSummary: string;
  whatHappened: string; whyItMatters: string; whoAffected: string;
  recommendedAction: string;
  verificationStatus: "verified" | "likely" | "community" | "developing";
  sources: string[]; publishedAt: string; isAiGenerated: boolean;
}
interface FeedResult {
  alerts: AlertItem[];
  stats: { activeAlerts: number; localSignals: number; nationalAlerts: number; riskReports: number };
  generatedAt: string;
}
interface DailyBrief {
  greeting: string; localAlerts: number; nationalAlerts: number; severeRisks: boolean;
  weatherStatus: string; topAlert: string; trafficStatus: string;
  examAlert: string; scamAlert: string; mood: string; advice: string; generatedAt: string;
}
interface ForecastItem { category: string; emoji: string; prediction: string; confidence: number; timeframe: string; reason: string; severity: string }
interface ForecastResult { forecasts: ForecastItem[]; overallRiskLevel: string; overallRiskReason: string; generatedAt: string }
interface CommunityReport { id: string; location: string; description: string; category: string; confidence: number; reportedAt: string; isDuplicate: boolean }
interface WatchlistEntry { id: string; label: string; location: string; categories: string[]; addedAt: string }

// ── Config ────────────────────────────────────────────────────────────────────
const CATS: { id: AlertCat; label: string; emoji: string }[] = [
  { id: "all", label: "All Alerts", emoji: "🔔" },
  { id: "student", label: "Student", emoji: "🎓" },
  { id: "scam", label: "Scam & Fraud", emoji: "💰" },
  { id: "weather", label: "Weather", emoji: "🌧" },
  { id: "traffic", label: "Traffic", emoji: "🚦" },
  { id: "public", label: "Public Notices", emoji: "🏛" },
  { id: "health", label: "Health", emoji: "🏥" },
  { id: "utility", label: "Utilities", emoji: "⚡" },
];

const LEVELS: { id: AlertLevel; label: string }[] = [
  { id: "area", label: "My Area" }, { id: "city", label: "City" },
  { id: "state", label: "State" }, { id: "national", label: "National" },
];

const INDIA_STATES = ["Andhra Pradesh","Assam","Bihar","Chhattisgarh","Delhi","Goa","Gujarat","Haryana","Himachal Pradesh","Jharkhand","Karnataka","Kerala","Madhya Pradesh","Maharashtra","Manipur","Meghalaya","Mizoram","Nagaland","Odisha","Punjab","Rajasthan","Sikkim","Tamil Nadu","Telangana","Tripura","Uttar Pradesh","Uttarakhand","West Bengal"];

const CAT_META: Record<string, { color: string; bg: string; ring: string; Icon: React.ElementType; badge: string }> = {
  student:  { color: "#60a5fa", bg: "rgba(96,165,250,0.15)", ring: "#60a5fa", Icon: GraduationCap, badge: "STUDENT ALERT" },
  scam:     { color: "#f59e0b", bg: "rgba(245,158,11,0.15)", ring: "#f59e0b", Icon: BadgeDollarSign, badge: "SCAM ALERT" },
  weather:  { color: "#34d399", bg: "rgba(52,211,153,0.15)", ring: "#34d399", Icon: CloudRain, badge: "WEATHER WARNING" },
  traffic:  { color: "#818cf8", bg: "rgba(129,140,248,0.15)", ring: "#818cf8", Icon: TrafficCone, badge: "TRAFFIC UPDATE" },
  public:   { color: "#c084fc", bg: "rgba(192,132,252,0.15)", ring: "#c084fc", Icon: Landmark, badge: "PUBLIC NOTICE" },
  utility:  { color: "#fbbf24", bg: "rgba(251,191,36,0.15)", ring: "#fbbf24", Icon: Zap, badge: "UTILITY ALERT" },
  health:   { color: "#f472b6", bg: "rgba(244,114,182,0.15)", ring: "#f472b6", Icon: Activity, badge: "HEALTH ALERT" },
  general:  { color: "#a78bfa", bg: "rgba(167,139,250,0.15)", ring: "#a78bfa", Icon: Bell, badge: "GENERAL ALERT" },
};

const SEV_COLOR: Record<string, string> = {
  critical: "#ef4444", high: "#f97316", medium: "#f59e0b", low: "#60a5fa",
};
const SEV_LABEL: Record<string, string> = {
  critical: "CRITICAL", high: "HIGH", medium: "MODERATE", low: "LOW",
};
const VER_META = {
  verified:   { label: "Verified", color: "#34d399", icon: "✅" },
  likely:     { label: "Likely", color: "#fbbf24", icon: "🟡" },
  community:  { label: "Community", color: "#60a5fa", icon: "👥" },
  developing: { label: "Developing", color: "#a78bfa", icon: "🔄" },
};

// ── Radar Visualization ───────────────────────────────────────────────────────
function LiveRadar({ alerts }: { alerts: AlertItem[] }) {
  const [angle, setAngle] = useState(0);
  const [blips, setBlips] = useState<{ x: number; y: number; color: string; size: number }[]>([]);

  useEffect(() => {
    const t = setInterval(() => setAngle(a => (a + 1.5) % 360), 30);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    const generated = alerts.slice(0, 12).map((a, i) => {
      const r = 20 + (i * 7) % 55;
      const theta = ((i * 137.5) % 360) * Math.PI / 180;
      const color = CAT_META[a.category]?.color ?? "#a78bfa";
      return { x: 50 + r * Math.cos(theta), y: 50 + r * Math.sin(theta), color, size: a.severity === "critical" ? 4 : a.severity === "high" ? 3 : 2.5 };
    });
    const fixed = [
      { x: 62, y: 38, color: "#ef4444", size: 4.5 }, { x: 35, y: 58, color: "#f97316", size: 3.5 },
      { x: 72, y: 65, color: "#f59e0b", size: 3 }, { x: 28, y: 32, color: "#60a5fa", size: 2.5 },
      { x: 55, y: 75, color: "#34d399", size: 2.5 }, { x: 42, y: 45, color: "#f97316", size: 3 },
    ];
    setBlips([...fixed, ...generated]);
  }, [alerts]);

  const rad = (angle * Math.PI) / 180;

  return (
    <div className="relative">
      <svg viewBox="0 0 100 100" className="w-full" style={{ height: 180 }}>
        <defs>
          <radialGradient id="rg1" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#1e1040" stopOpacity="0.9" />
            <stop offset="100%" stopColor="#080815" stopOpacity="1" />
          </radialGradient>
          <radialGradient id="sweep" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#7c3aed" stopOpacity="0.5" />
            <stop offset="100%" stopColor="#7c3aed" stopOpacity="0" />
          </radialGradient>
          <clipPath id="radarClip"><circle cx="50" cy="50" r="47" /></clipPath>
        </defs>
        <circle cx="50" cy="50" r="47" fill="url(#rg1)" stroke="#3b1a6b" strokeWidth="0.5" />
        {[14, 28, 42].map(r => <circle key={r} cx="50" cy="50" r={r} fill="none" stroke="#2d1a5a" strokeWidth="0.4" />)}
        <line x1="50" y1="3" x2="50" y2="97" stroke="#2d1a5a" strokeWidth="0.3" />
        <line x1="3" y1="50" x2="97" y2="50" stroke="#2d1a5a" strokeWidth="0.3" />
        <line x1="18" y1="18" x2="82" y2="82" stroke="#2d1a5a" strokeWidth="0.2" />
        <line x1="82" y1="18" x2="18" y2="82" stroke="#2d1a5a" strokeWidth="0.2" />
        <g clipPath="url(#radarClip)">
          <path
            d={`M 50 50 L ${50 + 46 * Math.cos(rad - 0.8)} ${50 + 46 * Math.sin(rad - 0.8)} A 46 46 0 0 1 ${50 + 46 * Math.cos(rad)} ${50 + 46 * Math.sin(rad)} Z`}
            fill="url(#sweep)" />
        </g>
        <line x1="50" y1="50" x2={50 + 46 * Math.cos(rad)} y2={50 + 46 * Math.sin(rad)} stroke="#7c3aed" strokeWidth="0.8" />
        {blips.map((b, i) => (
          <g key={i}>
            <circle cx={b.x} cy={b.y} r={b.size + 2} fill={b.color} opacity="0.15" />
            <circle cx={b.x} cy={b.y} r={b.size} fill={b.color} opacity="0.9">
              <animate attributeName="opacity" values="0.9;0.4;0.9" dur={`${1.5 + (i % 3) * 0.5}s`} repeatCount="indefinite" />
            </circle>
          </g>
        ))}
        <circle cx="50" cy="50" r="2.5" fill="#7c3aed" />
        <circle cx="50" cy="50" r="4.5" fill="none" stroke="#7c3aed" strokeWidth="0.5" opacity="0.5" />
      </svg>
    </div>
  );
}

// ── Score Ring ────────────────────────────────────────────────────────────────
function ScoreRing({ score, severity }: { score: number; severity: string }) {
  const color = SEV_COLOR[severity] ?? "#60a5fa";
  const r = 20, circ = 2 * Math.PI * r;
  const dash = (score / 100) * circ;

  return (
    <div className="relative flex-shrink-0 flex items-center justify-center" style={{ width: 58, height: 58 }}>
      <svg width="58" height="58" viewBox="0 0 58 58" className="absolute inset-0">
        <circle cx="29" cy="29" r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="4" />
        <circle cx="29" cy="29" r={r} fill="none" stroke={color} strokeWidth="4"
          strokeDasharray={`${dash} ${circ}`} strokeLinecap="round"
          transform="rotate(-90 29 29)" style={{ transition: "stroke-dasharray 0.5s ease" }} />
      </svg>
      <div className="text-center relative z-10">
        <div className="text-sm font-black leading-none" style={{ color }}>{score}</div>
        <div className="text-xs leading-none mt-0.5" style={{ color, opacity: 0.7 }}>
          {SEV_LABEL[severity]?.slice(0, 3)}
        </div>
      </div>
    </div>
  );
}

// ── Alert Card ────────────────────────────────────────────────────────────────
function AlertCard({ alert }: { alert: AlertItem }) {
  const [expanded, setExpanded] = useState(false);
  const meta = CAT_META[alert.category] ?? CAT_META.general;
  const Icon = meta.Icon;
  const sev = SEV_COLOR[alert.severity] ?? "#60a5fa";
  const ver = VER_META[alert.verificationStatus] ?? VER_META.developing;

  const timeAgo = (() => {
    const diff = Date.now() - new Date(alert.publishedAt).getTime();
    const m = Math.floor(diff / 60000);
    if (m < 1) return "just now";
    if (m < 60) return `${m} min ago`;
    return `${Math.floor(m / 60)}h ago`;
  })();

  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      className="group relative rounded-2xl border border-white/6 bg-white/2 hover:bg-white/4 hover:border-white/10 transition-all cursor-pointer overflow-hidden"
      onClick={() => setExpanded(e => !e)}
    >
      {/* Severity accent line */}
      <div className="absolute left-0 top-0 bottom-0 w-0.5 rounded-l-full" style={{ background: sev }} />

      <div className="flex items-start gap-4 p-4 pl-5">
        {/* Category icon */}
        <div className="flex-shrink-0 w-11 h-11 rounded-xl flex items-center justify-center" style={{ background: meta.bg, border: `1px solid ${meta.color}30` }}>
          <Icon className="w-5 h-5" style={{ color: meta.color }} />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <span className="text-xs font-bold px-2 py-0.5 rounded-md" style={{ background: `${sev}20`, color: sev, border: `1px solid ${sev}40` }}>
              {SEV_LABEL[alert.severity]}
            </span>
            <span className="text-xs font-bold tracking-wide" style={{ color: meta.color }}>{meta.badge}</span>
          </div>
          <h3 className="font-bold text-white text-sm leading-snug mb-0.5">{alert.title}</h3>
          <div className="flex items-center gap-2 text-xs text-white/35 mb-1.5">
            <MapPin className="w-3 h-3 flex-shrink-0" />
            <span>{alert.location}</span>
            <span className="text-white/20">•</span>
            <span className="uppercase text-xs" style={{ color: meta.color }}>{alert.level}</span>
          </div>
          <p className="text-xs text-white/55 leading-relaxed line-clamp-2">{alert.aiSummary}</p>
          {alert.isAiGenerated && (
            <p className="text-xs text-white/25 mt-1 italic">⚠ AI Summary — Verify through official sources.</p>
          )}
          <AnimatePresence>
            {expanded && (
              <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                <div className="mt-3 pt-3 border-t border-white/6 space-y-1.5">
                  {[
                    ["What happened?", alert.whatHappened],
                    ["Why it matters?", alert.whyItMatters],
                    ["Who is affected?", alert.whoAffected],
                    ["Action?", alert.recommendedAction],
                  ].map(([q, a]) => (
                    <div key={q} className="flex gap-2 text-xs">
                      <span className="text-white/35 font-semibold flex-shrink-0 w-28">{q}</span>
                      <span className="text-white/65">{a}</span>
                    </div>
                  ))}
                  <div className="flex items-center gap-2 pt-1">
                    <span className="text-xs" style={{ color: ver.color }}>{ver.icon} {ver.label}</span>
                    {alert.sources.length > 0 && <span className="text-xs text-white/25">• {alert.sources[0]}</span>}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Score + time */}
        <div className="flex-shrink-0 flex flex-col items-end gap-2">
          <ScoreRing score={alert.importanceScore} severity={alert.severity} />
          <span className="text-xs text-white/30">{timeAgo}</span>
          <ChevronDown className={`w-3.5 h-3.5 text-white/20 transition-transform ${expanded ? "rotate-180" : ""}`} />
        </div>
      </div>
    </motion.div>
  );
}

// ── Stat Card ─────────────────────────────────────────────────────────────────
function StatCard({ label, value, sub, color, trend }: { label: string; value: number | string; sub?: string; color: string; trend?: "up" | "down" }) {
  return (
    <div className="flex-1 rounded-2xl border border-white/6 bg-white/2 p-4 min-w-0">
      <div className="text-xs text-white/40 mb-2 font-medium">{label}</div>
      <div className="flex items-end gap-2">
        <div className="text-3xl font-black leading-none" style={{ color }}>{value}</div>
        {trend && (trend === "up"
          ? <TrendingUp className="w-4 h-4 text-red-400 mb-1" />
          : <TrendingDown className="w-4 h-4 text-green-400 mb-1" />)}
      </div>
      {sub && <div className="text-xs text-white/30 mt-1.5">{sub}</div>}
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function AlertNetwork() {
  const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");
  const api = (path: string) => `${BASE}/api${path}`;

  // Location
  const [country] = useState("India");
  const [stateVal, setStateVal] = useState("Delhi");
  const [city, setCity] = useState("Nangloi");
  const [area, setArea] = useState("");
  const [searchQ, setSearchQ] = useState("");
  const [locOpen, setLocOpen] = useState(false);

  // Level & category
  const [level, setLevel] = useState<AlertLevel>("city");
  const [category, setCategory] = useState<AlertCat>("all");

  // Feed
  const [feed, setFeed] = useState<FeedResult | null>(null);
  const [feedLoading, setFeedLoading] = useState(false);
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());

  // Brief
  const [brief, setBrief] = useState<DailyBrief | null>(null);
  const [briefLoading, setBriefLoading] = useState(false);

  // Forecast / Trending
  const [forecast, setForecast] = useState<ForecastResult | null>(null);
  const [forecastLoading, setForecastLoading] = useState(false);

  // Community
  const [commReports, setCommReports] = useState<CommunityReport[]>([]);
  const [commOpen, setCommOpen] = useState(false);
  const [commLoc, setCommLoc] = useState("");
  const [commDesc, setCommDesc] = useState("");
  const [commCat, setCommCat] = useState("general");
  const [commSubmitting, setCommSubmitting] = useState(false);
  const [commSuccess, setCommSuccess] = useState(false);

  // Watchlist
  const [watchlist, setWatchlist] = useState<WatchlistEntry[]>([]);
  const [wlInput, setWlInput] = useState("");
  const [wlAdding, setWlAdding] = useState(false);

  const focusLoc = city || stateVal || country;

  const loadFeed = useCallback(async (lvl = level, cat = category) => {
    setFeedLoading(true);
    try {
      const q = searchQ || "";
      const params = new URLSearchParams({ country, state: stateVal, city: q || city, area, level: lvl, category: cat });
      const r = await fetch(api(`/alert-network/feed?${params}`));
      if (r.ok) setFeed(await r.json());
    } catch {}
    finally { setFeedLoading(false); }
  }, [country, stateVal, city, area, level, category, searchQ]);

  const loadBrief = useCallback(async () => {
    setBriefLoading(true);
    try {
      const r = await fetch(api("/alert-network/brief"), { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ country, state: stateVal, city }) });
      if (r.ok) setBrief(await r.json());
    } catch {}
    finally { setBriefLoading(false); }
  }, [country, stateVal, city]);

  const loadForecast = useCallback(async () => {
    setForecastLoading(true);
    try {
      const r = await fetch(api("/alert-network/forecast"), { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ country, state: stateVal, city }) });
      if (r.ok) setForecast(await r.json());
    } catch {}
    finally { setForecastLoading(false); }
  }, [country, stateVal, city]);

  const loadCommunity = useCallback(async () => {
    try {
      const r = await fetch(api(`/alert-network/community?location=${encodeURIComponent(focusLoc)}`));
      if (r.ok) { const d = await r.json(); setCommReports(d.reports || []); }
    } catch {}
  }, [focusLoc]);

  const loadWatchlist = useCallback(async () => {
    try {
      const r = await fetch(api("/alert-network/watchlist"));
      if (r.ok) { const d = await r.json(); setWatchlist(d.watchlist || []); }
    } catch {}
  }, []);

  useEffect(() => { loadFeed(); loadBrief(); loadForecast(); loadCommunity(); loadWatchlist(); }, []);

  async function submitCommunity() {
    if (!commDesc.trim() || !commLoc.trim()) return;
    setCommSubmitting(true);
    try {
      const r = await fetch(api("/alert-network/community"), {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ location: commLoc, description: commDesc, category: commCat }),
      });
      if (r.ok) { setCommSuccess(true); setCommDesc(""); setCommLoc(""); loadCommunity(); setTimeout(() => setCommSuccess(false), 3000); }
    } finally { setCommSubmitting(false); }
  }

  async function addWatchlist() {
    if (!wlInput.trim()) return;
    setWlAdding(true);
    try {
      const r = await fetch(api("/alert-network/watchlist"), {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ location: wlInput.trim(), label: wlInput.trim() }),
      });
      if (r.ok) { setWlInput(""); loadWatchlist(); }
    } finally { setWlAdding(false); }
  }

  function handleScan() { loadFeed(); loadBrief(); loadForecast(); loadCommunity(); }

  const alerts = (feed?.alerts ?? []).filter(a => !dismissed.has(a.id));
  const stats = feed?.stats ?? { activeAlerts: 0, localSignals: 0, nationalAlerts: 0, riskReports: 0 };
  const highSeverity = alerts.filter(a => a.severity === "critical" || a.severity === "high").length;

  const aiScore = forecast
    ? ({ low: 25, moderate: 55, elevated: 75, high: 90 }[forecast.overallRiskLevel] ?? 50)
    : 0;

  const riskColor = (l: string) => ({ low: "#34d399", moderate: "#f59e0b", elevated: "#f97316", high: "#ef4444" }[l] ?? "#60a5fa");

  // Trending risks (from forecast or static fallback)
  const trendingRisks: { name: string; level: string }[] = forecast?.forecasts
    ? forecast.forecasts.slice(0, 5).map(f => ({ name: f.category.replace(/\b\w/g, l => l.toUpperCase()) + (f.prediction.length > 30 ? ` — ${f.prediction.slice(0, 30)}…` : ""), level: f.severity }))
    : [
        { name: "UPI Scam", level: "high" },
        { name: "Exam Related Fraud", level: "high" },
        { name: "Fake Job Offers", level: "high" },
        { name: "Investment Scam", level: "medium" },
        { name: "Digital Arrest Scam", level: "medium" },
      ];

  return (
    <div className="min-h-screen bg-[#04000c] text-white flex flex-col">

      {/* ── Top Header ───────────────────────────────────────────────────── */}
      <div className="flex-shrink-0 px-6 pt-6 pb-4 border-b border-white/5">
        <div className="flex items-start justify-between gap-4 mb-5">
          {/* Title */}
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-red-600 to-red-900 flex items-center justify-center flex-shrink-0 shadow-lg shadow-red-900/40">
              <AlertTriangle className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-black tracking-tight leading-none">
                <span className="text-white">NEXORA </span>
                <span className="text-red-500">ALERT</span>
                <span className="text-white"> NETWORK</span>
              </h1>
              <p className="text-xs text-white/40 mt-0.5">Know what matters before everyone else.</p>
            </div>
          </div>

          {/* Location pill + AI Radar active */}
          <div className="flex items-center gap-3 flex-shrink-0">
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/5 border border-white/10 text-xs text-white/60 cursor-pointer hover:bg-white/8 transition-colors" onClick={() => setLocOpen(o => !o)}>
              <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
              <MapPin className="w-3.5 h-3.5 text-violet-400" />
              <span className="font-medium text-white/80">{[city, stateVal, country].filter(Boolean).slice(0, 2).join(", ")}</span>
              <span className="text-white/30">Live</span>
              <ChevronDown className="w-3.5 h-3.5 text-white/30" />
            </div>
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-green-500/10 border border-green-500/20 text-xs text-green-400">
              <Radio className="w-3.5 h-3.5 animate-pulse" />
              <span className="font-medium">AI Radar Active</span>
              <span className="text-green-400/60">Scanning</span>
            </div>
          </div>
        </div>

        {/* Location dropdown */}
        <AnimatePresence>
          {locOpen && (
            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden mb-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 p-4 rounded-2xl bg-white/3 border border-white/8">
                <div>
                  <label className="text-xs text-white/40 mb-1 block">Country</label>
                  <input value={country} readOnly className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs text-white/60" />
                </div>
                <div>
                  <label className="text-xs text-white/40 mb-1 block">State</label>
                  <select value={stateVal} onChange={e => setStateVal(e.target.value)}
                    className="w-full bg-[#0d0018] border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-violet-500/50">
                    <option value="">— State —</option>
                    {INDIA_STATES.map(s => <option key={s} value={s} className="bg-[#0d0018]">{s}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs text-white/40 mb-1 block">City</label>
                  <input value={city} onChange={e => setCity(e.target.value)} placeholder="e.g. Delhi, Pune"
                    className="w-full bg-[#0d0018] border border-white/10 rounded-xl px-3 py-2 text-xs text-white placeholder:text-white/20 focus:outline-none focus:border-violet-500/50" />
                </div>
                <div>
                  <label className="text-xs text-white/40 mb-1 block">Area / Neighborhood</label>
                  <input value={area} onChange={e => setArea(e.target.value)} placeholder="e.g. Nangloi, Koramangala"
                    className="w-full bg-[#0d0018] border border-white/10 rounded-xl px-3 py-2 text-xs text-white placeholder:text-white/20 focus:outline-none focus:border-violet-500/50" />
                </div>
                <div className="col-span-full flex justify-end gap-2">
                  <button onClick={() => setLocOpen(false)} className="px-4 py-2 rounded-xl border border-white/10 text-xs text-white/50 hover:text-white transition-colors">Cancel</button>
                  <button onClick={() => { setLocOpen(false); handleScan(); }} className="px-5 py-2 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-xs font-bold transition-colors flex items-center gap-1.5">
                    <Radio className="w-3.5 h-3.5" /> Update & Scan
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Search bar */}
        <div className="flex gap-3">
          <div className="flex-1 relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/25 pointer-events-none" />
            <input value={searchQ} onChange={e => setSearchQ(e.target.value)}
              onKeyDown={e => e.key === "Enter" && handleScan()}
              placeholder="Search alerts, scams, issues, locations…"
              className="w-full bg-white/4 border border-white/8 rounded-2xl pl-11 pr-4 py-3 text-sm text-white placeholder:text-white/25 focus:outline-none focus:border-violet-500/40 transition-colors" />
          </div>
          <button onClick={handleScan} disabled={feedLoading}
            className="flex items-center gap-2 px-5 py-3 rounded-2xl bg-violet-700 hover:bg-violet-600 text-white text-sm font-bold transition-colors disabled:opacity-60 flex-shrink-0">
            {feedLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Radio className="w-4 h-4" />}
            Scan
          </button>
        </div>
      </div>

      {/* ── Stats Row ──────────────────────────────────────────────────────── */}
      <div className="flex-shrink-0 px-6 py-4 flex gap-3 overflow-x-auto">
        <StatCard label="Active Alerts" value={stats.activeAlerts} sub={`+${Math.floor(stats.activeAlerts * 0.15)} today`} color="#ef4444" trend="up" />
        <StatCard label="Local Signals" value={stats.localSignals} sub={`Within ${area || city || "5"} km`} color="#f97316" trend="up" />
        <StatCard label="National Alerts" value={stats.nationalAlerts} sub="Across India" color="#a78bfa" />
        <StatCard label="High Severity" value={highSeverity} sub="Take Action" color="#ef4444" trend={highSeverity > 0 ? "up" : undefined} />
        <div className="flex-1 rounded-2xl border border-white/6 bg-white/2 p-4 min-w-0 min-w-[140px]">
          <div className="text-xs text-white/40 mb-2 font-medium">AI Risk Score</div>
          <div className="flex items-end gap-2">
            <div className="text-3xl font-black leading-none" style={{ color: riskColor(forecast?.overallRiskLevel ?? "low") }}>{aiScore}</div>
            <div className="text-sm text-white/40 mb-0.5">/100</div>
          </div>
          <div className="text-xs mt-1.5 capitalize" style={{ color: riskColor(forecast?.overallRiskLevel ?? "low") }}>{forecast?.overallRiskLevel ?? "Loading…"}</div>
        </div>
      </div>

      {/* ── Main Content ───────────────────────────────────────────────────── */}
      <div className="flex-1 px-6 pb-6 grid grid-cols-1 xl:grid-cols-3 gap-5">

        {/* ── Left: Alert Feed ──────────────────────────────────────────── */}
        <div className="xl:col-span-2 flex flex-col gap-4">

          {/* Section header */}
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-black text-base text-white">TOP ALERT FEED</h2>
              <p className="text-xs text-white/35">Live updates from your area and beyond</p>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={() => loadFeed()} disabled={feedLoading} className="flex items-center gap-1.5 text-xs text-white/40 hover:text-white px-3 py-1.5 rounded-xl border border-white/8 hover:border-white/15 transition-all">
                <RefreshCw className={`w-3.5 h-3.5 ${feedLoading ? "animate-spin" : ""}`} /> Refresh
              </button>
            </div>
          </div>

          {/* Category tabs + level tabs */}
          <div className="space-y-2">
            <div className="flex gap-1 bg-white/2 p-1 rounded-xl border border-white/5">
              {LEVELS.map(l => (
                <button key={l.id} onClick={() => { setLevel(l.id); loadFeed(l.id, category); }}
                  className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all ${level === l.id ? "bg-violet-700 text-white" : "text-white/35 hover:text-white/60"}`}>
                  {l.label}
                </button>
              ))}
            </div>
            <div className="flex gap-1.5 flex-wrap">
              {CATS.map(c => (
                <button key={c.id} onClick={() => { setCategory(c.id); loadFeed(level, c.id); }}
                  className={`flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-medium transition-all border ${
                    category === c.id ? "bg-violet-700/70 border-violet-500/40 text-white" : "border-white/6 bg-white/2 text-white/40 hover:text-white/70 hover:border-white/12"
                  }`}>
                  {c.emoji} {c.label}
                </button>
              ))}
            </div>
          </div>

          {/* Alert cards */}
          <div className="flex-1 space-y-2.5">
            {feedLoading && alerts.length === 0 && (
              <div className="space-y-2.5">
                {[...Array(4)].map((_, i) => <div key={i} className="h-28 rounded-2xl bg-white/3 border border-white/5 animate-pulse" />)}
              </div>
            )}
            <AnimatePresence mode="popLayout">
              {alerts.map(a => <AlertCard key={a.id} alert={a} />)}
            </AnimatePresence>
            {!feedLoading && alerts.length === 0 && (
              <div className="flex flex-col items-center justify-center py-16 text-white/20">
                <Radio className="w-12 h-12 mb-3 opacity-30" />
                <p className="font-medium">No alerts found</p>
                <p className="text-sm mt-1">Set your location and click Scan</p>
              </div>
            )}
          </div>

          {/* Alert Timeline */}
          {alerts.length > 0 && (
            <div className="rounded-2xl border border-white/6 bg-white/2 p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-xs font-black text-white/60 uppercase tracking-widest flex items-center gap-1.5"><Clock className="w-3.5 h-3.5" /> Alert Timeline</h3>
                <span className="text-xs text-white/30">Track how situations are evolving</span>
              </div>
              {/* Timeline bar */}
              <div className="relative flex items-center gap-0 mb-3">
                <div className="absolute left-0 right-0 top-1/2 h-0.5 bg-white/6 -translate-y-1/2" />
                <div className="absolute left-0 right-1/3 top-1/2 h-0.5 bg-violet-600/60 -translate-y-1/2" />
                {["Now", "Today", "This Week", "This Month"].map((t, i) => (
                  <div key={t} className="flex-1 flex flex-col items-center relative z-10">
                    <div className={`w-2.5 h-2.5 rounded-full border-2 ${i === 0 ? "bg-violet-500 border-violet-400" : "bg-white/10 border-white/20"}`} />
                    <span className="text-xs text-white/35 mt-1.5">{t}</span>
                  </div>
                ))}
              </div>
              <div className="flex gap-2 overflow-x-auto pb-1">
                {alerts.slice(0, 5).map(a => {
                  const meta = CAT_META[a.category] ?? CAT_META.general;
                  const Icon = meta.Icon;
                  return (
                    <div key={a.id} className="flex-shrink-0 flex items-center gap-2 px-2.5 py-2 rounded-xl bg-white/3 border border-white/6 min-w-36">
                      <div className="w-6 h-6 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: meta.bg }}>
                        <Icon className="w-3 h-3" style={{ color: meta.color }} />
                      </div>
                      <div className="min-w-0">
                        <div className="text-xs font-semibold text-white/80 truncate">{a.title.replace(/^[^\w]*/, "").slice(0, 22)}</div>
                        <div className="text-xs text-white/30">{(() => {
                          const m = Math.floor((Date.now() - new Date(a.publishedAt).getTime()) / 60000);
                          return m < 60 ? `${m}m ago` : `${Math.floor(m / 60)}h ago`;
                        })()}</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* ── Right Sidebar ─────────────────────────────────────────────── */}
        <div className="space-y-4">

          {/* Live Local Radar */}
          <div className="rounded-2xl border border-white/6 bg-white/2 p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-black text-white/60 uppercase tracking-widest flex items-center gap-1.5"><Radio className="w-3.5 h-3.5 text-violet-400" /> Live Local Radar</h3>
              <div className="flex items-center gap-1 text-xs text-green-400"><div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" /> Live</div>
            </div>
            <LiveRadar alerts={alerts} />
            <div className="mt-3 grid grid-cols-2 gap-1.5">
              {[
                { label: "High Severity", color: "#ef4444", count: alerts.filter(a => a.severity === "critical" || a.severity === "high").length },
                { label: "Moderate", color: "#f97316", count: alerts.filter(a => a.severity === "medium").length },
                { label: "Low", color: "#60a5fa", count: alerts.filter(a => a.severity === "low").length },
                { label: "Info", color: "#a78bfa", count: Math.max(0, alerts.length - highSeverity) },
              ].map(r => (
                <div key={r.label} className="flex items-center gap-2 text-xs">
                  <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: r.color }} />
                  <span className="text-white/50">{r.label}</span>
                  <span className="ml-auto font-bold text-white/70">{r.count}</span>
                </div>
              ))}
            </div>
            <button className="mt-3 w-full text-xs text-violet-400 hover:text-violet-300 font-medium flex items-center justify-center gap-1.5 py-2 rounded-xl border border-violet-500/20 hover:bg-violet-500/10 transition-all">
              <MapPin className="w-3.5 h-3.5" /> Explore in Map
            </button>
          </div>

          {/* AI Daily Brief */}
          <div className="rounded-2xl border border-white/6 bg-white/2 p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-black text-white/60 uppercase tracking-widest flex items-center gap-1.5"><FileText className="w-3.5 h-3.5 text-violet-400" /> AI Daily Brief</h3>
              <button onClick={loadBrief} disabled={briefLoading} className="text-white/25 hover:text-white/60 transition-colors">
                <RefreshCw className={`w-3.5 h-3.5 ${briefLoading ? "animate-spin" : ""}`} />
              </button>
            </div>
            {briefLoading && !brief && <div className="space-y-2">{[...Array(4)].map((_, i) => <div key={i} className="h-6 bg-white/5 rounded-lg animate-pulse" />)}</div>}
            {brief && (
              <div className="space-y-3">
                <div className="p-3 rounded-xl bg-violet-500/8 border border-violet-500/15">
                  <p className="text-xs font-bold text-violet-300">{brief.greeting}</p>
                  <p className="text-xl mt-1">{brief.mood}</p>
                </div>
                {[
                  { icon: "🚨", n: brief.localAlerts, label: `High Severity Alert${brief.localAlerts !== 1 ? "s" : ""}`, sub: "Need your attention", color: "#ef4444" },
                  { icon: "📍", n: brief.nationalAlerts, label: "Local Updates", sub: "In your area", color: "#f97316" },
                  { icon: "🌤", n: null, label: brief.weatherStatus, sub: "Stay safe", color: "#34d399" },
                  { icon: "✅", n: null, label: brief.severeRisks ? "Severe Risk Active" : "All Clear", sub: brief.severeRisks ? "Stay informed" : "No major risks detected", color: brief.severeRisks ? "#ef4444" : "#34d399" },
                ].map((item, i) => (
                  <div key={i} className="flex items-center gap-3 text-xs">
                    <div className="w-7 h-7 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: `${item.color}15`, border: `1px solid ${item.color}25` }}>
                      <span className="text-sm">{item.icon}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-white/75">{item.n !== null ? `${item.n} ${item.label}` : item.label}</div>
                      <div className="text-white/35">{item.sub}</div>
                    </div>
                  </div>
                ))}
                <button onClick={() => {}} className="w-full text-xs text-violet-400 hover:text-violet-300 font-medium py-2 rounded-xl border border-violet-500/15 hover:bg-violet-500/8 transition-all flex items-center justify-center gap-1.5">
                  <FileText className="w-3.5 h-3.5" /> View Full Brief
                </button>
              </div>
            )}
          </div>

          {/* Trending Risks */}
          <div className="rounded-2xl border border-white/6 bg-white/2 p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-black text-white/60 uppercase tracking-widest flex items-center gap-1.5"><TrendingUp className="w-3.5 h-3.5 text-violet-400" /> Trending Risks</h3>
              <span className="text-xs text-white/30 px-2 py-0.5 rounded-lg bg-white/5">This Week</span>
            </div>
            <div className="space-y-2.5">
              {trendingRisks.map((r, i) => (
                <div key={i} className="flex items-center gap-2.5 text-xs">
                  <span className="w-5 h-5 rounded-lg bg-white/5 flex items-center justify-center font-bold text-white/40 flex-shrink-0 text-xs">{i + 1}</span>
                  <span className="flex-1 text-white/70 font-medium truncate">{r.name}</span>
                  <span className="flex-shrink-0 px-2 py-0.5 rounded-md font-bold capitalize" style={{
                    color: riskColor(r.level),
                    background: `${riskColor(r.level)}15`,
                    border: `1px solid ${riskColor(r.level)}30`,
                  }}>
                    {r.level === "medium" ? "Moderate" : r.level.replace(/\b\w/g, l => l.toUpperCase())}
                  </span>
                  <TrendingUp className="w-3 h-3 flex-shrink-0" style={{ color: riskColor(r.level) }} />
                </div>
              ))}
            </div>
            {forecastLoading && !forecast && <div className="space-y-2 mt-2">{[...Array(3)].map((_, i) => <div key={i} className="h-6 bg-white/5 rounded-lg animate-pulse" />)}</div>}
            <button onClick={() => {}} className="mt-3 w-full text-xs text-violet-400 hover:text-violet-300 font-medium py-2 rounded-xl border border-violet-500/15 hover:bg-violet-500/8 transition-all flex items-center justify-center gap-1.5">
              <Eye className="w-3.5 h-3.5" /> View All Trends
            </button>
          </div>

          {/* Quick Actions */}
          <div className="rounded-2xl border border-white/6 bg-white/2 p-4">
            <h3 className="text-xs font-black text-white/60 uppercase tracking-widest mb-3">Quick Actions</h3>
            <div className="space-y-2">
              {[
                { icon: Megaphone, label: "Report an Issue", sub: "Help your community", action: () => setCommOpen(true) },
                { icon: CheckCircle2, label: "Verify a News", sub: "Check authenticity", action: () => {} },
                { icon: Shield, label: "Safety Tips", sub: "Stay informed", action: () => {} },
                { icon: Star, label: "My Watchlist", sub: "Manage your alerts", action: () => {} },
              ].map(q => (
                <button key={q.label} onClick={q.action}
                  className="w-full flex items-center gap-3 p-2.5 rounded-xl bg-white/3 hover:bg-white/6 border border-white/5 hover:border-white/12 transition-all group text-left">
                  <div className="w-8 h-8 rounded-xl bg-violet-500/12 border border-violet-500/20 flex items-center justify-center flex-shrink-0">
                    <q.icon className="w-4 h-4 text-violet-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-bold text-white/80">{q.label}</div>
                    <div className="text-xs text-white/35">{q.sub}</div>
                  </div>
                  <ChevronRight className="w-3.5 h-3.5 text-white/20 group-hover:text-white/50 group-hover:translate-x-0.5 transition-all flex-shrink-0" />
                </button>
              ))}
            </div>
          </div>

          {/* Watchlist panel */}
          <div className="rounded-2xl border border-white/6 bg-white/2 p-4">
            <h3 className="text-xs font-black text-white/60 uppercase tracking-widest mb-3 flex items-center gap-1.5"><Bell className="w-3.5 h-3.5 text-violet-400" /> My Watchlist</h3>
            <div className="flex gap-2 mb-3">
              <input value={wlInput} onChange={e => setWlInput(e.target.value)} onKeyDown={e => e.key === "Enter" && addWatchlist()}
                placeholder="Add location to watch…"
                className="flex-1 bg-white/5 border border-white/8 rounded-xl px-3 py-2 text-xs text-white placeholder:text-white/20 focus:outline-none focus:border-violet-500/40" />
              <button onClick={addWatchlist} disabled={wlAdding || !wlInput.trim()} className="px-3 py-2 rounded-xl bg-violet-700 hover:bg-violet-600 text-white text-xs transition-colors disabled:opacity-50">
                {wlAdding ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
              </button>
            </div>
            <div className="space-y-1.5">
              {watchlist.length === 0 && <p className="text-xs text-white/25 text-center py-2">No locations watched yet</p>}
              {watchlist.map(w => (
                <div key={w.id} className="flex items-center gap-2 p-2 rounded-xl bg-white/3 border border-white/5">
                  <MapPin className="w-3.5 h-3.5 text-violet-400 flex-shrink-0" />
                  <span className="flex-1 text-xs text-white/70 font-medium truncate">{w.label}</span>
                  <button onClick={async () => { await fetch(api(`/alert-network/watchlist/${w.id}`), { method: "DELETE" }); loadWatchlist(); }} className="text-white/15 hover:text-red-400 transition-colors p-0.5"><X className="w-3 h-3" /></button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ── Community Report Modal ─────────────────────────────────────────── */}
      <AnimatePresence>
        {commOpen && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm" onClick={() => setCommOpen(false)}>
            <motion.div initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 20 }}
              className="bg-[#0c0018] border border-white/10 rounded-3xl p-6 w-full max-w-md shadow-2xl" onClick={e => e.stopPropagation()}>
              <div className="flex items-center justify-between mb-5">
                <h3 className="font-black text-white flex items-center gap-2"><Megaphone className="w-5 h-5 text-violet-400" /> Report an Issue</h3>
                <button onClick={() => setCommOpen(false)} className="text-white/30 hover:text-white transition-colors"><X className="w-5 h-5" /></button>
              </div>
              <div className="space-y-3">
                <input value={commLoc} onChange={e => setCommLoc(e.target.value)} placeholder="Location (e.g. Nangloi, Delhi)"
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-violet-500/40" />
                <textarea value={commDesc} onChange={e => setCommDesc(e.target.value)} placeholder="Describe what you observed…"
                  rows={4} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-violet-500/40 resize-none" />
                <select value={commCat} onChange={e => setCommCat(e.target.value)}
                  className="w-full bg-[#0d0018] border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-violet-500/40">
                  {CATS.filter(c => c.id !== "all").map(c => <option key={c.id} value={c.id} className="bg-[#0d0018]">{c.emoji} {c.label}</option>)}
                </select>
                <p className="text-xs text-white/25 italic">AI will categorize and assign confidence. Please do not make unverified accusations against individuals.</p>
                {commSuccess && <div className="flex items-center gap-2 text-xs text-green-400 font-medium"><CheckCircle2 className="w-4 h-4" /> Report submitted successfully!</div>}
                <button onClick={submitCommunity} disabled={commSubmitting || !commDesc.trim() || !commLoc.trim()}
                  className="w-full py-3 rounded-xl bg-violet-700 hover:bg-violet-600 text-white font-bold text-sm transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
                  {commSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                  Submit Report
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── AI Disclaimer Banner ───────────────────────────────────────────── */}
      <div className="flex-shrink-0 mx-6 mb-6 rounded-2xl border border-red-500/15 bg-red-500/5 p-4 flex gap-3">
        <div className="w-10 h-10 rounded-xl bg-red-500/15 border border-red-500/20 flex items-center justify-center flex-shrink-0">
          <AlertTriangle className="w-5 h-5 text-red-400" />
        </div>
        <div>
          <h4 className="text-sm font-bold text-red-400 mb-1">AI-Generated Intelligence Notice</h4>
          <p className="text-xs text-white/40 leading-relaxed">Some insights, summaries, predictions, classifications and risk assessments are generated by AI. Always double-check information through official sources before any action. Nexora is not responsible for decisions made based on this information.</p>
        </div>
        <div className="flex-shrink-0 w-16 h-16 rounded-xl bg-red-500/10 border border-red-500/15 flex items-center justify-center">
          <Bot className="w-8 h-8 text-red-400/60" />
        </div>
      </div>
    </div>
  );
}
