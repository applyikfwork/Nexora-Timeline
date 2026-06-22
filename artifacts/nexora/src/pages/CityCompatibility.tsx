import React, { useState } from "react";
import { motion } from "framer-motion";
import { Heart, Loader2, ThumbsUp, ThumbsDown, MapPin, Star } from "lucide-react";

const PLACES = [
  { id: "delhi-in", name: "Delhi" },
  { id: "mumbai-in", name: "Mumbai" },
  { id: "london-uk", name: "London" },
  { id: "new-york-us", name: "New York" },
  { id: "tokyo-jp", name: "Tokyo" },
  { id: "paris-fr", name: "Paris" },
  { id: "dubai-ae", name: "Dubai" },
  { id: "singapore-sg", name: "Singapore" },
  { id: "seoul-kr", name: "Seoul" },
  { id: "berlin-de", name: "Berlin" },
  { id: "sydney-au", name: "Sydney" },
  { id: "toronto-ca", name: "Toronto" },
];

const LIFESTYLE_OPTIONS = [
  { id: "remote-work", label: "Remote Worker" },
  { id: "foodie", label: "Foodie" },
  { id: "nightlife", label: "Nightlife Lover" },
  { id: "outdoor", label: "Outdoor Enthusiast" },
  { id: "culture", label: "Culture & Arts" },
  { id: "tech", label: "Tech & Innovation" },
  { id: "family", label: "Family-Oriented" },
  { id: "budget", label: "Budget Traveler" },
  { id: "luxury", label: "Luxury Seeker" },
  { id: "social", label: "Social Butterfly" },
  { id: "introvert", label: "Introvert / Quiet Life" },
  { id: "work-life-balance", label: "Work-Life Balance" },
];

const VERDICT_COLORS: Record<string, string> = {
  "Strong Match": "text-green-400 border-green-500/30 bg-green-500/10",
  "Good Fit": "text-primary border-primary/30 bg-primary/10",
  "Challenging": "text-yellow-400 border-yellow-500/30 bg-yellow-500/10",
  "Poor Fit": "text-red-400 border-red-500/30 bg-red-500/10",
};

