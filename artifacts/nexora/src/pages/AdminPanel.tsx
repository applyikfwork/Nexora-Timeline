import React, { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/lib/auth";
import { motion } from "framer-motion";
import {
  Shield, Users, Database, Zap, BarChart3, Settings, Trash2,
  RefreshCw, CheckCircle, XCircle, Eye, EyeOff, TrendingUp, Globe2,
  BrainCircuit, Lock, AlertTriangle, Activity, Server, Clock,
  Bell, Key, ExternalLink, Loader2, Send, Terminal, Star,
  ChevronDown, ChevronUp, Plus, Megaphone, PieChart,
} from "lucide-react";

const ADMIN_EMAIL = "xyzapplywork@gmail.com";
const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");

function apiFetch(path: string, opts?: RequestInit, token?: string) {
  return fetch(`${BASE}/api${path}`, {
    ...opts,
    headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}), ...(opts?.headers ?? {}) },
  });
}

function StatCard({ icon: Icon, label, value, sub, color = "violet" }: { icon: React.ElementType; label: string; value: string | number; sub?: string; color?: string }) {
  const c: Record<string, string> = {
    violet: "text-violet-400 border-violet-500/20 bg-violet-500/5",
    green: "text-green-400 border-green-500/20 bg-green-500/5",
    amber: "text-amber-400 border-amber-500/20 bg-amber-500/5",
    blue: "text-blue-400 border-blue-500/20 bg-blue-500/5",
    red: "text-red-400 border-red-500/20 bg-red-500/5",
  };
  return (
    <div className={`p-5 rounded-2xl border ${c[color]} bg-black/30`}>
      <div className="flex items-center gap-2 mb-2 text-sm text-white/50"><Icon className="w-4 h-4" />{label}</div>
      <div className="text-3xl font-black text-white">{value}</div>
      {sub && <div className="text-xs text-white/30 mt-1">{sub}</div>}
    </div>
  );
}

function Section({ title, icon: Icon, children, action }: { title: string; icon: React.ElementType; children: React.ReactNode; action?: React.ReactNode }) {
  return (
    <div className="bg-black/40 border border-white/8 rounded-2xl p-6">
      <div className="flex items-center justify-between mb-5 pb-4 border-b border-white/8">
        <div className="flex items-center gap-2"><Icon className="w-5 h-5 text-violet-400" /><h2 className="font-bold text-white">{title}</h2></div>
        {action}
      </div>
      {children}
    </div>
  );
}

function SkeletonRow() {
  return <div className="h-12 rounded-xl bg-white/5 animate-pulse mb-2" />;
}

