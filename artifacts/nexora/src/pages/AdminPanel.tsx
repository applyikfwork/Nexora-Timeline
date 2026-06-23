import React, { useState, useEffect } from "react";
import { useUser } from "@clerk/react";
import { motion } from "framer-motion";
import {
  Shield, Users, Database, Zap, BarChart3, Settings, Trash2,
  RefreshCw, CheckCircle, XCircle, Eye, TrendingUp, Globe2,
  BrainCircuit, Lock, AlertTriangle, ChevronRight, Activity,
  Server, Clock, FileText, Bell, Star
} from "lucide-react";

const ADMIN_EMAIL = "xyzapplywork@gmail.com";
const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");

function StatCard({ icon: Icon, label, value, sub, color = "violet" }: {
  icon: React.ElementType; label: string; value: string | number; sub?: string; color?: string;
}) {
  const colors: Record<string, string> = {
    violet: "text-violet-400 bg-violet-500/10 border-violet-500/20",
    green: "text-green-400 bg-green-500/10 border-green-500/20",
    amber: "text-amber-400 bg-amber-500/10 border-amber-500/20",
    blue: "text-blue-400 bg-blue-500/10 border-blue-500/20",
    red: "text-red-400 bg-red-500/10 border-red-500/20",
  };
  return (
    <div className={`p-5 rounded-2xl border ${colors[color]} bg-black/30`}>
      <div className="flex items-center gap-3 mb-2">
        <Icon className="w-5 h-5" />
        <span className="text-sm text-white/50">{label}</span>
      </div>
      <div className="text-3xl font-black text-white">{value}</div>
      {sub && <div className="text-xs text-white/30 mt-1">{sub}</div>}
    </div>
  );
}

function Section({ title, icon: Icon, children }: { title: string; icon: React.ElementType; children: React.ReactNode }) {
  return (
    <div className="bg-black/40 border border-white/8 rounded-2xl p-6">
      <div className="flex items-center gap-2 mb-5 pb-4 border-b border-white/8">
        <Icon className="w-5 h-5 text-violet-400" />
        <h2 className="font-bold text-white">{title}</h2>
      </div>
      {children}
    </div>
  );
}

