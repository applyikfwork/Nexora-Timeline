import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Radar, Loader2, AlertTriangle, Music, Users, Flag, Trophy, RefreshCw, Bell } from "lucide-react";
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
];

const TYPE_ICONS: Record<string, React.ElementType> = {
  festival: Music,
  sports: Trophy,
  concert: Music,
  protest: Flag,
  activity_spike: AlertTriangle,
  crowd_surge: Users,
};

const SEVERITY_STYLES: Record<string, string> = {
  high: "border-red-500/40 bg-red-500/5 text-red-400",
  moderate: "border-yellow-500/40 bg-yellow-500/5 text-yellow-400",
  low: "border-green-500/40 bg-green-500/5 text-green-400",
};

const SPIKE_COLORS: Record<string, string> = {
  high: "bg-red-500",
  moderate: "bg-yellow-500",
  low: "bg-green-500",
};

export default function EventRadar() {
  const { selectedPlace } = useAppContext();
  const [placeId, setPlaceId] = useState(selectedPlace?.id || "delhi-in");
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState<any>(null);
  const [pulseActive, setPulseActive] = useState(true);

  async function load() {
    setLoading(true);
    try {
      const res = await fetch(`/api/forecast/events?placeId=${placeId}`);
      setData(await res.json());
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, [placeId]);

  useEffect(() => {
    const interval = setInterval(() => setPulseActive(p => !p), 2000);
    return () => clearInterval(interval);
  }, []);

  const getIcon = (type: string) => TYPE_ICONS[type] || AlertTriangle;
  const getSeverityLabel = (s: string) => s === "high" ? "🔴 HIGH" : s === "moderate" ? "🟡 MODERATE" : "🟢 LOW";

  return (
    <div className="p-6 md:p-10 max-w-5xl mx-auto space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-red-500/20 flex items-center justify-center border border-red-500/30 relative">
            <Bell className="w-6 h-6 text-red-400" />
            <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full animate-pulse" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-white">Event Radar</h1>
            <p className="text-white/60 text-sm">AI-detected crowd surges, events & anomalies</p>
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

      {data && (
        <div className="flex items-center gap-4 bg-card border border-white/10 rounded-xl p-4">
          <div className="relative">
            <div className="w-12 h-12 rounded-full border-2 border-primary flex items-center justify-center">
              <div className={`w-3 h-3 rounded-full bg-primary ${pulseActive ? "opacity-100 scale-110" : "opacity-50 scale-100"} transition-all duration-500`} />
            </div>
            <div className="absolute inset-0 rounded-full border border-primary/30 animate-ping opacity-20" />
          </div>
          <div>
            <div className="font-bold text-white">{data.placeName}</div>
            <div className="text-xs text-white/40">Radar active — {data.events?.length || 0} events detected</div>
          </div>
          <div className="ml-auto text-xs text-white/30">Live monitoring</div>
        </div>
      )}

      {loading && (
        <div className="text-center py-20"><Loader2 className="w-8 h-8 animate-spin text-primary mx-auto" /></div>
      )}

      {data?.events && (
        <div className="space-y-4">
          {data.events.map((event: any, i: number) => {
            const Icon = getIcon(event.type);
            const isSelected = selected?.id === event.id;
            return (
              <motion.div key={event.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.1 }}
                className={`border rounded-2xl overflow-hidden cursor-pointer transition-all ${SEVERITY_STYLES[event.severity] || SEVERITY_STYLES.low}`}
                onClick={() => setSelected(isSelected ? null : event)}>
                <div className="p-5">
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center flex-shrink-0">
                      <Icon className="w-5 h-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 flex-wrap">
                        <h3 className="font-bold text-white">{event.name}</h3>
                        <span className="text-xs font-mono">{getSeverityLabel(event.severity)}</span>
                      </div>
                      <div className="text-sm text-white/60 mt-0.5">📍 {event.location}</div>
                      <div className="mt-2 flex items-center gap-3">
                        <div className="flex items-center gap-1.5 text-xs text-white/50">
                          <Users className="w-3 h-3" />
                          Crowd spike: <span className="font-bold">+{event.crowdSpike}%</span>
                        </div>
                        <div className="flex-1 h-1.5 bg-white/10 rounded-full overflow-hidden max-w-32">
                          <div className={`h-full ${SPIKE_COLORS[event.severity] || "bg-green-500"} rounded-full`}
                            style={{ width: `${Math.min(100, event.crowdSpike)}%` }} />
                        </div>
                      </div>
                    </div>
                    <div className="text-xs text-white/30 text-right flex-shrink-0">
                      <div>Detected</div>
                      <div>{new Date(event.detectedAt).toLocaleTimeString()}</div>
                    </div>
                  </div>
                </div>

                <AnimatePresence>
                  {isSelected && (
                    <motion.div initial={{ height: 0 }} animate={{ height: "auto" }} exit={{ height: 0 }} className="overflow-hidden">
                      <div className="px-5 pb-5 border-t border-white/10 pt-4 space-y-3">
                        <p className="text-sm text-white/70">{event.description}</p>
                        <div className="grid grid-cols-2 gap-3 text-xs">
                          <div className="bg-black/20 rounded-lg p-3">
                            <div className="text-white/40 mb-1">Event Start</div>
                            <div className="text-white font-mono">{new Date(event.startTime).toLocaleString()}</div>
                          </div>
                          <div className="bg-black/20 rounded-lg p-3">
                            <div className="text-white/40 mb-1">Type</div>
                            <div className="text-white capitalize">{event.type.replace("_", " ")}</div>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}
        </div>
      )}

      {data?.events?.length === 0 && (
        <div className="text-center py-20 text-white/30 border border-dashed border-white/10 rounded-2xl">
          <Radar className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p>No unusual events detected. City is running normally.</p>
        </div>
      )}
    </div>
  );
}