// ── Overview Tab ────────────────────────────────────────────────────────────
function OverviewTab({ token }: { token: string }) {
  const [stats, setStats] = useState<{ totalCacheEntries: number; activeCacheEntries: number; expiredCacheEntries: number; userCount: number } | null>(null);
  const [announcement, setAnnouncement] = useState<string | null>(null);

  useEffect(() => {
    apiFetch("/admin/stats", {}, token).then(r => r.ok ? r.json() : null).then(d => d && setStats(d)).catch(() => {});
    apiFetch("/admin/announcement").then(r => r.ok ? r.json() : null).then(d => d?.message && setAnnouncement(d.message)).catch(() => {});
  }, [token]);

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      {announcement && (
        <div className="flex items-center gap-3 p-4 bg-violet-500/10 border border-violet-500/30 rounded-2xl">
          <Megaphone className="w-5 h-5 text-violet-400 flex-shrink-0" />
          <p className="text-sm text-white/80">{announcement}</p>
        </div>
      )}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard icon={Database} label="Cache Entries" value={stats?.activeCacheEntries ?? "—"} sub="Active (non-expired)" color="green" />
        <StatCard icon={Clock} label="Expired Entries" value={stats?.expiredCacheEntries ?? "—"} sub="Safe to purge" color="amber" />
        <StatCard icon={Users} label="Signed-up Users" value={stats?.userCount ?? "—"} sub="Via Supabase Auth" color="violet" />
        <StatCard icon={BrainCircuit} label="Total Cached" value={stats?.totalCacheEntries ?? "—"} sub="All cache rows" color="blue" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Section title="System Status" icon={Server}>
          {[
            { label: "API Server", detail: "Express 5 + Node 24", ok: true },
            { label: "Database", detail: "Supabase PostgreSQL", ok: !!stats },
            { label: "Auth System", detail: "Supabase Auth", ok: true },
            { label: "AI Cache", detail: "24h TTL in PostgreSQL", ok: true },
          ].map(s => (
            <div key={s.label} className="flex items-center justify-between py-3 border-b border-white/5">
              <div><div className="text-sm font-medium">{s.label}</div><div className="text-xs text-white/30">{s.detail}</div></div>
              <div className="flex items-center gap-1.5">
                {s.ok ? <CheckCircle className="w-4 h-4 text-green-400" /> : <Loader2 className="w-4 h-4 text-amber-400 animate-spin" />}
                <span className={`text-xs ${s.ok ? "text-green-400" : "text-amber-400"}`}>{s.ok ? "Online" : "Checking"}</span>
              </div>
            </div>
          ))}
        </Section>
        <Section title="Quick Actions" icon={Zap}>
          <div className="space-y-3">
            {[
              { label: "Manage API Keys", desc: "Add Gemini, Mapbox, OpenWeather", href: "api-keys", icon: Key, color: "violet" },
              { label: "View Cache Usage", desc: "Breakdown by feature type", href: "usage", icon: PieChart, color: "blue" },
              { label: "Broadcast Message", desc: "Push announcement to all users", href: "broadcast", icon: Megaphone, color: "amber" },
              { label: "Manage Users", desc: "View signed-up accounts", href: "users", icon: Users, color: "green" },
            ].map(a => (
              <button key={a.label} onClick={() => (document.querySelector(`[data-tab="${a.href}"]`) as HTMLButtonElement)?.click()}
                className="w-full flex items-center gap-3 p-3 bg-white/3 hover:bg-white/5 border border-white/8 rounded-xl transition-all text-left">
                <div className={`w-8 h-8 rounded-lg bg-${a.color}-500/20 flex items-center justify-center flex-shrink-0`}>
                  <a.icon className={`w-4 h-4 text-${a.color}-400`} />
                </div>
                <div><div className="text-sm font-medium">{a.label}</div><div className="text-xs text-white/30">{a.desc}</div></div>
              </button>
            ))}
          </div>
        </Section>
      </div>
    </motion.div>
  );
}

// ── API Keys Tab ────────────────────────────────────────────────────────────
type KeyMeta = { name: string; label: string; description: string; required: boolean; getUrl: string; envVar: string; configured: boolean; source: "env" | "db" | null };

