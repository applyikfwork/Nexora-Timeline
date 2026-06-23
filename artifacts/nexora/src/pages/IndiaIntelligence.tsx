import React, { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  IndianRupee, Map, Cloud, Building2, Train, Wind, ChevronRight,
  Calendar, Flame, Sparkles, Loader2, TrendingUp, MapPin, Star,
  Sun, Droplets, AlertTriangle, Globe2, BarChart3, Users
} from "lucide-react";
import { askJSON, askAI } from "@/lib/ai";

const METROS = [
  { city: "Mumbai", state: "Maharashtra", icon: "🌊", color: "from-blue-500 to-cyan-500", tagline: "Financial capital", pop: "20.7M", score: 87 },
  { city: "Delhi", state: "Delhi NCR", icon: "🏛️", color: "from-orange-500 to-red-500", tagline: "Political nerve center", pop: "32.9M", score: 82 },
  { city: "Bangalore", state: "Karnataka", icon: "💻", color: "from-violet-500 to-indigo-500", tagline: "Tech silicon valley", pop: "12.5M", score: 91 },
  { city: "Hyderabad", state: "Telangana", icon: "🔬", color: "from-emerald-500 to-teal-500", tagline: "Pharma + IT powerhouse", pop: "9.7M", score: 88 },
  { city: "Chennai", state: "Tamil Nadu", icon: "🏭", color: "from-amber-500 to-yellow-500", tagline: "Manufacturing hub", pop: "8.7M", score: 79 },
  { city: "Pune", state: "Maharashtra", icon: "🎓", color: "from-pink-500 to-rose-500", tagline: "Education + Auto", pop: "6.8M", score: 84 },
];

const FESTIVALS = [
  { name: "Diwali", date: "Oct–Nov", cities: ["All India"], impact: "🔴 High", type: "traffic", desc: "Nationwide shutdown, massive fireworks, 30-40% hotel surge" },
  { name: "Ganesh Chaturthi", date: "Aug–Sep", cities: ["Mumbai", "Pune"], impact: "🔴 Extreme", type: "crowd", desc: "Mumbai streets impassable near Lalbaugcha Raja. Crowd density spikes 500%" },
  { name: "Durga Puja", date: "Oct", cities: ["Kolkata", "Delhi"], impact: "🟠 High", type: "crowd", desc: "Kolkata metro overwhelmed. Book hotels 3 months early" },
  { name: "IPL Season", date: "Mar–May", cities: ["All stadiums"], impact: "🟡 Medium", type: "traffic", desc: "Match-day crowds affect 5km radius around stadiums" },
  { name: "Holi", date: "Mar", cities: ["Mathura", "Vrindavan", "Delhi"], impact: "🟠 High", type: "travel", desc: "Mathura-Vrindavan bookings sold out 2 months ahead" },
  { name: "Kumbh Mela", date: "Jan–Mar (4yr)", cities: ["Prayagraj", "Haridwar"], impact: "🔴 Extreme", type: "crowd", desc: "Largest human gathering on Earth. Infrastructure strained" },
  { name: "Pongal/Makar Sankranti", date: "Jan", cities: ["Chennai", "Jaipur"], impact: "🟡 Medium", type: "travel", desc: "Mass travel to hometowns, transport fully booked" },
  { name: "Navratri", date: "Oct", cities: ["Ahmedabad", "Vadodara", "Surat"], impact: "🟠 High", type: "crowd", desc: "Garba venues packed till 4 AM for 9 nights" },
];

const MONSOON_DATA = [
  { city: "Mumbai", onset: "Jun 10", peak: "Jul", flood_risk: "Extreme", zones: "Kurla, Dharavi, Govandi", avoid: "Jul 15–Aug 15" },
  { city: "Delhi", onset: "Jun 27", peak: "Aug", flood_risk: "High", zones: "Yamuna floodplain, Mayur Vihar", avoid: "Aug 1–25" },
  { city: "Bangalore", onset: "Jun 5", peak: "Sep", flood_risk: "Medium", zones: "Koramangala, HSR Layout (flooding)", avoid: "Sep peak week" },
  { city: "Chennai", onset: "Oct (NE monsoon)", peak: "Nov", flood_risk: "High", zones: "Adyar, Velachery, Tambaram", avoid: "Nov 1–Dec 15" },
  { city: "Hyderabad", onset: "Jun 10", peak: "Aug", flood_risk: "Medium", zones: "Musi river areas", avoid: "Aug heavy rain weeks" },
  { city: "Pune", onset: "Jun 10", peak: "Jul–Aug", flood_risk: "High", zones: "Hadapsar, Kondhwa, Katraj", avoid: "Jul 20–Aug 20" },
];

