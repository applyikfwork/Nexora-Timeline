import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Bell, BellOff, MapPin, Loader2, RefreshCw, X, Plus, Trash2,
  CheckCircle2, AlertTriangle, Info, Zap, Users, Car, Cloud,
  TrendingUp, Send, Bot, Radio, Sun, Sparkles,
} from "lucide-react";

// ── Types ───────────────────────────────────────────────────────────────────
interface WatchedPlace { id: string; locationName: string; category: string; alertTypes: string[]; addedAt: string }
interface AlertItem {
  id: string; locationName: string; type: string; priority: "critical" | "important" | "info";
  title: string; message: string; detail: string;
  aiExplanation: string; recommendation: string; triggeredAt: string; isRead: boolean;
}
interface ScanResult {
  locationName: string; overallStatus: string; statusColor: string;
  statusMessage: string; activityLevel: number; alerts: AlertItem[];
  dailyBrief: { weather: string; events: string; traffic: string; activity: string };
  prediction: { timeframe: string; prediction: string; confidence: number; reason: string };
  generatedAt: string;
}
interface DailyBrief {
  greeting: string; weatherLine: string; eventsLine: string; trafficLine: string;
  activityLine: string; highlightLine: string; mood: string;
}
interface CommunityReport { id: string; locationName: string; description: string; aiCategory?: string; reportedAt: string }

// ── Config ──────────────────────────────────────────────────────────────────
const ALERT_TYPE_OPTIONS = [
  { id: "crowd", label: "Crowd", emoji: "👥" },
  { id: "traffic", label: "Traffic", emoji: "🚗" },
  { id: "events", label: "Events", emoji: "🎉" },
  { id: "weather", label: "Weather", emoji: "🌦" },
  { id: "trending", label: "Trending", emoji: "🔥" },
  { id: "city", label: "City Changes", emoji: "🏙" },
];
const CATEGORY_OPTIONS = [
  { id: "home", label: "🏠 Home", color: "#00b894" },
  { id: "college", label: "🎓 College", color: "#74b9ff" },
  { id: "work", label: "💼 Work", color: "#fdcb6e" },
  { id: "travel", label: "✈️ Travel", color: "#fd79a8" },
  { id: "custom", label: "📍 Custom", color: "#a29bfe" },
];
const STATUS_COLORS: Record<string, string> = {
  green: "#00b894", yellow: "#fdcb6e", orange: "#e17055", red: "#d63031",
};
const PRIORITY_CONFIG = {
  critical: { color: "#d63031", bg: "rgba(214,48,49,0.12)", border: "rgba(214,48,49,0.3)", icon: "🔴", label: "Critical" },
  important: { color: "#e17055", bg: "rgba(225,112,85,0.1)", border: "rgba(225,112,85,0.28)", icon: "🟠", label: "Important" },
  info: { color: "#74b9ff", bg: "rgba(116,185,255,0.08)", border: "rgba(116,185,255,0.22)", icon: "🔵", label: "Info" },
};
const TYPE_ICONS: Record<string, React.ReactNode> = {
  crowd: <Users className="w-4 h-4" />,
  traffic: <Car className="w-4 h-4" />,
  events: <Zap className="w-4 h-4" />,
  weather: <Cloud className="w-4 h-4" />,
  trending: <TrendingUp className="w-4 h-4" />,
  city: <MapPin className="w-4 h-4" />,
};
const QUICK_CITIES = ["Your Hometown", "Jaipur", "Indore", "Varanasi", "Chandigarh", "Kota", "Lucknow", "Surat"];
const CHAT_STARTERS = ["Any critical alerts now?", "What should I watch out for?", "Best time to go out?", "Summarize today"];