function ApiKeysTab({ token }: { token: string }) {
  const [keys, setKeys] = useState<KeyMeta[]>([]);
  const [loading, setLoading] = useState(true);
  const [inputs, setInputs] = useState<Record<string, string>>({});
  const [shown, setShown] = useState<Record<string, boolean>>({});
  const [saving, setSaving] = useState<Record<string, boolean>>({});
  const [testing, setTesting] = useState<Record<string, boolean>>({});
  const [testResults, setTestResults] = useState<Record<string, { success: boolean; latency?: number; error?: string }>>({});

  const load = useCallback(() => {
    setLoading(true);
    apiFetch("/admin/api-keys", {}, token)
      .then(r => r.ok ? r.json() : [])
      .then((d: KeyMeta[]) => { setKeys(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, [token]);

  useEffect(() => { load(); }, [load]);

  const saveKey = async (name: string) => {
    const val = inputs[name]?.trim();
    if (!val) return;
    setSaving(s => ({ ...s, [name]: true }));
    await apiFetch(`/admin/api-keys/${name}`, { method: "POST", body: JSON.stringify({ value: val }) }, token);
    setInputs(s => ({ ...s, [name]: "" }));
    setSaving(s => ({ ...s, [name]: false }));
    load();
  };

  const removeKey = async (name: string) => {
    await apiFetch(`/admin/api-keys/${name}`, { method: "DELETE" }, token);
    load();
  };

  const testKey = async (name: string) => {
    setTesting(t => ({ ...t, [name]: true }));
    const r = await apiFetch(`/admin/api-keys/${name}/test`, { method: "POST" }, token);
    const result = await r.json() as { success: boolean; latency?: number; error?: string };
    setTestResults(t => ({ ...t, [name]: result }));
    setTesting(t => ({ ...t, [name]: false }));
  };

  if (loading) return <div className="space-y-4">{[1, 2, 3, 4].map(i => <SkeletonRow key={i} />)}</div>;

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
      <div className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-xl text-sm text-blue-300">
        Keys saved here are stored securely in your database and take priority over Replit Secrets. They are never exposed to users.
      </div>
      {keys.map(k => {
        const result = testResults[k.name];
        return (
          <div key={k.name} className="bg-black/40 border border-white/8 rounded-2xl p-5">
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${k.configured ? "bg-green-400" : "bg-red-500"}`} />
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold">{k.label}</span>
                    {k.required && <span className="text-xs px-1.5 py-0.5 bg-amber-500/20 text-amber-400 rounded-full border border-amber-500/30">Required</span>}
                    {k.configured && <span className={`text-xs px-1.5 py-0.5 rounded-full border ${k.source === "db" ? "bg-violet-500/20 text-violet-400 border-violet-500/30" : "bg-green-500/20 text-green-400 border-green-500/30"}`}>{k.source === "db" ? "Saved in DB" : "From Env"}</span>}
                  </div>
                  <div className="text-xs text-white/40 mt-0.5">{k.description}</div>
                  <div className="text-xs text-white/20 font-mono mt-0.5">{k.envVar}</div>
                </div>
              </div>
              <a href={k.getUrl} target="_blank" rel="noreferrer" className="flex items-center gap-1 text-xs text-violet-400 hover:text-violet-300 transition-colors flex-shrink-0">
                Get Key <ExternalLink className="w-3 h-3" />
              </a>
            </div>

            {result && (
              <div className={`flex items-center gap-2 p-2 rounded-lg mb-3 text-xs ${result.success ? "bg-green-500/10 text-green-400 border border-green-500/20" : "bg-red-500/10 text-red-400 border border-red-500/20"}`}>
                {result.success ? <CheckCircle className="w-3.5 h-3.5" /> : <XCircle className="w-3.5 h-3.5" />}
                {result.success ? `Working — ${result.latency}ms response` : `Failed: ${result.error}`}
              </div>
            )}

            <div className="flex gap-2">
              <div className="flex-1 relative">
                <input
                  type={shown[k.name] ? "text" : "password"}
                  placeholder={k.configured ? "Enter new key to replace…" : "Paste API key here…"}
                  value={inputs[k.name] ?? ""}
                  onChange={e => setInputs(s => ({ ...s, [k.name]: e.target.value }))}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-white/25 focus:outline-none focus:border-violet-500/60 pr-10"
                />
                <button onClick={() => setShown(s => ({ ...s, [k.name]: !s[k.name] }))} className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60">
                  {shown[k.name] ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              <button onClick={() => saveKey(k.name)} disabled={!inputs[k.name]?.trim() || saving[k.name]}
                className="px-4 py-2 bg-violet-600 hover:bg-violet-500 disabled:opacity-40 rounded-xl text-sm font-semibold transition-colors flex items-center gap-2">
                {saving[k.name] ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />} Save
              </button>
              {k.configured && (
                <>
                  <button onClick={() => testKey(k.name)} disabled={testing[k.name]}
                    className="px-4 py-2 bg-green-500/20 hover:bg-green-500/30 border border-green-500/30 rounded-xl text-sm text-green-400 transition-colors flex items-center gap-2 disabled:opacity-40">
                    {testing[k.name] ? <Loader2 className="w-4 h-4 animate-spin" /> : <Terminal className="w-4 h-4" />} Test
                  </button>
                  {k.source === "db" && (
                    <button onClick={() => removeKey(k.name)} className="px-3 py-2 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 rounded-xl text-red-400 transition-colors">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </>
              )}
            </div>
          </div>
        );
      })}
    </motion.div>
  );
}

// ── AI Usage Tab ─────────────────────────────────────────────────────────────
function UsageTab({ token }: { token: string }) {
  const [data, setData] = useState<{ byType: { type: string; count: number }[]; recent: { cacheKey: string; requestType: string; createdAt: string }[]; estimatedKB: number } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiFetch("/admin/usage", {}, token).then(r => r.ok ? r.json() : null).then(d => { setData(d); setLoading(false); }).catch(() => setLoading(false));
  }, [token]);

  const total = data?.byType.reduce((a, b) => a + Number(b.count), 0) ?? 0;

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard icon={Database} label="Total Cached Queries" value={total || "—"} sub="All time" color="violet" />
        <StatCard icon={Activity} label="Estimated Cache Size" value={data ? `${Math.round(data.estimatedKB / 1024 * 10) / 10} MB` : "—"} sub="Approximate storage used" color="blue" />
        <StatCard icon={TrendingUp} label="Feature Types" value={data?.byType.length ?? "—"} sub="Distinct AI query types" color="green" />
      </div>
      <Section title="Cache Breakdown by Feature" icon={PieChart}>
        {loading ? [1, 2, 3, 4, 5].map(i => <SkeletonRow key={i} />) : (
          <div className="space-y-2">
            {data?.byType.map(({ type, count }) => {
              const pct = total > 0 ? Math.round((Number(count) / total) * 100) : 0;
              return (
                <div key={type} className="flex items-center gap-3">
                  <div className="text-xs font-mono text-violet-400 w-40 truncate">{type}</div>
                  <div className="flex-1 h-2 bg-white/5 rounded-full overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-violet-500 to-indigo-500 rounded-full transition-all" style={{ width: `${pct}%` }} />
                  </div>
                  <div className="text-xs text-white/40 w-20 text-right">{count} ({pct}%)</div>
                </div>
              );
            })}
            {!data?.byType.length && <div className="text-center py-8 text-white/30 text-sm">No cache data yet. AI features will populate this once active.</div>}
          </div>
        )}
      </Section>
      <Section title="Recent Cache Activity" icon={Clock}>
        {loading ? [1, 2, 3].map(i => <SkeletonRow key={i} />) : (
          <div className="space-y-2">
            {data?.recent.map((r, i) => (
              <div key={i} className="flex items-center gap-3 py-2 border-b border-white/5">
                <span className="text-xs px-2 py-0.5 rounded-full bg-violet-500/20 text-violet-400 font-mono flex-shrink-0">{r.requestType}</span>
                <span className="text-xs text-white/50 flex-1 truncate font-mono">{r.cacheKey}</span>
                <span className="text-xs text-white/25 flex-shrink-0">{new Date(r.createdAt).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}</span>
              </div>
            ))}
            {!data?.recent.length && <div className="text-center py-8 text-white/30 text-sm">No recent activity.</div>}
          </div>
        )}
      </Section>
    </motion.div>
  );
}

// ── Cache Tab ─────────────────────────────────────────────────────────────────
function CacheTab({ token }: { token: string }) {
  const [entries, setEntries] = useState<Array<{ id: number; request_type: string; cache_key: string; expires_at: string; created_at: string }>>([]);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState("");
  const [clearing, setClearing] = useState<string | null>(null);
  const [types, setTypes] = useState<string[]>([]);

  const load = async (type = "") => {
    setLoading(true);
    const url = type ? `/admin/cache?type=${encodeURIComponent(type)}` : "/admin/cache";
    const r = await apiFetch(url, {}, token);
    if (r.ok) {
      const data = await r.json() as typeof entries;
      setEntries(data);
      const t = [...new Set(data.map(e => e.request_type))];
      if (!type) setTypes(t);
    }
    setLoading(false);
  };

  const clear = async (scope: string) => {
    setClearing(scope);
    if (scope === "all") await apiFetch("/admin/cache", { method: "DELETE" }, token);
    else if (scope === "expired") await apiFetch("/admin/cache/expired", { method: "DELETE" }, token);
    else await apiFetch(`/admin/cache/type/${encodeURIComponent(scope)}`, { method: "DELETE" }, token);
    setClearing(null);
    load(filter);
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      <Section title="AI Response Cache" icon={Database}
        action={
          <div className="flex gap-2">
            <button onClick={() => clear("expired")} disabled={clearing === "expired"} className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-500/20 border border-amber-500/30 text-amber-400 rounded-lg text-xs hover:brightness-110 disabled:opacity-40">
              <Trash2 className="w-3 h-3" />{clearing === "expired" ? "Clearing…" : "Clear Expired"}
            </button>
            <button onClick={() => clear("all")} disabled={clearing === "all"} className="flex items-center gap-1.5 px-3 py-1.5 bg-red-500/20 border border-red-500/30 text-red-400 rounded-lg text-xs hover:brightness-110 disabled:opacity-40">
              <Trash2 className="w-3 h-3" />{clearing === "all" ? "Clearing…" : "Clear All"}
            </button>
          </div>
        }>
        <div className="flex gap-2 mb-4">
          <select value={filter} onChange={e => { setFilter(e.target.value); load(e.target.value); }}
            className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white/70 flex-1">
            <option value="">All types</option>
            {types.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
          <button onClick={() => load(filter)} disabled={loading} className="flex items-center gap-2 px-4 py-2 bg-violet-500/20 border border-violet-500/30 rounded-lg text-violet-400 text-sm hover:brightness-110 disabled:opacity-40">
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} /> Load
          </button>
          {filter && (
            <button onClick={() => clear(filter)} disabled={clearing === filter} className="flex items-center gap-2 px-4 py-2 bg-red-500/20 border border-red-500/30 rounded-lg text-red-400 text-sm hover:brightness-110 disabled:opacity-40">
              <Trash2 className="w-4 h-4" /> Clear Type
            </button>
          )}
        </div>

        {entries.length === 0 ? (
          <div className="text-center py-10 text-white/30">
            <Database className="w-10 h-10 mx-auto mb-3 opacity-20" />
            <p>Click Load to view cached AI responses</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <div className="text-xs text-white/30 mb-3">{entries.length} entries{filter ? ` of type "${filter}"` : ""}</div>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/10">
                  {["ID", "Type", "Key", "Created", "Expires"].map(h => (
                    <th key={h} className="text-left py-2 pr-4 text-white/40 font-medium">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {entries.slice(0, 50).map(e => (
                  <tr key={e.id} className="border-b border-white/5 hover:bg-white/3">
                    <td className="py-2 pr-4 text-white/30 text-xs">{e.id}</td>
                    <td className="py-2 pr-4"><span className="px-2 py-0.5 rounded-full bg-violet-500/20 text-violet-400 text-xs">{e.request_type}</span></td>
                    <td className="py-2 pr-4 text-white/50 font-mono text-xs truncate max-w-xs">{e.cache_key}</td>
                    <td className="py-2 pr-4 text-white/30 text-xs">{new Date(e.created_at).toLocaleDateString("en-IN")}</td>
                    <td className={`py-2 text-xs ${new Date(e.expires_at) < new Date() ? "text-red-400" : "text-green-400"}`}>
                      {new Date(e.expires_at) < new Date() ? "Expired" : new Date(e.expires_at).toLocaleDateString("en-IN")}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Section>
    </motion.div>
  );
}

// ── Users Tab ─────────────────────────────────────────────────────────────────
function UsersTab({ token }: { token: string }) {
  const [data, setData] = useState<{ total: number; users: { id: string; email: string; created_at: string; last_sign_in_at: string; confirmed: boolean }[] } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiFetch("/admin/users", {}, token).then(r => r.ok ? r.json() : null).then(d => { setData(d); setLoading(false); }).catch(() => setLoading(false));
  }, [token]);

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <StatCard icon={Users} label="Total Users" value={data?.total ?? "—"} sub="Via Supabase Auth" color="violet" />
        <StatCard icon={CheckCircle} label="Confirmed" value={data?.users.filter(u => u.confirmed).length ?? "—"} sub="Email verified" color="green" />
        <StatCard icon={Star} label="Admin Users" value={1} sub="xyzapplywork@gmail.com" color="amber" />
      </div>
      <Section title="User Accounts" icon={Users}>
        {loading ? [1, 2, 3].map(i => <SkeletonRow key={i} />) : data?.users.length === 0 ? (
          <div className="text-center py-10 text-white/30">
            <Users className="w-10 h-10 mx-auto mb-3 opacity-20" />
            <p>No users yet. Share the app to start getting sign-ups.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="border-b border-white/10">{["Email", "Joined", "Last Sign-in", "Status"].map(h => <th key={h} className="text-left py-2 pr-4 text-white/40 font-medium">{h}</th>)}</tr></thead>
              <tbody>
                {data?.users.map(u => (
                  <tr key={u.id} className="border-b border-white/5 hover:bg-white/3">
                    <td className="py-3 pr-4 text-white/80 text-sm">{u.email} {u.email === ADMIN_EMAIL && <span className="ml-1 text-xs px-1.5 py-0.5 bg-violet-500/20 text-violet-400 rounded-full">admin</span>}</td>
                    <td className="py-3 pr-4 text-white/40 text-xs">{new Date(u.created_at).toLocaleDateString("en-IN")}</td>
                    <td className="py-3 pr-4 text-white/40 text-xs">{u.last_sign_in_at ? new Date(u.last_sign_in_at).toLocaleDateString("en-IN") : "Never"}</td>
                    <td className="py-3"><span className={`text-xs px-2 py-0.5 rounded-full border ${u.confirmed ? "bg-green-500/10 text-green-400 border-green-500/20" : "bg-amber-500/10 text-amber-400 border-amber-500/20"}`}>{u.confirmed ? "Confirmed" : "Pending"}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Section>
    </motion.div>
  );
}

// ── Features Tab ──────────────────────────────────────────────────────────────
function FeaturesTab({ token }: { token: string }) {
  const [flags, setFlags] = useState<{ name: string; enabled: boolean; description: string; inDb: boolean }[]>([]);
  const [loading, setLoading] = useState(true);
  const [toggling, setToggling] = useState<string | null>(null);

  const load = useCallback(() => {
    apiFetch("/admin/feature-flags", {}, token).then(r => r.ok ? r.json() : []).then(d => { setFlags(d as typeof flags); setLoading(false); }).catch(() => setLoading(false));
  }, [token]);

  useEffect(() => { load(); }, [load]);

  const toggle = async (name: string, current: boolean) => {
    setToggling(name);
    await apiFetch(`/admin/feature-flags/${name}`, { method: "POST", body: JSON.stringify({ enabled: !current }) }, token);
    setToggling(null);
    load();
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <Section title="Feature Flags" icon={Zap} action={<button onClick={load} className="text-xs text-white/30 hover:text-white/60 flex items-center gap-1"><RefreshCw className="w-3 h-3" /> Refresh</button>}>
        <p className="text-sm text-white/40 mb-5">Toggle platform features on/off. Changes take effect immediately.</p>
        {loading ? [1, 2, 3, 4].map(i => <SkeletonRow key={i} />) : (
          <div className="space-y-2">
            {flags.map(f => (
              <div key={f.name} className="flex items-center justify-between py-4 border-b border-white/5">
                <div>
                  <div className="font-semibold text-white">{f.name.replace(/_/g, " ").replace(/\b\w/g, l => l.toUpperCase())}</div>
                  <div className="text-xs text-white/40 mt-0.5">{f.description}</div>
                  <div className="text-xs text-white/20 font-mono mt-0.5">{f.name}</div>
                </div>
                <button onClick={() => toggle(f.name, f.enabled)} disabled={toggling === f.name}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold border transition-all ${f.enabled ? "bg-green-500/20 text-green-400 border-green-500/30 hover:bg-red-500/20 hover:text-red-400 hover:border-red-500/30" : "bg-red-500/20 text-red-400 border-red-500/30 hover:bg-green-500/20 hover:text-green-400 hover:border-green-500/30"}`}>
                  {toggling === f.name ? <Loader2 className="w-3 h-3 animate-spin" /> : f.enabled ? <CheckCircle className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                  {f.enabled ? "Enabled" : "Disabled"}
                </button>
              </div>
            ))}
          </div>
        )}
      </Section>
    </motion.div>
  );
}

// ── Broadcast Tab ──────────────────────────────────────────────────────────────
function BroadcastTab({ token }: { token: string }) {
  const [current, setCurrent] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);
  const [clearing, setClearing] = useState(false);

  useEffect(() => {
    apiFetch("/admin/announcement").then(r => r.ok ? r.json() : null).then(d => d?.message && setCurrent(d.message)).catch(() => {});
  }, []);

  const send = async () => {
    if (!message.trim()) return;
    setSaving(true);
    await apiFetch("/admin/announcement", { method: "POST", body: JSON.stringify({ message: message.trim() }) }, token);
    setCurrent(message.trim());
    setMessage("");
    setSaving(false);
  };

  const clear = async () => {
    setClearing(true);
    await apiFetch("/admin/announcement", { method: "DELETE" }, token);
    setCurrent(null);
    setClearing(false);
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      <Section title="System Announcement" icon={Megaphone}>
        <p className="text-sm text-white/40 mb-4">Post a message that appears as a banner across the entire platform. Great for maintenance notices or new feature announcements.</p>
        {current && (
          <div className="flex items-start gap-3 p-4 bg-violet-500/10 border border-violet-500/30 rounded-xl mb-4">
            <Bell className="w-4 h-4 text-violet-400 mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <div className="text-xs text-white/40 mb-1">Active announcement:</div>
              <p className="text-sm text-white/80">{current}</p>
            </div>
            <button onClick={clear} disabled={clearing} className="flex items-center gap-1.5 px-3 py-1.5 bg-red-500/20 border border-red-500/30 text-red-400 rounded-lg text-xs hover:brightness-110 disabled:opacity-40">
              {clearing ? <Loader2 className="w-3 h-3 animate-spin" /> : <Trash2 className="w-3 h-3" />} Clear
            </button>
          </div>
        )}
        <div className="space-y-3">
          <textarea
            value={message}
            onChange={e => setMessage(e.target.value)}
            placeholder="e.g. 🎉 Mumbai Business Intelligence Report updated with Q4 2025 data!"
            rows={3}
            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder:text-white/25 focus:outline-none focus:border-violet-500/60 resize-none"
          />
          <button onClick={send} disabled={!message.trim() || saving}
            className="flex items-center gap-2 px-5 py-2.5 bg-violet-600 hover:bg-violet-500 disabled:opacity-40 rounded-xl text-sm font-semibold transition-colors">
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            {saving ? "Sending…" : "Broadcast Announcement"}
          </button>
        </div>
      </Section>
      <Section title="Announcement Examples" icon={Bell}>
        <div className="space-y-2">
          {[
            "🎉 New: City Comparison now supports 1,000+ cities via Mapbox",
            "⚡ AI Cache refreshed — all city intelligence updated for June 2025",
            "🛠️ Brief maintenance tonight 12–1 AM IST. AI features may be slow.",
            "📊 India Tier 2 city rankings updated with new Q2 2025 data",
          ].map((ex, i) => (
            <button key={i} onClick={() => setMessage(ex)} className="w-full text-left text-sm text-white/50 hover:text-white/80 py-2 border-b border-white/5 transition-colors">
              {ex}
            </button>
          ))}
        </div>
      </Section>
    </motion.div>
  );
}

// ── Settings Tab ──────────────────────────────────────────────────────────────
function SettingsTab() {
  const items = [
    { key: "Gemini Model", value: "gemini-2.0-flash", note: "Current AI model in use" },
    { key: "AI Cache TTL", value: "24 hours", note: "Factual queries cached for 24h" },
    { key: "Time-sensitive TTL", value: "60 minutes", note: "Crowd, alerts, live data" },
    { key: "India Focus", value: "Enabled", note: "Indian cities prioritized in defaults" },
    { key: "Admin Email", value: ADMIN_EMAIL, note: "Only this email can access Admin Panel" },
    { key: "Auth Provider", value: "Supabase Auth", note: "Email/password authentication" },
    { key: "Database", value: "Supabase PostgreSQL", note: "Via SUPABASE_DATABASE_URL" },
    { key: "Session ID", value: "nexora_session_id", note: "localStorage key for anonymous users" },
  ];
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      <Section title="Platform Configuration" icon={Settings}>
        <div className="space-y-1">
          {items.map(s => (
            <div key={s.key} className="flex items-center justify-between py-3 border-b border-white/5">
              <div><div className="text-sm font-medium">{s.key}</div><div className="text-xs text-white/30">{s.note}</div></div>
              <div className="text-sm text-white/60 font-mono bg-white/5 px-3 py-1.5 rounded-lg">{s.value}</div>
            </div>
          ))}
        </div>
      </Section>
      <Section title="Environment Variables Required" icon={Lock}>
        <div className="space-y-1">
          {[
            { var: "SUPABASE_URL", where: "Backend", required: true },
            { var: "SUPABASE_SERVICE_ROLE_KEY", where: "Backend only", required: true },
            { var: "SUPABASE_ANON_KEY", where: "Backend", required: true },
            { var: "SUPABASE_DATABASE_URL", where: "Backend DB", required: true },
            { var: "VITE_SUPABASE_URL", where: "Frontend (Vite)", required: true },
            { var: "VITE_SUPABASE_ANON_KEY", where: "Frontend (Vite)", required: true },
            { var: "GEMINI_API_KEY", where: "Can also set in API Keys tab", required: false },
            { var: "MAPBOX_ACCESS_TOKEN", where: "Can also set in API Keys tab", required: false },
          ].map(e => (
            <div key={e.var} className="flex items-center justify-between py-3 border-b border-white/5">
              <div className="font-mono text-sm text-violet-400">{e.var}</div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-white/30">{e.where}</span>
                {e.required && <span className="text-xs px-2 py-0.5 bg-red-500/10 text-red-400 rounded-full border border-red-500/20">Required</span>}
              </div>
            </div>
          ))}
        </div>
      </Section>
    </motion.div>
  );
}

