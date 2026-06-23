import React, { useState, useCallback } from "react";
import { motion } from "framer-motion";
import { Building2, TrendingUp, IndianRupee, MapPin, Loader2, Search, BarChart3, Users, Coffee, Zap, Home, Globe2, ChevronRight, Star } from "lucide-react";
import { askJSON, askAI } from "@/lib/ai";

const SECTORS = [
  { id: "cafe", label: "☕ Café / F&B", icon: "☕" },
  { id: "coworking", label: "🏢 Coworking Space", icon: "🏢" },
  { id: "retail", label: "🛍️ Retail Store", icon: "🛍️" },
  { id: "tech_office", label: "💻 Tech Office", icon: "💻" },
  { id: "clinic", label: "🏥 Clinic / Pharmacy", icon: "🏥" },
  { id: "ecommerce", label: "📦 E-commerce Warehouse", icon: "📦" },
];

const RENTAL_CITIES = [
  { city: "Bangalore (Koramangala)", type: "Commercial", yield: "6.2%", rent: "₹120-180/sqft", trend: "↑ Rising" },
  { city: "Bangalore (Whitefield)", type: "Commercial", yield: "5.8%", rent: "₹80-120/sqft", trend: "→ Stable" },
  { city: "Mumbai (BKC)", type: "Commercial", yield: "4.5%", rent: "₹250-400/sqft", trend: "→ Stable" },
  { city: "Mumbai (Andheri W)", type: "Commercial", yield: "5.2%", rent: "₹130-200/sqft", trend: "↑ Rising" },
  { city: "Hyderabad (HITEC City)", type: "Commercial", yield: "6.8%", rent: "₹65-95/sqft", trend: "↑ Rising" },
  { city: "Pune (Hinjewadi)", type: "Commercial", yield: "6.5%", rent: "₹55-85/sqft", trend: "↑ Strong" },
  { city: "Delhi (Gurgaon Cyber City)", type: "Commercial", yield: "5.5%", rent: "₹110-160/sqft", trend: "→ Stable" },
  { city: "Surat (Ring Road)", type: "Commercial", yield: "7.2%", rent: "₹40-65/sqft", trend: "↑ Strong" },
];

const RESIDENTIAL_YIELDS = [
  { city: "Bangalore (Sarjapur)", yield: "3.8%", price: "₹65-85 L", trend: "↑" },
  { city: "Hyderabad (Miyapur)", yield: "3.5%", price: "₹45-65 L", trend: "↑" },
  { city: "Pune (Wakad)", yield: "3.2%", price: "₹55-75 L", trend: "↑" },
  { city: "Mumbai (Navi Mumbai)", yield: "2.8%", price: "₹80-120 L", trend: "→" },
  { city: "Chennai (OMR)", yield: "3.4%", price: "₹50-80 L", trend: "↑" },
  { city: "Ahmedabad (SG Highway)", yield: "3.9%", price: "₹40-60 L", trend: "↑" },
];

type MarketEntry = {
  marketSize: string; competition: string; opportunity: string;
  estimatedRevenue: string; risks: string; recommendation: string;
};

