import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { MapPin, Loader2, Star, Clock, Gem, Search } from "lucide-react";
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer } from "recharts";

const CITIES = [
  { id: "mumbai-in", name: "Mumbai" },
  { id: "new-york-us", name: "New York" },
  { id: "london-uk", name: "London" },
  { id: "tokyo-jp", name: "Tokyo" },
  { id: "paris-fr", name: "Paris" },
  { id: "delhi-in", name: "Delhi" },
  { id: "berlin-de", name: "Berlin" },
];

const PRESETS: Record<string, string[]> = {
  "mumbai-in": ["Bandra", "Dharavi", "Colaba", "Juhu", "Lower Parel"],
  "new-york-us": ["Brooklyn", "Harlem", "SoHo", "Williamsburg", "Astoria"],
  "london-uk": ["Shoreditch", "Brixton", "Notting Hill", "Hackney", "Peckham"],
  "tokyo-jp": ["Shibuya", "Shinjuku", "Shimokitazawa", "Yanaka", "Koenji"],
  "paris-fr": ["Le Marais", "Belleville", "Montmartre", "Canal Saint-Martin", "Bastille"],
  "delhi-in": ["Hauz Khas", "Chandni Chowk", "Lajpat Nagar", "Saket", "Mehrauli"],
  "berlin-de": ["Kreuzberg", "Mitte", "Prenzlauer Berg", "Neukölln", "Friedrichshain"],
};

const DNA_LABELS: Record<string, string> = {
  food: "🍜 Food",
  nightlife: "🌙 Nightlife",
  art: "🎨 Art",
  shopping: "🛍️ Shopping",
  green: "🌿 Green",
  history: "🏛️ History",
};