// ── Component ───────────────────────────────────────────────────────────────
export default function SmartAlerts() {
  // Watchlist
  const [watchlist, setWatchlist] = useState<WatchedPlace[]>([]);
  const [addOpen, setAddOpen] = useState(false);
  const [newLocation, setNewLocation] = useState("");
  const [newCategory, setNewCategory] = useState("custom");
  const [newTypes, setNewTypes] = useState<string[]>(["crowd", "events", "traffic"]);
  const [adding, setAdding] = useState(false);

  // Scan state
  const [activePlace, setActivePlace] = useState<WatchedPlace | null>(null);
  const [scanResult, setScanResult] = useState<ScanResult | null>(null);
  const [scanning, setScanning] = useState(false);

  // Quick scan (no watchlist needed)
  const [quickInput, setQuickInput] = useState("");

  // Daily brief
  const [brief, setBrief] = useState<DailyBrief | null>(null);
  const [briefLoading, setBriefLoading] = useState(false);
  const [briefCity, setBriefCity] = useState("");

  // History
  const [history, setHistory] = useState<AlertItem[]>([]);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // Community
  const [commOpen, setCommOpen] = useState(false);
  const [commLocation, setCommLocation] = useState("");
  const [commDesc, setCommDesc] = useState("");
  const [commReports, setCommReports] = useState<CommunityReport[]>([]);
  const [commSubmitted, setCommSubmitted] = useState(false);

  // Radar animation tick
  const [radarAngle, setRadarAngle] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setRadarAngle(a => (a + 3) % 360), 50);
    return () => clearInterval(t);
  }, []);

  // Chat
  const [chatOpen, setChatOpen] = useState(false);
  const [chatInput, setChatInput] = useState("");
  const [chatLoading, setChatLoading] = useState(false);
  const [chatMsgs, setChatMsgs] = useState<{ role: "user" | "ai"; text: string }[]>([
    { role: "ai", text: "🔔 Smart Alerts active! Add any place to your watchlist and I'll monitor it for crowd changes, events, traffic, and city signals. Or ask me anything!" },
  ]);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => { loadWatchlist(); loadHistory(); loadCommunity(); }, []);
  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [chatMsgs]);

  async function loadWatchlist() {
    try { const r = await fetch("/api/alerts/watchlist"); const d = await r.json(); setWatchlist(d.watchlist || []); } catch { /* ok */ }
  }
  async function loadHistory() {
    try { const r = await fetch("/api/alerts/history"); const d = await r.json(); setHistory(d.alerts || []); } catch { /* ok */ }
  }
  async function loadCommunity() {
    try { const r = await fetch("/api/alerts/community"); const d = await r.json(); setCommReports(d.reports || []); } catch { /* ok */ }
  }

  async function addToWatchlist() {
    if (!newLocation.trim()) return;
    setAdding(true);
    try {
      const r = await fetch("/api/alerts/watchlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ locationName: newLocation.trim(), category: newCategory, alertTypes: newTypes }),
      });
      const d = await r.json();
      setWatchlist(p => [...p, d.place || d]);
      setNewLocation(""); setAddOpen(false);
      // Auto-scan the new place
      await scanPlace(d.place || d);
    } finally { setAdding(false); }
  }

  async function removeFromWatchlist(id: string) {
    await fetch(`/api/alerts/watchlist/${id}`, { method: "DELETE" }).catch(() => {});
    setWatchlist(p => p.filter(w => w.id !== id));
    if (activePlace?.id === id) { setActivePlace(null); setScanResult(null); }
  }

  async function scanPlace(place: WatchedPlace) {
    setActivePlace(place);
    setScanResult(null);
    setScanning(true);
    try {
      const r = await fetch("/api/alerts/scan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ locationName: place.locationName, alertTypes: place.alertTypes }),
      });
      const d: ScanResult = await r.json();
      setScanResult(d);
      if (Array.isArray(d.alerts)) setHistory(prev => [...d.alerts, ...prev].slice(0, 60));
    } finally { setScanning(false); }
  }

  async function quickScan() {
    if (!quickInput.trim()) return;
    const tempPlace: WatchedPlace = { id: `quick-${Date.now()}`, locationName: quickInput.trim(), category: "custom", alertTypes: ["crowd", "events", "traffic", "weather", "trending"], addedAt: new Date().toISOString() };
    await scanPlace(tempPlace);
  }

  async function loadBrief() {
    const city = briefCity.trim() || activePlace?.locationName || "Delhi";
    setBriefLoading(true);
    try {
      const r = await fetch("/api/alerts/brief", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ locationName: city }),
      });
      setBrief(await r.json());
    } finally { setBriefLoading(false); }
  }

  async function submitCommunity() {
    if (!commDesc.trim() || !commLocation.trim()) return;
    const r = await fetch("/api/alerts/community", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ locationName: commLocation, description: commDesc }),
    });
    const d = await r.json();
    setCommReports(p => [d, ...p]);
    setCommDesc(""); setCommSubmitted(true);
    setTimeout(() => setCommSubmitted(false), 3000);
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
        body: JSON.stringify({ message: msg, cityName: activePlace?.locationName || undefined }),
      });
      const d = await r.json();
      setChatMsgs(m => [...m, { role: "ai", text: d.reply }]);
    } finally { setChatLoading(false); }
  }

  const statusCol = scanResult ? (STATUS_COLORS[scanResult.statusColor] || "#00b894") : "#00b894";
  const unread = history.filter(a => !a.isRead).length;

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen pb-32" style={{ background: "linear-gradient(135deg, #0a0a1a 0%, #0a0d1a 60%, #0d0a1a 100%)" }}>

      {/* ── HERO ──────────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden" style={{ minHeight: 280 }}>
        <div className="absolute inset-0 pointer-events-none">
          {/* Radar rings */}
          {[80, 140, 200, 260].map((r, i) => (
            <motion.div key={i} className="absolute rounded-full border"
              style={{ width: r * 2, height: r * 2, left: "50%", top: "50%", marginLeft: -r, marginTop: -r, borderColor: `rgba(255,193,7,${0.04 + i * 0.02})` }}
              animate={{ scale: [1, 1.04, 1], opacity: [0.4, 0.8, 0.4] }}
              transition={{ duration: 2 + i * 0.5, repeat: Infinity, delay: i * 0.3 }} />
          ))}
          {/* Radar sweep */}
          <div className="absolute" style={{ width: 520, height: 520, left: "50%", top: "50%", marginLeft: -260, marginTop: -260 }}>
            <svg viewBox="0 0 520 520" className="w-full h-full">
              <defs>
                <linearGradient id="sweep" x1="0.5" y1="0.5" x2="1" y2="0.5" gradientUnits="objectBoundingBox">
                  <stop offset="0%" stopColor="rgba(255,193,7,0)" />
                  <stop offset="100%" stopColor="rgba(255,193,7,0.18)" />
                </linearGradient>
              </defs>
              <g transform={`rotate(${radarAngle} 260 260)`}>
                <path d="M260,260 L520,260 A260,260 0 0,0 260,0 Z" fill="url(#sweep)" />
              </g>
            </svg>
          </div>
          {/* Signal particles */}
          {[...Array(14)].map((_, i) => (
            <motion.div key={i} className="absolute w-1 h-1 rounded-full"
              style={{ background: i % 3 === 0 ? "#ffd32a" : i % 3 === 1 ? "#00b894" : "#74b9ff", left: `${(i * 7.3) % 100}%`, top: `${(i * 11) % 90}%`, opacity: 0.3 }}
              animate={{ opacity: [0.2, 0.8, 0.2], scale: [1, 1.8, 1] }}
              transition={{ duration: 2 + (i % 3), repeat: Infinity, delay: (i * 0.25) % 2 }} />
          ))}
        </div>

        <div className="relative z-10 px-6 pt-10 pb-6 max-w-6xl mx-auto">
          <div className="flex items-center gap-4 mb-5">
            <motion.div className="w-16 h-16 rounded-2xl flex items-center justify-center text-3xl border relative"
              style={{ background: "rgba(255,193,7,0.12)", borderColor: "rgba(255,193,7,0.4)" }}
              animate={{ boxShadow: ["0 0 20px rgba(255,193,7,0.2)", "0 0 45px rgba(255,193,7,0.5)", "0 0 20px rgba(255,193,7,0.2)"] }}
              transition={{ duration: 2, repeat: Infinity }}>
              🔔
              {unread > 0 && (
                <div className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-red-500 flex items-center justify-center text-white text-xs font-black">
                  {unread > 9 ? "9+" : unread}
                </div>
              )}
            </motion.div>
            <div>
              <h1 className="text-4xl md:text-5xl font-black text-white">Smart Alerts</h1>
              <p className="text-white/50 mt-1">AI watches your places and tells you when something important changes.</p>
            </div>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { icon: "📍", label: "Places Watching", val: watchlist.length, color: "#74b9ff" },
              { icon: "⚡", label: "Live Signals", val: "Active", color: "#fdcb6e" },
              { icon: "🤖", label: "AI Detection", val: "On", color: "#a29bfe" },
              { icon: "🔔", label: "Active Alerts", val: unread, color: "#e17055" },
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

        {/* ── QUICK SCAN + WATCHLIST SETUP ────────────────────────────── */}
        <div className="grid md:grid-cols-2 gap-5">

          {/* Quick scan */}
          <section>
            <div className="rounded-2xl border overflow-hidden" style={{ background: "rgba(255,255,255,0.025)", borderColor: "rgba(255,193,7,0.3)" }}>
              <div className="px-5 py-4">
                <div className="flex items-center gap-2 mb-3">
                  <motion.div animate={{ scale: [1, 1.15, 1] }} transition={{ duration: 1.5, repeat: Infinity }}>
                    <Radio className="w-4 h-4 text-yellow-400" />
                  </motion.div>
                  <span className="font-bold text-white text-sm">Quick AI Scan</span>
                  <span className="text-xs text-white/30">any place, instantly</span>
                </div>
                <div className="flex gap-2">
                  <input value={quickInput} onChange={e => setQuickInput(e.target.value)}
                    onKeyDown={e => e.key === "Enter" && quickScan()}
                    placeholder="Enter any city, area, neighborhood..."
                    className="flex-1 px-4 py-2.5 rounded-xl border text-sm text-white placeholder-white/30 outline-none"
                    style={{ background: "rgba(255,255,255,0.05)", borderColor: "rgba(255,255,255,0.1)" }} />
                  <button onClick={quickScan} disabled={!quickInput.trim() || scanning}
                    className="px-4 py-2.5 rounded-xl font-bold text-sm disabled:opacity-40"
                    style={{ background: "rgba(255,193,7,0.18)", color: "#ffd32a", border: "1px solid rgba(255,193,7,0.35)" }}>
                    {scanning ? <Loader2 className="w-4 h-4 animate-spin" /> : "Scan →"}
                  </button>
                </div>
                <div className="flex flex-wrap gap-1.5 mt-3">
                  {QUICK_CITIES.map(c => (
                    <button key={c} onClick={() => { setQuickInput(c); }}
                      className="px-2.5 py-1 rounded-full text-xs border text-white/40 hover:text-yellow-300 hover:border-yellow-400/40 transition-all"
                      style={{ background: "rgba(255,255,255,0.03)", borderColor: "rgba(255,255,255,0.07)" }}>
                      {c}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </section>

          {/* Add to watchlist */}
          <section>
            <div className="rounded-2xl border overflow-hidden" style={{ background: "rgba(255,255,255,0.025)", borderColor: "rgba(116,185,255,0.25)" }}>
              <div className="px-5 py-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Bell className="w-4 h-4 text-blue-400" />
                    <span className="font-bold text-white text-sm">My Watchlist</span>
                    <span className="text-xs text-white/30">{watchlist.length} places</span>
                  </div>
                  <button onClick={() => setAddOpen(!addOpen)}
                    className="text-xs px-3 py-1.5 rounded-xl border flex items-center gap-1.5"
                    style={{ background: "rgba(116,185,255,0.12)", borderColor: "rgba(116,185,255,0.35)", color: "#74b9ff" }}>
                    <Plus className="w-3.5 h-3.5" /> Add Place
                  </button>
                </div>

                <AnimatePresence>
                  {addOpen && (
                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden mb-3">
                      <div className="space-y-3 pb-3 border-b" style={{ borderColor: "rgba(255,255,255,0.07)" }}>
                        <input value={newLocation} onChange={e => setNewLocation(e.target.value)}
                          onKeyDown={e => e.key === "Enter" && addToWatchlist()}
                          placeholder="Enter city, area, neighborhood..."
                          className="w-full px-3 py-2 rounded-xl border text-sm text-white placeholder-white/30 outline-none"
                          style={{ background: "rgba(255,255,255,0.05)", borderColor: "rgba(255,255,255,0.1)" }} />
                        <div className="flex gap-1.5 flex-wrap">
                          {CATEGORY_OPTIONS.map(cat => (
                            <button key={cat.id} onClick={() => setNewCategory(cat.id)}
                              className="px-2.5 py-1 rounded-xl text-xs border transition-all"
                              style={{
                                background: newCategory === cat.id ? `${cat.color}18` : "rgba(255,255,255,0.04)",
                                borderColor: newCategory === cat.id ? `${cat.color}50` : "rgba(255,255,255,0.08)",
                                color: newCategory === cat.id ? cat.color : "rgba(255,255,255,0.45)",
                              }}>
                              {cat.label}
                            </button>
                          ))}
                        </div>
                        <div className="flex gap-1.5 flex-wrap">
                          {ALERT_TYPE_OPTIONS.map(t => (
                            <button key={t.id} onClick={() => setNewTypes(prev => prev.includes(t.id) ? prev.filter(x => x !== t.id) : [...prev, t.id])}
                              className="px-2.5 py-1 rounded-xl text-xs border transition-all"
                              style={{
                                background: newTypes.includes(t.id) ? "rgba(255,193,7,0.12)" : "rgba(255,255,255,0.04)",
                                borderColor: newTypes.includes(t.id) ? "rgba(255,193,7,0.4)" : "rgba(255,255,255,0.08)",
                                color: newTypes.includes(t.id) ? "#ffd32a" : "rgba(255,255,255,0.4)",
                              }}>
                              {t.emoji} {t.label}
                            </button>
                          ))}
                        </div>
                        <button onClick={addToWatchlist} disabled={!newLocation.trim() || adding}
                          className="w-full py-2 rounded-xl text-sm font-bold disabled:opacity-40"
                          style={{ background: "rgba(116,185,255,0.18)", color: "#74b9ff", border: "1px solid rgba(116,185,255,0.35)" }}>
                          {adding ? <span className="flex items-center gap-2 justify-center"><Loader2 className="w-3.5 h-3.5 animate-spin" />Adding & Scanning...</span> : "Add to Watchlist →"}
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {watchlist.length === 0 ? (
                  <p className="text-xs text-white/30 text-center py-3">No places watched yet. Add your hometown, college, or travel destination.</p>
                ) : (
                  <div className="space-y-2">
                    {watchlist.map(place => {
                      const cat = CATEGORY_OPTIONS.find(c => c.id === place.category);
                      const isActive = activePlace?.id === place.id;
                      return (
                        <div key={place.id} className="flex items-center gap-3 px-3 py-2.5 rounded-xl border cursor-pointer transition-all"
                          style={{ background: isActive ? "rgba(255,193,7,0.08)" : "rgba(255,255,255,0.03)", borderColor: isActive ? "rgba(255,193,7,0.35)" : "rgba(255,255,255,0.07)" }}
                          onClick={() => scanPlace(place)}>
                          <div className="text-base">{cat?.label.split(" ")[0] || "📍"}</div>
                          <div className="flex-1">
                            <div className="text-sm font-medium text-white">{place.locationName}</div>
                            <div className="text-xs text-white/30">{place.alertTypes.slice(0, 3).join(", ")}</div>
                          </div>
                          <div className="flex items-center gap-1.5">
                            {scanning && isActive && <Loader2 className="w-3.5 h-3.5 animate-spin text-yellow-400" />}
                            {!scanning && isActive && <motion.div className="w-2 h-2 rounded-full bg-green-400" animate={{ scale: [1, 1.3, 1] }} transition={{ duration: 1, repeat: Infinity }} />}
                            <button onClick={e => { e.stopPropagation(); removeFromWatchlist(place.id); }}
                              className="p-1 rounded-lg text-white/20 hover:text-red-400 hover:bg-red-500/10 transition-all">
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </section>
        </div>

        {/* ── SCAN LOADING ─────────────────────────────────────────────── */}
        <AnimatePresence>
          {scanning && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="text-center py-10">
              <div className="relative w-16 h-16 mx-auto mb-4">
                {[0, 1, 2].map(i => (
                  <motion.div key={i} className="absolute inset-0 rounded-full border-2 border-yellow-400"
                    animate={{ scale: [1, 2, 2], opacity: [0.6, 0, 0] }}
                    transition={{ duration: 1.5, repeat: Infinity, delay: i * 0.5 }} />
                ))}
                <div className="absolute inset-0 flex items-center justify-center">
                  <Radio className="w-8 h-8 text-yellow-400" />
                </div>
              </div>
              <p className="text-white/50">AI scanning <span className="text-yellow-400 font-medium">{activePlace?.locationName}</span>...</p>
              <div className="flex justify-center gap-2 mt-2">
                {["Crowd", "Traffic", "Events", "Weather", "Signals"].map((s, i) => (
                  <motion.span key={s} className="text-xs text-white/25" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.2 }}>{s} ·</motion.span>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── SCAN RESULT DASHBOARD ────────────────────────────────────── */}
        {scanResult && !scanning && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-5">

            {/* Status header */}
            <div className="rounded-3xl border overflow-hidden" style={{
              background: "linear-gradient(135deg, rgba(255,193,7,0.06), rgba(116,185,255,0.03))",
              borderColor: `${statusCol}44`,
            }}>
              <div className="p-5">
                <div className="flex items-center justify-between flex-wrap gap-3 mb-4">
                  <div className="flex items-center gap-3">
                    <motion.div className="w-3 h-3 rounded-full" style={{ background: statusCol }}
                      animate={{ boxShadow: [`0 0 0 0 ${statusCol}66`, `0 0 0 10px transparent`] }}
                      transition={{ duration: 1.3, repeat: Infinity }} />
                    <span className="font-black text-white text-lg">{scanResult.locationName}</span>
                    <span className="px-2.5 py-1 rounded-full text-xs font-bold" style={{ background: `${statusCol}18`, color: statusCol }}>
                      {scanResult.overallStatus}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button onClick={() => activePlace && scanPlace(activePlace)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs text-white/50 hover:text-white transition-all"
                      style={{ borderColor: "rgba(255,255,255,0.1)" }}>
                      <RefreshCw className="w-3.5 h-3.5" /> Refresh
                    </button>
                    <span className="text-xs text-white/25">{new Date(scanResult.generatedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
                  </div>
                </div>
                <p className="text-white/60 text-sm mb-4">{scanResult.statusMessage}</p>

                {/* Activity bar */}
                <div className="flex items-center gap-3 mb-4">
                  <span className="text-xs text-white/40 w-24 flex-shrink-0">Activity Level</span>
                  <div className="flex-1 h-2.5 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.06)" }}>
                    <motion.div className="h-full rounded-full" style={{ background: `linear-gradient(90deg, ${statusCol}, ${statusCol}88)` }}
                      initial={{ width: 0 }} animate={{ width: `${scanResult.activityLevel}%` }} transition={{ duration: 1 }} />
                  </div>
                  <span className="text-sm font-black w-10 text-right" style={{ color: statusCol }}>{scanResult.activityLevel}%</span>
                </div>

                {/* Prediction */}
                <div className="flex items-start gap-3 p-3 rounded-2xl" style={{ background: "rgba(162,155,254,0.07)", border: "1px solid rgba(162,155,254,0.2)" }}>
                  <span className="text-xl flex-shrink-0">🔮</span>
                  <div>
                    <span className="text-xs text-purple-400 font-medium uppercase tracking-wide">{scanResult.prediction.timeframe} Prediction</span>
                    <p className="text-sm text-white/80 mt-0.5">{scanResult.prediction.prediction}</p>
                    <p className="text-xs text-white/40 mt-1">{scanResult.prediction.reason} · {scanResult.prediction.confidence}% confidence</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Live Alert Feed */}
            <div className="rounded-2xl border overflow-hidden" style={{ background: "rgba(255,255,255,0.02)", borderColor: "rgba(255,193,7,0.2)" }}>
              <div className="px-5 pt-4 pb-3 border-b flex items-center gap-2" style={{ borderColor: "rgba(255,255,255,0.06)" }}>
                <motion.div animate={{ scale: [1, 1.2, 1] }} transition={{ duration: 1, repeat: Infinity }}>
                  <Zap className="w-4 h-4 text-yellow-400" />
                </motion.div>
                <span className="font-bold text-white">Live Alert Feed</span>
                <span className="text-xs px-2 py-0.5 rounded-full text-yellow-400" style={{ background: "rgba(255,193,7,0.12)" }}>● LIVE — {scanResult.alerts.length} alerts</span>
              </div>
              <div className="p-4 space-y-3">
                {scanResult.alerts.length === 0 ? (
                  <div className="text-center py-6 text-white/30 text-sm">
                    <CheckCircle2 className="w-8 h-8 mx-auto mb-2 text-green-400 opacity-60" />
                    No alerts — everything normal in {scanResult.locationName}
                  </div>
                ) : (
                  scanResult.alerts.map((alert, i) => {
                    const cfg = PRIORITY_CONFIG[alert.priority] || PRIORITY_CONFIG.info;
                    const isExpanded = expandedId === alert.id;
                    return (
                      <motion.div key={alert.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.07 }}
                        className="rounded-2xl border overflow-hidden cursor-pointer"
                        style={{ background: cfg.bg, borderColor: cfg.border }}
                        onClick={() => setExpandedId(isExpanded ? null : alert.id)}>
                        <div className="px-4 py-3 flex items-start gap-3">
                          <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5"
                            style={{ background: `${cfg.color}20` }}>
                            <span style={{ color: cfg.color }}>{TYPE_ICONS[alert.type] || <Bell className="w-4 h-4" />}</span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-0.5">
                              <span className="text-xs font-bold uppercase tracking-wide" style={{ color: cfg.color }}>{cfg.icon} {cfg.label}</span>
                              <span className="text-xs text-white/25">{new Date(alert.triggeredAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
                            </div>
                            <div className="text-sm font-bold text-white">{alert.title}</div>
                            <div className="text-xs text-white/60 mt-0.5">{alert.message}</div>
                          </div>
                          <div className="text-white/25 text-xs mt-1 flex-shrink-0">{isExpanded ? "▲" : "▼"}</div>
                        </div>
                        <AnimatePresence>
                          {isExpanded && (
                            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                              className="overflow-hidden">
                              <div className="px-4 pb-4 space-y-2 border-t" style={{ borderColor: "rgba(255,255,255,0.06)" }}>
                                <div className="mt-3 text-xs text-white/60">{alert.detail}</div>
                                <div className="flex items-start gap-2 p-2.5 rounded-xl" style={{ background: "rgba(255,255,255,0.04)" }}>
                                  <Bot className="w-3.5 h-3.5 text-purple-400 flex-shrink-0 mt-0.5" />
                                  <div>
                                    <div className="text-xs text-purple-400 font-medium mb-0.5">Why this alert?</div>
                                    <div className="text-xs text-white/55">{alert.aiExplanation}</div>
                                  </div>
                                </div>
                                <div className="flex items-center gap-2 px-3 py-2 rounded-xl" style={{ background: "rgba(0,184,148,0.08)" }}>
                                  <CheckCircle2 className="w-3.5 h-3.5 text-green-400 flex-shrink-0" />
                                  <span className="text-xs text-white/70">{alert.recommendation}</span>
                                </div>
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </motion.div>
                    );
                  })
                )}
              </div>
            </div>

            {/* Daily brief mini-cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {[
                { icon: "☁️", label: "Weather", val: scanResult.dailyBrief.weather },
                { icon: "🎉", label: "Events", val: scanResult.dailyBrief.events },
                { icon: "🚗", label: "Traffic", val: scanResult.dailyBrief.traffic },
                { icon: "📊", label: "Activity", val: scanResult.dailyBrief.activity },
              ].map((c, i) => (
                <motion.div key={c.label} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}
                  className="p-3 rounded-2xl border" style={{ background: "rgba(255,255,255,0.02)", borderColor: "rgba(255,255,255,0.06)" }}>
                  <div className="text-xl mb-1.5">{c.icon}</div>
                  <div className="text-xs text-white/40 mb-1">{c.label}</div>
                  <p className="text-xs text-white/70 leading-relaxed">{c.val}</p>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}

        {/* ── DAILY BRIEFING ───────────────────────────────────────────── */}
        <section>
          <div className="rounded-2xl border overflow-hidden" style={{ background: "rgba(255,255,255,0.02)", borderColor: "rgba(255,221,0,0.2)" }}>
            <div className="px-5 pt-4 pb-3 border-b flex items-center justify-between" style={{ borderColor: "rgba(255,255,255,0.06)" }}>
              <div className="flex items-center gap-2">
                <Sun className="w-4 h-4 text-yellow-400" />
                <span className="font-bold text-white">AI Daily Briefing</span>
                <span className="text-xs text-white/30">morning city update</span>
              </div>
              <div className="flex items-center gap-2">
                <input value={briefCity} onChange={e => setBriefCity(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && loadBrief()}
                  placeholder={activePlace?.locationName || "Enter city..."}
                  className="px-3 py-1.5 rounded-xl border text-xs text-white placeholder-white/30 outline-none w-32"
                  style={{ background: "rgba(255,255,255,0.05)", borderColor: "rgba(255,255,255,0.1)" }} />
                <button onClick={loadBrief} disabled={briefLoading}
                  className="px-3 py-1.5 rounded-xl text-xs font-bold disabled:opacity-40"
                  style={{ background: "rgba(255,193,7,0.15)", color: "#ffd32a", border: "1px solid rgba(255,193,7,0.3)" }}>
                  {briefLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : "Get Brief →"}
                </button>
              </div>
            </div>
            <AnimatePresence>
              {brief ? (
                <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="p-5">
                  <div className="flex items-center gap-3 mb-4">
                    <span className="text-2xl">☀️</span>
                    <div>
                      <div className="text-sm font-bold text-white">{brief.greeting}</div>
                      <div className="text-xs text-yellow-400 mt-0.5">{brief.mood}</div>
                    </div>
                  </div>
                  <div className="grid md:grid-cols-2 gap-2">
                    {[
                      { icon: "🌤", label: "Weather", val: brief.weatherLine },
                      { icon: "🎉", label: "Events", val: brief.eventsLine },
                      { icon: "🚗", label: "Traffic", val: brief.trafficLine },
                      { icon: "📈", label: "Activity", val: brief.activityLine },
                    ].map(row => (
                      <div key={row.label} className="flex items-start gap-2.5 px-3 py-2.5 rounded-xl" style={{ background: "rgba(255,255,255,0.04)" }}>
                        <span className="flex-shrink-0 mt-0.5">{row.icon}</span>
                        <div>
                          <div className="text-xs text-white/40">{row.label}</div>
                          <div className="text-xs text-white/75 mt-0.5">{row.val}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                  {brief.highlightLine && (
                    <div className="mt-3 flex items-start gap-2 px-3 py-2.5 rounded-xl" style={{ background: "rgba(255,193,7,0.07)", border: "1px solid rgba(255,193,7,0.18)" }}>
                      <Sparkles className="w-3.5 h-3.5 text-yellow-400 flex-shrink-0 mt-0.5" />
                      <p className="text-xs text-white/70">{brief.highlightLine}</p>
                    </div>
                  )}
                </motion.div>
              ) : (
                <div className="px-5 py-5 text-sm text-white/30 text-center">
                  Enter a city and get your AI morning briefing — weather, events, traffic, and today's city mood.
                </div>
              )}
            </AnimatePresence>
          </div>
        </section>

        {/* ── ALERT HISTORY ────────────────────────────────────────────── */}
        {history.length > 0 && (
          <section>
            <div className="flex items-center gap-3 mb-3">
              <Bell className="w-4 h-4 text-white/50" />
              <span className="font-bold text-white text-sm">Alert History</span>
              <span className="text-xs text-white/30">{history.length} alerts</span>
            </div>
            <div className="space-y-2">
              {history.slice(0, 8).map((alert, i) => {
                const cfg = PRIORITY_CONFIG[alert.priority] || PRIORITY_CONFIG.info;
                return (
                  <motion.div key={alert.id} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.04 }}
                    className="flex items-start gap-3 px-4 py-3 rounded-xl border transition-all"
                    style={{ background: alert.isRead ? "rgba(255,255,255,0.02)" : cfg.bg, borderColor: alert.isRead ? "rgba(255,255,255,0.06)" : cfg.border }}>
                    <span className="text-base flex-shrink-0 mt-0.5">{cfg.icon}</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-white truncate">{alert.title}</span>
                        {!alert.isRead && <span className="w-1.5 h-1.5 rounded-full bg-yellow-400 flex-shrink-0" />}
                      </div>
                      <div className="text-xs text-white/45 mt-0.5">{alert.locationName} · {alert.message}</div>
                    </div>
                    <span className="text-xs text-white/25 flex-shrink-0">{new Date(alert.triggeredAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
                  </motion.div>
                );
              })}
            </div>
          </section>
        )}

        {/* ── COMMUNITY SIGNALS ────────────────────────────────────────── */}
        <section>
          <div className="rounded-2xl border overflow-hidden" style={{ background: "rgba(255,255,255,0.02)", borderColor: "rgba(0,184,148,0.2)" }}>
            <div className="px-5 pt-4 pb-3 border-b flex items-center justify-between" style={{ borderColor: "rgba(255,255,255,0.06)" }}>
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-green-400" />
                <span className="font-bold text-white">Community Signals</span>
              </div>
              <button onClick={() => setCommOpen(!commOpen)}
                className="text-xs px-3 py-1.5 rounded-xl border"
                style={{ background: "rgba(0,184,148,0.1)", borderColor: "rgba(0,184,148,0.3)", color: "#00b894" }}>
                {commOpen ? "Cancel" : "+ Report Update"}
              </button>
            </div>
            <AnimatePresence>
              {commOpen && (
                <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                  <div className="p-5 space-y-3 border-b" style={{ borderColor: "rgba(255,255,255,0.06)" }}>
                    <input value={commLocation} onChange={e => setCommLocation(e.target.value)} placeholder="Location (city or area)..."
                      className="w-full px-3 py-2 rounded-xl border text-sm text-white placeholder-white/30 outline-none"
                      style={{ background: "rgba(255,255,255,0.05)", borderColor: "rgba(255,255,255,0.1)" }} />
                    <textarea value={commDesc} onChange={e => setCommDesc(e.target.value)} rows={2}
                      placeholder="What's happening? Traffic jam, local event, unusual activity..."
                      className="w-full px-3 py-2 rounded-xl border text-sm text-white placeholder-white/30 outline-none resize-none"
                      style={{ background: "rgba(255,255,255,0.05)", borderColor: "rgba(255,255,255,0.1)" }} />
                    <div className="flex items-center justify-between">
                      <AnimatePresence>
                        {commSubmitted && <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="text-xs text-green-400">✅ Signal submitted! AI verified.</motion.span>}
                      </AnimatePresence>
                      <button onClick={submitCommunity} disabled={!commDesc.trim() || !commLocation.trim()}
                        className="ml-auto px-4 py-2 rounded-xl text-sm font-bold disabled:opacity-40"
                        style={{ background: "rgba(0,184,148,0.18)", color: "#00b894", border: "1px solid rgba(0,184,148,0.3)" }}>
                        Submit Signal →
                      </button>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
            <div className="p-4 space-y-2">
              {commReports.length === 0 ? (
                <p className="text-xs text-white/30 text-center py-3">No community signals yet. Be the first to report something!</p>
              ) : (
                commReports.slice(0, 5).map((r, i) => (
                  <div key={r.id} className="flex items-start gap-2 px-3 py-2 rounded-xl text-xs"
                    style={{ background: "rgba(0,184,148,0.06)", border: "1px solid rgba(0,184,148,0.14)" }}>
                    <span className="text-green-400 flex-shrink-0 mt-0.5">📍</span>
                    <div>
                      <span className="text-white/65">{r.description}</span>
                      {r.aiCategory && <span className="ml-1.5 text-green-400/60">— {r.aiCategory}</span>}
                      <div className="text-white/25 mt-0.5">{r.locationName}</div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </section>

      </div>

      {/* ── FLOATING AI CHAT ──────────────────────────────────────────── */}
      <div className="fixed bottom-6 right-6 z-50">
        <AnimatePresence>
          {chatOpen && (
            <motion.div initial={{ opacity: 0, scale: 0.85, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.85, y: 20 }}
              className="mb-4 rounded-3xl border overflow-hidden"
              style={{ width: 340, maxHeight: 500, background: "#0e0e1c", borderColor: "rgba(255,193,7,0.35)", boxShadow: "0 20px 60px rgba(0,0,0,0.5)" }}>
              <div className="flex items-center justify-between px-4 py-3 border-b" style={{ borderColor: "rgba(255,255,255,0.06)", background: "rgba(255,193,7,0.07)" }}>
                <div className="flex items-center gap-2">
                  <motion.div className="w-7 h-7 rounded-xl flex items-center justify-center text-base" style={{ background: "rgba(255,193,7,0.2)" }}
                    animate={{ boxShadow: ["0 0 0 0 rgba(255,193,7,0.4)", "0 0 0 6px transparent"] }} transition={{ duration: 1.5, repeat: Infinity }}>
                    🔔
                  </motion.div>
                  <div>
                    <div className="text-sm font-bold text-white">Alert AI</div>
                    <div className="text-xs text-yellow-400">{activePlace ? `Watching ${activePlace.locationName}` : "City Intelligence"}</div>
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
                        background: msg.role === "user" ? "rgba(255,193,7,0.2)" : "rgba(255,255,255,0.07)",
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
                      <div className="flex gap-1">{[0, 1, 2].map(i => <div key={i} className="w-1.5 h-1.5 rounded-full bg-yellow-400 animate-bounce" style={{ animationDelay: `${i * 0.15}s` }} />)}</div>
                    </div>
                  </div>
                )}
                <div ref={chatEndRef} />
              </div>
              <div className="px-3 pb-3">
                <div className="flex items-center gap-2 p-2 rounded-xl border mb-2" style={{ background: "rgba(255,255,255,0.05)", borderColor: "rgba(255,255,255,0.1)" }}>
                  <input value={chatInput} onChange={e => setChatInput(e.target.value)} onKeyDown={e => e.key === "Enter" && sendChat()}
                    placeholder="Ask about alerts..."
                    className="flex-1 bg-transparent text-sm text-white placeholder-white/30 outline-none" />
                  <button onClick={sendChat} disabled={chatLoading || !chatInput.trim()}
                    className="w-7 h-7 rounded-lg flex items-center justify-center disabled:opacity-40"
                    style={{ background: "rgba(255,193,7,0.22)" }}>
                    <Send className="w-3.5 h-3.5 text-yellow-300" />
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
          className="flex items-center gap-2 px-5 py-3.5 rounded-2xl font-bold text-sm shadow-2xl relative"
          style={{ background: "linear-gradient(135deg, #f39c12, #fdcb6e)", color: "#1a1a2e", boxShadow: "0 8px 32px rgba(243,156,18,0.4)" }}
          animate={{ boxShadow: chatOpen ? "0 8px 32px rgba(243,156,18,0.6)" : ["0 8px 32px rgba(243,156,18,0.4)", "0 8px 40px rgba(243,156,18,0.65)", "0 8px 32px rgba(243,156,18,0.4)"] }}
          transition={{ duration: 2, repeat: chatOpen ? 0 : Infinity }}>
          {unread > 0 && !chatOpen && (
            <motion.div className="absolute -top-2 -right-2 w-5 h-5 rounded-full bg-red-500 flex items-center justify-center text-white text-xs font-black"
              animate={{ scale: [1, 1.2, 1] }} transition={{ duration: 1, repeat: Infinity }}>
              {unread > 9 ? "9+" : unread}
            </motion.div>
          )}
          <Bell className="w-5 h-5" />
          <span>{chatOpen ? "Close" : "Alert AI"}</span>
          {!chatOpen && <span className="w-2 h-2 rounded-full bg-white animate-pulse" />}
        </motion.button>
      </div>
    </div>
  );
}
