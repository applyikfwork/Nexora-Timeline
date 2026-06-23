import React, { useState, useCallback, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Trophy, RefreshCw, Loader2, Crown, Medal, BarChart3, Zap, Clock } from "lucide-react";
import { askJSON } from "@/lib/ai";

type CityEntry = { city: string; state: string; score: number; trend: string; highlight: string; reason?: string };
type LeaderboardData = { cities: CityEntry[] };

const SECTOR_RANKINGS = [
  { sector: "🖥️ Tech & Startups", cities: ["Bangalore", "Hyderabad", "Pune", "Delhi NCR", "Mumbai"] },
  { sector: "🏦 Finance & Banking", cities: ["Mumbai", "Delhi", "Bangalore", "Ahmedabad", "Kolkata"] },
  { sector: "🏭 Manufacturing", cities: ["Pune", "Chennai", "Ahmedabad", "Ludhiana", "Coimbatore"] },
  { sector: "🎓 Education & Research", cities: ["Bangalore", "Pune", "Delhi", "Hyderabad", "Chennai"] },
  { sector: "✈️ Tourism & Hospitality", cities: ["Goa", "Jaipur", "Agra", "Kochi", "Varanasi"] },
  { sector: "🧬 Pharma & Healthcare", cities: ["Hyderabad", "Ahmedabad", "Bangalore", "Mumbai", "Pune"] },
];

function RankBadge({ rank }: { rank: number }) {
  if (rank === 1) return <div className="w-8 h-8 rounded-full bg-gradient-to-br from-amber-400 to-yellow-300 flex items-center justify-center flex-shrink-0"><Crown className="w-4 h-4 text-amber-900" /></div>;
  if (rank === 2) return <div className="w-8 h-8 rounded-full bg-gradient-to-br from-slate-300 to-gray-200 flex items-center justify-center flex-shrink-0"><Medal className="w-4 h-4 text-slate-600" /></div>;
  if (rank === 3) return <div className="w-8 h-8 rounded-full bg-gradient-to-br from-amber-600 to-orange-400 flex items-center justify-center flex-shrink-0"><Medal className="w-4 h-4 text-amber-900" /></div>;
  return <div className="w-8 h-8 rounded-full bg-white/5 border border-white/10 flex items-center justify-center flex-shrink-0 text-white/40 text-sm font-bold">{rank}</div>;
}

function SkeletonRow({ rank }: { rank: number }) {
  return (
    <div className="grid grid-cols-[auto_1fr_auto_auto] items-center gap-4 px-6 py-4 border-b border-white/5">
      <RankBadge rank={rank} />
      <div className="space-y-2">
        <div className="h-4 w-32 bg-white/8 rounded-full animate-pulse" />
        <div className="h-3 w-48 bg-white/5 rounded-full animate-pulse" />
      </div>
      <div className="text-center space-y-1">
        <div className="h-7 w-10 bg-white/8 rounded animate-pulse mx-auto" />
        <div className="h-1.5 w-16 bg-white/5 rounded-full animate-pulse" />
      </div>
      <div className="h-4 w-8 bg-white/5 rounded animate-pulse" />
    </div>
  );
}

const CATEGORIES = [
  { id: "india", label: "🇮🇳 Top India Cities" },
  { id: "global", label: "🌍 Global Cities" },
];

