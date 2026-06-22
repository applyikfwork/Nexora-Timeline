import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { BarChart3, Plus, Trash2, TrendingUp, TrendingDown, Minus, Loader2, Eye } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer, Tooltip, CartesianGrid } from "recharts";

const PLACES = [
  { id: "delhi-in", name: "Delhi", country: "India" },
  { id: "mumbai-in", name: "Mumbai", country: "India" },
  { id: "london-uk", name: "London", country: "UK" },
  { id: "new-york-us", name: "New York", country: "USA" },
  { id: "tokyo-jp", name: "Tokyo", country: "Japan" },
  { id: "paris-fr", name: "Paris", country: "France" },
  { id: "dubai-ae", name: "Dubai", country: "UAE" },
  { id: "singapore-sg", name: "Singapore", country: "Singapore" },
  { id: "seoul-kr", name: "Seoul", country: "South Korea" },
  { id: "berlin-de", name: "Berlin", country: "Germany" },
  { id: "sydney-au", name: "Sydney", country: "Australia" },
  { id: "toronto-ca", name: "Toronto", country: "Canada" },
];

interface PortfolioCity {
  id: string;
  name: string;
  country: string;
  vibeScore: number;
  crowd: number;
  traffic: number;
  trend: "up" | "down" | "stable";
  changePercent: number;
  addedAt: string;
  history: { time: string; score: number }[];
}

function generateHistory(baseScore: number) {
  const now = Date.now();
  return Array.from({ length: 24 }, (_, i) => ({
    time: new Date(now - (23 - i) * 3600000).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    score: Math.max(20, Math.min(100, baseScore + Math.floor(Math.random() * 20 - 10))),
  }));
}

function generateCityData(placeId: string, name: string, country: string): PortfolioCity {
  const baseScore = 60 + Math.floor(Math.random() * 35);
  const change = Math.floor(Math.random() * 20 - 10);
  return {
    id: placeId,
    name,
    country,
    vibeScore: baseScore,
    crowd: 30 + Math.floor(Math.random() * 60),
    traffic: 20 + Math.floor(Math.random() * 70),
    trend: change > 2 ? "up" : change < -2 ? "down" : "stable",
    changePercent: Math.abs(change),
    addedAt: new Date().toISOString(),
    history: generateHistory(baseScore),
  };
}

const TREND_ICON: Record<string, React.ReactNode> = {
  up: <TrendingUp className="w-4 h-4 text-green-400" />,
  down: <TrendingDown className="w-4 h-4 text-red-400" />,
  stable: <Minus className="w-4 h-4 text-white/40" />,
};

const TREND_COLOR: Record<string, string> = {
  up: "text-green-400",
  down: "text-red-400",
  stable: "text-white/40",
};

