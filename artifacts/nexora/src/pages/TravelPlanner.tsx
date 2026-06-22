import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Map, Loader2, ChevronDown, ChevronUp, Sun, Coffee, Moon, Lightbulb } from "lucide-react";

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
  { id: "cairo-eg", name: "Cairo" },
  { id: "toronto-ca", name: "Toronto" },
  { id: "sao-paulo-br", name: "São Paulo" },
];

const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
const INTEREST_OPTIONS = ["Culture & History", "Food & Dining", "Nightlife", "Nature & Parks", "Shopping", "Art & Museums", "Adventure", "Local Neighborhoods", "Hidden Gems"];

const crowdColors: Record<string, string> = {
  "Low": "text-green-400 bg-green-400/10",
  "Moderate": "text-yellow-400 bg-yellow-400/10",
  "High": "text-red-400 bg-red-400/10",
};

export default function TravelPlanner() {
  const [city, setCity] = useState("tokyo-jp");
  const [days, setDays] = useState(4);
  const [month, setMonth] = useState(MONTHS[new Date().getMonth()]);
  const [interests, setInterests] = useState<string[]>(["Culture & History", "Food & Dining"]);
  const [plan, setPlan] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [expandedDay, setExpandedDay] = useState<number | null>(0);

  function toggleInterest(i: string) {
    setInterests(prev => prev.includes(i) ? prev.filter(x => x !== i) : [...prev, i]);
  }

  async function generate() {
    setLoading(true);
    setPlan(null);
    try {
      const res = await fetch("/api/planner/itinerary", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ city, days, month, interests }),
      });
      const data = await res.json();
      setPlan(data);
      setExpandedDay(0);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="p-6 md:p-10 max-w-5xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center border border-primary/30">
          <Map className="w-6 h-6 text-primary" />
        </div>
        <div>
          <h1 className="text-3xl font-bold text-white">AI Travel Planner</h1>
          <p className="text-white/60 text-sm">AI-powered day-by-day itineraries using crowd & vibe data</p>
        </div>
      </div>

      <div className="bg-card border border-white/10 rounded-2xl p-6 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="text-xs text-white/50 uppercase tracking-wider mb-2 block">Destination</label>
            <select value={city} onChange={e => setCity(e.target.value)} className="w-full bg-background border border-white/10 text-white rounded-lg px-3 py-2.5 text-sm">
              {PLACES.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs text-white/50 uppercase tracking-wider mb-2 block">Duration</label>
            <div className="flex items-center gap-3">
              <input type="range" min={2} max={10} value={days} onChange={e => setDays(+e.target.value)} className="flex-1 accent-primary" />
              <span className="text-white font-bold w-12 text-center">{days}d</span>
            </div>
          </div>
          <div>
            <label className="text-xs text-white/50 uppercase tracking-wider mb-2 block">Travel Month</label>
            <select value={month} onChange={e => setMonth(e.target.value)} className="w-full bg-background border border-white/10 text-white rounded-lg px-3 py-2.5 text-sm">
              {MONTHS.map(m => <option key={m}>{m}</option>)}
            </select>
          </div>
        </div>

        <div>
          <label className="text-xs text-white/50 uppercase tracking-wider mb-2 block">Your Interests</label>
          <div className="flex flex-wrap gap-2">
            {INTEREST_OPTIONS.map(i => (
              <button key={i} onClick={() => toggleInterest(i)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${interests.includes(i) ? "bg-primary text-black" : "bg-white/5 text-white/60 hover:bg-white/10 border border-white/10"}`}>
                {i}
              </button>
            ))}
          </div>
        </div>

        <button onClick={generate} disabled={loading}
          className="w-full flex items-center justify-center gap-2 py-3 bg-primary text-black rounded-xl font-bold hover:bg-primary/90 disabled:opacity-50 transition-all">
          {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Map className="w-5 h-5" />}
          {loading ? "Planning your trip..." : "Generate Itinerary"}
        </button>
      </div>

      {plan && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-card border border-white/10 rounded-xl p-4">
              <p className="text-xs text-white/40 uppercase tracking-wider mb-1">Best Time Note</p>
              <p className="text-sm text-white/80">{plan.bestTimeNote}</p>
            </div>
            <div className="bg-card border border-white/10 rounded-xl p-4">
              <p className="text-xs text-white/40 uppercase tracking-wider mb-1">Budget Estimate</p>
              <p className="text-sm text-white font-bold">{plan.budgetEstimate}</p>
            </div>
            <div className="bg-card border border-white/10 rounded-xl p-4">
              <p className="text-xs text-white/40 uppercase tracking-wider mb-1">Packing Tips</p>
              <ul className="text-xs text-white/60 space-y-0.5">
                {(plan.packingTips || []).map((t: string, i: number) => <li key={i}>• {t}</li>)}
              </ul>
            </div>
          </div>

          <div className="space-y-3">
            {(plan.itinerary || []).map((day: any, idx: number) => {
              const isOpen = expandedDay === idx;
              return (
                <div key={idx} className="bg-card border border-white/10 rounded-xl overflow-hidden">
                  <button onClick={() => setExpandedDay(isOpen ? null : idx)}
                    className="w-full flex items-center justify-between p-5 hover:bg-white/5 transition-all">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-full bg-primary/20 border border-primary/30 flex items-center justify-center text-primary font-black text-sm">
                        {day.day}
                      </div>
                      <div className="text-left">
                        <div className="font-bold text-white">{day.theme}</div>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${crowdColors[day.crowdLevel] || "text-white/50 bg-white/5"}`}>
                            Crowd: {day.crowdLevel}
                          </span>
                          {day.eventName && <span className="text-xs text-secondary/80">📅 {day.eventName}</span>}
                        </div>
                      </div>
                    </div>
                    {isOpen ? <ChevronUp className="w-5 h-5 text-white/40" /> : <ChevronDown className="w-5 h-5 text-white/40" />}
                  </button>

                  <AnimatePresence>
                    {isOpen && (
                      <motion.div initial={{ height: 0 }} animate={{ height: "auto" }} exit={{ height: 0 }} className="overflow-hidden">
                        <div className="px-5 pb-5 space-y-4 border-t border-white/10 pt-4">
                          {[
                            { label: "Morning", icon: Coffee, color: "text-yellow-400", data: day.morning },
                            { label: "Afternoon", icon: Sun, color: "text-orange-400", data: day.afternoon },
                            { label: "Evening", icon: Moon, color: "text-blue-400", data: day.evening },
                          ].map(({ label, icon: Icon, color, data: d }) => d && (
                            <div key={label} className="flex gap-4">
                              <div className={`flex-shrink-0 w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center ${color}`}>
                                <Icon className="w-4 h-4" />
                              </div>
                              <div className="flex-1">
                                <div className="text-xs text-white/40 uppercase tracking-wider mb-0.5">{label}</div>
                                <div className="font-medium text-white text-sm">{d.activity}</div>
                                <div className="text-xs text-white/50 mt-0.5">📍 {d.location}</div>
                                {d.tip && <div className="text-xs text-primary/70 mt-1 italic">💡 {d.tip}</div>}
                              </div>
                            </div>
                          ))}
                          {day.localTip && (
                            <div className="flex gap-3 bg-secondary/10 border border-secondary/20 rounded-lg p-3">
                              <Lightbulb className="w-4 h-4 text-secondary flex-shrink-0 mt-0.5" />
                              <p className="text-xs text-white/70">{day.localTip}</p>
                            </div>
                          )}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}
          </div>
        </motion.div>
      )}

      {!plan && !loading && (
        <div className="text-center py-20 text-white/30 border border-dashed border-white/10 rounded-2xl">
          <Map className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p>Configure your trip and generate an AI itinerary</p>
        </div>
      )}
    </div>
  );
}
