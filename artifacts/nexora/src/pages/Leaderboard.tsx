import React, { useState, useCallback } from "react";
import { motion } from "framer-motion";
import { Trophy, TrendingUp, Star, MapPin, RefreshCw, Loader2, Crown, Medal, BarChart3, Globe2, Zap, Building2 } from "lucide-react";
import { askJSON } from "@/lib/ai";

type CityEntry = { city: string; state: string; score: number; trend: string; highlight: string };
type Leaderboard = { cities: CityEntry[] };

const DEFAULT_INDIA: CityEntry[] = [
  { city: "Bangalore", state: "Karnataka", score: 91, trend: "+3", highlight: "Tech hiring at all-time high" },
  { city: "Hyderabad", state: "Telangana", score: 88, trend: "+2", highlight: "Pharma + IT dual engine" },
  { city: "Mumbai", state: "Maharashtra", score: 87, trend: "0", highlight: "Finance capital, IPO season" },
  { city: "Pune", state: "Maharashtra", score: 84, trend: "+4", highlight: "Rising EV & auto sector" },
  { city: "Ahmedabad", state: "Gujarat", score: 83, trend: "+5", highlight: "GIFT City momentum" },
  { city: "Surat", state: "Gujarat", score: 82, trend: "+7", highlight: "Fastest growing metro" },
  { city: "Delhi", state: "NCR", score: 81, trend: "-1", highlight: "AQI concern, strong retail" },
  { city: "Indore", state: "M.P.", score: 80, trend: "+8", highlight: "Cleanest city 7yrs running" },
  { city: "Coimbatore", state: "Tamil Nadu", score: 79, trend: "+6", highlight: "Textile + IT renaissance" },
  { city: "Kochi", state: "Kerala", score: 78, trend: "+4", highlight: "Tourism + startup ecosystem" },
];

const DEFAULT_GLOBAL: CityEntry[] = [
  { city: "Singapore", state: "Singapore", score: 96, trend: "0", highlight: "Global finance + tech hub" },
  { city: "Dubai", state: "UAE", score: 94, trend: "+2", highlight: "NRI capital of the world" },
  { city: "Tokyo", state: "Japan", score: 93, trend: "0", highlight: "Innovation + culture leader" },
  { city: "London", state: "UK", score: 91, trend: "-1", highlight: "Finance + fintech capital" },
  { city: "Sydney", state: "Australia", score: 90, trend: "+1", highlight: "Lifestyle + tech talent" },
  { city: "New York", state: "USA", score: 89, trend: "0", highlight: "VC density unmatched" },
  { city: "Berlin", state: "Germany", score: 87, trend: "+2", highlight: "EU startup gateway" },
  { city: "Toronto", state: "Canada", score: 86, trend: "+1", highlight: "AI research cluster" },
  { city: "Bangalore", state: "India", score: 84, trend: "+3", highlight: "Best value tech city" },
  { city: "Nairobi", state: "Kenya", score: 81, trend: "+5", highlight: "Africa's Silicon Savannah" },
];

const CATEGORIES = [
  { id: "india", label: "🇮🇳 Top India Cities", data: DEFAULT_INDIA },
  { id: "global", label: "🌍 Global Cities", data: DEFAULT_GLOBAL },
];

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