export default function Leaderboard() {
  const [activeCategory, setActiveCategory] = useState("india");
  const [liveData, setLiveData] = useState<Record<string, CityEntry[]>>({});
  const [loading, setLoading] = useState<Record<string, boolean>>({});
  const [updatedAt, setUpdatedAt] = useState<Record<string, Date>>({});
  const [error, setError] = useState<Record<string, boolean>>({});
  const loadedRef = useRef<Set<string>>(new Set());

  const load = useCallback(async (category: string, force = false) => {
    if (loading[category] || (loadedRef.current.has(category) && !force)) return;
    loadedRef.current.add(category);
    setLoading(l => ({ ...l, [category]: true }));
    setError(e => ({ ...e, [category]: false }));

    const isIndia = category === "india";
    const context = isIndia
      ? "top 10 Indian cities for living, working, and investing — rank by overall opportunity score in 2025. Include Tier 2 cities if rising fast."
      : "top 10 global cities for talent, business, and quality of life in 2025. Include emerging markets.";

    const data = await askJSON<LeaderboardData>(
      `AI intelligence ranking: ${context}. Score each city 0-100 based on economy, growth, culture, liveability, and future potential. Return JSON: { "cities": [{ "city": string, "state": string (country/state), "score": number, "trend": string (like "+3" or "-1" or "0"), "highlight": string (max 8 words describing the city's key strength), "reason": string (one sentence: why this rank, specific and data-driven) }] }`,
      { cities: [] }
    );

    if (data.cities?.length > 0) {
      setLiveData(d => ({ ...d, [category]: data.cities.slice(0, 10) }));
      setUpdatedAt(u => ({ ...u, [category]: new Date() }));
    } else {
      setError(e => ({ ...e, [category]: true }));
      loadedRef.current.delete(category);
    }
    setLoading(l => ({ ...l, [category]: false }));
  }, [loading]);

  useEffect(() => { load("india"); }, []);

  useEffect(() => { if (!liveData[activeCategory] && !loading[activeCategory]) load(activeCategory); }, [activeCategory]);

  const cities = liveData[activeCategory] ?? [];
  const isLoading = loading[activeCategory];
  const hasError = error[activeCategory];
  const lastUpdate = updatedAt[activeCategory];

  return (
    <div className="min-h-screen bg-[radial-gradient(ellipse_at_top,_#0d0010_0%,_#000_60%)] text-white pb-20">
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-amber-500/10 via-yellow-500/5 to-transparent" />
        <div className="relative max-w-5xl mx-auto px-4 pt-16 pb-12 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-amber-500/20 border border-amber-500/30 rounded-full text-amber-400 text-sm font-semibold mb-6">
            <Trophy className="w-4 h-4" /> AI-Powered City Rankings
          </div>
          <h1 className="text-4xl md:text-5xl font-black mb-4 bg-gradient-to-r from-amber-400 via-yellow-400 to-orange-400 bg-clip-text text-transparent">
            City Leaderboard 2025
          </h1>
          <p className="text-white/50 text-lg max-w-xl mx-auto">
            Ranked live by Gemini AI — Growth, Economy, Culture, Future potential, and Liveability.
          </p>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 space-y-8">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex gap-2">
            {CATEGORIES.map(c => (
              <button key={c.id} onClick={() => setActiveCategory(c.id)}
                className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all ${activeCategory === c.id ? "bg-amber-500 text-white" : "bg-white/5 text-white/50 hover:text-white"}`}>
                {c.label}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-3">
            {lastUpdate && (
              <div className="flex items-center gap-1.5 text-xs text-white/30">
                <Clock className="w-3 h-3" />
                Updated {Math.round((Date.now() - lastUpdate.getTime()) / 60000)}m ago
              </div>
            )}
            <button onClick={() => { loadedRef.current.delete(activeCategory); load(activeCategory, true); }}
              disabled={isLoading}
              className="flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/10 rounded-xl text-sm text-white/50 hover:text-white hover:border-amber-500/30 transition-all disabled:opacity-40">
              <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`} />
              {isLoading ? "AI Scoring…" : "Refresh"}
            </button>
          </div>
        </div>

        <div className="bg-black/40 border border-white/10 rounded-2xl overflow-hidden">
          <div className="grid grid-cols-[auto_1fr_auto_auto] items-center gap-4 px-6 py-3 border-b border-white/8 text-xs text-white/30 uppercase tracking-wider">
            <span>Rank</span><span>City</span><span className="text-center">Score</span><span className="text-right">Trend</span>
          </div>

          <AnimatePresence mode="wait">
            {isLoading ? (
              <motion.div key="skeleton" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                {Array.from({ length: 10 }, (_, i) => <SkeletonRow key={i} rank={i + 1} />)}
              </motion.div>
            ) : hasError ? (
              <motion.div key="error" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="py-16 text-center">
                <div className="text-white/30 text-sm mb-3">Could not load AI rankings. Add your Gemini API key in Admin Panel → API Keys.</div>
                <button onClick={() => { loadedRef.current.delete(activeCategory); load(activeCategory, true); }}
                  className="px-4 py-2 bg-amber-500/20 border border-amber-500/30 text-amber-400 rounded-xl text-sm hover:brightness-110">
                  Try Again
                </button>
              </motion.div>
            ) : cities.length === 0 ? (
              <motion.div key="loading-init" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="py-16 text-center">
                <Loader2 className="w-8 h-8 animate-spin text-amber-400 mx-auto mb-3" />
                <p className="text-white/30 text-sm">AI is analyzing cities…</p>
              </motion.div>
            ) : (
              <motion.div key={`data-${activeCategory}`} initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                {cities.map((entry, i) => (
                  <motion.div key={`${activeCategory}-${i}`}
                    initial={{ opacity: 0, x: -16 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.04 }}
                    className={`grid grid-cols-[auto_1fr_auto_auto] items-center gap-4 px-6 py-4 border-b border-white/5 hover:bg-white/3 transition-all ${i === 0 ? "bg-amber-500/5" : ""}`}>
                    <RankBadge rank={i + 1} />
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-white">{entry.city}</span>
                        <span className="text-xs text-white/30">{entry.state}</span>
                      </div>
                      <div className="text-xs text-white/40 mt-0.5">{entry.highlight}</div>
                      {entry.reason && <div className="text-xs text-violet-400/60 mt-0.5 italic hidden md:block">{entry.reason}</div>}
                    </div>
                    <div className="text-center">
                      <div className={`text-2xl font-black ${i === 0 ? "text-amber-400" : i === 1 ? "text-slate-300" : i === 2 ? "text-amber-600" : "text-white/70"}`}>
                        {entry.score}
                      </div>
                      <div className="h-1.5 bg-white/5 rounded-full mt-1 w-16">
                        <div className="h-full bg-gradient-to-r from-amber-500 to-yellow-400 rounded-full" style={{ width: `${entry.score}%` }} />
                      </div>
                    </div>
                    <div className={`text-right text-sm font-bold ${entry.trend?.startsWith("+") ? "text-green-400" : entry.trend?.startsWith("-") ? "text-red-400" : "text-white/30"}`}>
                      {entry.trend && entry.trend !== "0" ? entry.trend : "—"}
                    </div>
                  </motion.div>
                ))}
              </motion.div>
            )}
          </AnimatePresence>

          {cities.length > 0 && (
            <div className="px-6 py-3 border-t border-white/5 flex items-center gap-2 text-xs text-white/20">
              <Zap className="w-3 h-3 text-violet-400" />
              AI-generated rankings · Scores reflect current economic, cultural, and growth signals
            </div>
          )}
        </div>

        <div className="bg-black/40 border border-white/10 rounded-2xl p-6">
          <h3 className="font-bold mb-5 flex items-center gap-2"><BarChart3 className="w-5 h-5 text-amber-400" /> Rankings by Sector</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {SECTOR_RANKINGS.map(s => (
              <div key={s.sector}>
                <div className="text-sm font-semibold mb-2">{s.sector}</div>
                <div className="flex flex-wrap gap-1.5">
                  {s.cities.map((city, j) => (
                    <div key={`${s.sector}-${city}`} className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium border ${j === 0 ? "bg-amber-500/20 border-amber-500/30 text-amber-400" : "bg-white/3 border-white/8 text-white/50"}`}>
                      {j === 0 && <Crown className="w-3 h-3 fill-amber-400" />}
                      #{j + 1} {city}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