export default function CityPortfolio() {
  const [portfolio, setPortfolio] = useState<PortfolioCity[]>([
    generateCityData("tokyo-jp", "Tokyo", "Japan"),
    generateCityData("london-uk", "London", "UK"),
    generateCityData("new-york-us", "New York", "USA"),
  ]);
  const [addCity, setAddCity] = useState("dubai-ae");
  const [selectedCity, setSelectedCity] = useState<PortfolioCity | null>(portfolio[0]);

  function add() {
    if (portfolio.find(c => c.id === addCity)) return;
    const place = PLACES.find(p => p.id === addCity);
    if (!place) return;
    const city = generateCityData(place.id, place.name, place.country);
    setPortfolio(prev => [...prev, city]);
    setSelectedCity(city);
  }

  function remove(id: string) {
    setPortfolio(prev => {
      const updated = prev.filter(c => c.id !== id);
      if (selectedCity?.id === id) setSelectedCity(updated[0] || null);
      return updated;
    });
  }

  const available = PLACES.filter(p => !portfolio.find(c => c.id === p.id));
  const avgVibe = portfolio.length ? Math.round(portfolio.reduce((s, c) => s + c.vibeScore, 0) / portfolio.length) : 0;
  const trending = portfolio.filter(c => c.trend === "up").length;

  return (
    <div className="p-6 md:p-10 max-w-7xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center border border-primary/30">
          <BarChart3 className="w-6 h-6 text-primary" />
        </div>
        <div>
          <h1 className="text-3xl font-bold text-white">City Portfolio</h1>
          <p className="text-white/60 text-sm">Track multiple cities like a stock portfolio</p>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-card border border-white/10 rounded-xl p-4 text-center">
          <div className="text-3xl font-black text-primary">{portfolio.length}</div>
          <div className="text-xs text-white/40 uppercase tracking-wider mt-1">Cities Tracked</div>
        </div>
        <div className="bg-card border border-white/10 rounded-xl p-4 text-center">
          <div className="text-3xl font-black text-yellow-400">{avgVibe}</div>
          <div className="text-xs text-white/40 uppercase tracking-wider mt-1">Avg Vibe Score</div>
        </div>
        <div className="bg-card border border-green-500/20 rounded-xl p-4 text-center">
          <div className="text-3xl font-black text-green-400">{trending}</div>
          <div className="text-xs text-white/40 uppercase tracking-wider mt-1">Trending Up</div>
        </div>
        <div className="bg-card border border-white/10 rounded-xl p-4 text-center">
          <div className="text-3xl font-black text-white">{portfolio.length > 0 ? portfolio.sort((a, b) => b.vibeScore - a.vibeScore)[0]?.name : "—"}</div>
          <div className="text-xs text-white/40 uppercase tracking-wider mt-1">Top City</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 space-y-3">
          <div className="flex gap-2">
            <select value={addCity} onChange={e => setAddCity(e.target.value)} className="flex-1 bg-card border border-white/10 text-white rounded-lg px-3 py-2 text-sm">
              {available.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
            <button onClick={add} disabled={available.length === 0}
              className="flex items-center gap-1 px-3 py-2 bg-primary text-black rounded-lg text-sm font-bold hover:bg-primary/90 disabled:opacity-50 transition-all">
              <Plus className="w-4 h-4" />
            </button>
          </div>

          {portfolio.map(city => (
            <motion.div key={city.id} layout
              onClick={() => setSelectedCity(city)}
              className={`p-4 rounded-xl border cursor-pointer transition-all ${selectedCity?.id === city.id ? "border-primary/50 bg-primary/5" : "border-white/10 bg-card hover:border-white/30"}`}>
              <div className="flex items-center justify-between mb-2">
                <div>
                  <div className="font-bold text-white text-sm">{city.name}</div>
                  <div className="text-xs text-white/40">{city.country}</div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="text-right">
                    <div className="font-black text-white">{city.vibeScore}</div>
                    <div className={`text-xs flex items-center gap-0.5 justify-end ${TREND_COLOR[city.trend]}`}>
                      {TREND_ICON[city.trend]}
                      {city.trend !== "stable" && `${city.changePercent}%`}
                    </div>
                  </div>
                  <button onClick={e => { e.stopPropagation(); remove(city.id); }}
                    className="p-1 rounded hover:bg-red-500/20 text-white/30 hover:text-red-400 transition-all">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
              <div className="h-8">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={city.history.slice(-12)}>
                    <Line type="monotone" dataKey="score" stroke={city.trend === "up" ? "#22c55e" : city.trend === "down" ? "#ef4444" : "#00ffcc"} strokeWidth={1.5} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </motion.div>
          ))}
        </div>

        <div className="lg:col-span-2">
          {selectedCity ? (
            <motion.div key={selectedCity.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-card border border-white/10 rounded-2xl p-6 h-full">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h2 className="text-2xl font-black text-white">{selectedCity.name}</h2>
                  <div className="text-white/40 text-sm">{selectedCity.country} • Added {new Date(selectedCity.addedAt).toLocaleDateString()}</div>
                </div>
                <div className="text-right">
                  <div className="text-4xl font-black text-primary">{selectedCity.vibeScore}</div>
                  <div className={`flex items-center gap-1 justify-end text-sm ${TREND_COLOR[selectedCity.trend]}`}>
                    {TREND_ICON[selectedCity.trend]}
                    {selectedCity.trend !== "stable" ? `${selectedCity.changePercent}% ${selectedCity.trend}` : "Stable"}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="bg-background/50 rounded-xl p-4">
                  <div className="text-xs text-white/40 mb-1">Crowd Level</div>
                  <div className="text-2xl font-bold text-white mb-2">{selectedCity.crowd}%</div>
                  <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                    <div className="h-full bg-secondary rounded-full" style={{ width: `${selectedCity.crowd}%` }} />
                  </div>
                </div>
                <div className="bg-background/50 rounded-xl p-4">
                  <div className="text-xs text-white/40 mb-1">Traffic Level</div>
                  <div className="text-2xl font-bold text-white mb-2">{selectedCity.traffic}%</div>
                  <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                    <div className="h-full bg-accent rounded-full" style={{ width: `${selectedCity.traffic}%` }} />
                  </div>
                </div>
              </div>

              <div>
                <h4 className="text-sm text-white/40 uppercase tracking-wider mb-3">24-Hour Vibe History</h4>
                <div className="h-48">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={selectedCity.history}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                      <XAxis dataKey="time" stroke="rgba(255,255,255,0.2)" tick={{ fill: "rgba(255,255,255,0.3)", fontSize: 9 }} interval={5} />
                      <YAxis domain={[0, 100]} stroke="rgba(255,255,255,0.2)" tick={{ fill: "rgba(255,255,255,0.3)", fontSize: 10 }} />
                      <Tooltip contentStyle={{ backgroundColor: "hsl(var(--card))", borderColor: "rgba(255,255,255,0.1)", fontSize: 12 }} />
                      <Line type="monotone" dataKey="score" stroke="hsl(var(--primary))" strokeWidth={2} dot={false} name="Vibe Score" />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </motion.div>
          ) : (
            <div className="flex items-center justify-center h-full bg-card border border-dashed border-white/10 rounded-2xl p-10">
              <div className="text-center text-white/30">
                <Eye className="w-12 h-12 mx-auto mb-3 opacity-30" />
                <p>Select a city to view detailed trends</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
