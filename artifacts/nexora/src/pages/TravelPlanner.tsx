import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plane, Sparkles, Search, Loader2, X, MapPin, Clock,
  Sun, Coffee, Moon, Star, Zap, ChevronRight, Check,
  ArrowUpRight, Backpack, Users, Camera, Utensils,
  Landmark, Briefcase, Heart, Mountain, Waves, RefreshCw,
  Calendar, CloudRain, TrendingUp, Flame
} from "lucide-react";

// ── DATA ─────────────────────────────────────────────────────────────
const DESTINATIONS = [
  { id: "goa-in", name: "Goa", country: "India", flag: "🇮🇳", emoji: "🏖", vibe: "Beach + Chill", bestFor: ["Relax", "Food", "Photography"], color: "#00cec9" },
  { id: "delhi-in", name: "Delhi", country: "India", flag: "🇮🇳", emoji: "🏛", vibe: "History + Culture", bestFor: ["History", "Food", "Family"], color: "#e17055" },
  { id: "mumbai-in", name: "Mumbai", country: "India", flag: "🇮🇳", emoji: "🌊", vibe: "City Energy", bestFor: ["Business", "Food", "Photography"], color: "#74b9ff" },
  { id: "jaipur-in", name: "Jaipur", country: "India", flag: "🇮🇳", emoji: "🏰", vibe: "Royal Heritage", bestFor: ["History", "Photography", "Family"], color: "#fdcb6e" },
  { id: "bangalore-in", name: "Bangalore", country: "India", flag: "🇮🇳", emoji: "💻", vibe: "Tech + Food", bestFor: ["Business", "Food", "Relax"], color: "#a29bfe" },
  { id: "kerala-in", name: "Kerala", country: "India", flag: "🇮🇳", emoji: "🌿", vibe: "Nature + Calm", bestFor: ["Relax", "Photography", "Food"], color: "#55efc4" },
  { id: "manali-in", name: "Manali", country: "India", flag: "🇮🇳", emoji: "🏔", vibe: "Mountain Adventure", bestFor: ["Adventure", "Photography", "Relax"], color: "#74b9ff" },
  { id: "varanasi-in", name: "Varanasi", country: "India", flag: "🇮🇳", emoji: "🕯", vibe: "Spiritual Journey", bestFor: ["History", "Photography", "Family"], color: "#f59e0b" },
  { id: "tokyo-jp", name: "Tokyo", country: "Japan", flag: "🇯🇵", emoji: "⛩", vibe: "Future + Tradition", bestFor: ["Adventure", "Food", "Photography"], color: "#fd79a8" },
  { id: "dubai-ae", name: "Dubai", country: "UAE", flag: "🇦🇪", emoji: "🌆", vibe: "Luxury + Business", bestFor: ["Business", "Relax", "Family"], color: "#fdcb6e" },
  { id: "singapore-sg", name: "Singapore", country: "Singapore", flag: "🇸🇬", emoji: "🦁", vibe: "Clean + Efficient", bestFor: ["Business", "Food", "Family"], color: "#00ffcc" },
  { id: "paris-fr", name: "Paris", country: "France", flag: "🇫🇷", emoji: "🗼", vibe: "Romance + Art", bestFor: ["Relax", "Photography", "Food"], color: "#e84393" },
];

const INDIA_REGIONS = [
  { name: "Rajasthan", emoji: "🏰", color: "#fdcb6e", desc: "Royal palaces, sand dunes, heritage", tags: ["Heritage", "Culture", "Photography"], cities: ["Jaipur", "Udaipur", "Jodhpur"], bestTime: "Oct–Mar" },
  { name: "Goa", emoji: "🏖", color: "#00cec9", desc: "Golden beaches, seafood, Portuguese charm", tags: ["Beach", "Food", "Nightlife"], cities: ["Panaji", "Calangute", "Palolem"], bestTime: "Nov–Feb" },
  { name: "Kerala", emoji: "🌿", color: "#55efc4", desc: "Backwaters, spice gardens, Ayurveda", tags: ["Nature", "Wellness", "Food"], cities: ["Munnar", "Alleppey", "Kochi"], bestTime: "Sep–Mar" },
  { name: "Himachal", emoji: "🏔", color: "#74b9ff", desc: "Snow peaks, adventure sports, valleys", tags: ["Adventure", "Trekking", "Scenic"], cities: ["Manali", "Dharamsala", "Spiti"], bestTime: "Mar–Jun" },
  { name: "Varanasi", emoji: "🕯", color: "#f59e0b", desc: "Sacred ghats, ancient temples, Ganga", tags: ["Spiritual", "History", "Culture"], cities: ["Varanasi", "Sarnath", "Prayagraj"], bestTime: "Oct–Mar" },
  { name: "Northeast", emoji: "🌄", color: "#a29bfe", desc: "Tribal culture, untouched nature, fog valleys", tags: ["Nature", "Culture", "Adventure"], cities: ["Shillong", "Kaziranga", "Ziro"], bestTime: "Oct–Apr" },
];

const TRAVEL_STYLES = [
  { id: "Relax", emoji: "🏖", label: "Relax" },
  { id: "Adventure", emoji: "🧗", label: "Adventure" },
  { id: "Food", emoji: "🍛", label: "Food" },
  { id: "Photography", emoji: "📸", label: "Photography" },
  { id: "History", emoji: "🏛", label: "History" },
  { id: "Business", emoji: "💼", label: "Business" },
  { id: "Family", emoji: "👨‍👩‍👧", label: "Family" },
];

const BUDGET_OPTIONS = [
  { id: "budget", label: "₹ Budget", desc: "₹1,500–3,000/day", color: "#55efc4" },
  { id: "medium", label: "₹₹ Medium", desc: "₹3,000–7,000/day", color: "#fdcb6e" },
  { id: "premium", label: "₹₹₹ Premium", desc: "₹7,000+/day", color: "#a29bfe" },
];