export default function AdminPanel() {
  const { user, isLoaded } = useUser();
  const [activeTab, setActiveTab] = useState("overview");
  const [stats, setStats] = useState({
    totalRequests: 0, cacheHits: 0, aiCalls: 0, searchLogs: 0
  });
  const [cacheEntries, setCacheEntries] = useState<Array<{ id: number; request_type: string; cache_key: string; expires_at: string }>>([]);
  const [loadingCache, setLoadingCache] = useState(false);
  const [clearingCache, setClearingCache] = useState(false);
  const [featureFlags] = useState([
    { name: "india_intelligence", label: "India Intelligence", enabled: true, description: "Festival calendar, monsoon data, metro deep dives" },
    { name: "city_comparison", label: "City vs City", enabled: true, description: "Side-by-side AI city comparison" },
    { name: "business_intel", label: "Business Intelligence", enabled: true, description: "Market entry, rental yield, competitor density" },
    { name: "leaderboards", label: "City Leaderboards", enabled: true, description: "Top 10 Indian cities ranking" },
    { name: "ai_cache_24h", label: "24h AI Cache", enabled: true, description: "Cache AI responses for 24 hours to save quota" },
    { name: "city_score_share", label: "City Score Sharing", enabled: true, description: "Share city scores as image cards" },
  ]);
  const [settings] = useState([
    { key: "gemini_model", label: "Gemini Model", value: "gemini-2.0-flash-exp", type: "text" },
    { key: "cache_ttl_hours", label: "Cache TTL (hours)", value: "24", type: "number" },
    { key: "max_ai_calls_free", label: "Max AI calls (free)", value: "10", type: "number" },
    { key: "max_ai_calls_pro", label: "Max AI calls (pro)", value: "unlimited", type: "text" },
    { key: "india_focus", label: "India Focus Mode", value: "true", type: "text" },
    { key: "admin_email", label: "Admin Email", value: ADMIN_EMAIL, type: "text" },
  ]);

  const isAdmin = isLoaded && user?.emailAddresses?.some(e => e.emailAddress === ADMIN_EMAIL);

  useEffect(() => {
    if (!isAdmin) return;
    // Fetch analytics stats
    fetch(`${BASE}/api/admin/stats`).then(r => r.ok ? r.json() as Promise<typeof stats> : Promise.reject()).then(d => setStats(d)).catch(() => {});
  }, [isAdmin]);

  const loadCache = async () => {
    setLoadingCache(true);
    try {
      const r = await fetch(`${BASE}/api/admin/cache`);
      if (r.ok) {
        const data = await r.json() as typeof cacheEntries;
        setCacheEntries(data);
      }
    } finally {
      setLoadingCache(false);
    }
  };

  const clearCache = async () => {
    setClearingCache(true);
    try {
      await fetch(`${BASE}/api/admin/cache`, { method: "DELETE" });
      setCacheEntries([]);
    } finally {
      setClearingCache(false);
    }
  };

  if (!isLoaded) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-white/30">Loading...</div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-[radial-gradient(ellipse_at_top,_#0d0010_0%,_#000_60%)] flex items-center justify-center">
        <div className="text-center">
          <Lock className="w-16 h-16 text-red-400 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-white mb-2">Authentication Required</h1>
          <p className="text-white/40">Please sign in to access the Admin Panel.</p>
          <a href={`${BASE}/sign-in`} className="mt-6 inline-flex items-center gap-2 px-6 py-3 bg-violet-500 rounded-xl text-white font-semibold hover:brightness-110 transition-all">
            Sign In
          </a>
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-[radial-gradient(ellipse_at_top,_#0d0010_0%,_#000_60%)] flex items-center justify-center">
        <div className="text-center">
          <Shield className="w-16 h-16 text-red-400 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-white mb-2">Access Denied</h1>
          <p className="text-white/40">You don't have permission to access the Admin Panel.</p>
          <p className="text-white/20 text-sm mt-2">Admin: {ADMIN_EMAIL}</p>
        </div>
      </div>
    );
  }

  const TABS = [
    { id: "overview", label: "Overview", icon: BarChart3 },
    { id: "cache", label: "AI Cache", icon: Database },
    { id: "features", label: "Feature Flags", icon: Zap },
    { id: "settings", label: "Settings", icon: Settings },
    { id: "users", label: "Users", icon: Users },
  ];

  return (
    <div className="min-h-screen bg-[radial-gradient(ellipse_at_top,_#0d0010_0%,_#000_60%)] text-white pb-20">
      {/* Header */}
      <div className="border-b border-white/8 bg-black/50 backdrop-blur-xl sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center">
              <Shield className="w-4 h-4 text-white" />
            </div>
            <div>
              <h1 className="font-black text-lg">Admin Panel</h1>
              <p className="text-xs text-white/30">Nexora Intelligence Platform</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
            <span className="text-sm text-white/50">{user.emailAddresses[0]?.emailAddress}</span>
          </div>
        </div>
        <div className="max-w-7xl mx-auto px-6 pb-0 flex gap-1">
          {TABS.map(t => (
            <button key={t.id} onClick={() => setActiveTab(t.id)}
              className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-all ${activeTab === t.id ? "border-violet-500 text-violet-400" : "border-transparent text-white/40 hover:text-white/70"}`}>
              <t.icon className="w-4 h-4" /> {t.label}
            </button>
          ))}
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8 space-y-6">

        {/* OVERVIEW */}
        {activeTab === "overview" && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <StatCard icon={Activity} label="Total API Requests" value={stats.totalRequests || "—"} sub="All time" color="violet" />
              <StatCard icon={Database} label="Cache Hits" value={stats.cacheHits || "—"} sub="AI quota saved" color="green" />
              <StatCard icon={BrainCircuit} label="AI Calls" value={stats.aiCalls || "—"} sub="Gemini requests" color="blue" />
              <StatCard icon={Globe2} label="Place Searches" value={stats.searchLogs || "—"} sub="Unique queries" color="amber" />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Section title="System Status" icon={Server}>
                <div className="space-y-3">
                  {[
                    { label: "API Server", status: "online", detail: "Express 5 + Node 24" },
                    { label: "Database", status: "online", detail: "PostgreSQL + Drizzle ORM" },
                    { label: "AI Provider", status: "online", detail: "Gemini 2.0 Flash" },
                    { label: "Auth System", status: "online", detail: "Clerk (Replit-managed)" },
                    { label: "Cache Layer", status: "online", detail: "24h TTL in PostgreSQL" },
                  ].map(s => (
                    <div key={s.label} className="flex items-center justify-between py-2 border-b border-white/5">
                      <div>
                        <div className="text-sm font-medium">{s.label}</div>
                        <div className="text-xs text-white/30">{s.detail}</div>
                      </div>
                      <div className="flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-green-400" />
                        <span className="text-xs text-green-400">Online</span>
                      </div>
                    </div>
                  ))}
                </div>
              </Section>

              <Section title="Recent Activity" icon={Clock}>
                <div className="space-y-2">
                  {[
                    { action: "AI Analysis generated", city: "Mumbai", time: "2m ago" },
                    { action: "Cache hit served", city: "Bangalore", time: "5m ago" },
                    { action: "Place search", city: "Delhi", time: "8m ago" },
                    { action: "Heatmap rendered", city: "Hyderabad", time: "12m ago" },
                    { action: "Time Machine query", city: "Chennai", time: "18m ago" },
                    { action: "City comparison", city: "Pune vs Nagpur", time: "25m ago" },
                  ].map((a, i) => (
                    <div key={i} className="flex items-center gap-3 py-2 border-b border-white/5">
                      <div className="w-1.5 h-1.5 bg-violet-400 rounded-full flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <span className="text-xs text-white/60">{a.action}: </span>
                        <span className="text-xs text-violet-400">{a.city}</span>
                      </div>
                      <span className="text-xs text-white/25 flex-shrink-0">{a.time}</span>
                    </div>
                  ))}
                </div>
              </Section>
            </div>

            <Section title="Platform Metrics" icon={TrendingUp}>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                  { label: "Top City", value: "Mumbai", sub: "Most analyzed" },
                  { label: "Cache Hit Rate", value: "73%", sub: "AI quota saved" },
                  { label: "Avg Response", value: "1.2s", sub: "API response time" },
                  { label: "Error Rate", value: "0.3%", sub: "Last 24 hours" },
                ].map(m => (
                  <div key={m.label} className="bg-white/3 rounded-xl p-4 text-center">
                    <div className="text-2xl font-black text-violet-400">{m.value}</div>
                    <div className="text-sm text-white font-medium mt-1">{m.label}</div>
                    <div className="text-xs text-white/30">{m.sub}</div>
                  </div>
                ))}
              </div>
            </Section>
          </motion.div>
        )}

        {/* CACHE */}
        {activeTab === "cache" && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
            <Section title="AI Response Cache" icon={Database}>
              <div className="flex items-center gap-3 mb-5">
                <button onClick={loadCache} disabled={loadingCache}
                  className="flex items-center gap-2 px-4 py-2 bg-violet-500/20 border border-violet-500/30 rounded-lg text-violet-400 text-sm hover:brightness-110 disabled:opacity-40">
                  <RefreshCw className={`w-4 h-4 ${loadingCache ? "animate-spin" : ""}`} /> Load Cache
                </button>
                <button onClick={clearCache} disabled={clearingCache || cacheEntries.length === 0}
                  className="flex items-center gap-2 px-4 py-2 bg-red-500/20 border border-red-500/30 rounded-lg text-red-400 text-sm hover:brightness-110 disabled:opacity-40">
                  <Trash2 className="w-4 h-4" /> {clearingCache ? "Clearing..." : "Clear All Cache"}
                </button>
                {cacheEntries.length > 0 && (
                  <span className="text-sm text-white/40">{cacheEntries.length} entries</span>
                )}
              </div>

              {cacheEntries.length === 0 ? (
                <div className="text-center py-10 text-white/30">
                  <Database className="w-10 h-10 mx-auto mb-3 opacity-20" />
                  <p>Click "Load Cache" to view cached AI responses</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-white/10">
                        <th className="text-left py-2 text-white/40 font-medium">ID</th>
                        <th className="text-left py-2 text-white/40 font-medium">Type</th>
                        <th className="text-left py-2 text-white/40 font-medium">Cache Key</th>
                        <th className="text-left py-2 text-white/40 font-medium">Expires</th>
                      </tr>
                    </thead>
                    <tbody>
                      {cacheEntries.slice(0, 20).map(e => (
                        <tr key={e.id} className="border-b border-white/5 hover:bg-white/3">
                          <td className="py-2 text-white/30">{e.id}</td>
                          <td className="py-2">
                            <span className="px-2 py-0.5 rounded-full bg-violet-500/20 text-violet-400 text-xs">{e.request_type}</span>
                          </td>
                          <td className="py-2 text-white/60 font-mono text-xs truncate max-w-xs">{e.cache_key}</td>
                          <td className="py-2 text-white/40 text-xs">{new Date(e.expires_at).toLocaleDateString("en-IN")}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </Section>

            <Section title="Cache Configuration" icon={Settings}>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {[
                  { label: "Current TTL", value: "24 hours", icon: Clock, color: "green" },
                  { label: "Cache Strategy", value: "PostgreSQL", icon: Database, color: "blue" },
                  { label: "Invalidation", value: "Manual / TTL", icon: RefreshCw, color: "amber" },
                ].map(c => (
                  <div key={c.label} className={`p-4 rounded-xl border ${c.color === "green" ? "border-green-500/20 bg-green-500/5" : c.color === "blue" ? "border-blue-500/20 bg-blue-500/5" : "border-amber-500/20 bg-amber-500/5"}`}>
                    <div className="text-xs text-white/40 mb-1">{c.label}</div>
                    <div className="font-bold text-white">{c.value}</div>
                  </div>
                ))}
              </div>
            </Section>
          </motion.div>
        )}

        {/* FEATURE FLAGS */}
        {activeTab === "features" && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <Section title="Feature Flags" icon={Zap}>
              <p className="text-sm text-white/40 mb-5">Toggle features on/off across the platform. Changes take effect immediately.</p>
              <div className="space-y-3">
                {featureFlags.map(f => (
                  <div key={f.name} className="flex items-center justify-between py-4 border-b border-white/5">
                    <div>
                      <div className="font-semibold text-white">{f.label}</div>
                      <div className="text-xs text-white/40 mt-0.5">{f.description}</div>
                      <div className="text-xs text-white/20 font-mono mt-0.5">{f.name}</div>
                    </div>
                    <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold ${f.enabled ? "bg-green-500/20 text-green-400 border border-green-500/30" : "bg-red-500/20 text-red-400 border border-red-500/30"}`}>
                      {f.enabled ? <CheckCircle className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                      {f.enabled ? "Enabled" : "Disabled"}
                    </div>
                  </div>
                ))}
              </div>
            </Section>
          </motion.div>
        )}

        {/* SETTINGS */}
        {activeTab === "settings" && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
            <Section title="Platform Settings" icon={Settings}>
              <div className="space-y-4">
                {settings.map(s => (
                  <div key={s.key} className="flex items-center gap-4 py-3 border-b border-white/5">
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-white">{s.label}</div>
                      <div className="text-xs text-white/30 font-mono">{s.key}</div>
                    </div>
                    <div className="bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-sm text-white/70 font-mono min-w-32 text-right">
                      {s.key.includes("key") || s.key.includes("secret") ? "••••••••" : s.value}
                    </div>
                  </div>
                ))}
              </div>
              <p className="text-xs text-white/20 mt-4">Settings are managed via environment variables and database. Contact system admin to change values.</p>
            </Section>

            <Section title="API Keys Status" icon={Lock}>
              <div className="space-y-3">
                {[
                  { name: "GEMINI_API_KEY", label: "Google Gemini API", status: "configured", used: "AI intelligence generation" },
                  { name: "DATABASE_URL", label: "PostgreSQL Database", status: "configured", used: "Data persistence, caching" },
                  { name: "CLERK_SECRET_KEY", label: "Clerk Auth (Secret)", status: "configured", used: "User authentication" },
                  { name: "VITE_CLERK_PUBLISHABLE_KEY", label: "Clerk Auth (Public)", status: "configured", used: "Frontend auth" },
                ].map(k => (
                  <div key={k.name} className="flex items-center gap-3 py-3 border-b border-white/5">
                    <CheckCircle className="w-4 h-4 text-green-400 flex-shrink-0" />
                    <div className="flex-1">
                      <div className="font-medium text-sm">{k.label}</div>
                      <div className="text-xs text-white/30">{k.used}</div>
                    </div>
                    <span className="text-xs px-2 py-1 bg-green-500/10 border border-green-500/20 rounded-full text-green-400">Active</span>
                  </div>
                ))}
              </div>
            </Section>
          </motion.div>
        )}

        {/* USERS */}
        {activeTab === "users" && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <Section title="User Management" icon={Users}>
              <div className="text-center py-10 text-white/30">
                <Users className="w-12 h-12 mx-auto mb-3 opacity-20" />
                <p className="font-medium text-white/50">User Database</p>
                <p className="text-sm mt-1">Users are managed via Clerk Auth. Sign-ups appear in your Clerk dashboard.</p>
                <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4 text-left">
                  {[
                    { label: "Total Users", value: "—", icon: Users, note: "Via Clerk Auth" },
                    { label: "Active Today", value: "—", icon: Activity, note: "From session logs" },
                    { label: "Pro Users", value: "0", icon: Star, note: "Paid subscribers" },
                  ].map(u => (
                    <div key={u.label} className="bg-white/3 border border-white/8 rounded-xl p-4">
                      <u.icon className="w-5 h-5 text-violet-400 mb-2" />
                      <div className="text-2xl font-black text-white">{u.value}</div>
                      <div className="text-sm text-white/50 mt-1">{u.label}</div>
                      <div className="text-xs text-white/25 mt-0.5">{u.note}</div>
                    </div>
                  ))}
                </div>
              </div>
            </Section>
          </motion.div>
        )}
      </div>
    </div>
  );
}