export default function CityCompatibility() {
  const [placeId, setPlaceId] = useState("singapore-sg");
  const [lifestyle, setLifestyle] = useState<string[]>(["remote-work", "foodie", "tech"]);
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  function toggleLifestyle(id: string) {
    setLifestyle(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  }

  async function calculate() {
    setLoading(true);
    setData(null);
    try {
      const params = new URLSearchParams({ placeId, lifestyle: lifestyle.join(",") });
      const res = await fetch(`/api/planner/compatibility?${params}`);
      setData(await res.json());
    } finally {
      setLoading(false);
    }
  }

  const scoreColor = (s: number) => s >= 80 ? "text-green-400" : s >= 65 ? "text-yellow-400" : s >= 50 ? "text-orange-400" : "text-red-400";

  return (
    <div className="p-6 md:p-10 max-w-5xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 rounded-xl bg-pink-500/20 flex items-center justify-center border border-pink-500/30">
          <Heart className="w-6 h-6 text-pink-400" />
        </div>
        <div>
          <h1 className="text-3xl font-bold text-white">City Compatibility</h1>
          <p className="text-white/60 text-sm">How well would you actually live in any city?</p>
        </div>
      </div>

      <div className="bg-card border border-white/10 rounded-2xl p-6 space-y-5">
        <div>
          <label className="text-xs text-white/50 uppercase tracking-wider mb-2 block">Pick a City</label>
          <div className="grid grid-cols-3 md:grid-cols-6 gap-2">
            {PLACES.map(p => (
              <button key={p.id} onClick={() => setPlaceId(p.id)}
                className={`py-2 px-3 rounded-lg text-xs font-medium transition-all ${placeId === p.id ? "bg-pink-500/20 border border-pink-500/40 text-pink-300" : "bg-white/5 border border-white/10 text-white/60 hover:border-white/30 hover:text-white"}`}>
                {p.name}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="text-xs text-white/50 uppercase tracking-wider mb-2 block">Your Lifestyle (select all that apply)</label>
          <div className="flex flex-wrap gap-2">
            {LIFESTYLE_OPTIONS.map(l => (
              <button key={l.id} onClick={() => toggleLifestyle(l.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${lifestyle.includes(l.id) ? "bg-primary/20 border-primary/40 text-primary" : "bg-white/5 border-white/10 text-white/60 hover:border-white/30 hover:text-white"}`}>
                {l.label}
              </button>
            ))}
          </div>
        </div>

        <button onClick={calculate} disabled={loading || lifestyle.length === 0}
          className="w-full flex items-center justify-center gap-2 py-3 bg-pink-500 text-white rounded-xl font-bold hover:bg-pink-500/90 disabled:opacity-50 transition-all">
          {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Heart className="w-5 h-5" />}
          {loading ? "Calculating compatibility..." : "Calculate My Compatibility"}
        </button>
      </div>

      {data && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
          <div className="bg-gradient-to-br from-pink-500/10 via-card to-primary/5 border border-pink-500/20 rounded-2xl p-8">
            <div className="flex flex-col md:flex-row items-center gap-6 mb-6">
              <div className="relative">
                <svg viewBox="0 0 120 120" className="w-32 h-32">
                  <circle cx="60" cy="60" r="50" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="10" />
                  <circle cx="60" cy="60" r="50" fill="none" stroke="#ec4899" strokeWidth="10"
                    strokeDasharray={`${(data.score / 100) * 314} 314`}
                    strokeLinecap="round" transform="rotate(-90 60 60)" />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <div className={`text-3xl font-black ${scoreColor(data.score)}`}>{data.score}%</div>
                  <div className="text-xs text-white/40">Match</div>
                </div>
              </div>

              <div className="flex-1 text-center md:text-left">
                <h2 className="text-3xl font-black text-white mb-1">{data.placeName}</h2>
                <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full border text-sm font-bold mb-3 ${VERDICT_COLORS[data.verdict] || VERDICT_COLORS["Good Fit"]}`}>
                  {data.verdict}
                </div>
                <p className="text-white/70 text-sm leading-relaxed">{data.why}</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-green-500/5 border border-green-500/20 rounded-xl p-4">
                <h4 className="text-green-400 font-bold text-sm mb-3 flex items-center gap-2">
                  <ThumbsUp className="w-4 h-4" /> Why You'd Love It
                </h4>
                <ul className="space-y-2">
                  {(data.pros || []).map((p: string, i: number) => (
                    <li key={i} className="text-sm text-white/70 flex gap-2">
                      <Star className="w-3 h-3 text-green-400 mt-0.5 flex-shrink-0" /> {p}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="bg-red-500/5 border border-red-500/20 rounded-xl p-4">
                <h4 className="text-red-400 font-bold text-sm mb-3 flex items-center gap-2">
                  <ThumbsDown className="w-4 h-4" /> Potential Challenges
                </h4>
                <ul className="space-y-2">
                  {(data.cons || []).map((c: string, i: number) => (
                    <li key={i} className="text-sm text-white/70 flex gap-2">
                      <span className="text-red-400/60 mt-0.5">▸</span> {c}
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {data.bestNeighborhood && (
              <div className="mt-4 bg-primary/10 border border-primary/20 rounded-xl p-4">
                <div className="flex items-center gap-2 text-primary font-bold text-sm mb-1">
                  <MapPin className="w-4 h-4" /> Your Best Neighborhood Match
                </div>
                <p className="text-white/70 text-sm">{data.bestNeighborhood}</p>
              </div>
            )}

            {data.localTip && (
              <div className="mt-4 bg-white/5 rounded-xl p-4">
                <p className="text-xs text-white/40 mb-1">💡 Insider Tip</p>
                <p className="text-sm text-white/70">{data.localTip}</p>
              </div>
            )}

            {data.similarCities && data.similarCities.length > 0 && (
              <div className="mt-4">
                <p className="text-xs text-white/40 mb-2">Also consider: {data.similarCities.join(", ")}</p>
              </div>
            )}
          </div>
        </motion.div>
      )}

      {!data && !loading && (
        <div className="text-center py-20 text-white/30 border border-dashed border-white/10 rounded-2xl">
          <Heart className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p>Pick a city and your lifestyle to calculate your compatibility</p>
        </div>
      )}
    </div>
  );
}