// ── Main Component ─────────────────────────────────────────────────────────────
export default function AdminPanel() {
  const { user, isLoaded, session } = useAuth();
  const [activeTab, setActiveTab] = useState("overview");

  const isAdmin = isLoaded && user?.email === ADMIN_EMAIL;
  const token = session?.access_token ?? "";

  const TABS = [
    { id: "overview", label: "Overview", icon: BarChart3 },
    { id: "api-keys", label: "API Keys", icon: Key },
    { id: "usage", label: "AI Usage", icon: Activity },
    { id: "cache", label: "Cache", icon: Database },
    { id: "users", label: "Users", icon: Users },
    { id: "features", label: "Features", icon: Zap },
    { id: "broadcast", label: "Broadcast", icon: Megaphone },
    { id: "settings", label: "Settings", icon: Settings },
  ];

  if (!isLoaded) {
    return <div className="min-h-screen bg-black flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-violet-400" /></div>;
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-[radial-gradient(ellipse_at_top,_#0d0010_0%,_#000_60%)] flex items-center justify-center">
        <div className="text-center"><Lock className="w-16 h-16 text-red-400 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-white mb-2">Authentication Required</h1>
          <p className="text-white/40 mb-6">Please sign in to access the Admin Panel.</p>
          <a href={`${BASE}/sign-in`} className="inline-flex items-center gap-2 px-6 py-3 bg-violet-500 rounded-xl text-white font-semibold hover:brightness-110 transition-all">Sign In</a>
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-[radial-gradient(ellipse_at_top,_#0d0010_0%,_#000_60%)] flex items-center justify-center">
        <div className="text-center"><Shield className="w-16 h-16 text-red-400 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-white mb-2">Access Denied</h1>
          <p className="text-white/40">Admin access required. Signed in as: {user.email}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[radial-gradient(ellipse_at_top,_#0d0010_0%,_#000_60%)] text-white pb-20">
      <div className="border-b border-white/8 bg-black/60 backdrop-blur-xl sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center"><Shield className="w-4 h-4 text-white" /></div>
            <div><h1 className="font-black text-lg">Admin Panel</h1><p className="text-xs text-white/30">Nexora Intelligence Platform</p></div>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
            <span className="text-sm text-white/40 hidden sm:block">{user.email}</span>
          </div>
        </div>
        <div className="max-w-7xl mx-auto px-4 pb-0 flex gap-0 overflow-x-auto">
          {TABS.map(t => (
            <button key={t.id} data-tab={t.id} onClick={() => setActiveTab(t.id)}
              className={`flex items-center gap-1.5 px-3 py-2.5 text-xs font-medium border-b-2 transition-all whitespace-nowrap ${activeTab === t.id ? "border-violet-500 text-violet-400" : "border-transparent text-white/40 hover:text-white/70"}`}>
              <t.icon className="w-3.5 h-3.5" /> {t.label}
            </button>
          ))}
        </div>
      </div>
      <div className="max-w-7xl mx-auto px-4 py-8">
        {activeTab === "overview" && <OverviewTab token={token} />}
        {activeTab === "api-keys" && <ApiKeysTab token={token} />}
        {activeTab === "usage" && <UsageTab token={token} />}
        {activeTab === "cache" && <CacheTab token={token} />}
        {activeTab === "users" && <UsersTab token={token} />}
        {activeTab === "features" && <FeaturesTab token={token} />}
        {activeTab === "broadcast" && <BroadcastTab token={token} />}
        {activeTab === "settings" && <SettingsTab />}
      </div>
    </div>
  );
}
