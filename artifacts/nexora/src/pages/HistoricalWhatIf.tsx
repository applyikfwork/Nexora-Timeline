import React, { useState } from "react";
import { motion } from "framer-motion";
import { BookOpen, Loader2, Clock, Users, MapPin, Quote, Sparkles } from "lucide-react";

const PLACES = [
  { id: "delhi-in", name: "Delhi" },
  { id: "mumbai-in", name: "Mumbai" },
  { id: "london-uk", name: "London" },
  { id: "new-york-us", name: "New York" },
  { id: "tokyo-jp", name: "Tokyo" },
  { id: "paris-fr", name: "Paris" },
  { id: "cairo-eg", name: "Cairo" },
  { id: "berlin-de", name: "Berlin" },
];

const PRESET_ERAS = [
  { label: "1920s — The Roaring Era", year: "1925", event: "the Roaring Twenties" },
  { label: "1940s — WWII Shadow", year: "1943", event: "World War II" },
  { label: "1960s — Cultural Revolution", year: "1965", event: "the cultural revolution of the 1960s" },
  { label: "1985 — The Cold War Era", year: "1985", event: "" },
  { label: "2000 — Y2K Moment", year: "2000", event: "the Y2K millennium" },
];

export default function HistoricalWhatIf() {
  const [placeId, setPlaceId] = useState("delhi-in");
  const [year, setYear] = useState("1985");
  const [event, setEvent] = useState("");
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  async function reconstruct() {
    setLoading(true);
    setData(null);
    try {
      const params = new URLSearchParams({ placeId, year });
      if (event) params.append("event", event);
      const res = await fetch(`/api/planner/historical?${params}`);
      setData(await res.json());
    } finally {
      setLoading(false);
    }
  }

  function applyPreset(p: typeof PRESET_ERAS[0]) {
    setYear(p.year);
    setEvent(p.event);
  }

  return (
    <div className="p-6 md:p-10 max-w-5xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 rounded-xl bg-secondary/20 flex items-center justify-center border border-secondary/30">
          <BookOpen className="w-6 h-6 text-secondary" />
        </div>
        <div>
          <h1 className="text-3xl font-bold text-white">Historical What-If</h1>
          <p className="text-white/60 text-sm">AI reconstructs what cities felt like in any era</p>
        </div>
      </div>

      <div className="bg-card border border-white/10 rounded-2xl p-6 space-y-5">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-xs text-white/50 uppercase tracking-wider mb-2 block">City</label>
            <select value={placeId} onChange={e => setPlaceId(e.target.value)} className="w-full bg-background border border-white/10 text-white rounded-lg px-3 py-2.5 text-sm">
              {PLACES.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs text-white/50 uppercase tracking-wider mb-2 block">Year</label>
            <input type="number" value={year} onChange={e => setYear(e.target.value)} min={1800} max={2023}
              className="w-full bg-background border border-white/10 text-white rounded-lg px-3 py-2.5 text-sm" />
          </div>
        </div>

        <div>
          <label className="text-xs text-white/50 uppercase tracking-wider mb-2 block">Historical Context (optional)</label>
          <input value={event} onChange={e => setEvent(e.target.value)} placeholder="e.g. during the Great Famine, the Partition, the Olympics..."
            className="w-full bg-background border border-white/10 text-white rounded-lg px-3 py-2.5 text-sm placeholder:text-white/30 focus:border-secondary/50 focus:outline-none" />
        </div>

        <div>
          <label className="text-xs text-white/50 uppercase tracking-wider mb-2 block">Quick Presets</label>
          <div className="flex flex-wrap gap-2">
            {PRESET_ERAS.map(p => (
              <button key={p.label} onClick={() => applyPreset(p)}
                className={`px-3 py-1.5 rounded-lg text-xs border transition-all ${year === p.year ? "border-secondary/50 bg-secondary/10 text-secondary" : "border-white/10 text-white/50 hover:text-white hover:border-white/30"}`}>
                {p.label}
              </button>
            ))}
          </div>
        </div>

        <button onClick={reconstruct} disabled={loading}
          className="w-full flex items-center justify-center gap-2 py-3 bg-secondary text-black rounded-xl font-bold hover:bg-secondary/90 disabled:opacity-50 transition-all">
          {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Sparkles className="w-5 h-5" />}
          {loading ? "Reconstructing the past..." : "Reconstruct City"}
        </button>
      </div>

      {data && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
          <div className="bg-gradient-to-br from-secondary/10 via-card to-primary/5 border border-secondary/30 rounded-2xl p-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="text-4xl">🕰️</div>
              <div>
                <h2 className="text-2xl font-black text-white">{data.placeName}</h2>
                <div className="text-secondary text-sm">{data.era} {data.event ? `— ${data.event}` : ""}</div>
              </div>
              {data.population && (
                <div className="ml-auto flex items-center gap-1 text-white/40 text-sm">
                  <Users className="w-4 h-4" />
                  <span>{data.population}</span>
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <h4 className="text-xs text-secondary/60 uppercase tracking-wider mb-2">Atmosphere</h4>
                  <p className="text-white/80 text-sm leading-relaxed">{data.atmosphere}</p>
                </div>
                <div>
                  <h4 className="text-xs text-secondary/60 uppercase tracking-wider mb-2">Daily Life</h4>
                  <p className="text-white/80 text-sm leading-relaxed">{data.dailyLife}</p>
                </div>
              </div>

              <div className="space-y-4">
                {data.keyEvents && (
                  <div>
                    <h4 className="text-xs text-secondary/60 uppercase tracking-wider mb-2 flex items-center gap-1">
                      <Clock className="w-3 h-3" /> Key Events
                    </h4>
                    <ul className="space-y-1">
                      {data.keyEvents.map((e: string, i: number) => (
                        <li key={i} className="text-sm text-white/70 flex gap-2">
                          <span className="text-secondary/50 mt-0.5">▸</span> {e}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                {data.landmarks && (
                  <div>
                    <h4 className="text-xs text-secondary/60 uppercase tracking-wider mb-2 flex items-center gap-1">
                      <MapPin className="w-3 h-3" /> Notable Landmarks
                    </h4>
                    <ul className="space-y-1">
                      {data.landmarks.map((l: string, i: number) => (
                        <li key={i} className="text-sm text-white/70 flex gap-2">
                          <span className="text-secondary/50 mt-0.5">▸</span> {l}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>

            {data.sensoryDescription && (
              <div className="mt-6 bg-black/20 rounded-xl p-4">
                <h4 className="text-xs text-secondary/60 uppercase tracking-wider mb-2">Sensory Experience</h4>
                <p className="text-white/70 text-sm italic">{data.sensoryDescription}</p>
              </div>
            )}

            {data.quote && (
              <div className="mt-4 border-l-2 border-secondary/40 pl-4">
                <Quote className="w-4 h-4 text-secondary/40 mb-1" />
                <p className="text-white/60 text-sm italic">{data.quote}</p>
              </div>
            )}
          </div>
        </motion.div>
      )}

      {!data && !loading && (
        <div className="text-center py-20 text-white/30 border border-dashed border-white/10 rounded-2xl">
          <BookOpen className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p>Choose a city and era, then reconstruct the past</p>
        </div>
      )}
    </div>
  );
}
