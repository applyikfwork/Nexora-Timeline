import React, { useState, useCallback, useRef } from "react";
import { motion } from "framer-motion";
import { Search, MapPin, Loader2, ArrowLeftRight, Star, BarChart3, TrendingUp, Globe2, Zap, Activity } from "lucide-react";
import { askJSON, askAI } from "@/lib/ai";

const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");

const POPULAR = ["Mumbai", "Bangalore", "Delhi", "Hyderabad", "Pune", "Chennai", "Dubai", "Singapore", "Surat", "Indore"];

const DIMENSIONS = [
  { key: "Growth", icon: "📈", color: "from-green-500 to-emerald-500" },
  { key: "Activity", icon: "⚡", color: "from-yellow-500 to-amber-500" },
  { key: "Culture", icon: "🎭", color: "from-pink-500 to-rose-500" },
  { key: "Economy", icon: "💰", color: "from-blue-500 to-cyan-500" },
  { key: "Environment", icon: "🌿", color: "from-teal-500 to-green-500" },
  { key: "Future", icon: "🚀", color: "from-violet-500 to-indigo-500" },
];

type ScoreMap = Record<string, number>;

function CitySearch({ value, onChange, placeholder, color }: { value: string; onChange: (v: string) => void; placeholder: string; color: string }) {
  const [results, setResults] = useState<Array<{ id: string; name: string; country: string }>>([]);
  const [open, setOpen] = useState(false);
  const [searching, setSearching] = useState(false);
  const timer = useRef<NodeJS.Timeout | null>(null);
  const wrapRef = useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const search = (q: string) => {
    onChange(q);
    if (timer.current) clearTimeout(timer.current);
    if (q.length < 2) { setResults([]); return; }
    setOpen(true);
    timer.current = setTimeout(async () => {
      setSearching(true);
      try {
        const r = await fetch(`${BASE}/api/places/search?q=${encodeURIComponent(q)}&limit=5`);
        const data = await r.json() as Array<{ id: string; name: string; country: string }>;
        setResults(data);
      } finally {
        setSearching(false);
      }
    }, 300);
  };

  return (
    <div ref={wrapRef} className="relative">
      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
        <input value={value} onChange={e => search(e.target.value)}
          onFocus={() => value.length > 1 && setOpen(true)}
          placeholder={placeholder}
          className={`w-full bg-black/40 border ${color} rounded-xl pl-11 pr-4 py-3.5 text-white placeholder:text-white/30 focus:outline-none transition-colors`}
        />
        {searching && <Loader2 className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 animate-spin text-violet-400" />}
      </div>
      {open && results.length > 0 && (
        <div className="absolute top-full mt-1 left-0 right-0 z-50 bg-black/95 border border-white/10 rounded-xl overflow-hidden shadow-2xl">
          {results.map(r => (
            <button key={r.id} onClick={() => { onChange(r.name); setOpen(false); }}
              className="w-full flex items-center gap-3 px-4 py-3 hover:bg-white/5 text-left">
              <MapPin className="w-4 h-4 text-violet-400" />
              <span className="text-sm">{r.name}</span>
              <span className="text-xs text-white/30 ml-auto">{r.country}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function RadarBar({ label, icon, v1, v2, color1, color2 }: { label: string; icon: string; v1: number; v2: number; color1: string; color2: string }) {
  return (
    <div className="mb-5">
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-sm text-white/70 flex items-center gap-1.5"><span>{icon}</span> {label}</span>
        <div className="flex items-center gap-4">
          <span className={`text-sm font-bold ${v1 > v2 ? "text-violet-400" : "text-white/40"}`}>{v1 || "—"}</span>
          <span className="text-white/20 text-xs">vs</span>
          <span className={`text-sm font-bold ${v2 > v1 ? "text-orange-400" : "text-white/40"}`}>{v2 || "—"}</span>
        </div>
      </div>
      <div className="flex gap-1 h-2 rounded-full overflow-hidden bg-white/5">
        <motion.div className={`bg-gradient-to-r ${color1} h-full rounded-l-full`}
          animate={{ width: `${(v1 / (v1 + v2 || 1)) * 100}%` }} />
        <motion.div className={`bg-gradient-to-r ${color2} h-full rounded-r-full flex-1`}
          animate={{ width: `${(v2 / (v1 + v2 || 1)) * 100}%` }} />
      </div>
    </div>
  );
}

export default function CityComparison() {
  const [city1, setCity1] = useState("");
  const [city2, setCity2] = useState("");
  const [scores1, setScores1] = useState<ScoreMap>({});
  const [scores2, setScores2] = useState<ScoreMap>({});
  const [verdict, setVerdict] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadingMsg, setLoadingMsg] = useState("");

  const compare = useCallback(async () => {
    if (!city1.trim() || !city2.trim()) return;
    setLoading(true);
    setVerdict("");
    setScores1({});
    setScores2({});

    setLoadingMsg(`Analyzing ${city1}…`);
    const [s1, s2] = await Promise.all([
      askJSON<ScoreMap>(
        `Score ${city1} on these 6 dimensions (0-100 each). Return JSON only: { "Growth": number, "Activity": number, "Culture": number, "Economy": number, "Environment": number, "Future": number }`,
        {}
      ),
      askJSON<ScoreMap>(
        `Score ${city2} on these 6 dimensions (0-100 each). Return JSON only: { "Growth": number, "Activity": number, "Culture": number, "Economy": number, "Environment": number, "Future": number }`,
        {}
      ),
    ]);
    setScores1(s1);
    setScores2(s2);

    setLoadingMsg("Writing verdict…");
    const v = await askAI(
      `Compare ${city1} vs ${city2} for someone choosing where to live, work, or invest. Give a sharp 3-paragraph verdict: (1) Where ${city1} wins, (2) Where ${city2} wins, (3) Final recommendation for whom each city is best suited. Be specific.`,
      `${city1} vs ${city2}`
    );
    setVerdict(v);
    setLoading(false);
    setLoadingMsg("");
  }, [city1, city2]);

  const city1Total = Object.values(scores1).reduce((a, b) => a + b, 0);
  const city2Total = Object.values(scores2).reduce((a, b) => a + b, 0);
  const city1Avg = city1Total ? Math.round(city1Total / 6) : 0;
  const city2Avg = city2Total ? Math.round(city2Total / 6) : 0;
  const hasScores = city1Avg > 0 && city2Avg > 0;

  return (
    <div className="min-h-screen bg-[radial-gradient(ellipse_at_top,_#0d0010_0%,_#000_60%)] text-white pb-20">
      {/* Hero */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-violet-500/10 via-indigo-500/5 to-transparent" />
        <div className="relative max-w-5xl mx-auto px-4 pt-16 pb-12 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-violet-500/20 border border-violet-500/30 rounded-full text-violet-400 text-sm font-semibold mb-6">
            <ArrowLeftRight className="w-4 h-4" /> City vs City Intelligence
          </div>
          <h1 className="text-4xl md:text-5xl font-black mb-4 bg-gradient-to-r from-violet-400 via-indigo-400 to-blue-400 bg-clip-text text-transparent">
            Compare Any Two Cities
          </h1>
          <p className="text-white/50 text-lg max-w-xl mx-auto">
            Side-by-side AI intelligence — Growth, Economy, Culture, Environment, Future potential.
          </p>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 space-y-6">
        {/* Search Row */}
        <div className="grid grid-cols-1 md:grid-cols-[1fr_auto_1fr] gap-4 items-center">
          <div className="space-y-2">
            <div className="text-xs text-violet-400 font-bold uppercase tracking-wider px-1">City A</div>
            <CitySearch value={city1} onChange={setCity1} placeholder="e.g. Bangalore"
              color="border-violet-500/40 focus:border-violet-500" />
          </div>
          <div className="hidden md:flex items-center justify-center">
            <div className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center">
              <ArrowLeftRight className="w-4 h-4 text-white/40" />
            </div>
          </div>
          <div className="space-y-2">
            <div className="text-xs text-orange-400 font-bold uppercase tracking-wider px-1">City B</div>
            <CitySearch value={city2} onChange={setCity2} placeholder="e.g. Hyderabad"
              color="border-orange-500/40 focus:border-orange-500" />
          </div>
        </div>

        {/* Popular Pairs */}
        <div>
          <div className="text-xs text-white/30 mb-2 px-1">Quick pairs</div>
          <div className="flex flex-wrap gap-2">
            {[["Bangalore", "Hyderabad"], ["Mumbai", "Delhi"], ["Pune", "Surat"], ["Chennai", "Coimbatore"], ["Bangalore", "Dubai"]].map(([a, b]) => (
              <button key={`${a}-${b}`} onClick={() => { setCity1(a); setCity2(b); }}
                className="text-xs px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-white/50 hover:text-white hover:border-violet-500/40 transition-all">
                {a} vs {b}
              </button>
            ))}
          </div>
        </div>

        <button onClick={compare} disabled={!city1.trim() || !city2.trim() || loading}
          className="w-full py-4 bg-gradient-to-r from-violet-500 via-indigo-500 to-blue-500 rounded-2xl font-bold text-lg disabled:opacity-40 hover:brightness-110 transition-all flex items-center justify-center gap-3">
          {loading ? (
            <><Loader2 className="w-5 h-5 animate-spin" /> {loadingMsg}</>
          ) : (
            <><ArrowLeftRight className="w-5 h-5" /> Compare Cities</>
          )}
        </button>

        {/* Scores */}
        {hasScores && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
            {/* Overall Scores */}
            <div className="grid grid-cols-2 gap-4">
              <div className="p-6 bg-violet-500/10 border border-violet-500/20 rounded-2xl text-center">
                <div className="text-4xl font-black text-violet-400">{city1Avg}</div>
                <div className="font-bold text-white mt-1">{city1}</div>
                <div className="text-xs text-white/40 mt-1">Overall Intelligence Score</div>
                {city1Avg > city2Avg && (
                  <div className="mt-2 inline-flex items-center gap-1 text-xs px-2 py-1 bg-violet-500/20 rounded-full text-violet-400">
                    <Star className="w-3 h-3 fill-violet-400" /> Winner
                  </div>
                )}
              </div>
              <div className="p-6 bg-orange-500/10 border border-orange-500/20 rounded-2xl text-center">
                <div className="text-4xl font-black text-orange-400">{city2Avg}</div>
                <div className="font-bold text-white mt-1">{city2}</div>
                <div className="text-xs text-white/40 mt-1">Overall Intelligence Score</div>
                {city2Avg > city1Avg && (
                  <div className="mt-2 inline-flex items-center gap-1 text-xs px-2 py-1 bg-orange-500/20 rounded-full text-orange-400">
                    <Star className="w-3 h-3 fill-orange-400" /> Winner
                  </div>
                )}
              </div>
            </div>

            {/* Dimension Bars */}
            <div className="bg-black/40 border border-white/10 rounded-2xl p-6">
              <div className="flex items-center justify-between mb-5">
                <h3 className="font-bold flex items-center gap-2"><BarChart3 className="w-5 h-5 text-violet-400" /> Dimension Breakdown</h3>
                <div className="flex items-center gap-4 text-xs">
                  <span className="flex items-center gap-1"><span className="w-3 h-1.5 rounded-full bg-violet-400 inline-block" /> {city1}</span>
                  <span className="flex items-center gap-1"><span className="w-3 h-1.5 rounded-full bg-orange-400 inline-block" /> {city2}</span>
                </div>
              </div>
              {DIMENSIONS.map(d => (
                <RadarBar key={d.key} label={d.key} icon={d.icon}
                  v1={scores1[d.key] ?? 0} v2={scores2[d.key] ?? 0}
                  color1="from-violet-500 to-violet-400" color2="from-orange-500 to-orange-400"
                />
              ))}
            </div>

            {/* Verdict */}
            {verdict && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                className="bg-black/40 border border-white/10 rounded-2xl p-6">
                <h3 className="font-bold mb-4 flex items-center gap-2">
                  <Globe2 className="w-5 h-5 text-indigo-400" /> AI Verdict: {city1} vs {city2}
                </h3>
                <div className="text-white/70 text-sm leading-relaxed whitespace-pre-wrap">{verdict}</div>
              </motion.div>
            )}
          </motion.div>
        )}

        {/* Popular choices */}
        <div className="bg-black/40 border border-white/10 rounded-2xl p-6">
          <h3 className="font-bold mb-4 text-sm text-white/40 uppercase tracking-wider">Popular Comparisons This Week</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {[
              { a: "Bangalore", b: "Hyderabad", winner: "Bangalore", reason: "Better startup ecosystem" },
              { a: "Mumbai", b: "Delhi", winner: "Mumbai", reason: "Finance & lifestyle edge" },
              { a: "Pune", b: "Surat", winner: "Surat", reason: "Faster growth trajectory" },
              { a: "Bangalore", b: "Dubai", winner: "Dubai", reason: "Quality of life wins" },
            ].map(p => (
              <button key={`${p.a}-${p.b}`} onClick={() => { setCity1(p.a); setCity2(p.b); }}
                className="flex items-center gap-3 p-3 bg-white/3 border border-white/8 rounded-xl hover:border-violet-500/30 transition-all text-left">
                <div className="text-sm font-semibold">{p.a} <span className="text-white/30">vs</span> {p.b}</div>
                <div className="ml-auto text-right">
                  <div className="text-xs text-violet-400 font-semibold">{p.winner} wins</div>
                  <div className="text-xs text-white/30">{p.reason}</div>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