export default function BusinessIntelligence() {
  const [city, setCity] = useState("");
  const [sector, setSector] = useState("cafe");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<MarketEntry | null>(null);
  const [fullAnalysis, setFullAnalysis] = useState("");
  const [tab, setTab] = useState("market");

  const analyze = useCallback(async () => {
    if (!city.trim()) return;
    setLoading(true);
    setResult(null);
    setFullAnalysis("");
    const sectorLabel = SECTORS.find(s => s.id === sector)?.label ?? sector;

    const [data, analysis] = await Promise.all([
      askJSON<MarketEntry>(
        `Market entry analysis for opening a ${sectorLabel} in ${city}, India. Return JSON: { "marketSize": string, "competition": "Low/Medium/High/Saturated", "opportunity": string (score 0-100 + reason), "estimatedRevenue": string (monthly INR range), "risks": string (2-3 key risks), "recommendation": "Excellent/Good/Moderate/Poor" }`,
        { marketSize: "N/A", competition: "Medium", opportunity: "50 - moderate opportunity", estimatedRevenue: "₹2-5L/month", risks: "Market saturation, location risk", recommendation: "Moderate" }
      ),
      askAI(
        `Detailed business intelligence for opening a ${sectorLabel} in ${city}, India. Cover: (1) Best neighborhoods/areas to open, (2) Target customer profile, (3) Competition landscape, (4) Pricing strategy, (5) Growth potential. Be specific with local context, street names, and INR figures.`,
        city
      ),
    ]);
    setResult(data);
    setFullAnalysis(analysis);
    setLoading(false);
  }, [city, sector]);

  const getRecColor = (rec: string) => {
    if (rec === "Excellent") return "text-green-400 bg-green-500/10 border-green-500/30";
    if (rec === "Good") return "text-blue-400 bg-blue-500/10 border-blue-500/30";
    if (rec === "Moderate") return "text-amber-400 bg-amber-500/10 border-amber-500/30";
    return "text-red-400 bg-red-500/10 border-red-500/30";
  };

  return (
    <div className="min-h-screen bg-[radial-gradient(ellipse_at_top,_#0d0010_0%,_#000_60%)] text-white pb-20">
      {/* Hero */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-green-500/10 via-emerald-500/5 to-transparent" />
        <div className="relative max-w-5xl mx-auto px-4 pt-16 pb-12 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-green-500/20 border border-green-500/30 rounded-full text-green-400 text-sm font-semibold mb-6">
            <Building2 className="w-4 h-4" /> Business Intelligence
          </div>
          <h1 className="text-4xl md:text-5xl font-black mb-4 bg-gradient-to-r from-green-400 via-emerald-400 to-teal-400 bg-clip-text text-transparent">
            India Business Intel
          </h1>
          <p className="text-white/50 text-lg max-w-xl mx-auto">
            Market entry analysis, rental yields, competitor density, and revenue estimates for any Indian city.
          </p>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 space-y-6">
        {/* Tabs */}
        <div className="flex gap-2 flex-wrap">
          {[
            { id: "market", label: "🎯 Market Entry" },
            { id: "rental", label: "🏠 Rental Yields" },
          ].map(t => (
            <button key={t.id} onClick={() => setTab(t.id)}
              className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all ${tab === t.id ? "bg-green-500 text-white" : "bg-white/5 text-white/50 hover:text-white"}`}>
              {t.label}
            </button>
          ))}
        </div>

        {tab === "market" && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
            {/* Input */}
            <div className="bg-black/40 border border-white/10 rounded-2xl p-6 space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-white/50 mb-2 block">Target City</label>
                  <div className="relative">
                    <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                    <input value={city} onChange={e => setCity(e.target.value)} placeholder="e.g. Indore, Coimbatore, Kochi…"
                      className="w-full bg-white/5 border border-white/10 rounded-xl pl-11 pr-4 py-3 text-white placeholder:text-white/30 focus:outline-none focus:border-green-500/50" />
                  </div>
                </div>
                <div>
                  <label className="text-sm text-white/50 mb-2 block">Business Sector</label>
                  <select value={sector} onChange={e => setSector(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-green-500/50">
                    {SECTORS.map(s => (
                      <option key={s.id} value={s.id} className="bg-black">{s.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Quick cities */}
              <div>
                <div className="text-xs text-white/30 mb-2">Quick select cities</div>
                <div className="flex flex-wrap gap-2">
                  {["Mumbai", "Bangalore", "Delhi", "Hyderabad", "Pune", "Surat", "Indore", "Jaipur"].map(c => (
                    <button key={c} onClick={() => setCity(c)}
                      className={`text-xs px-3 py-1.5 rounded-full border transition-all ${city === c ? "bg-green-500/20 border-green-500/40 text-green-400" : "bg-white/5 border-white/10 text-white/40 hover:text-white"}`}>
                      {c}
                    </button>
                  ))}
                </div>
              </div>

              <button onClick={analyze} disabled={!city.trim() || loading}
                className="w-full py-3.5 bg-gradient-to-r from-green-500 to-emerald-500 rounded-xl font-bold disabled:opacity-40 hover:brightness-110 transition-all flex items-center justify-center gap-2">
                {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Analyzing market…</> : <><BarChart3 className="w-4 h-4" /> Analyze Market Entry</>}
              </button>
            </div>

            {/* Results */}
            {result && (
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="p-4 bg-black/40 border border-white/10 rounded-xl text-center">
                    <div className="text-xs text-white/40 mb-1">Market Size</div>
                    <div className="font-bold text-green-400">{result.marketSize}</div>
                  </div>
                  <div className="p-4 bg-black/40 border border-white/10 rounded-xl text-center">
                    <div className="text-xs text-white/40 mb-1">Competition</div>
                    <div className="font-bold text-white">{result.competition}</div>
                  </div>
                  <div className="p-4 bg-black/40 border border-white/10 rounded-xl text-center">
                    <div className="text-xs text-white/40 mb-1">Est. Monthly Revenue</div>
                    <div className="font-bold text-amber-400">{result.estimatedRevenue}</div>
                  </div>
                  <div className={`p-4 rounded-xl text-center border ${getRecColor(result.recommendation)}`}>
                    <div className="text-xs text-white/40 mb-1">Recommendation</div>
                    <div className="font-bold">{result.recommendation}</div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-5 bg-green-500/5 border border-green-500/20 rounded-xl">
                    <div className="text-xs text-green-400 font-bold mb-2 uppercase">Opportunity</div>
                    <p className="text-sm text-white/70">{result.opportunity}</p>
                  </div>
                  <div className="p-5 bg-red-500/5 border border-red-500/20 rounded-xl">
                    <div className="text-xs text-red-400 font-bold mb-2 uppercase">Key Risks</div>
                    <p className="text-sm text-white/70">{result.risks}</p>
                  </div>
                </div>

                {fullAnalysis && (
                  <div className="bg-black/40 border border-white/10 rounded-xl p-5">
                    <div className="text-xs text-white/40 font-bold mb-3 uppercase">Full Intelligence Report</div>
                    <p className="text-sm text-white/70 leading-relaxed whitespace-pre-wrap">{fullAnalysis}</p>
                  </div>
                )}
              </motion.div>
            )}
          </motion.div>
        )}

        {tab === "rental" && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
            <div className="bg-black/40 border border-white/10 rounded-2xl p-6">
              <h3 className="font-bold mb-4 flex items-center gap-2">
                <IndianRupee className="w-5 h-5 text-green-400" /> Commercial Rental Yields — India 2025
              </h3>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-white/10">
                      <th className="text-left py-3 text-xs text-white/40">Location</th>
                      <th className="text-left py-3 text-xs text-white/40">Gross Yield</th>
                      <th className="text-left py-3 text-xs text-white/40">Rent/sqft/month</th>
                      <th className="text-left py-3 text-xs text-white/40">Trend</th>
                    </tr>
                  </thead>
                  <tbody>
                    {RENTAL_CITIES.map(r => (
                      <tr key={r.city} className="border-b border-white/5 hover:bg-white/3">
                        <td className="py-3 text-sm font-medium">{r.city}</td>
                        <td className="py-3">
                          <span className={`text-sm font-bold ${parseFloat(r.yield) >= 6.5 ? "text-green-400" : parseFloat(r.yield) >= 5.5 ? "text-amber-400" : "text-white/60"}`}>{r.yield}</span>
                        </td>
                        <td className="py-3 text-sm text-white/60">{r.rent}</td>
                        <td className="py-3 text-sm">{r.trend.includes("↑") ? <span className="text-green-400">{r.trend}</span> : <span className="text-white/40">{r.trend}</span>}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="bg-black/40 border border-white/10 rounded-2xl p-6">
              <h3 className="font-bold mb-4 flex items-center gap-2">
                <Home className="w-5 h-5 text-green-400" /> Residential Yields — Key Micro-Markets
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {RESIDENTIAL_YIELDS.map(r => (
                  <div key={r.city} className="flex items-center justify-between p-4 bg-white/3 border border-white/8 rounded-xl">
                    <div>
                      <div className="font-medium text-sm">{r.city}</div>
                      <div className="text-xs text-white/40 mt-0.5">{r.price}</div>
                    </div>
                    <div className="text-right">
                      <div className={`text-xl font-black ${parseFloat(r.yield) >= 3.5 ? "text-green-400" : "text-amber-400"}`}>{r.yield}</div>
                      <div className="text-xs text-white/40">{r.trend}</div>
                    </div>
                  </div>
                ))}
              </div>
              <p className="text-xs text-white/20 mt-4">* Yields are indicative. Verify with local property advisors. Does not account for property tax, maintenance, vacancy.</p>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