export default function NeighborhoodDNA() {
  const [cityId, setCityId] = useState("mumbai-in");
  const [neighborhood, setNeighborhood] = useState("");
  const [customInput, setCustomInput] = useState("");
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [allNeighborhoods, setAllNeighborhoods] = useState<any[]>([]);
  const [loadingAll, setLoadingAll] = useState(false);

  async function loadCityNeighborhoods() {
    setLoadingAll(true);
    try {
      const res = await fetch(`/api/planner/neighborhood?cityId=${cityId}`);
      const d = await res.json();
      if (d.neighborhoods) setAllNeighborhoods(d.neighborhoods);
      else setAllNeighborhoods([]);
    } finally {
      setLoadingAll(false);
    }
  }

  useEffect(() => {
    loadCityNeighborhoods();
    setData(null);
    setNeighborhood("");
  }, [cityId]);

  async function explore(n: string) {
    setNeighborhood(n);
    setLoading(true);
    setData(null);
    try {
      const res = await fetch(`/api/planner/neighborhood?cityId=${cityId}&neighborhood=${encodeURIComponent(n.toLowerCase())}`);
      const d = await res.json();
      if (d.dna) setData(d);
    } finally {
      setLoading(false);
    }
  }

  async function searchCustom() {
    if (!customInput.trim()) return;
    await explore(customInput.trim());
  }

  const radarData = data?.dna ? Object.entries(data.dna).map(([key, val]) => ({
    subject: DNA_LABELS[key] || key,
    A: val,
    fullMark: 100,
  })) : [];

  const scoreColor = (s: number) => s >= 85 ? "text-green-400" : s >= 70 ? "text-yellow-400" : s >= 50 ? "text-primary" : "text-white/40";

  return (
    <div className="p-6 md:p-10 max-w-6xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 rounded-xl bg-accent/20 flex items-center justify-center border border-accent/30">
          <MapPin className="w-6 h-6 text-accent" />
        </div>
        <div>
          <h1 className="text-3xl font-bold text-white">Neighborhood DNA</h1>
          <p className="text-white/60 text-sm">Zoom into specific neighborhoods — personality, vibe, hidden gems</p>
        </div>
      </div>

      <div className="bg-card border border-white/10 rounded-2xl p-6 space-y-4">
        <div className="flex gap-3 flex-wrap items-end">
          <div className="flex-1 min-w-48">
            <label className="text-xs text-white/50 uppercase tracking-wider mb-2 block">City</label>
            <select value={cityId} onChange={e => setCityId(e.target.value)} className="w-full bg-background border border-white/10 text-white rounded-lg px-3 py-2.5 text-sm">
              {CITIES.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div className="flex-1 min-w-48">
            <label className="text-xs text-white/50 uppercase tracking-wider mb-2 block">Search Neighborhood</label>
            <div className="flex gap-2">
              <input value={customInput} onChange={e => setCustomInput(e.target.value)}
                onKeyDown={e => e.key === "Enter" && searchCustom()}
                placeholder="e.g. Harajuku, Montmartre..."
                className="flex-1 bg-background border border-white/10 text-white rounded-lg px-3 py-2.5 text-sm placeholder:text-white/30 focus:border-accent/50 focus:outline-none" />
              <button onClick={searchCustom} className="px-3 py-2.5 bg-accent/20 hover:bg-accent/30 border border-accent/30 rounded-lg text-accent transition-all">
                <Search className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        <div>
          <label className="text-xs text-white/50 uppercase tracking-wider mb-2 block">Popular Neighborhoods</label>
          <div className="flex flex-wrap gap-2">
            {(PRESETS[cityId] || []).map(n => (
              <button key={n} onClick={() => explore(n)}
                className={`px-3 py-1.5 rounded-lg text-xs border transition-all ${neighborhood === n ? "border-accent/50 bg-accent/10 text-accent" : "border-white/10 text-white/60 hover:border-white/30 hover:text-white"}`}>
                {n}
              </button>
            ))}
          </div>
        </div>
      </div>

      {loading && (
        <div className="text-center py-20"><Loader2 className="w-8 h-8 animate-spin text-accent mx-auto" /></div>
      )}

      {data && !loading && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div className="bg-gradient-to-br from-accent/10 via-card to-primary/5 border border-accent/20 rounded-2xl p-6">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h2 className="text-2xl font-black text-white">{data.name}</h2>
                  <div className="text-accent text-sm mt-0.5">{data.vibe}</div>
                </div>
                <div className="text-right">
                  <div className="text-4xl font-black text-primary">{data.vibeScore}</div>
                  <div className="text-xs text-white/40">Vibe Score</div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 mb-4">
                <div className="bg-black/20 rounded-xl p-3">
                  <div className="text-xs text-white/40 mb-1">Personality</div>
                  <div className="text-sm font-bold text-white">{data.personality}</div>
                </div>
                <div className="bg-black/20 rounded-xl p-3 flex items-start gap-2">
                  <Clock className="w-3 h-3 text-secondary mt-0.5 flex-shrink-0" />
                  <div>
                    <div className="text-xs text-white/40 mb-0.5">Best Time</div>
                    <div className="text-xs text-white/70">{data.bestTime}</div>
                  </div>
                </div>
              </div>

              {data.hiddenGems && (
                <div>
                  <h4 className="text-xs text-white/40 uppercase tracking-wider mb-2 flex items-center gap-1">
                    <Gem className="w-3 h-3" /> Hidden Gems
                  </h4>
                  <ul className="space-y-1.5">
                    {data.hiddenGems.map((g: string, i: number) => (
                      <li key={i} className="text-sm text-white/70 flex gap-2">
                        <Star className="w-3 h-3 text-yellow-400/60 mt-0.5 flex-shrink-0" />
                        {g}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            {data.dna && (
              <div className="bg-card border border-white/10 rounded-xl p-4">
                <h4 className="text-xs text-white/40 uppercase tracking-wider mb-3">DNA Scores</h4>
                <div className="space-y-2">
                  {Object.entries(data.dna).map(([key, val]: [string, any]) => (
                    <div key={key}>
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-white/60">{DNA_LABELS[key] || key}</span>
                        <span className={`font-bold ${scoreColor(val)}`}>{val}</span>
                      </div>
                      <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                        <div className="h-full bg-accent rounded-full" style={{ width: `${val}%` }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="bg-card border border-white/10 rounded-2xl p-6">
            <h3 className="text-lg font-bold text-white mb-4">DNA Radar</h3>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart cx="50%" cy="50%" outerRadius="80%" data={radarData}>
                  <PolarGrid stroke="rgba(255,255,255,0.08)" />
                  <PolarAngleAxis dataKey="subject" tick={{ fill: "rgba(255,255,255,0.6)", fontSize: 11 }} />
                  <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                  <Radar name="DNA" dataKey="A" stroke="hsl(var(--accent))" fill="hsl(var(--accent))" fillOpacity={0.3} />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </motion.div>
      )}

      {!data && !loading && allNeighborhoods.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {allNeighborhoods.map((n: any) => (
            <button key={n.name} onClick={() => explore(n.name)}
              className="bg-card border border-white/10 hover:border-accent/30 rounded-xl p-4 text-left transition-all hover:bg-white/5">
              <div className="flex justify-between items-start mb-2">
                <h3 className="font-bold text-white">{n.name}</h3>
                <span className="text-primary font-black">{n.vibeScore}</span>
              </div>
              <div className="text-sm text-accent/70">{n.vibe}</div>
              <div className="text-xs text-white/40 mt-1">Best: {n.bestTime}</div>
            </button>
          ))}
        </div>
      )}

      {!data && !loading && allNeighborhoods.length === 0 && (
        <div className="text-center py-20 text-white/30 border border-dashed border-white/10 rounded-2xl">
          <MapPin className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p>Select a neighborhood or search for one to explore its DNA</p>
        </div>
      )}
    </div>
  );
}