const STATES = [
  { state: "Maharashtra", ease: 98, gst_zones: 15, sez: 12, score: 91, hot: "Mumbai, Pune MIDC" },
  { state: "Karnataka", ease: 95, gst_zones: 8, sez: 6, score: 89, hot: "Bangalore ITPL, KIADB" },
  { state: "Telangana", ease: 93, gst_zones: 7, sez: 9, score: 88, hot: "Hyderabad Pharma City" },
  { state: "Gujarat", ease: 96, gst_zones: 10, sez: 18, score: 92, hot: "Surat, Ahmedabad GIDC" },
  { state: "Tamil Nadu", ease: 90, gst_zones: 9, sez: 11, score: 85, hot: "Chennai Tidel Park, Coimbatore" },
  { state: "Haryana", ease: 87, gst_zones: 6, sez: 7, score: 82, hot: "Gurgaon, Manesar IMT" },
  { state: "Andhra Pradesh", ease: 85, gst_zones: 6, sez: 8, score: 80, hot: "Vizag Steel City, Amaravati" },
  { state: "Rajasthan", ease: 80, gst_zones: 5, sez: 4, score: 75, hot: "Jaipur, Neemrana" },
];

const TIER2_CITIES = [
  { city: "Surat", state: "Gujarat", growth: 94, sector: "Textiles + Diamonds", emerging: true },
  { city: "Indore", state: "Madhya Pradesh", growth: 88, sector: "F&B + Retail", emerging: true },
  { city: "Lucknow", state: "Uttar Pradesh", growth: 82, sector: "Retail + Govt", emerging: true },
  { city: "Coimbatore", state: "Tamil Nadu", growth: 86, sector: "Manufacturing + IT", emerging: true },
  { city: "Nagpur", state: "Maharashtra", growth: 80, sector: "Logistics + OZ", emerging: false },
  { city: "Kochi", state: "Kerala", growth: 83, sector: "Tourism + IT", emerging: true },
  { city: "Bhubaneswar", state: "Odisha", growth: 79, sector: "IT + Steel", emerging: false },
  { city: "Chandigarh", state: "Punjab/Haryana", growth: 78, sector: "Real Estate + Retail", emerging: false },
];

function GlassCard({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`bg-black/40 backdrop-blur-xl border border-white/10 rounded-2xl ${className}`}>
      {children}
    </div>
  );
}