const TRENDING_TRIPS = [
  { title: "Manali Winter Escape", desc: "Snow, skiing, hot springs", emoji: "❄️", duration: "4 Days", cost: "₹18,000", hot: true, region: "Himachal" },
  { title: "Goa Weekend Getaway", desc: "Beaches, shacks, seafood", emoji: "🏖", duration: "3 Days", cost: "₹12,000", hot: true, region: "Goa" },
  { title: "Rajasthan Heritage Trail", desc: "Forts, camel rides, culture", emoji: "🏰", duration: "7 Days", cost: "₹35,000", region: "Rajasthan" },
  { title: "Kerala Backwaters", desc: "Houseboat, spices, Ayurveda", emoji: "🌿", duration: "5 Days", cost: "₹22,000", region: "Kerala" },
  { title: "Varanasi Soul Journey", desc: "Ghats, Ganga Aarti, temples", emoji: "🕯", duration: "3 Days", cost: "₹9,000", region: "Varanasi" },
  { title: "Northeast Explorer", desc: "Tribes, forests, hidden valleys", emoji: "🌄", duration: "7 Days", cost: "₹28,000", hot: true, region: "Northeast" },
];

const FESTIVAL_INTEL = [
  { name: "Diwali", emoji: "✨", crowd: 95, hotels: 90, advice: "Book hotels 3–4 months ahead. Visit markets in the morning (7–10 AM) before crowds. Evening Ganga Aarti in Varanasi is unmissable.", avoid: "Agra (very crowded), Delhi (pollution)", goto: "Varanasi, Jaipur, Udaipur" },
  { name: "Holi", emoji: "🌈", crowd: 88, hotels: 75, advice: "Mathura-Vrindavan is the best experience. Wear old clothes. Use organic colors. Start early (7 AM). Avoid expensive cameras.", avoid: "Mumbai crowded, Delhi air quality", goto: "Mathura, Vrindavan, Pushkar" },
  { name: "Navratri", emoji: "💃", crowd: 80, hotels: 72, advice: "Gujarat is the best destination. Garba starts at 9 PM — arrive by 8:30. Comfortable shoes essential for dancing.", avoid: "Weekday timing less electric", goto: "Ahmedabad, Vadodara, Jaipur" },
];

const crowdColor = (c: string) => c === "Low" ? "#55efc4" : c === "Moderate" ? "#fdcb6e" : "#ff4757";

function AnimatedRoute() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-15">
      <svg className="w-full h-full" viewBox="0 0 1200 400" preserveAspectRatio="xMidYMid slice">
        {[
          "M 100 200 Q 300 100 500 180 Q 700 260 900 150 Q 1050 80 1150 200",
          "M 50 300 Q 200 150 400 250 Q 600 350 800 200 Q 1000 100 1150 300",
          "M 200 100 Q 400 200 600 120 Q 800 50 1000 180 Q 1100 230 1150 150",
        ].map((d, i) => (
          <motion.path key={i} d={d} fill="none" stroke="#00ffcc" strokeWidth={1}
            strokeDasharray="8 12"
            animate={{ strokeDashoffset: [-200, 0] }}
            transition={{ duration: 4 + i, repeat: Infinity, ease: "linear", delay: i * 1.5 }} />
        ))}
        {[[100, 200], [500, 180], [900, 150], [1150, 200], [400, 250], [800, 200]].map(([x, y], i) => (
          <motion.circle key={i} cx={x} cy={y} r={4} fill="#00ffcc"
            animate={{ scale: [1, 1.8, 1], opacity: [0.6, 1, 0.6] }}
            transition={{ duration: 2, repeat: Infinity, delay: i * 0.3 }} />
        ))}
      </svg>
      <motion.div
        animate={{ x: ["0%", "90%", "0%"], y: ["30%", "10%", "60%"] }}
        transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
        className="absolute text-2xl"
        style={{ top: 0, left: 0 }}>
        ✈️
      </motion.div>
    </div>
  );
}

function PeriodIcon({ period }: { period: string }) {
  if (period === "morning") return <Sun className="w-4 h-4 text-yellow-400" />;
  if (period === "afternoon") return <Coffee className="w-4 h-4 text-orange-400" />;
  return <Moon className="w-4 h-4 text-purple-400" />;
}
function periodColor(p: string) {
  if (p === "morning") return "#fbbf24";
  if (p === "afternoon") return "#f97316";
  return "#a78bfa";
}