export default function Leaderboard() {
  const [activeCategory, setActiveCategory] = useState("india");
  const [liveData, setLiveData] = useState<CityEntry[] | null>(null);
  const [loading, setLoading] = useState(false);

  const currentData = liveData ?? CATEGORIES.find(c => c.id === activeCategory)?.data ?? [];

  const refreshLive = useCallback(async () => {
    setLoading(true);
    setLiveData(null);
    const isIndia = activeCategory === "india";
    const context = isIndia
      ? "top 10 Indian cities for living, working, and investing in 2025"
      : "top 10 global cities for talent and business in 2025";
    const data = await askJSON<Leaderboard>(
      `Rank the ${context}. Score each 0-100. Return JSON: { "cities": [{ "city": string, "state": string, "score": number, "trend": string (e.g. "+3" or "-1" or "0"), "highlight": string (max 8 words) }] }`,
      { cities: [] }
    );
    if (data.cities && data.cities.length > 0) {
      setLiveData(data.cities.slice(0, 10));
    }
    setLoading(false);
  }, [activeCategory]);

  return (
    <div className="min-h-screen bg-[radial-gradient(ellipse_at_top,_#0d0010_0%,_#000_60%)] text-white pb-20">
      {/* Hero */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-amber-500/10 via-yellow-500/5 to-transparent" />
        <div className="relative max-w-5xl mx-auto px-4 pt-16 pb-12 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-amber-500/20 border border-amber-500/30 rounded-full text-amber-400 text-sm font-semibold mb-6">
            <Trophy className="w-4 h-4" /> City Intelligence Rankings
          </div>
          <h1 className="text-4xl md:text-5xl font-black mb-4 bg-gradient-to-r from-amber-400 via-yellow-400 to-orange-400 bg-clip-text text-transparent">
            City Leaderboard 2025
          </h1>
          <p className="text-white/50 text-lg max-w-xl mx-auto">
            Ranked by AI intelligence score — Growth, Economy, Culture, Future potential, and Liveability.
          </p>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 space-y-8">
        {/* Category Tabs + Refresh */}
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex gap-2">
            {CATEGORIES.map(c => (
              <button key={c.id} onClick={() => { setActiveCategory(c.id); setLiveData(null); }}
                className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all ${activeCategory === c.id ? "bg-amber-500 text-white" : "bg-white/5 text-white/50 hover:text-white"}`}>
                {c.label}
              </button>
            ))}
          </div>
          <button onClick={refreshLive} disabled={loading}
            className="flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/10 rounded-xl text-sm text-white/50 hover:text-white hover:border-amber-500/30 transition-all disabled:opacity-40">
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            {loading ? "AI Scoring…" : "Live AI Refresh"}
          </button>
        </div>

        {/* Leaderboard Table */}
        <div className="bg-black/40 border border-white/10 rounded-2xl overflow-hidden">
          <div className="grid grid-cols-[auto_1fr_auto_auto] items-center gap-4 px-6 py-3 border-b border-white/8 text-xs text-white/30 uppercase tracking-wider">
            <span>Rank</span>
            <span>City</span>
            <span className="text-center">Score</span>
            <span className="text-right">Trend</span>
          </div>
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <div className="text-center">
                <Loader2 className="w-8 h-8 animate-spin text-amber-400 mx-auto mb-3" />
                <p className="text-white/30 text-sm">AI is scoring cities…</p>
              </div>
            </div>
          ) : (
            currentData.map((entry, i) => (
              <motion.div key={entry.city}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05 }}
                className={`grid grid-cols-[auto_1fr_auto_auto] items-center gap-4 px-6 py-4 border-b border-white/5 hover:bg-white/3 transition-all ${i === 0 ? "bg-amber-500/5" : ""}`}>
                <RankBadge rank={i + 1} />
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-white">{entry.city}</span>
                    <span className="text-xs text-white/30">{entry.state}</span>
                  </div>
                  <div className="text-xs text-white/40 mt-0.5">{entry.highlight}</div>
                </div>
                <div className="text-center">
                  <div className={`text-2xl font-black ${i === 0 ? "text-amber-400" : i === 1 ? "text-slate-300" : i === 2 ? "text-amber-600" : "text-white/70"}`}>
                    {entry.score}
                  </div>
                  <div className="h-1.5 bg-white/5 rounded-full mt-1 w-16">
                    <div className="h-full bg-gradient-to-r from-amber-500 to-yellow-400 rounded-full" style={{ width: `${entry.score}%` }} />
                  </div>
                </div>
                <div className={`text-right text-sm font-bold ${entry.trend.startsWith("+") ? "text-green-400" : entry.trend.startsWith("-") ? "text-red-400" : "text-white/30"}`}>
                  {entry.trend !== "0" ? entry.trend : "—"}
                </div>
              </motion.div>
            ))
          )}
        </div>

        {/* Sector Rankings */}
        <div className="bg-black/40 border border-white/10 rounded-2xl p-6">
          <h3 className="font-bold mb-5 flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-amber-400" /> Rankings by Sector
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {SECTOR_RANKINGS.map(s => (
              <div key={s.sector}>
                <div className="text-sm font-semibold mb-2">{s.sector}</div>
                <div className="flex flex-wrap gap-1.5">
                  {s.cities.map((city, j) => (
                    <div key={city} className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium border ${j === 0 ? "bg-amber-500/20 border-amber-500/30 text-amber-400" : "bg-white/3 border-white/8 text-white/50"}`}>
                      {j === 0 && <Crown className="w-3 h-3 fill-amber-400" />}
                      #{j + 1} {city}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Fastest Rising */}
        <div className="bg-black/40 border border-white/10 rounded-2xl p-6">
          <h3 className="font-bold mb-4 flex items-center gap-2">
            <Zap className="w-5 h-5 text-green-400" /> Fastest Rising Cities — India 2025
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { city: "Indore", score: 80, rise: "+8pts", reason: "Smart City + clean reputation" },
              { city: "Surat", score: 82, rise: "+7pts", reason: "Diamond hub expansion" },
              { city: "Coimbatore", score: 79, rise: "+6pts", reason: "IT company migrations" },
              { city: "Ahmedabad", score: 83, rise: "+5pts", reason: "GIFT City IFSC boost" },
            ].map(c => (
              <div key={c.city} className="p-4 bg-green-500/5 border border-green-500/20 rounded-xl">
                <div className="text-green-400 font-bold text-xl">{c.rise}</div>
                <div className="font-semibold text-white mt-1">{c.city}</div>
                <div className="text-xs text-white/40 mt-1">{c.reason}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