function TabBtn({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button onClick={onClick}
      className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all ${active ? "bg-orange-500 text-white" : "bg-white/5 text-white/50 hover:text-white hover:bg-white/10"}`}>
      {children}
    </button>
  );
}

export default function IndiaIntelligence() {
  const [tab, setTab] = useState("metros");
  const [selectedCity, setSelectedCity] = useState<string | null>(null);
  const [cityData, setCityData] = useState<string>("");
  const [loadingCity, setLoadingCity] = useState(false);

  const analyzeCity = useCallback(async (city: string) => {
    setSelectedCity(city);
    setCityData("");
    setLoadingCity(true);
    const d = await askAI(
      `Give a detailed 5-point intelligence briefing about ${city}, India. Cover: (1) current economic activity, (2) real estate micro-market highlights, (3) infrastructure developments underway, (4) business opportunities, (5) livability score and issues. Be specific with Indian context, neighborhoods, and data points.`,
      city
    );
    setCityData(d);
    setLoadingCity(false);
  }, []);

  return (
    <div className="min-h-screen bg-[radial-gradient(ellipse_at_top,_#0d0010_0%,_#000_60%)] text-white pb-20">
      {/* Hero */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-orange-500/10 via-amber-500/5 to-transparent" />
        <div className="relative max-w-6xl mx-auto px-4 pt-16 pb-12 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-orange-500/20 border border-orange-500/30 rounded-full text-orange-400 text-sm font-semibold mb-6">
            <span className="text-lg">🇮🇳</span> India-First Intelligence
          </div>
          <h1 className="text-4xl md:text-5xl font-black mb-4 bg-gradient-to-r from-orange-400 via-amber-400 to-yellow-400 bg-clip-text text-transparent">
            India Intelligence Hub
          </h1>
          <p className="text-white/50 text-lg max-w-2xl mx-auto">
            Deep insights on Indian metros, festival calendars, monsoon intelligence, state business climate, and Tier 2 city opportunities.
          </p>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 space-y-8">
        {/* Tab Bar */}
        <div className="flex flex-wrap gap-2">
          {[
            { id: "metros", label: "🏙️ Metro Deep Dives" },
            { id: "festivals", label: "🎉 Festival Calendar" },
            { id: "monsoon", label: "🌧️ Monsoon Intelligence" },
            { id: "business", label: "💼 State Business Climate" },
            { id: "tier2", label: "📈 Tier 2 Rising" },
          ].map(t => (
            <TabBtn key={t.id} active={tab === t.id} onClick={() => setTab(t.id)}>{t.label}</TabBtn>
          ))}
        </div>

        {/* METRO DEEP DIVES */}
        {tab === "metros" && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {METROS.map(m => (
                <button key={m.city} onClick={() => analyzeCity(m.city)}
                  className={`p-5 rounded-2xl border border-white/10 text-left hover:border-white/20 transition-all group ${selectedCity === m.city ? "border-orange-500/50 bg-orange-500/5" : "bg-black/40 hover:bg-white/5"}`}>
                  <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${m.color} flex items-center justify-center text-2xl mb-3`}>
                    {m.icon}
                  </div>
                  <div className="font-bold text-white text-lg">{m.city}</div>
                  <div className="text-xs text-white/40 mb-2">{m.state} • Pop {m.pop}</div>
                  <div className="text-xs text-white/60 mb-3">{m.tagline}</div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1">
                      <Star className="w-3 h-3 text-amber-400 fill-amber-400" />
                      <span className="text-sm font-bold text-amber-400">{m.score}</span>
                    </div>
                    <span className="text-xs text-white/30 group-hover:text-orange-400 transition-colors">Deep Dive →</span>
                  </div>
                </button>
              ))}
            </div>

            {selectedCity && (
              <GlassCard className="p-6">
                <div className="flex items-center gap-3 mb-4">
                  <MapPin className="w-5 h-5 text-orange-400" />
                  <h3 className="font-bold text-lg">{selectedCity} — Intelligence Brief</h3>
                  {loadingCity && <Loader2 className="w-4 h-4 animate-spin text-orange-400 ml-auto" />}
                </div>
                {loadingCity ? (
                  <div className="space-y-3">
                    {[1, 2, 3].map(i => (
                      <div key={i} className="h-4 bg-white/5 rounded animate-pulse" style={{ width: `${70 + i * 10}%` }} />
                    ))}
                  </div>
                ) : (
                  <div className="text-white/70 text-sm leading-relaxed whitespace-pre-wrap">{cityData}</div>
                )}
              </GlassCard>
            )}

            {/* Neighborhood DNA for metros */}
            <GlassCard className="p-6">
              <h3 className="font-bold mb-4 flex items-center gap-2">
                <MapPin className="w-5 h-5 text-orange-400" /> Key Micro-Markets
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[
                  { city: "Bangalore", areas: [{ name: "Koramangala", type: "Startup hub", hot: true }, { name: "Indiranagar", type: "F&B + Nightlife", hot: true }, { name: "Whitefield", type: "IT corridor", hot: false }, { name: "HSR Layout", type: "Residential + Cafés", hot: true }] },
                  { city: "Mumbai", areas: [{ name: "BKC", type: "Finance + Corp", hot: true }, { name: "Andheri W", type: "Media + Startups", hot: true }, { name: "Bandra", type: "Luxury + Bollywood", hot: false }, { name: "Navi Mumbai", type: "Emerging residential", hot: true }] },
                  { city: "Delhi NCR", areas: [{ name: "Gurgaon Cyber City", type: "MNC headquarters", hot: true }, { name: "Noida Sector 62", type: "IT offices", hot: false }, { name: "Connaught Place", type: "Retail + Heritage", hot: false }, { name: "Dwarka Expressway", type: "New residential", hot: true }] },
                  { city: "Hyderabad", areas: [{ name: "HITEC City", type: "IT giants cluster", hot: true }, { name: "Gachibowli", type: "Co-working + Startups", hot: true }, { name: "Banjara Hills", type: "Luxury retail", hot: false }, { name: "Madhapur", type: "IT + F&B", hot: true }] },
                ].map(c => (
                  <div key={c.city}>
                    <div className="text-sm font-bold text-orange-400 mb-2">{c.city}</div>
                    <div className="space-y-1.5">
                      {c.areas.map(a => (
                        <div key={a.name} className="flex items-center justify-between py-1.5 border-b border-white/5">
                          <div>
                            <span className="text-sm text-white">{a.name}</span>
                            <span className="text-xs text-white/40 ml-2">{a.type}</span>
                          </div>
                          {a.hot && <span className="text-xs px-2 py-0.5 bg-orange-500/20 text-orange-400 rounded-full border border-orange-500/30">🔥 Hot</span>}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </GlassCard>
          </motion.div>
        )}

        {/* FESTIVAL CALENDAR */}
        {tab === "festivals" && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
            <GlassCard className="p-6">
              <div className="flex items-center gap-2 mb-2">
                <Calendar className="w-5 h-5 text-orange-400" />
                <h3 className="font-bold">India Festival Intelligence Calendar</h3>
              </div>
              <p className="text-white/40 text-sm mb-6">How major festivals affect crowd density, hotel prices, traffic, and business across India.</p>
              <div className="space-y-4">
                {FESTIVALS.map(f => (
                  <div key={f.name} className="p-4 bg-white/3 border border-white/8 rounded-xl hover:border-orange-500/30 transition-all">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-bold text-white">{f.name}</span>
                          <span className="text-xs px-2 py-0.5 bg-amber-500/20 text-amber-400 border border-amber-500/30 rounded-full">{f.date}</span>
                          <span className={`text-xs px-2 py-0.5 rounded-full border ${f.type === "crowd" ? "bg-red-500/10 text-red-400 border-red-500/20" : f.type === "traffic" ? "bg-orange-500/10 text-orange-400 border-orange-500/20" : "bg-blue-500/10 text-blue-400 border-blue-500/20"}`}>{f.type}</span>
                        </div>
                        <div className="text-xs text-white/50 mb-2">📍 {f.cities.join(", ")}</div>
                        <p className="text-sm text-white/70">{f.desc}</p>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <div className="text-sm font-bold">{f.impact}</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </GlassCard>
          </motion.div>
        )}

        {/* MONSOON INTELLIGENCE */}
        {tab === "monsoon" && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
            <GlassCard className="p-6">
              <div className="flex items-center gap-2 mb-2">
                <Cloud className="w-5 h-5 text-blue-400" />
                <h3 className="font-bold">Monsoon Intelligence — City by City</h3>
              </div>
              <p className="text-white/40 text-sm mb-6">When monsoon hits, which areas flood, and when to avoid travel. Uniquely Indian insight no global app provides.</p>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-white/10">
                      <th className="text-left py-3 text-sm text-white/40">City</th>
                      <th className="text-left py-3 text-sm text-white/40">Onset</th>
                      <th className="text-left py-3 text-sm text-white/40">Peak</th>
                      <th className="text-left py-3 text-sm text-white/40">Flood Risk</th>
                      <th className="text-left py-3 text-sm text-white/40">Vulnerable Areas</th>
                      <th className="text-left py-3 text-sm text-white/40">Avoid Dates</th>
                    </tr>
                  </thead>
                  <tbody>
                    {MONSOON_DATA.map(r => (
                      <tr key={r.city} className="border-b border-white/5 hover:bg-white/3">
                        <td className="py-3 font-semibold">{r.city}</td>
                        <td className="py-3 text-sm text-blue-400">{r.onset}</td>
                        <td className="py-3 text-sm text-white/60">{r.peak}</td>
                        <td className="py-3">
                          <span className={`text-xs px-2 py-0.5 rounded-full border font-semibold ${r.flood_risk === "Extreme" ? "bg-red-500/20 text-red-400 border-red-500/30" : r.flood_risk === "High" ? "bg-orange-500/20 text-orange-400 border-orange-500/30" : "bg-yellow-500/20 text-yellow-400 border-yellow-500/30"}`}>{r.flood_risk}</span>
                        </td>
                        <td className="py-3 text-xs text-white/50">{r.zones}</td>
                        <td className="py-3 text-xs text-red-400 font-medium">{r.avoid}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </GlassCard>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[
                { title: "🌧️ June–July", desc: "SW Monsoon hits Kerala, Karnataka, Maharashtra. Mumbai gets 2,000mm+ annual rainfall concentrated in 3 months.", tip: "Carry waterproof boots" },
                { title: "⚡ August", desc: "Peak flooding season. Avoid Yamuna flood plains in Delhi, Musi river areas in Hyderabad, and Mithi river zones in Mumbai.", tip: "Check NDMA flood alerts" },
                { title: "🌊 Oct–Dec", desc: "NE Monsoon hits Tamil Nadu. Chennai gets its annual floods. Cyclone season for coastal AP, Odisha, and West Bengal.", tip: "Book trains 2 months early" },
              ].map(c => (
                <GlassCard key={c.title} className="p-5">
                  <div className="font-bold mb-2">{c.title}</div>
                  <p className="text-sm text-white/60 mb-3">{c.desc}</p>
                  <div className="text-xs px-3 py-1.5 bg-blue-500/10 border border-blue-500/20 rounded-lg text-blue-400">💡 {c.tip}</div>
                </GlassCard>
              ))}
            </div>
          </motion.div>
        )}

        {/* STATE BUSINESS CLIMATE */}
        {tab === "business" && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
            <GlassCard className="p-6">
              <div className="flex items-center gap-2 mb-2">
                <Building2 className="w-5 h-5 text-green-400" />
                <h3 className="font-bold">State Business Climate</h3>
              </div>
              <p className="text-white/40 text-sm mb-6">Ease of doing business, GST zones, SEZ locations, and hot industrial corridors by state.</p>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-white/10">
                      <th className="text-left py-3 text-sm text-white/40">State</th>
                      <th className="text-left py-3 text-sm text-white/40">Ease Score</th>
                      <th className="text-left py-3 text-sm text-white/40">GST Zones</th>
                      <th className="text-left py-3 text-sm text-white/40">SEZ Parks</th>
                      <th className="text-left py-3 text-sm text-white/40">Intel Score</th>
                      <th className="text-left py-3 text-sm text-white/40">Hot Zones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {STATES.map(s => (
                      <tr key={s.state} className="border-b border-white/5 hover:bg-white/3">
                        <td className="py-3 font-semibold">{s.state}</td>
                        <td className="py-3">
                          <div className="flex items-center gap-2">
                            <div className="h-1.5 bg-white/10 rounded-full w-20">
                              <div className="h-full bg-green-400 rounded-full" style={{ width: `${s.ease}%` }} />
                            </div>
                            <span className="text-xs text-green-400">{s.ease}</span>
                          </div>
                        </td>
                        <td className="py-3 text-sm text-white/60">{s.gst_zones}</td>
                        <td className="py-3 text-sm text-white/60">{s.sez}</td>
                        <td className="py-3">
                          <span className={`text-sm font-bold ${s.score >= 90 ? "text-green-400" : s.score >= 85 ? "text-amber-400" : "text-orange-400"}`}>{s.score}</span>
                        </td>
                        <td className="py-3 text-xs text-white/50">{s.hot}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </GlassCard>
          </motion.div>
        )}

        {/* TIER 2 RISING */}
        {tab === "tier2" && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
            <GlassCard className="p-6">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="w-5 h-5 text-amber-400" />
                <h3 className="font-bold">Tier 2 India — Next Breakout Cities</h3>
              </div>
              <p className="text-white/40 text-sm mb-6">India's next growth engines. Lower cost of living, rising talent pools, and government investment make these the next big opportunities.</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {TIER2_CITIES.map(c => (
                  <div key={c.city} className="p-4 bg-white/3 border border-white/8 rounded-xl hover:border-amber-500/30 transition-all">
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-bold">{c.city}</span>
                          {c.emerging && <span className="text-xs px-2 py-0.5 bg-green-500/20 text-green-400 border border-green-500/30 rounded-full">🚀 Emerging</span>}
                        </div>
                        <div className="text-xs text-white/40 mb-2">{c.state}</div>
                        <div className="text-xs text-amber-400 font-medium">{c.sector}</div>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-black text-amber-400">{c.growth}</div>
                        <div className="text-xs text-white/30">Growth Score</div>
                      </div>
                    </div>
                    <div className="mt-3 h-1.5 bg-white/5 rounded-full">
                      <div className="h-full bg-gradient-to-r from-amber-500 to-yellow-400 rounded-full" style={{ width: `${c.growth}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </GlassCard>

            <GlassCard className="p-6">
              <h3 className="font-bold mb-4 flex items-center gap-2">
                <Train className="w-5 h-5 text-blue-400" /> Railway Intelligence — Major Junction Cities
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {[
                  { city: "Nagpur", type: "Geographic center of India", trains: "Zero Mile Station" },
                  { city: "Itarsi", type: "Central railway hub", trains: "Busiest junction" },
                  { city: "Mughal Sarai", type: "Largest rail yard", trains: "85+ trains/day" },
                  { city: "Vijayawada", type: "South-Central hub", trains: "Key express corridor" },
                ].map(r => (
                  <div key={r.city} className="p-3 bg-blue-500/5 border border-blue-500/20 rounded-xl">
                    <div className="font-semibold text-sm mb-1">{r.city}</div>
                    <div className="text-xs text-blue-400">{r.type}</div>
                    <div className="text-xs text-white/30 mt-1">{r.trains}</div>
                  </div>
                ))}
              </div>
            </GlassCard>
          </motion.div>
        )}
      </div>
    </div>
  );
}