export default function TravelPlanner() {
  const [mainTab, setMainTab] = useState<"plan" | "india" | "trending">("plan");
  const [destination, setDestination] = useState<typeof DESTINATIONS[0] | null>(null);
  const [destSearch, setDestSearch] = useState("");
  const [days, setDays] = useState(3);
  const [styles, setStyles] = useState<string[]>(["Relax", "Food"]);
  const [budget, setBudget] = useState("medium");
  const [plan, setPlan] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [activeDay, setActiveDay] = useState(0);
  const [packingOpen, setPackingOpen] = useState(false);
  const [hiddenGemsData, setHiddenGemsData] = useState<any>(null);
  const [gemsLoading, setGemsLoading] = useState(false);
  const [compareA, setCompareA] = useState<typeof DESTINATIONS[0]>(DESTINATIONS[0]);
  const [compareB, setCompareB] = useState<typeof DESTINATIONS[1]>(DESTINATIONS[1]);
  const [compareResult, setCompareResult] = useState<any>(null);
  const [compareLoading, setCompareLoading] = useState(false);
  const [showAI, setShowAI] = useState(false);
  const [aiQuery, setAiQuery] = useState("");
  const [aiAnswer, setAiAnswer] = useState<string | null>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [cityReport, setCityReport] = useState<any>(null);
  const [activeFestival, setActiveFestival] = useState(0);

  const filteredDests = DESTINATIONS.filter(d =>
    d.name.toLowerCase().includes(destSearch.toLowerCase()) ||
    d.country.toLowerCase().includes(destSearch.toLowerCase())
  );

  async function generatePlan() {
    if (!destination) return;
    setLoading(true); setPlan(null); setHiddenGemsData(null);
    try {
      const res = await fetch("/api/planner/itinerary", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          city: destination.id,
          days,
          month: new Date().toLocaleString("default", { month: "long" }),
          interests: styles,
        })
      });
      const data = await res.json();
      setPlan(data);
      setActiveDay(0);
      loadHiddenGems(destination.id);
      loadCityReport(destination.id);
    } finally { setLoading(false); }
  }

  async function loadHiddenGems(cityId: string) {
    setGemsLoading(true);
    try {
      const res = await fetch(`/api/planner/neighborhood?cityId=${cityId}`);
      const d = await res.json();
      setHiddenGemsData(d);
    } finally { setGemsLoading(false); }
  }

  async function loadCityReport(cityId: string) {
    try {
      const res = await fetch(`/api/planner/reporter?placeId=${cityId}`);
      setCityReport(await res.json());
    } catch { /* silent */ }
  }

  async function runCompare() {
    setCompareLoading(true); setCompareResult(null);
    try {
      const res = await fetch("/api/chat/message", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: `Compare ${compareA.name} vs ${compareB.name} as travel destinations. For each, rate these 6 categories 0-100: Weather, Cost, Food, Crowd, Nightlife, Nature. Return JSON only: { "a": { "name": "${compareA.name}", "scores": { "Weather": 80, "Cost": 70, "Food": 85, "Crowd": 60, "Nightlife": 75, "Nature": 65 }, "verdict": "one sentence" }, "b": { same structure for ${compareB.name} }, "winner": "city name", "reason": "one sentence" }`,
          sessionId: "travel-compare"
        })
      });
      const d = await res.json();
      try {
        const json = JSON.parse(d.message.replace(/```json|```/g, "").trim());
        setCompareResult(json);
      } catch {
        setCompareResult({ a: { name: compareA.name, scores: { Weather: 82, Cost: 60, Food: 90, Crowd: 55, Nightlife: 80, Nature: 70 }, verdict: compareA.vibe }, b: { name: compareB.name, scores: { Weather: 75, Cost: 72, Food: 88, Crowd: 65, Nightlife: 70, Nature: 85 }, verdict: compareB.vibe }, winner: compareA.name, reason: "Better overall balance of activities and value." });
      }
    } finally { setCompareLoading(false); }
  }

  async function askTripAI() {
    if (!aiQuery.trim()) return;
    setAiLoading(true); setAiAnswer(null);
    try {
      const res = await fetch("/api/chat/message", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: `Travel AI for ${destination?.name || "India"}: "${aiQuery}". Answer in 2 concise sentences with specific, actionable travel advice.`,
          sessionId: "travel-ai-companion"
        })
      });
      const d = await res.json();
      setAiAnswer(d.message || "Happy to help you plan the perfect trip!");
    } catch { setAiAnswer("Let me help you plan smarter. India's travel season peaks Oct–Mar for most destinations."); }
    finally { setAiLoading(false); }
  }

  const currentDay = plan?.itinerary?.[activeDay];
  const budgetInfo = BUDGET_OPTIONS.find(b => b.id === budget);

  return (
    <div className="min-h-full" style={{ background: "linear-gradient(180deg, #050d1a 0%, #07111f 50%, #0a0f1e 100%)" }}>

      {/* ── HERO ── */}
      <div className="relative overflow-hidden border-b border-white/5 min-h-52">
        <AnimatedRoute />
        <div className="absolute inset-0 pointer-events-none"
          style={{ background: "radial-gradient(ellipse at 30% 50%, #00ffcc06 0%, transparent 60%), radial-gradient(ellipse at 70% 20%, #7c3aed06 0%, transparent 50%)" }} />
        <div className="relative px-6 md:px-10 py-8">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Plane className="w-4 h-4 text-cyan-400" />
                <span className="text-xs font-bold text-cyan-400 uppercase tracking-widest">AI Travel Intelligence</span>
              </div>
              <h1 className="text-3xl md:text-4xl font-black text-white leading-tight">
                ✈️ Plan Your<br />
                <span className="text-transparent bg-clip-text" style={{ backgroundImage: "linear-gradient(135deg, #00ffcc, #7c3aed)" }}>
                  Perfect Journey
                </span>
              </h1>
              <p className="text-white/50 mt-2 text-sm max-w-lg leading-relaxed">
                AI-powered travel planning that understands places, people, weather and the perfect moments.
              </p>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {[
                { label: "Global Destinations", value: "10K+", emoji: "🌎", color: "#00ffcc" },
                { label: "AI Insights", value: "Smart", emoji: "🧠", color: "#a29bfe" },
                { label: "Smart Routes", value: "Auto", emoji: "📍", color: "#fdcb6e" },
                { label: "Best Time AI", value: "Live", emoji: "⏳", color: "#fd79a8" },
              ].map(s => (
                <div key={s.label} className="bg-[#0d1f33]/70 border border-white/8 rounded-2xl p-3 text-center">
                  <div className="text-lg mb-1">{s.emoji}</div>
                  <div className="text-lg font-black" style={{ color: s.color }}>{s.value}</div>
                  <div className="text-xs text-white/30 mt-0.5">{s.label}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Main Nav Tabs */}
          <div className="flex gap-2 mt-6">
            {[
              { id: "plan", label: "✈️ Plan My Trip" },
              { id: "india", label: "🇮🇳 India Explorer" },
              { id: "trending", label: "🔥 Trending Trips" },
            ].map(tab => (
              <button key={tab.id} onClick={() => setMainTab(tab.id as any)}
                className={`text-sm px-4 py-2.5 rounded-xl font-semibold border transition-all ${mainTab === tab.id ? "text-black border-transparent" : "border-white/10 text-white/50 hover:text-white bg-transparent"}`}
                style={mainTab === tab.id ? { background: "linear-gradient(135deg, #00ffcc, #0099ff)" } : {}}>
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <AnimatePresence mode="wait">

        {/* ── PLAN MY TRIP ── */}
        {mainTab === "plan" && (
          <motion.div key="plan" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="px-6 md:px-10 py-6 space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

              {/* Builder */}
              <div className="space-y-4">
                {/* Destination */}
                <div className="bg-[#0d1f33]/80 border border-white/8 rounded-2xl p-5">
                  <div className="text-xs font-bold text-white/30 uppercase tracking-widest mb-3">📍 Destination</div>
                  <div className="relative">
                    <div className="flex items-center gap-2 bg-[#07111f] border border-white/10 rounded-xl px-3 py-2.5 focus-within:border-cyan-500/40 transition-all">
                      <Search className="w-4 h-4 text-white/30 flex-shrink-0" />
                      <input
                        value={destSearch}
                        onChange={e => { setDestSearch(e.target.value); setDestination(null); }}
                        placeholder={destination ? destination.name : "Search destination..."}
                        className="flex-1 bg-transparent text-white placeholder-white/25 text-sm outline-none"
                      />
                      {destination && <button onClick={() => { setDestination(null); setDestSearch(""); }}><X className="w-3.5 h-3.5 text-white/30" /></button>}
                    </div>
                    <AnimatePresence>
                      {destSearch && !destination && (
                        <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                          className="absolute top-full mt-1 left-0 right-0 bg-[#0d1f33] border border-white/12 rounded-xl overflow-hidden z-20 shadow-2xl max-h-60 overflow-y-auto">
                          {filteredDests.map(dest => (
                            <button key={dest.id} onClick={() => { setDestination(dest); setDestSearch(dest.name); }}
                              className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-white/5 transition-all text-left">
                              <span className="text-xl">{dest.emoji}</span>
                              <div>
                                <div className="text-sm font-bold text-white">{dest.name}</div>
                                <div className="text-xs text-white/35">{dest.vibe}</div>
                              </div>
                              <div className="ml-auto text-xs text-white/25">{dest.flag}</div>
                            </button>
                          ))}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                  {/* Quick picks */}
                  {!destination && (
                    <div className="flex flex-wrap gap-1.5 mt-3">
                      {DESTINATIONS.slice(0, 6).map(d => (
                        <button key={d.id} onClick={() => { setDestination(d); setDestSearch(d.name); }}
                          className="text-xs px-2.5 py-1 rounded-lg bg-white/4 border border-white/8 text-white/50 hover:text-white hover:border-white/20 transition-all">
                          {d.emoji} {d.name}
                        </button>
                      ))}
                    </div>
                  )}

                  {destination && (
                    <div className="mt-3 flex items-center gap-3 p-3 rounded-xl border"
                      style={{ background: destination.color + "10", borderColor: destination.color + "30" }}>
                      <span className="text-2xl">{destination.emoji}</span>
                      <div>
                        <div className="text-sm font-bold text-white">{destination.name} {destination.flag}</div>
                        <div className="text-xs" style={{ color: destination.color }}>{destination.vibe}</div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Duration */}
                <div className="bg-[#0d1f33]/80 border border-white/8 rounded-2xl p-5">
                  <div className="text-xs font-bold text-white/30 uppercase tracking-widest mb-3">📅 Duration</div>
                  <div className="grid grid-cols-4 gap-2">
                    {[2, 3, 5, 7].map(d => (
                      <button key={d} onClick={() => setDays(d)}
                        className={`py-2.5 rounded-xl text-sm font-bold border transition-all ${days === d ? "border-transparent text-black" : "border-white/10 text-white/50 hover:text-white"}`}
                        style={days === d ? { background: "linear-gradient(135deg, #00ffcc, #0099ff)" } : {}}>
                        {d}d
                      </button>
                    ))}
                  </div>
                </div>

                {/* Travel Style */}
                <div className="bg-[#0d1f33]/80 border border-white/8 rounded-2xl p-5">
                  <div className="text-xs font-bold text-white/30 uppercase tracking-widest mb-3">🎯 Travel Style</div>
                  <div className="grid grid-cols-4 gap-2">
                    {TRAVEL_STYLES.map(s => (
                      <button key={s.id}
                        onClick={() => setStyles(prev => prev.includes(s.id) ? prev.filter(x => x !== s.id) : [...prev, s.id])}
                        className={`flex flex-col items-center gap-1 py-2.5 px-1 rounded-xl text-xs border transition-all ${styles.includes(s.id) ? "border-cyan-500/40 bg-cyan-500/10 text-cyan-300" : "border-white/8 text-white/40 hover:text-white hover:border-white/15"}`}>
                        <span className="text-base">{s.emoji}</span>
                        <span className="font-medium leading-none">{s.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Budget */}
                <div className="bg-[#0d1f33]/80 border border-white/8 rounded-2xl p-5">
                  <div className="text-xs font-bold text-white/30 uppercase tracking-widest mb-3">💰 Budget</div>
                  <div className="space-y-2">
                    {BUDGET_OPTIONS.map(b => (
                      <button key={b.id} onClick={() => setBudget(b.id)}
                        className={`w-full flex items-center justify-between p-3 rounded-xl border text-sm transition-all ${budget === b.id ? "border-opacity-40 bg-opacity-10" : "border-white/8 hover:border-white/15"}`}
                        style={budget === b.id ? { borderColor: b.color + "60", background: b.color + "10" } : {}}>
                        <span className={`font-bold ${budget === b.id ? "" : "text-white/50"}`} style={budget === b.id ? { color: b.color } : {}}>{b.label}</span>
                        <span className="text-xs text-white/30">{b.desc}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Generate Button */}
                <button onClick={generatePlan} disabled={!destination || loading}
                  className="w-full flex items-center justify-center gap-2.5 py-4 rounded-2xl font-black text-base disabled:opacity-40 transition-all text-[#07111f]"
                  style={{ background: "linear-gradient(135deg, #00ffcc, #0099ff)", boxShadow: destination && !loading ? "0 0 30px #00ffcc30" : "none" }}>
                  {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Sparkles className="w-5 h-5" />}
                  {loading ? "AI Planning Your Journey..." : "✨ Create My Journey"}
                </button>
              </div>

              {/* Itinerary Output */}
              <div className="lg:col-span-2 space-y-4">
                {loading && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                    className="border border-dashed border-cyan-500/20 rounded-2xl p-12 text-center bg-cyan-500/3">
                    <motion.div animate={{ rotate: 360 }} transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                      className="w-14 h-14 rounded-full border-2 border-cyan-500/30 border-t-cyan-400 mx-auto mb-4" />
                    <div className="text-white/50 text-sm">AI is crafting your perfect itinerary...</div>
                    <div className="text-white/25 text-xs mt-1">Analyzing crowd data, weather, and local insights</div>
                  </motion.div>
                )}

                {plan && !loading && (
                  <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">

                    {/* Plan Header */}
                    <div className="bg-[#0d1f33]/80 border border-cyan-500/20 rounded-2xl p-5"
                      style={{ boxShadow: "0 0 30px rgba(0,255,204,0.04)" }}>
                      <div className="flex items-start justify-between mb-4">
                        <div>
                          <div className="text-2xl font-black text-white">{plan.city}</div>
                          <div className="text-sm text-white/40">{days}-Day Journey · {new Date().toLocaleString("default", { month: "long" })}</div>
                        </div>
                        <div className="text-right">
                          <div className="text-xs text-white/30">Est. Budget</div>
                          <div className="text-base font-black text-cyan-400">{plan.budgetEstimate}</div>
                        </div>
                      </div>
                      <div className="p-3 bg-cyan-500/6 border border-cyan-500/15 rounded-xl flex items-start gap-2">
                        <Sparkles className="w-4 h-4 text-cyan-400 mt-0.5 flex-shrink-0" />
                        <div className="text-xs text-white/65 leading-relaxed">{plan.bestTimeNote}</div>
                      </div>
                    </div>

                    {/* City Live Report */}
                    {cityReport && (
                      <div className="bg-[#0d1f33]/80 border border-white/8 rounded-2xl p-4">
                        <div className="flex items-center gap-2 mb-2">
                          <div className="w-1.5 h-1.5 rounded-full bg-red-400 animate-pulse" />
                          <div className="text-xs font-bold text-red-400 uppercase tracking-widest">Live City Brief</div>
                        </div>
                        <div className="text-sm font-bold text-white mb-1">{cityReport.headline}</div>
                        <div className="text-xs text-white/50 leading-relaxed mb-2">{cityReport.brief}</div>
                        <div className="flex gap-3 text-xs">
                          <div className="flex items-center gap-1 text-yellow-400"><CloudRain className="w-3 h-3" /> {cityReport.weatherMood?.split(".")[0]}</div>
                          <div className="flex items-center gap-1 text-white/30">Mood: <span className="text-white/60 font-bold">{cityReport.moodLabel}</span></div>
                        </div>
                      </div>
                    )}

                    {/* Day Tabs */}
                    <div className="flex gap-2 overflow-x-auto pb-1">
                      {plan.itinerary.map((day: any, i: number) => (
                        <button key={i} onClick={() => setActiveDay(i)}
                          className={`flex-shrink-0 px-4 py-2 rounded-xl text-xs font-bold border transition-all ${activeDay === i ? "border-transparent text-black" : "border-white/10 text-white/50 hover:text-white"}`}
                          style={activeDay === i ? { background: "linear-gradient(135deg, #00ffcc, #0099ff)" } : {}}>
                          Day {day.day}
                        </button>
                      ))}
                    </div>

                    {/* Active Day Card */}
                    {currentDay && (
                      <AnimatePresence mode="wait">
                        <motion.div key={activeDay}
                          initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -12 }}
                          className="bg-[#0d1f33]/80 border border-white/8 rounded-2xl p-5">
                          <div className="flex items-center justify-between mb-4">
                            <div>
                              <div className="text-xs text-white/30 font-bold uppercase tracking-widest">Day {currentDay.day}</div>
                              <div className="text-xl font-black text-white">{currentDay.theme}</div>
                            </div>
                            <div className="flex items-center gap-2">
                              <div className="text-xs px-2.5 py-1 rounded-full font-bold border"
                                style={{ color: crowdColor(currentDay.crowdLevel), borderColor: crowdColor(currentDay.crowdLevel) + "40", background: crowdColor(currentDay.crowdLevel) + "12" }}>
                                {currentDay.crowdLevel} Crowd
                              </div>
                            </div>
                          </div>

                          <div className="space-y-3">
                            {(["morning", "afternoon", "evening"] as const).map(period => {
                              const slot = currentDay[period];
                              if (!slot) return null;
                              return (
                                <div key={period} className="flex gap-4 p-4 bg-white/3 rounded-xl border border-white/5">
                                  <div className="flex flex-col items-center gap-1 flex-shrink-0">
                                    <PeriodIcon period={period} />
                                    <div className="w-px flex-1 opacity-20" style={{ background: periodColor(period) }} />
                                  </div>
                                  <div className="flex-1">
                                    <div className="text-xs font-bold uppercase tracking-wider mb-1" style={{ color: periodColor(period) }}>
                                      {period.charAt(0).toUpperCase() + period.slice(1)}
                                    </div>
                                    <div className="text-sm font-bold text-white mb-0.5">{slot.activity}</div>
                                    <div className="flex items-center gap-1 text-xs text-white/40 mb-2">
                                      <MapPin className="w-3 h-3" /> {slot.location}
                                    </div>
                                    <div className="flex items-center gap-2 text-xs">
                                      <Sparkles className="w-3 h-3 text-cyan-400/70" />
                                      <span className="text-white/50 italic">{slot.tip}</span>
                                    </div>
                                  </div>
                                </div>
                              );
                            })}
                          </div>

                          <div className="mt-4 p-3 bg-yellow-500/6 border border-yellow-500/15 rounded-xl flex items-start gap-2">
                            <Star className="w-3.5 h-3.5 text-yellow-400 mt-0.5 flex-shrink-0" />
                            <div className="text-xs text-white/60 leading-relaxed">
                              <span className="text-yellow-400 font-bold">Local Tip: </span>{currentDay.localTip}
                            </div>
                          </div>

                          {currentDay.weatherNote && (
                            <div className="mt-2 flex items-center gap-2 text-xs text-white/35">
                              <CloudRain className="w-3.5 h-3.5" />
                              {currentDay.weatherNote}
                            </div>
                          )}
                        </motion.div>
                      </AnimatePresence>
                    )}

                    {/* Hidden Gems */}
                    <div className="bg-[#0d1f33]/80 border border-purple-500/15 rounded-2xl p-5">
                      <div className="flex items-center gap-2 mb-4">
                        <Star className="w-4 h-4 text-purple-400" />
                        <div className="text-sm font-bold text-purple-400 uppercase tracking-widest">✨ Hidden Gems</div>
                      </div>
                      {gemsLoading ? (
                        <div className="flex items-center gap-2 text-white/30 text-sm">
                          <Loader2 className="w-4 h-4 animate-spin" /> Finding local secrets...
                        </div>
                      ) : hiddenGemsData?.neighborhoods ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          {hiddenGemsData.neighborhoods.slice(0, 4).map((n: any) => (
                            <div key={n.name} className="p-3 bg-white/3 rounded-xl border border-white/5">
                              <div className="text-sm font-bold text-white">{n.name}</div>
                              <div className="text-xs text-purple-400 mb-2">{n.vibe}</div>
                              {n.hiddenGems?.slice(0, 2).map((g: string) => (
                                <div key={g} className="text-xs text-white/45 flex items-center gap-1.5 mb-1">
                                  <div className="w-1 h-1 rounded-full bg-purple-500/60" /> {g}
                                </div>
                              ))}
                            </div>
                          ))}
                        </div>
                      ) : hiddenGemsData?.hiddenGems ? (
                        <div className="space-y-2">
                          {hiddenGemsData.hiddenGems.map((g: string) => (
                            <div key={g} className="flex items-center gap-2 text-sm text-white/65">
                              <Star className="w-3.5 h-3.5 text-purple-400 flex-shrink-0" /> {g}
                            </div>
                          ))}
                        </div>
                      ) : null}
                    </div>

                    {/* Packing List */}
                    {plan.packingTips && (
                      <div className="bg-[#0d1f33]/80 border border-white/8 rounded-2xl overflow-hidden">
                        <button onClick={() => setPackingOpen(v => !v)}
                          className="w-full flex items-center justify-between p-5 hover:bg-white/3 transition-all">
                          <div className="flex items-center gap-2 text-sm font-bold text-white/60">
                            <Backpack className="w-4 h-4 text-green-400" /> 🎒 Packing Assistant
                          </div>
                          <ChevronRight className={`w-4 h-4 text-white/30 transition-transform ${packingOpen ? "rotate-90" : ""}`} />
                        </button>
                        <AnimatePresence>
                          {packingOpen && (
                            <motion.div initial={{ height: 0 }} animate={{ height: "auto" }} exit={{ height: 0 }}
                              className="overflow-hidden">
                              <div className="px-5 pb-5 grid grid-cols-1 md:grid-cols-2 gap-2">
                                {plan.packingTips.map((tip: string) => (
                                  <div key={tip} className="flex items-center gap-2 text-sm text-white/65">
                                    <div className="w-5 h-5 rounded-full bg-green-400/20 flex items-center justify-center flex-shrink-0">
                                      <Check className="w-3 h-3 text-green-400" />
                                    </div>
                                    {tip}
                                  </div>
                                ))}
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    )}
                  </motion.div>
                )}

                {!plan && !loading && (
                  <div className="text-center py-20 border border-dashed border-white/8 rounded-2xl text-white/20">
                    <div className="text-5xl mb-3">✈️</div>
                    <div className="text-sm">Pick a destination and let AI build your perfect trip</div>
                  </div>
                )}
              </div>
            </div>

            {/* ── COMPARE DESTINATIONS ── */}
            <div className="bg-[#0d1f33]/80 border border-white/8 rounded-2xl p-6">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-1.5 h-5 rounded-full bg-cyan-400" />
                <h3 className="text-base font-bold text-white">Compare Destinations</h3>
              </div>
              <div className="flex gap-3 items-end flex-wrap mb-4">
                <div>
                  <label className="text-xs text-white/30 mb-1.5 block uppercase tracking-wider">Destination A</label>
                  <select value={compareA.id}
                    onChange={e => setCompareA(DESTINATIONS.find(d => d.id === e.target.value) || DESTINATIONS[0])}
                    className="bg-[#07111f] border border-white/10 text-white rounded-xl px-3 py-2.5 text-sm focus:border-cyan-500/40 focus:outline-none">
                    {DESTINATIONS.map(d => <option key={d.id} value={d.id}>{d.emoji} {d.name}</option>)}
                  </select>
                </div>
                <div className="text-white/20 font-black text-xl pb-2">VS</div>
                <div>
                  <label className="text-xs text-white/30 mb-1.5 block uppercase tracking-wider">Destination B</label>
                  <select value={compareB.id}
                    onChange={e => setCompareB(DESTINATIONS.find(d => d.id === e.target.value) || DESTINATIONS[1])}
                    className="bg-[#07111f] border border-white/10 text-white rounded-xl px-3 py-2.5 text-sm focus:border-cyan-500/40 focus:outline-none">
                    {DESTINATIONS.map(d => <option key={d.id} value={d.id}>{d.emoji} {d.name}</option>)}
                  </select>
                </div>
                <button onClick={runCompare} disabled={compareLoading}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm disabled:opacity-40 text-[#07111f] transition-all"
                  style={{ background: "linear-gradient(135deg, #00ffcc, #0099ff)" }}>
                  {compareLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                  Compare
                </button>
              </div>

              <AnimatePresence>
                {compareResult && (
                  <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                    className="space-y-3">
                    <div className="grid grid-cols-2 gap-4">
                      {[compareResult.a, compareResult.b].map((city: any, ci: number) => (
                        <div key={ci} className={`rounded-xl p-4 border ${city.name === compareResult.winner ? "border-yellow-400/30 bg-yellow-400/4" : "border-white/8 bg-white/3"}`}>
                          <div className="flex justify-between items-center mb-3">
                            <div className="font-bold text-white text-sm">{city.name}</div>
                            {city.name === compareResult.winner && <span className="text-base">🏆</span>}
                          </div>
                          {Object.entries(city.scores || {}).map(([key, val]: [string, any]) => (
                            <div key={key} className="mb-1.5">
                              <div className="flex justify-between text-xs text-white/40 mb-0.5">
                                <span>{key}</span><span className="font-bold text-white/60">{val}</span>
                              </div>
                              <div className="h-1 bg-white/5 rounded-full overflow-hidden">
                                <motion.div initial={{ width: 0 }} animate={{ width: `${val}%` }}
                                  className="h-full rounded-full"
                                  style={{ background: ci === 0 ? "#00ffcc" : "#a29bfe" }} />
                              </div>
                            </div>
                          ))}
                          <div className="text-xs text-white/35 italic mt-2">{city.verdict}</div>
                        </div>
                      ))}
                    </div>
                    <div className="p-3 bg-yellow-400/6 border border-yellow-400/20 rounded-xl text-center">
                      <span className="text-yellow-400 font-bold">{compareResult.winner} wins</span>
                      <span className="text-white/50 text-xs ml-2">— {compareResult.reason}</span>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Festival Travel Intelligence */}
            <div className="bg-[#0d1f33]/80 border border-white/8 rounded-2xl p-6">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-1.5 h-5 rounded-full bg-yellow-400" />
                <h3 className="text-base font-bold text-white">🇮🇳 Festival Travel Intelligence</h3>
              </div>
              <div className="flex gap-2 mb-4">
                {FESTIVAL_INTEL.map((f, i) => (
                  <button key={f.name} onClick={() => setActiveFestival(i)}
                    className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold border transition-all ${activeFestival === i ? "bg-yellow-500/20 border-yellow-500/35 text-yellow-300" : "border-white/8 text-white/40 hover:text-white"}`}>
                    {f.emoji} {f.name}
                  </button>
                ))}
              </div>
              {(() => {
                const fest = FESTIVAL_INTEL[activeFestival];
                return (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <div className="flex gap-3 mb-3">
                        {[["Crowd", fest.crowd], ["Hotel Demand", fest.hotels]].map(([label, val]: any) => (
                          <div key={label} className="flex-1 bg-white/3 rounded-xl p-3 text-center border border-white/5">
                            <div className="text-xl font-black text-white">{val}%</div>
                            <div className="text-xs text-white/35 mt-0.5">{label}</div>
                          </div>
                        ))}
                      </div>
                      <div className="p-3 bg-green-500/6 border border-green-500/15 rounded-xl mb-2">
                        <div className="text-xs font-bold text-green-400 mb-1">✅ Best Destinations</div>
                        <div className="text-xs text-white/60">{fest.goto}</div>
                      </div>
                      <div className="p-3 bg-red-500/6 border border-red-500/15 rounded-xl">
                        <div className="text-xs font-bold text-red-400 mb-1">⚠️ Avoid / Hard to Visit</div>
                        <div className="text-xs text-white/60">{fest.avoid}</div>
                      </div>
                    </div>
                    <div className="p-4 bg-yellow-500/5 border border-yellow-500/15 rounded-xl">
                      <div className="flex items-center gap-2 mb-2">
                        <Sparkles className="w-4 h-4 text-yellow-400" />
                        <span className="text-xs font-bold text-yellow-400">AI Advice</span>
                      </div>
                      <p className="text-sm text-white/65 leading-relaxed">{fest.advice}</p>
                    </div>
                  </div>
                );
              })()}
            </div>
          </motion.div>
        )}

        {/* ── INDIA EXPLORER ── */}
        {mainTab === "india" && (
          <motion.div key="india" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="px-6 md:px-10 py-6 space-y-6">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-1.5 h-5 rounded-full bg-orange-400" />
                <h2 className="text-lg font-bold text-white">🇮🇳 Discover India</h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {INDIA_REGIONS.map((region, i) => (
                  <motion.div key={region.name}
                    initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}
                    className="bg-[#0d1f33]/80 border border-white/8 rounded-2xl p-5 hover:border-white/20 transition-all group cursor-pointer"
                    onClick={() => {
                      const match = DESTINATIONS.find(d => region.cities[0] && d.name === region.cities[0]);
                      if (match) { setDestination(match); setDestSearch(match.name); setMainTab("plan"); }
                    }}>
                    <div className="flex items-start justify-between mb-3">
                      <div className="text-3xl">{region.emoji}</div>
                      <div className="text-xs px-2 py-0.5 rounded-full text-white/40 border border-white/8">{region.bestTime}</div>
                    </div>
                    <div className="text-base font-black text-white group-hover:text-cyan-300 transition-colors mb-1">{region.name}</div>
                    <div className="text-xs text-white/45 leading-relaxed mb-3">{region.desc}</div>
                    <div className="flex flex-wrap gap-1.5 mb-3">
                      {region.tags.map(t => (
                        <span key={t} className="text-xs px-2 py-0.5 rounded-full border"
                          style={{ borderColor: region.color + "40", color: region.color, background: region.color + "10" }}>
                          {t}
                        </span>
                      ))}
                    </div>
                    <div className="flex items-center gap-1 text-xs text-white/30">
                      <MapPin className="w-3 h-3" />
                      {region.cities.join(" · ")}
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>

            {/* India Quick Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { icon: "🏔", label: "Mountain Destinations", value: "4", sub: "Manali, Ladakh, Spiti, Coorg" },
                { icon: "🏖", label: "Beach Destinations", value: "12+", sub: "Goa, Kerala, Andaman, Pondicherry" },
                { icon: "🛕", label: "Heritage Sites", value: "42", sub: "UNESCO World Heritage Sites" },
                { icon: "🍛", label: "Regional Cuisines", value: "100+", sub: "Every state has unique flavors" },
              ].map(stat => (
                <div key={stat.label} className="bg-[#0d1f33]/80 border border-white/8 rounded-2xl p-4">
                  <div className="text-2xl mb-2">{stat.icon}</div>
                  <div className="text-2xl font-black text-white">{stat.value}</div>
                  <div className="text-xs font-bold text-white/50 mt-0.5">{stat.label}</div>
                  <div className="text-xs text-white/25 mt-1">{stat.sub}</div>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* ── TRENDING TRIPS ── */}
        {mainTab === "trending" && (
          <motion.div key="trending" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="px-6 md:px-10 py-6 space-y-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-1.5 h-5 rounded-full bg-red-400" />
              <h2 className="text-lg font-bold text-white">🔥 Popular India Trips Right Now</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {TRENDING_TRIPS.map((trip, i) => (
                <motion.div key={trip.title}
                  initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}
                  className="bg-[#0d1f33]/80 border border-white/8 rounded-2xl p-5 hover:border-white/20 transition-all group cursor-pointer"
                  onClick={() => {
                    const match = DESTINATIONS.find(d => d.id.includes(trip.region.toLowerCase().replace(/\s/g, "-")));
                    if (match) { setDestination(match); setDestSearch(match.name); setMainTab("plan"); }
                  }}>
                  <div className="flex items-start justify-between mb-3">
                    <div className="text-3xl">{trip.emoji}</div>
                    {trip.hot && (
                      <div className="flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-red-500/20 border border-red-500/30 text-red-400 font-bold">
                        <Flame className="w-2.5 h-2.5" /> HOT
                      </div>
                    )}
                  </div>
                  <div className="font-bold text-white group-hover:text-cyan-300 transition-colors mb-1">{trip.title}</div>
                  <div className="text-xs text-white/45 mb-3">{trip.desc}</div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3 text-xs text-white/35">
                      <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {trip.duration}</span>
                      <span className="font-bold text-green-400">{trip.cost}</span>
                    </div>
                    <ChevronRight className="w-4 h-4 text-white/20 group-hover:text-white/60 transition-colors" />
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── FLOATING TRIP AI ── */}
      <div className="fixed bottom-6 right-6 z-40">
        <AnimatePresence>
          {showAI && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 12 }}
              className="mb-3 bg-[#0d1f33] border border-white/15 rounded-2xl p-4 w-80"
              style={{ boxShadow: "0 20px 60px rgba(0,0,0,0.6), 0 0 40px rgba(0,255,204,0.06)" }}>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-cyan-400" />
                  <span className="text-sm font-bold text-white">Trip AI</span>
                  {destination && <span className="text-xs text-white/30">· {destination.name}</span>}
                </div>
                <button onClick={() => { setShowAI(false); setAiAnswer(null); }} className="text-white/30 hover:text-white/70">
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="flex gap-2 mb-3">
                <input
                  value={aiQuery}
                  onChange={e => setAiQuery(e.target.value)}
                  onKeyDown={e => { if (e.key === "Enter") askTripAI(); }}
                  placeholder="Where should I eat? Best time to visit?"
                  className="flex-1 bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs text-white placeholder-white/25 outline-none focus:border-cyan-500/40"
                  autoFocus
                />
                <button onClick={askTripAI} disabled={aiLoading || !aiQuery}
                  className="px-3 py-2 rounded-xl text-xs font-bold disabled:opacity-40 text-[#07111f]"
                  style={{ background: "linear-gradient(135deg, #00ffcc, #0099ff)" }}>
                  {aiLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <ArrowUpRight className="w-3.5 h-3.5" />}
                </button>
              </div>
              {["Where should I eat in Goa?", "Is it safe to travel solo?", "Best budget hotels in Jaipur?", "What to pack for Kerala?"].map(q => (
                <button key={q} onClick={() => setAiQuery(q)} className="w-full text-left text-xs text-white/30 hover:text-white/55 py-0.5 transition-colors">
                  → {q}
                </button>
              ))}
              <AnimatePresence>
                {aiAnswer && (
                  <motion.div initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }}
                    className="mt-3 p-3 bg-cyan-500/8 border border-cyan-500/20 rounded-xl text-xs text-white/70 leading-relaxed">
                    {aiAnswer}
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          )}
        </AnimatePresence>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.97 }}
          onClick={() => setShowAI(v => !v)}
          className="flex items-center gap-2.5 px-5 py-3 rounded-2xl font-bold text-sm text-[#07111f]"
          style={{ background: "linear-gradient(135deg, #00ffcc, #0099ff)", boxShadow: "0 0 30px #00ffcc40, 0 8px 32px rgba(0,0,0,0.5)" }}>
          <Sparkles className="w-4 h-4" />
          🤖 Ask Trip AI
        </motion.button>
      </div>
    </div>
  );
}
