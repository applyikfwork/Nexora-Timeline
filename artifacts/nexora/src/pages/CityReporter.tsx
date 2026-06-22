import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Newspaper, Loader2, RefreshCw, Cloud, Users, Zap, TrendingUp } from "lucide-react";
import { useAppContext } from "@/lib/store";

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
  { id: "bangalore-in", name: "Bangalore" },
];

const MOOD_COLORS: Record<string, string> = {
  Tense: "text-red-400",
  Calm: "text-blue-400",
  Electric: "text-yellow-400",
  Festive: "text-pink-400",
  Vibrant: "text-primary",
  Melancholic: "text-purple-400",
  Energized: "text-green-400",
  Restless: "text-orange-400",
};

export default function CityReporter() {
  const { selectedPlace } = useAppContext();
  const [placeId, setPlaceId] = useState(selectedPlace?.id || "delhi-in");
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  async function load() {
    setLoading(true);
    setData(null);
    try {
      const res = await fetch(`/api/planner/reporter?placeId=${placeId}`);
      setData(await res.json());
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, [placeId]);

  const moodColor = data?.moodLabel ? (MOOD_COLORS[data.moodLabel] || "text-primary") : "text-primary";

  return (
    <div className="p-6 md:p-10 max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-orange-500/20 flex items-center justify-center border border-orange-500/30">
            <Newspaper className="w-6 h-6 text-orange-400" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-white">AI City Reporter</h1>
            <p className="text-white/60 text-sm">Your daily 60-second AI news brief for any city</p>
          </div>
        </div>
        <div className="flex gap-3 items-center">
          <select value={placeId} onChange={e => setPlaceId(e.target.value)} className="bg-card border border-white/10 text-white rounded-lg px-3 py-2 text-sm">
            {PLACES.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
          <button onClick={load} disabled={loading} className="flex items-center gap-2 px-3 py-2 bg-card border border-white/10 rounded-lg text-sm text-white/70 hover:text-white transition-all disabled:opacity-50">
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          </button>
        </div>
      </div>

      {loading && (
        <div className="text-center py-20 space-y-3">
          <Loader2 className="w-10 h-10 animate-spin text-orange-400 mx-auto" />
          <p className="text-white/40 text-sm">AI reporter is writing your brief...</p>
        </div>
      )}

      {data && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
          <div className="bg-gradient-to-br from-orange-500/10 via-card to-primary/5 border border-orange-500/20 rounded-2xl p-8">
            <div className="flex items-start justify-between gap-4 mb-6">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                  <span className="text-xs text-orange-400 uppercase tracking-widest font-bold">Live Report</span>
                  <span className="text-xs text-white/30 ml-2">{new Date(data.reportedAt).toLocaleTimeString()}</span>
                </div>
                <h2 className="text-2xl md:text-3xl font-black text-white leading-tight">{data.headline}</h2>
                <div className="text-orange-400/70 text-sm mt-1">{data.placeName}</div>
              </div>
              <div className="text-center flex-shrink-0">
                <div className={`text-4xl font-black ${moodColor}`}>{data.mood}</div>
                <div className="text-xs text-white/40 mt-0.5">City Mood</div>
                <div className={`text-sm font-bold mt-1 ${moodColor}`}>{data.moodLabel}</div>
              </div>
            </div>

            <div className="bg-black/20 rounded-xl p-5 mb-6">
              <p className="text-white/80 leading-relaxed">{data.brief}</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-white/5 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Cloud className="w-4 h-4 text-blue-400" />
                  <span className="text-xs text-white/40 uppercase tracking-wider">Weather Mood</span>
                </div>
                <p className="text-sm text-white/70">{data.weatherMood}</p>
              </div>
              <div className="bg-white/5 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Users className="w-4 h-4 text-yellow-400" />
                  <span className="text-xs text-white/40 uppercase tracking-wider">Crowd Alert</span>
                </div>
                <p className="text-sm text-white/70">{data.crowdAlert}</p>
              </div>
              <div className="bg-white/5 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Zap className="w-4 h-4 text-primary" />
                  <span className="text-xs text-white/40 uppercase tracking-wider">Local Buzz</span>
                </div>
                <p className="text-sm text-white/70">{data.localBuzz}</p>
              </div>
            </div>
          </div>

          <div className="bg-card border border-white/10 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-3">
              <TrendingUp className="w-4 h-4 text-primary" />
              <span className="text-sm font-bold text-white">Mood Gauge</span>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-xs text-white/30">Tense</span>
              <div className="flex-1 h-3 bg-white/5 rounded-full overflow-hidden">
                <motion.div initial={{ width: 0 }} animate={{ width: `${data.mood}%` }} transition={{ duration: 1, ease: "easeOut" }}
                  className={`h-full rounded-full ${moodColor.replace("text-", "bg-")}`} />
              </div>
              <span className="text-xs text-white/30">Electric</span>
              <span className={`text-lg font-black ${moodColor}`}>{data.mood}</span>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
}
