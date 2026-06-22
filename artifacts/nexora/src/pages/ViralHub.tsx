import React, { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Flame, TrendingUp, Search, Sparkles, Copy, Check, RefreshCw,
  Loader2, Swords, HelpCircle, Feather, Trophy, Star, Zap,
  MapPin, Clock, ChevronRight, Share2, Eye, BarChart2,
  Music, Utensils, GraduationCap, Tv, Shield, Heart,
  Users, Activity, ArrowUpRight, Calendar, Radio,
  ShoppingBag, Trophy as TrophyIcon
} from "lucide-react";

// ── DATA ────────────────────────────────────────────────────────────────
const INDIA_CITIES = [
  { id: "delhi-in", name: "Delhi", emoji: "🔥", activity: 92, mood: "Energetic", lat: 28.6, lng: 77.2, x: 38, y: 22 },
  { id: "mumbai-in", name: "Mumbai", emoji: "⚡", activity: 87, mood: "Celebration", lat: 19.1, lng: 72.9, x: 28, y: 52 },
  { id: "bangalore-in", name: "Bangalore", emoji: "💻", activity: 81, mood: "Tech + Youth", lat: 12.97, lng: 77.6, x: 38, y: 70 },
  { id: "chennai-in", name: "Chennai", emoji: "🌊", activity: 74, mood: "Cultural", lat: 13.08, lng: 80.27, x: 46, y: 68 },
  { id: "hyderabad-in", name: "Hyderabad", emoji: "🏏", activity: 78, mood: "Sports Buzz", lat: 17.38, lng: 78.5, x: 42, y: 58 },
  { id: "kolkata-in", name: "Kolkata", emoji: "🎭", activity: 76, mood: "Festive", lat: 22.57, lng: 88.36, x: 62, y: 38 },
  { id: "jaipur-in", name: "Jaipur", emoji: "🏰", activity: 68, mood: "Tourism High", lat: 26.9, lng: 75.8, x: 34, y: 28 },
  { id: "pune-in", name: "Pune", emoji: "🎓", activity: 71, mood: "Students Active", lat: 18.52, lng: 73.85, x: 30, y: 56 },
  { id: "ahmedabad-in", name: "Ahmedabad", emoji: "💎", activity: 65, mood: "Business", lat: 23.03, lng: 72.58, x: 25, y: 42 },
  { id: "lucknow-in", name: "Lucknow", emoji: "🌹", activity: 69, mood: "Cultural", lat: 26.85, lng: 80.95, x: 48, y: 26 },
];

const TREND_CATEGORIES = [
  { id: "all", label: "🔥 Viral Now", color: "#ff4757" },
  { id: "events", label: "🎉 Events", color: "#a29bfe" },
  { id: "food", label: "🍛 Food", color: "#fdcb6e" },
  { id: "sports", label: "🏏 Sports", color: "#00cec9" },
  { id: "entertainment", label: "🎬 Entertainment", color: "#fd79a8" },
  { id: "local", label: "📍 Local", color: "#74b9ff" },
  { id: "students", label: "🎓 Students", color: "#55efc4" },
  { id: "business", label: "💼 Business", color: "#ffeaa7" },
];

const INDIA_TRENDS = [
  { id: 1, title: "Delhi Metro Weekend Rush", city: "Delhi", state: "Delhi", category: "local", heat: 94, growth: "+42%", emoji: "🚇", why: ["Weekend peak timing", "Sporting event nearby", "Weather perfect for travel", "Social media amplification"], aiSummary: "Metro activity 3x above average due to weekend events and mild weather drawing massive footfall across all corridors.", timeline: ["10 AM - Surge begins", "1 PM - More cities join", "5 PM - Peak viral moment", "Now - Nationwide attention"], tags: ["Transport", "Infrastructure"], hot: true },
  { id: 2, title: "Biryani Festival Hyderabad", city: "Hyderabad", state: "Telangana", category: "food", heat: 91, growth: "+67%", emoji: "🍛", why: ["Annual festival", "Food influencers active", "Weekend timing", "Record participation"], aiSummary: "Hyderabad's iconic biryani festival is drawing 50,000+ visitors with 300+ stalls. Online searches up 3x in 48 hours.", timeline: ["Day 1 - Opening buzz", "Day 2 - Viral videos", "Day 3 - Peak crowd", "Now - National spotlight"], tags: ["Food", "Culture"], hot: true },
  { id: 3, title: "IPL 2025 Final Buzz", city: "Mumbai", state: "Maharashtra", category: "sports", heat: 98, growth: "+120%", emoji: "🏏", why: ["Season finale", "Top teams competing", "National interest", "Celebrity attendance"], aiSummary: "India grinding to a halt as IPL final approaches. Streaming platforms seeing 10x traffic. #IPLFinal trending #1.", timeline: ["Morning - Anticipation peaks", "Afternoon - Stadium fills", "Evening - Match live", "Night - Victory celebrations"], tags: ["Cricket", "Sports"], hot: true },
  { id: 4, title: "Navratri Night Delhi", city: "Delhi", state: "Delhi", category: "events", heat: 89, growth: "+55%", emoji: "🎉", why: ["Festival season", "Large venues booked", "Youth participation high", "Influencer coverage"], aiSummary: "Nine nights of garba across 200+ venues in Delhi. Dandiya attendance up 40% YoY with gen-Z driving cultural revival.", timeline: ["Sunset - Events begin", "9 PM - Peak energy", "Midnight - Viral clips", "Now - Trending #3"], tags: ["Festival", "Culture"] },
  { id: 5, title: "Street Food Bangalore", city: "Bangalore", state: "Karnataka", category: "food", heat: 83, growth: "+38%", emoji: "🌮", why: ["Food festival ongoing", "Tech crowd active", "Weekend evening", "Insta-worthy spots"], aiSummary: "Bangalore's street food scene exploding with new fusion stalls. VV Puram food street seeing record footfall this weekend.", timeline: ["6 PM - Stalls open", "8 PM - Crowds build", "10 PM - Viral reels", "Now - Food influencers active"], tags: ["Food", "Startup"] },
  { id: 6, title: "NEET Exam Update", city: "Pan India", state: "National", category: "students", heat: 88, growth: "+90%", emoji: "📚", why: ["Results expected", "Students anxious", "Social media buzz", "News coverage"], aiSummary: "NEET 2025 results creating massive online discussion. Counseling timelines, top colleges trending across all platforms.", timeline: ["Morning - Results declared", "Noon - Analysis starts", "Evening - Trending #1", "Now - Counseling buzz"], tags: ["Education", "Exam"], hot: true },
  { id: 7, title: "New Bollywood Release", city: "Mumbai", state: "Maharashtra", category: "entertainment", heat: 86, growth: "+73%", emoji: "🎬", why: ["Blockbuster weekend", "Star-studded cast", "Record advance booking", "OTT deal rumors"], aiSummary: "New release smashing advance booking records. First-day collections projected at ₹80 crore. Social media completely flooded.", timeline: ["Thursday Night - Special screening", "Friday - Opening day", "Weekend - Record rush", "Now - Review wars"], tags: ["Movies", "Bollywood"] },
  { id: 8, title: "Jaipur Heritage Walk", city: "Jaipur", state: "Rajasthan", category: "local", heat: 72, growth: "+28%", emoji: "🏰", why: ["Tourism season peak", "International visitors", "Instagrammable spots", "Government promotion"], aiSummary: "Jaipur's Pink City seeing tourist surge with heritage walks booked weeks in advance. Foreign visitor count up 60%.", timeline: ["Morning - Tours begin", "Afternoon - Peak visits", "Sunset - Golden hour rush", "Now - Reviews flooding in"], tags: ["Tourism", "Culture"] },
  { id: 9, title: "Startup India Summit", city: "Bangalore", state: "Karnataka", category: "business", heat: 77, growth: "+44%", emoji: "🚀", why: ["Annual summit", "Top investors present", "New unicorn announcements", "Media coverage"], aiSummary: "India's biggest startup event bringing 5,000+ founders together. Three new unicorn announcements expected. VC activity at peak.", timeline: ["Day 1 - Keynotes viral", "Day 2 - Funding news", "Day 3 - Networking peak", "Now - Deal announcements"], tags: ["Startup", "Tech"] },
  { id: 10, title: "Durga Puja Kolkata", city: "Kolkata", state: "West Bengal", category: "events", heat: 95, growth: "+85%", emoji: "🌺", why: ["UNESCO heritage event", "Pandal competition", "Massive footfall", "Global attention"], aiSummary: "Kolkata's Durga Puja drawing 8 million visitors over 5 days. Pandal-hopping culture going viral globally. UNESCO status boosting pride.", timeline: ["Day 1 - Pandals inaugurated", "Day 3 - Peak crowds", "Day 5 - Sindur Khela", "Now - Worldwide trending"], tags: ["Festival", "Heritage"], hot: true },
  { id: 11, title: "Chennai Music Season", city: "Chennai", state: "Tamil Nadu", category: "entertainment", heat: 79, growth: "+35%", emoji: "🎵", why: ["December season starts", "Classical music revival", "Youth rediscovering", "International artists"], aiSummary: "Chennai's annual Margazhi music season kicking off early. Young artists driving classical Carnatic music revival across OTT platforms.", timeline: ["Week 1 - Season opens", "Week 2 - Top concerts", "Week 3 - Peak attendance", "Now - Global streaming"], tags: ["Music", "Culture"] },
  { id: 12, title: "Gold Rate Surge", city: "Pan India", state: "National", category: "business", heat: 82, growth: "+29%", emoji: "💛", why: ["Festival buying season", "Wedding season approaching", "Inflation concerns", "Investment trend"], aiSummary: "Gold prices hitting record highs with festival and wedding season demand surging. Digital gold investments up 200% on apps.", timeline: ["Morning - Rate announced", "Noon - Jewellery rush", "Evening - Online buying spike", "Now - Investment discussions"], tags: ["Finance", "Weddings"] },
];

const FESTIVALS = [
  { name: "Diwali", emoji: "✨", status: "Upcoming", shopping: 95, traffic: 88, markets: 92, bestTime: "Evening" },
  { name: "Holi", emoji: "🌈", status: "Seasonal", shopping: 72, traffic: 80, markets: 76, bestTime: "Morning" },
  { name: "Navratri", emoji: "💃", status: "Active Now", shopping: 85, traffic: 79, markets: 88, bestTime: "Evening" },
  { name: "Durga Puja", emoji: "🌺", status: "Peak", shopping: 89, traffic: 91, markets: 87, bestTime: "Evening" },
  { name: "Eid", emoji: "🌙", status: "Upcoming", shopping: 90, traffic: 82, markets: 94, bestTime: "Morning" },
  { name: "Ganesh Chaturthi", emoji: "🐘", status: "Seasonal", shopping: 78, traffic: 85, markets: 80, bestTime: "All Day" },
];

const RADAR_CATEGORIES = [
  { label: "Entertainment", value: 95, color: "#fd79a8" },
  { label: "Sports", value: 88, color: "#00cec9" },
  { label: "Food", value: 76, color: "#fdcb6e" },
  { label: "Technology", value: 82, color: "#74b9ff" },
  { label: "Culture", value: 91, color: "#a29bfe" },
  { label: "Business", value: 68, color: "#55efc4" },
];

const PLACES_FOR_QUIZ = [
  { id: "delhi-in", name: "Delhi" }, { id: "mumbai-in", name: "Mumbai" },
  { id: "london-uk", name: "London" }, { id: "new-york-us", name: "New York" },
  { id: "tokyo-jp", name: "Tokyo" }, { id: "paris-fr", name: "Paris" },
  { id: "dubai-ae", name: "Dubai" }, { id: "singapore-sg", name: "Singapore" },
  { id: "bangalore-in", name: "Bangalore" }, { id: "seoul-kr", name: "Seoul" },
];

const QUIZ_QUESTIONS = [
  { id: 1, question: "What time do you naturally wake up?", options: ["Before 6am — I'm a morning person", "7-9am — Normal human hours", "10am+ — Night owl life", "It varies wildly"] },
  { id: 2, question: "Your ideal Friday night?", options: ["Rooftop bar with great views", "Cozy ramen spot + walk home", "Underground club till 4am", "Home, movie, takeout"] },
  { id: 3, question: "How do you handle chaos?", options: ["Thrive in it — energy fuel", "Tolerate it if needed", "Prefer structure and calm", "Depends on my mood"] },
  { id: 4, question: "What's your relationship with food?", options: ["I eat to explore — adventure first", "Comfort food is my love language", "I care about precision + quality", "Food is fuel, function over form"] },
  { id: 5, question: "Your ideal commute?", options: ["Packed metro — I like the pulse", "Walking 30 mins — clear my head", "Cycle through greenery", "Work from home always"] },
  { id: 6, question: "What drives you most?", options: ["Ambition — I want to build things", "Art & culture — beauty matters", "Connection — community first", "Freedom — no rules, no boxes"] },
];

// ── HELPERS ─────────────────────────────────────────────────────────────
function heatColor(h: number) {
  if (h >= 90) return "#ff4757";
  if (h >= 80) return "#ffa502";
  if (h >= 70) return "#00ffcc";
  return "#74b9ff";
}

function RadarChart() {
  const cx = 120, cy = 120, r = 90;
  const n = RADAR_CATEGORIES.length;
  const angles = RADAR_CATEGORIES.map((_, i) => (i / n) * 2 * Math.PI - Math.PI / 2);
  const rings = [0.25, 0.5, 0.75, 1].map(scale =>
    angles.map(a => [cx + r * scale * Math.cos(a), cy + r * scale * Math.sin(a)] as [number, number])
  );
  const points = RADAR_CATEGORIES.map((cat, i) => {
    const a = angles[i], v = cat.value / 100;
    return [cx + r * v * Math.cos(a), cy + r * v * Math.sin(a)] as [number, number];
  });
  const polyPoints = points.map(p => p.join(",")).join(" ");

  return (
    <div className="relative">
      <svg width={240} height={240} className="mx-auto">
        {rings.map((ring, ri) => (
          <polygon key={ri} points={ring.map(p => p.join(",")).join(" ")}
            fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth={1} />
        ))}
        {angles.map((a, i) => (
          <line key={i} x1={cx} y1={cy}
            x2={cx + r * Math.cos(a)} y2={cy + r * Math.sin(a)}
            stroke="rgba(255,255,255,0.06)" strokeWidth={1} />
        ))}
        <motion.polygon
          initial={{ scale: 0, transformOrigin: "120px 120px" }}
          animate={{ scale: 1, transformOrigin: "120px 120px" }}
          transition={{ duration: 1, ease: "easeOut" }}
          points={polyPoints}
          fill="rgba(0,255,204,0.08)"
          stroke="#00ffcc"
          strokeWidth={1.5}
        />
        {points.map((p, i) => (
          <motion.circle key={i} cx={p[0]} cy={p[1]} r={4}
            fill={RADAR_CATEGORIES[i].color}
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.5 + i * 0.1 }}
            style={{ filter: `drop-shadow(0 0 4px ${RADAR_CATEGORIES[i].color})` }}
          />
        ))}
        {RADAR_CATEGORIES.map((cat, i) => {
          const a = angles[i];
          const lx = cx + (r + 20) * Math.cos(a);
          const ly = cy + (r + 20) * Math.sin(a);
          return (
            <text key={i} x={lx} y={ly} textAnchor="middle" dominantBaseline="middle"
              fontSize={9} fill="rgba(255,255,255,0.5)">
              {cat.label}
            </text>
          );
        })}
        {/* Scanning line */}
        <motion.line
          x1={cx} y1={cy} x2={cx} y2={cy - r}
          stroke="#00ffcc" strokeWidth={1} opacity={0.4}
          animate={{ rotate: 360, transformOrigin: `${cx}px ${cy}px` }}
          transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
        />
      </svg>
      <div className="grid grid-cols-2 gap-1.5 mt-1">
        {RADAR_CATEGORIES.map(cat => (
          <div key={cat.label} className="flex items-center gap-2 text-xs">
            <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: cat.color }} />
            <span className="text-white/50 truncate">{cat.label}</span>
            <span className="ml-auto font-bold" style={{ color: cat.color }}>{cat.value}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function IndiaMapViz({ onCityClick }: { onCityClick: (city: typeof INDIA_CITIES[0]) => void }) {
  return (
    <div className="relative w-full h-64 rounded-2xl overflow-hidden border border-white/5"
      style={{ background: "radial-gradient(ellipse at center, #0d1f3360 0%, #07111f 100%)" }}>
      <div className="absolute inset-0 flex items-center justify-center opacity-5">
        <div className="text-[180px] select-none pointer-events-none">🇮🇳</div>
      </div>
      {INDIA_CITIES.map((city, i) => (
        <motion.button
          key={city.id}
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: i * 0.08, type: "spring" }}
          onClick={() => onCityClick(city)}
          style={{ left: `${city.x}%`, top: `${city.y}%`, position: "absolute" }}
          className="group -translate-x-1/2 -translate-y-1/2 z-10"
        >
          <div className="relative flex flex-col items-center">
            <motion.div
              animate={{ scale: [1, 1.6, 1], opacity: [0.6, 0, 0.6] }}
              transition={{ duration: 2 + i * 0.3, repeat: Infinity }}
              className="absolute -inset-2 rounded-full"
              style={{ background: `${heatColor(city.activity)}30` }}
            />
            <div className="w-3 h-3 rounded-full border-2 border-white/60 shadow-lg"
              style={{ background: heatColor(city.activity), boxShadow: `0 0 10px ${heatColor(city.activity)}80` }} />
            <div className="mt-1 text-[9px] font-bold text-white/70 whitespace-nowrap bg-black/40 px-1 rounded hidden group-hover:block">
              {city.name} {city.activity}%
            </div>
          </div>
        </motion.button>
      ))}
      <div className="absolute bottom-2 left-2 text-xs text-white/20 font-medium">India Live Pulse Map</div>
      <div className="absolute top-2 right-2 flex items-center gap-1">
        <div className="w-1.5 h-1.5 rounded-full bg-red-400 animate-pulse" />
        <span className="text-[10px] text-white/30 font-bold">LIVE</span>
      </div>
    </div>
  );
}

function AnimatedCounter({ target, suffix = "" }: { target: number; suffix?: string }) {
  const [value, setValue] = useState(0);
  useEffect(() => {
    let start = 0;
    const step = target / 50;
    const timer = setInterval(() => {
      start += step;
      if (start >= target) { setValue(target); clearInterval(timer); }
      else setValue(Math.floor(start));
    }, 30);
    return () => clearInterval(timer);
  }, [target]);
  return <span>{value.toLocaleString()}{suffix}</span>;
}

function TrendCard({ trend, onClick }: { trend: typeof INDIA_TRENDS[0]; onClick: () => void }) {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      onClick={onClick}
      className="group relative bg-[#0d1f33]/80 backdrop-blur-xl border border-white/8 rounded-2xl p-5 hover:border-white/15 transition-all cursor-pointer overflow-hidden"
    >
      {trend.hot && (
        <div className="absolute top-3 right-3 text-xs px-2 py-0.5 rounded-full bg-red-500/20 text-red-400 border border-red-500/30 font-bold flex items-center gap-1">
          <Flame className="w-2.5 h-2.5" /> HOT
        </div>
      )}
      <div className="flex items-start gap-4">
        <div className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl flex-shrink-0"
          style={{ background: `${heatColor(trend.heat)}15`, border: `1px solid ${heatColor(trend.heat)}30` }}>
          {trend.emoji}
        </div>
        <div className="flex-1 min-w-0">
          <div className="font-bold text-white text-sm leading-tight mb-1 group-hover:text-cyan-300 transition-colors">
            {trend.title}
          </div>
          <div className="flex items-center gap-2 text-xs text-white/40 mb-2">
            <MapPin className="w-3 h-3" /> {trend.city}
            <span className="w-1 h-1 rounded-full bg-white/20" />
            {trend.tags.map(t => (
              <span key={t} className="px-1.5 py-0.5 rounded-full bg-white/5 border border-white/8">{t}</span>
            ))}
          </div>
          <div className="text-xs text-white/50 leading-relaxed line-clamp-2">{trend.aiSummary}</div>
        </div>
      </div>
      <div className="mt-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <div className="w-16 h-1.5 rounded-full bg-white/5 overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${trend.heat}%` }}
                transition={{ duration: 0.8, ease: "easeOut" }}
                className="h-full rounded-full"
                style={{ background: `linear-gradient(90deg, ${heatColor(trend.heat)}80, ${heatColor(trend.heat)})` }}
              />
            </div>
            <span className="text-xs font-bold" style={{ color: heatColor(trend.heat) }}>{trend.heat}%</span>
          </div>
        </div>
        <div className="flex items-center gap-1 text-xs text-green-400 font-semibold">
          <ArrowUpRight className="w-3 h-3" /> {trend.growth} today
        </div>
      </div>
    </motion.div>
  );
}

// ── MAIN COMPONENT ──────────────────────────────────────────────────────
export default function ViralHub() {
  const [activeCategory, setActiveCategory] = useState("all");
  const [selectedTrend, setSelectedTrend] = useState<typeof INDIA_TRENDS[0] | null>(null);
  const [selectedCity, setSelectedCity] = useState<typeof INDIA_CITIES[0] | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [aiAnswer, setAiAnswer] = useState<string | null>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [activeSection, setActiveSection] = useState<"pulse" | "tools">("pulse");
  const [toolTab, setToolTab] = useState<"battle" | "quiz" | "vibe">("vibe");
  const [viralCardData, setViralCardData] = useState<any>(null);
  const [viralCardCity, setViralCardCity] = useState("delhi-in");
  const [viralCardLoading, setViralCardLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [liveCount, setLiveCount] = useState(2430);

  useEffect(() => {
    const t = setInterval(() => setLiveCount(c => c + Math.floor(Math.random() * 5) - 2), 3000);
    return () => clearInterval(t);
  }, []);

  const filteredTrends = INDIA_TRENDS.filter(t =>
    (activeCategory === "all" || t.category === activeCategory) &&
    (searchQuery === "" || t.title.toLowerCase().includes(searchQuery.toLowerCase()) || t.city.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  async function handleAISearch(q: string) {
    if (!q.trim()) return;
    setAiLoading(true);
    setAiAnswer(null);
    try {
      const res = await fetch("/api/chat/message", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: `India Viral Hub Query: "${q}". Give a 2-3 sentence intelligent response about what's trending in India related to this topic. Be specific and insightful.`,
          sessionId: "viral-hub"
        })
      });
      const d = await res.json();
      setAiAnswer(d.message || "Trending insights will appear here.");
    } catch {
      setAiAnswer("AI is momentarily unavailable. India is always buzzing though! 🔥");
    } finally {
      setAiLoading(false);
    }
  }

  async function generateViralCard() {
    setViralCardLoading(true);
    setViralCardData(null);
    try {
      const res = await fetch(`/api/viral/vibe-card?placeId=${viralCardCity}`);
      setViralCardData(await res.json());
    } finally {
      setViralCardLoading(false);
    }
  }

  async function copyViralCard() {
    if (!viralCardData) return;
    const city = INDIA_CITIES.find(c => c.id === viralCardCity);
    const text = `🔥 Today in ${viralCardData.placeName}\n\nTop Trend: ${city?.emoji} ${viralCardData.personality}\nActivity: ${viralCardData.vibeScore}/100\nMood: ${viralCardData.quote}\n\nPowered by Nexora 🌍`;
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="min-h-full" style={{ background: "linear-gradient(180deg, #07111f 0%, #0a1628 100%)" }}>
      {/* ── HERO ── */}
      <div className="relative overflow-hidden border-b border-white/5">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 left-1/4 w-96 h-96 rounded-full opacity-8"
            style={{ background: "radial-gradient(circle, #ff475720 0%, transparent 70%)" }} />
          <div className="absolute top-0 right-1/4 w-64 h-64 rounded-full opacity-8"
            style={{ background: "radial-gradient(circle, #a29bfe20 0%, transparent 70%)" }} />
        </div>
        <div className="relative px-6 py-8 md:px-10">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <div className="w-2 h-2 rounded-full bg-red-400 animate-pulse" />
                <span className="text-xs font-bold text-red-400 uppercase tracking-widest">Live</span>
              </div>
              <h1 className="text-3xl md:text-4xl font-black text-white leading-tight">
                🔥 India's Live Pulse
              </h1>
              <p className="text-white/50 mt-2 text-sm max-w-xl">
                Discover viral moments, events, conversations and cultural trends happening across India — powered by AI.
              </p>
            </div>
            <div className="flex gap-4 flex-wrap">
              {[
                { label: "Trending Topics", value: liveCount, icon: TrendingUp, color: "#ff4757" },
                { label: "Cities Active", value: 28, icon: MapPin, color: "#00ffcc" },
                { label: "Real-time", value: "LIVE", icon: Radio, color: "#a29bfe", noCount: true },
              ].map(stat => (
                <div key={stat.label} className="bg-[#0d1f33]/80 backdrop-blur border border-white/8 rounded-2xl px-5 py-4 text-center min-w-[110px]">
                  <div className="text-2xl font-black text-white">
                    {stat.noCount ? <span style={{ color: stat.color }}>{stat.value}</span> : <AnimatedCounter target={stat.value as number} />}
                  </div>
                  <div className="text-xs text-white/40 mt-1">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>

          {/* AI Search */}
          <div className="mt-6 max-w-2xl">
            <div className="flex gap-2">
              <div className="flex-1 flex items-center gap-3 bg-[#0d1f33]/90 border border-white/10 rounded-2xl px-4 py-3 focus-within:border-cyan-500/40 transition-all">
                <Search className="w-4 h-4 text-cyan-400 flex-shrink-0" />
                <input
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  onKeyDown={e => { if (e.key === "Enter") handleAISearch(searchQuery); }}
                  placeholder='Ask Nexora: "What is trending in Mumbai today?"'
                  className="flex-1 bg-transparent text-white placeholder-white/25 text-sm outline-none"
                />
                {aiLoading && <Loader2 className="w-4 h-4 text-cyan-400 animate-spin" />}
              </div>
              <button
                onClick={() => handleAISearch(searchQuery)}
                disabled={aiLoading || !searchQuery}
                className="flex items-center gap-2 px-5 py-3 rounded-2xl font-bold text-sm disabled:opacity-40 transition-all text-[#07111f]"
                style={{ background: "linear-gradient(135deg, #00ffcc, #0099ff)", boxShadow: "0 0 20px #00ffcc30" }}
              >
                <Sparkles className="w-4 h-4" />
                Ask AI
              </button>
            </div>
            <AnimatePresence>
              {aiAnswer && (
                <motion.div
                  initial={{ opacity: 0, y: -6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  className="mt-2 flex gap-3 bg-[#0d1f33]/90 border border-cyan-500/20 rounded-2xl p-4"
                >
                  <Sparkles className="w-4 h-4 text-cyan-400 mt-0.5 flex-shrink-0" />
                  <div className="flex-1">
                    <div className="text-xs text-cyan-400 font-bold mb-1">Nexora AI</div>
                    <div className="text-sm text-white/75 leading-relaxed">{aiAnswer}</div>
                  </div>
                  <button onClick={() => setAiAnswer(null)} className="text-white/20 hover:text-white/50">✕</button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* ── SECTION TOGGLE ── */}
      <div className="px-6 md:px-10 py-4 border-b border-white/5 flex gap-3">
        <button onClick={() => setActiveSection("pulse")}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all ${activeSection === "pulse" ? "bg-red-500/20 text-red-400 border border-red-500/30" : "text-white/40 hover:text-white border border-transparent"}`}>
          <Flame className="w-4 h-4" /> India Pulse
        </button>
        <button onClick={() => setActiveSection("tools")}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all ${activeSection === "tools" ? "bg-cyan-500/20 text-cyan-400 border border-cyan-500/30" : "text-white/40 hover:text-white border border-transparent"}`}>
          <Zap className="w-4 h-4" /> Viral Tools
        </button>
      </div>

      <AnimatePresence mode="wait">
        {activeSection === "pulse" ? (
          <motion.div key="pulse" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="px-6 md:px-10 py-6 space-y-8">

            {/* ── MAIN 3-COLUMN LAYOUT ── */}
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
              {/* Left: Trend Feed */}
              <div className="xl:col-span-2 space-y-4">
                {/* Category Tabs */}
                <div className="flex gap-2 flex-wrap">
                  {TREND_CATEGORIES.map(cat => (
                    <button key={cat.id} onClick={() => setActiveCategory(cat.id)}
                      className={`text-xs px-3 py-1.5 rounded-xl font-semibold transition-all border ${activeCategory === cat.id ? "text-black border-transparent" : "bg-transparent border-white/10 text-white/50 hover:text-white hover:border-white/20"}`}
                      style={activeCategory === cat.id ? { background: cat.color, borderColor: cat.color } : {}}>
                      {cat.label}
                    </button>
                  ))}
                </div>

                {/* Trend Cards */}
                <div className="space-y-3">
                  <AnimatePresence>
                    {filteredTrends.map(trend => (
                      <TrendCard key={trend.id} trend={trend} onClick={() => setSelectedTrend(trend)} />
                    ))}
                  </AnimatePresence>
                </div>
              </div>

              {/* Right: Radar + Map + Cities */}
              <div className="space-y-5">
                {/* AI Trend Radar */}
                <div className="bg-[#0d1f33]/80 border border-white/8 rounded-2xl p-5">
                  <div className="text-xs font-bold text-white/30 uppercase tracking-widest mb-4 flex items-center gap-2">
                    <Activity className="w-3.5 h-3.5 text-cyan-400" />
                    AI Trend Radar
                  </div>
                  <RadarChart />
                </div>

                {/* India Map */}
                <div className="bg-[#0d1f33]/80 border border-white/8 rounded-2xl p-5">
                  <div className="text-xs font-bold text-white/30 uppercase tracking-widest mb-3 flex items-center gap-2">
                    <MapPin className="w-3.5 h-3.5 text-orange-400" />
                    Viral Heat Map
                  </div>
                  <IndiaMapViz onCityClick={city => setSelectedCity(city)} />
                  {selectedCity && (
                    <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
                      className="mt-3 p-3 bg-white/4 rounded-xl border border-white/5">
                      <div className="font-bold text-white text-sm mb-2">{selectedCity.emoji} {selectedCity.name}</div>
                      <div className="flex justify-between text-xs text-white/50 mb-1">
                        <span>Activity</span>
                        <span style={{ color: heatColor(selectedCity.activity) }}>{selectedCity.activity}%</span>
                      </div>
                      <div className="h-1 bg-white/5 rounded-full overflow-hidden">
                        <div className="h-full rounded-full" style={{ width: `${selectedCity.activity}%`, background: heatColor(selectedCity.activity) }} />
                      </div>
                      <div className="text-xs text-white/40 mt-1.5">{selectedCity.mood}</div>
                    </motion.div>
                  )}
                </div>
              </div>
            </div>

            {/* ── CITY PULSE SECTION ── */}
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-1.5 h-5 rounded-full bg-orange-400" />
                <h2 className="text-lg font-bold text-white">India City Pulse</h2>
                <div className="w-2 h-2 rounded-full bg-red-400 animate-pulse ml-1" />
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
                {INDIA_CITIES.slice(0, 10).map((city, i) => (
                  <motion.div key={city.id}
                    initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                    className="bg-[#0d1f33]/80 border border-white/8 rounded-2xl p-4 hover:border-white/15 transition-all group cursor-pointer"
                    onClick={() => setSelectedCity(city)}
                  >
                    <div className="text-2xl mb-2">{city.emoji}</div>
                    <div className="text-sm font-bold text-white group-hover:text-cyan-300 transition-colors">{city.name}</div>
                    <div className="text-xs text-white/40 mb-2">{city.mood}</div>
                    <div className="flex items-center gap-1.5 mb-1.5">
                      <div className="flex-1 h-1 bg-white/5 rounded-full overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }} animate={{ width: `${city.activity}%` }}
                          transition={{ delay: 0.3 + i * 0.05, duration: 0.8 }}
                          className="h-full rounded-full"
                          style={{ background: heatColor(city.activity) }}
                        />
                      </div>
                      <span className="text-xs font-bold" style={{ color: heatColor(city.activity) }}>{city.activity}%</span>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>

            {/* ── FESTIVAL INTELLIGENCE ── */}
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-1.5 h-5 rounded-full bg-yellow-400" />
                <h2 className="text-lg font-bold text-white">🇮🇳 Festival Intelligence</h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {FESTIVALS.map((fest, i) => (
                  <motion.div key={fest.name}
                    initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }}
                    className="bg-[#0d1f33]/80 border border-white/8 rounded-2xl p-5 hover:border-yellow-400/20 transition-all">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-2">
                        <span className="text-2xl">{fest.emoji}</span>
                        <div>
                          <div className="font-bold text-white text-sm">{fest.name}</div>
                          <div className={`text-xs px-2 py-0.5 rounded-full font-semibold mt-0.5 inline-block
                            ${fest.status === "Active Now" || fest.status === "Peak" ? "bg-red-500/20 text-red-400" : "bg-white/5 text-white/40"}`}>
                            {fest.status}
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="space-y-2">
                      {[["Shopping", fest.shopping, ShoppingBag], ["Traffic", fest.traffic, Activity], ["Markets", fest.markets, Users]].map(([label, val, Icon]: any) => (
                        <div key={label} className="flex items-center gap-2">
                          <Icon className="w-3 h-3 text-white/30" />
                          <span className="text-xs text-white/40 w-16">{label}</span>
                          <div className="flex-1 h-1 bg-white/5 rounded-full overflow-hidden">
                            <div className="h-full rounded-full bg-yellow-400/60" style={{ width: `${val}%` }} />
                          </div>
                          <span className="text-xs font-bold text-yellow-400 w-8 text-right">{val}%</span>
                        </div>
                      ))}
                    </div>
                    <div className="mt-3 pt-3 border-t border-white/5 flex items-center justify-between text-xs">
                      <span className="text-white/30">Best Time</span>
                      <span className="text-yellow-400 font-semibold">{fest.bestTime}</span>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>

            {/* ── THEMATIC PULSE SECTIONS ── */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Sports */}
              <div className="bg-[#0d1f33]/80 border border-white/8 rounded-2xl p-5">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-8 h-8 rounded-xl bg-cyan-500/15 border border-cyan-500/25 flex items-center justify-center">
                    🏏
                  </div>
                  <div className="font-bold text-white">Sports Pulse</div>
                </div>
                {[
                  { sport: "Cricket (IPL)", interest: 98, cities: "Mumbai, Delhi, Chennai" },
                  { sport: "Football ISL", interest: 72, cities: "Kolkata, Goa, Kerala" },
                  { sport: "Kabaddi PKL", interest: 65, cities: "Delhi, Jaipur, Patna" },
                  { sport: "Badminton", interest: 58, cities: "Hyderabad, Bangalore" },
                ].map(s => (
                  <div key={s.sport} className="mb-3">
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-white/70 font-medium">{s.sport}</span>
                      <span className="font-bold text-cyan-400">{s.interest}%</span>
                    </div>
                    <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                      <motion.div initial={{ width: 0 }} animate={{ width: `${s.interest}%` }}
                        transition={{ duration: 0.8, delay: 0.2 }}
                        className="h-full rounded-full bg-gradient-to-r from-cyan-500/80 to-cyan-400" />
                    </div>
                    <div className="text-xs text-white/25 mt-0.5">{s.cities}</div>
                  </div>
                ))}
              </div>

              {/* Entertainment */}
              <div className="bg-[#0d1f33]/80 border border-white/8 rounded-2xl p-5">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-8 h-8 rounded-xl bg-pink-500/15 border border-pink-500/25 flex items-center justify-center">🎬</div>
                  <div className="font-bold text-white">Entertainment Pulse</div>
                </div>
                {[
                  { item: "Bollywood Box Office", val: 86, color: "#fd79a8", why: "New blockbuster release" },
                  { item: "Netflix India Trending", val: 79, color: "#fd79a8", why: "Crime thriller viral" },
                  { item: "JioCinema Sports", val: 91, color: "#fd79a8", why: "IPL streaming peak" },
                  { item: "Spotify India", val: 73, color: "#fd79a8", why: "New album dropped" },
                ].map(e => (
                  <div key={e.item} className="mb-3">
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-white/70 font-medium">{e.item}</span>
                      <span className="font-bold" style={{ color: e.color }}>{e.val}%</span>
                    </div>
                    <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                      <motion.div initial={{ width: 0 }} animate={{ width: `${e.val}%` }}
                        transition={{ duration: 0.8, delay: 0.3 }}
                        className="h-full rounded-full" style={{ background: e.color + "99" }} />
                    </div>
                    <div className="text-xs text-white/25 mt-0.5">{e.why}</div>
                  </div>
                ))}
              </div>

              {/* Students */}
              <div className="bg-[#0d1f33]/80 border border-white/8 rounded-2xl p-5">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-8 h-8 rounded-xl bg-green-500/15 border border-green-500/25 flex items-center justify-center">🎓</div>
                  <div className="font-bold text-white">Student Pulse</div>
                </div>
                {[
                  { topic: "NEET Results", interest: 94, tag: "🔥 Viral" },
                  { topic: "JEE Advanced", interest: 88, tag: "Upcoming" },
                  { topic: "AI/ML Courses", interest: 82, tag: "Trending" },
                  { topic: "Study Abroad", interest: 71, tag: "Growing" },
                  { topic: "College Events", interest: 65, tag: "Weekend" },
                ].map(s => (
                  <div key={s.topic} className="flex items-center gap-3 mb-2.5 group cursor-pointer">
                    <div className="flex-1">
                      <div className="text-xs text-white/70 font-medium group-hover:text-white transition-colors">{s.topic}</div>
                      <div className="text-[10px] text-green-400">{s.tag}</div>
                    </div>
                    <div className="text-xs font-bold text-green-400">{s.interest}%</div>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        ) : (
          <motion.div key="tools" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="px-6 md:px-10 py-6">

            <div className="flex gap-2 mb-6">
              {[
                { id: "vibe", label: "🔥 Create Viral Card", color: "#00ffcc" },
                { id: "battle", label: "⚔️ City Battle", color: "#ff4757" },
                { id: "quiz", label: "🧠 City DNA Quiz", color: "#fdcb6e" },
              ].map(tab => (
                <button key={tab.id} onClick={() => setToolTab(tab.id as any)}
                  className={`px-4 py-2 rounded-xl text-sm font-bold transition-all border ${toolTab === tab.id ? "text-black border-transparent" : "border-white/10 text-white/50 hover:text-white bg-transparent"}`}
                  style={toolTab === tab.id ? { background: tab.color } : {}}>
                  {tab.label}
                </button>
              ))}
            </div>

            <AnimatePresence mode="wait">
              {toolTab === "vibe" && (
                <motion.div key="vibe" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                  className="max-w-2xl space-y-5">
                  <div className="bg-[#0d1f33]/80 border border-white/8 rounded-2xl p-6">
                    <h2 className="text-lg font-bold text-white mb-1">Create Shareable Viral Card</h2>
                    <p className="text-sm text-white/40 mb-5">Generate an AI-powered city card to share on Instagram, Twitter and WhatsApp.</p>
                    <div className="flex gap-3 items-end flex-wrap">
                      <div className="flex-1 min-w-40">
                        <label className="text-xs text-white/40 uppercase tracking-wider mb-1.5 block">Pick City</label>
                        <select value={viralCardCity} onChange={e => setViralCardCity(e.target.value)}
                          className="w-full bg-[#07111f] border border-white/10 text-white rounded-xl px-3 py-2.5 text-sm focus:border-cyan-500/40 focus:outline-none">
                          {INDIA_CITIES.map(c => <option key={c.id} value={c.id}>{c.emoji} {c.name}</option>)}
                        </select>
                      </div>
                      <button onClick={generateViralCard} disabled={viralCardLoading}
                        className="flex items-center gap-2 px-6 py-2.5 rounded-xl font-bold text-sm disabled:opacity-50 transition-all text-[#07111f]"
                        style={{ background: "linear-gradient(135deg, #00ffcc, #0099ff)", boxShadow: "0 0 20px #00ffcc30" }}>
                        {viralCardLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Flame className="w-4 h-4" />}
                        Generate
                      </button>
                    </div>
                  </div>

                  <AnimatePresence mode="wait">
                    {viralCardLoading && (
                      <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className="text-center py-12 border border-dashed border-cyan-500/20 rounded-2xl bg-cyan-500/3">
                        <Loader2 className="w-10 h-10 mx-auto mb-3 text-cyan-400 animate-spin opacity-60" />
                        <p className="text-white/40 text-sm">AI generating your viral card...</p>
                      </motion.div>
                    )}
                    {viralCardData && !viralCardLoading && (
                      <motion.div key="card"
                        initial={{ opacity: 0, scale: 0.96, y: 16 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        transition={{ type: "spring", stiffness: 200, damping: 22 }}
                        className="relative overflow-hidden rounded-2xl p-8"
                        style={{ background: "linear-gradient(135deg, #0d1f33 0%, #111827 50%, #0d1f33 100%)", border: "1px solid rgba(0,255,204,0.25)", boxShadow: "0 0 50px rgba(0,255,204,0.06)" }}>
                        <div className="absolute top-0 right-0 w-48 h-48 rounded-full -translate-y-1/2 translate-x-1/2"
                          style={{ background: "radial-gradient(circle, #00ffcc08, transparent)" }} />
                        <div className="text-xs text-cyan-500/60 font-bold uppercase tracking-widest mb-1">🔥 Nexora Viral Card</div>
                        <div className="text-3xl font-black text-white mb-1">{viralCardData.placeName}</div>
                        <div className="text-white/50 mb-5">{viralCardData.personality}</div>
                        <div className="grid grid-cols-4 gap-3 mb-5">
                          {[["Energy", viralCardData.energy], ["Culture", viralCardData.culture], ["Chaos", viralCardData.chaos], ["Soul", viralCardData.soul]].map(([label, val]: any) => (
                            <div key={label} className="bg-black/20 rounded-xl p-3 text-center border border-white/5">
                              <div className="text-2xl font-black text-cyan-400">{val}</div>
                              <div className="text-xs text-white/30 mt-0.5">{label}</div>
                            </div>
                          ))}
                        </div>
                        <div className="text-sm text-white/60 italic mb-4">"{viralCardData.quote}"</div>
                        <div className="text-xs text-white/20 mb-4">Powered by Nexora Intelligence</div>
                        <div className="flex gap-2">
                          <button onClick={copyViralCard}
                            className="flex items-center gap-2 px-4 py-2 bg-white/8 hover:bg-white/15 rounded-xl text-sm text-white border border-white/10 transition-all">
                            {copied ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
                            {copied ? "Copied!" : "Copy Card"}
                          </button>
                          <button onClick={generateViralCard}
                            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm border border-cyan-500/30 text-cyan-400 bg-cyan-500/8 hover:bg-cyan-500/15 transition-all">
                            <RefreshCw className="w-4 h-4" /> Regenerate
                          </button>
                        </div>
                      </motion.div>
                    )}
                    {!viralCardData && !viralCardLoading && (
                      <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                        className="text-center py-16 text-white/20 border border-dashed border-white/5 rounded-2xl">
                        <div className="text-5xl mb-3">🔥</div>
                        <p className="text-sm">Pick a city and generate your viral card</p>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              )}
              {toolTab === "battle" && <CityBattleSection />}
              {toolTab === "quiz" && <CityQuizSection />}
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── TREND DETAIL MODAL ── */}
      <AnimatePresence>
        {selectedTrend && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            style={{ background: "rgba(7,17,31,0.85)", backdropFilter: "blur(8px)" }}
            onClick={() => setSelectedTrend(null)}>
            <motion.div initial={{ scale: 0.93, y: 16 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.93, y: 16 }}
              onClick={e => e.stopPropagation()}
              className="bg-[#0d1f33] border border-white/10 rounded-3xl p-7 max-w-lg w-full max-h-[85vh] overflow-y-auto"
              style={{ boxShadow: "0 20px 60px rgba(0,0,0,0.6)" }}>
              <div className="flex items-start justify-between mb-5">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl text-2xl flex items-center justify-center"
                    style={{ background: `${heatColor(selectedTrend.heat)}15`, border: `1px solid ${heatColor(selectedTrend.heat)}30` }}>
                    {selectedTrend.emoji}
                  </div>
                  <div>
                    <div className="font-bold text-white text-lg leading-tight">{selectedTrend.title}</div>
                    <div className="text-xs text-white/40 flex items-center gap-1 mt-0.5">
                      <MapPin className="w-3 h-3" /> {selectedTrend.city} • {selectedTrend.state}
                    </div>
                  </div>
                </div>
                <button onClick={() => setSelectedTrend(null)} className="text-white/30 hover:text-white text-xl ml-2">✕</button>
              </div>

              <div className="space-y-4">
                <div className="bg-white/4 rounded-2xl p-4">
                  <div className="text-xs font-bold text-white/30 uppercase tracking-widest mb-2 flex items-center gap-1.5">
                    <Sparkles className="w-3 h-3 text-cyan-400" /> AI Summary
                  </div>
                  <p className="text-sm text-white/70 leading-relaxed">{selectedTrend.aiSummary}</p>
                </div>

                <div className="bg-white/4 rounded-2xl p-4">
                  <div className="text-xs font-bold text-white/30 uppercase tracking-widest mb-3">Why Is It Viral?</div>
                  <div className="space-y-2">
                    {selectedTrend.why.map((reason, i) => (
                      <motion.div key={i} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.08 }}
                        className="flex items-center gap-2 text-sm">
                        <div className="w-4 h-4 rounded-full bg-green-400/20 flex items-center justify-center flex-shrink-0">
                          <Check className="w-2.5 h-2.5 text-green-400" />
                        </div>
                        <span className="text-white/70">{reason}</span>
                      </motion.div>
                    ))}
                    <div className="mt-3 flex items-center gap-2 pt-2 border-t border-white/5">
                      <ArrowUpRight className="w-3.5 h-3.5 text-green-400" />
                      <span className="text-xs font-bold text-green-400">Growth: {selectedTrend.growth} today</span>
                    </div>
                  </div>
                </div>

                <div className="bg-white/4 rounded-2xl p-4">
                  <div className="text-xs font-bold text-white/30 uppercase tracking-widest mb-3 flex items-center gap-1.5">
                    <Clock className="w-3 h-3 text-purple-400" /> Viral Timeline
                  </div>
                  <div className="space-y-2">
                    {selectedTrend.timeline.map((entry, i) => (
                      <div key={i} className="flex items-start gap-3 text-sm">
                        <div className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${i === selectedTrend.timeline.length - 1 ? "bg-red-400 animate-pulse" : "bg-white/20"}`} />
                        <span className={i === selectedTrend.timeline.length - 1 ? "text-white font-medium" : "text-white/50"}>{entry}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex items-center justify-between p-3 bg-white/4 rounded-xl">
                  <span className="text-xs text-white/40">Heat Score</span>
                  <div className="flex items-center gap-2">
                    <div className="w-24 h-1.5 bg-white/5 rounded-full overflow-hidden">
                      <div className="h-full rounded-full" style={{ width: `${selectedTrend.heat}%`, background: heatColor(selectedTrend.heat) }} />
                    </div>
                    <span className="text-sm font-black" style={{ color: heatColor(selectedTrend.heat) }}>{selectedTrend.heat}%</span>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ── CITY BATTLE SECTION ────────────────────────────────────────────────
function CityBattleSection() {
  const [cityA, setCityA] = useState("delhi-in");
  const [cityB, setCityB] = useState("mumbai-in");
  const [data, setData] = useState<any>(null);
  const [phase, setPhase] = useState<"idle" | "loading" | "reveal">("idle");
  const PLACES = INDIA_CITIES;

  async function battle() {
    if (cityA === cityB) return;
    setPhase("loading"); setData(null);
    try {
      const res = await fetch("/api/viral/city-battle", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ placeA: cityA, placeB: cityB })
      });
      setData(await res.json());
      setTimeout(() => setPhase("reveal"), 1500);
    } catch { setPhase("idle"); }
  }

  return (
    <div className="max-w-2xl space-y-5">
      <div className="bg-[#0d1f33]/80 border border-white/8 rounded-2xl p-6">
        <h2 className="text-lg font-bold text-white mb-1">City Battle ⚔️</h2>
        <p className="text-sm text-white/40 mb-5">Let AI judge which city wins across Energy, Culture, Food, Nightlife and more.</p>
        <div className="grid grid-cols-3 gap-4 items-end">
          <div>
            <label className="text-xs text-white/40 uppercase tracking-wider mb-1.5 block">City A</label>
            <select value={cityA} onChange={e => setCityA(e.target.value)}
              className="w-full bg-[#07111f] border border-white/10 text-white rounded-xl px-3 py-2.5 text-sm focus:border-red-500/40 focus:outline-none">
              {PLACES.map(p => <option key={p.id} value={p.id}>{p.emoji} {p.name}</option>)}
            </select>
          </div>
          <div className="text-center">
            <div className="text-2xl font-black text-white/20 mb-2">VS</div>
            <button onClick={battle} disabled={phase === "loading" || cityA === cityB}
              className="flex items-center gap-2 px-5 py-2.5 bg-red-500 text-white rounded-xl font-bold text-sm hover:bg-red-400 disabled:opacity-40 transition-all mx-auto shadow-[0_0_20px_rgba(239,68,68,0.3)]">
              {phase === "loading" ? <Loader2 className="w-4 h-4 animate-spin" /> : <Swords className="w-4 h-4" />}
              Battle!
            </button>
          </div>
          <div>
            <label className="text-xs text-white/40 uppercase tracking-wider mb-1.5 block">City B</label>
            <select value={cityB} onChange={e => setCityB(e.target.value)}
              className="w-full bg-[#07111f] border border-white/10 text-white rounded-xl px-3 py-2.5 text-sm focus:border-red-500/40 focus:outline-none">
              {PLACES.map(p => <option key={p.id} value={p.id}>{p.emoji} {p.name}</option>)}
            </select>
          </div>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {phase === "loading" && (
          <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="text-center py-12 border border-dashed border-red-500/20 rounded-2xl bg-red-500/3">
            <Swords className="w-10 h-10 mx-auto mb-3 text-red-400/40 animate-pulse" />
            <p className="text-white/40 text-sm">AI is judging the battle...</p>
          </motion.div>
        )}
        {data && phase === "reveal" && (
          <motion.div key="result" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              {[data.cityA, data.cityB].map((city: any, i: number) => {
                const isWinner = city.name === data.winner;
                return (
                  <div key={i} className={`rounded-2xl p-5 border transition-all ${isWinner ? "border-yellow-400/40 bg-yellow-400/4" : "border-white/8 bg-[#0d1f33]/80"}`}>
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="text-lg font-bold text-white">{city.name}</h3>
                      {isWinner && <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", stiffness: 300 }} className="text-xl">🏆</motion.span>}
                    </div>
                    {Object.entries(city.stats || {}).map(([key, val]: [string, any], si) => (
                      <div key={key} className="mb-2">
                        <div className="flex justify-between text-xs text-white/40 mb-1">
                          <span className="capitalize">{key}</span>
                          <span className="font-bold text-white">{val}</span>
                        </div>
                        <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                          <motion.div initial={{ width: 0 }} animate={{ width: `${val}%` }} transition={{ delay: si * 0.08, duration: 0.6 }}
                            className={`h-full rounded-full ${i === 0 ? "bg-cyan-400" : "bg-red-400"}`} />
                        </div>
                      </div>
                    ))}
                  </div>
                );
              })}
            </div>
            <div className="bg-gradient-to-r from-yellow-400/8 via-[#0d1f33] to-yellow-400/8 border border-yellow-400/25 rounded-2xl p-6 text-center">
              <div className="text-4xl mb-2">🏆</div>
              <div className="text-2xl font-black text-yellow-400 mb-1">{data.winner} Wins!</div>
              <div className="text-sm text-white/50 italic mb-1">"{data.tagline}"</div>
              <div className="text-sm text-white/40 max-w-sm mx-auto">{data.verdict}</div>
            </div>
          </motion.div>
        )}
        {phase === "idle" && !data && (
          <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            className="text-center py-14 text-white/20 border border-dashed border-white/5 rounded-2xl">
            <Swords className="w-10 h-10 mx-auto mb-3 opacity-20" />
            <p className="text-sm">Choose two cities and start the battle</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ── CITY QUIZ SECTION ──────────────────────────────────────────────────
function CityQuizSection() {
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<string[]>([]);
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  function answer(opt: string) {
    const next = [...answers, opt];
    setAnswers(next);
    if (step < QUIZ_QUESTIONS.length - 1) setStep(step + 1);
    else submit(next);
  }

  async function submit(ans: string[]) {
    setLoading(true);
    try {
      const res = await fetch("/api/viral/quiz-result", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ answers: ans })
      });
      setResult(await res.json());
    } finally { setLoading(false); }
  }

  function reset() { setStep(0); setAnswers([]); setResult(null); }

  if (loading) return (
    <div className="text-center py-20">
      <div className="w-14 h-14 rounded-full border-2 border-yellow-400/30 border-t-yellow-400 animate-spin mx-auto mb-4" />
      <p className="text-white/40 text-sm">AI analyzing your city DNA...</p>
    </div>
  );

  if (result) return (
    <motion.div initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }}
      className="max-w-md space-y-4">
      <div className="bg-gradient-to-br from-cyan-500/8 via-[#0d1f33] to-purple-500/8 border border-cyan-500/25 rounded-2xl p-8 text-center">
        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", stiffness: 200 }}
          className="text-5xl mb-4">🌆</motion.div>
        <div className="text-xs text-cyan-400 font-bold uppercase tracking-widest mb-2">You are...</div>
        <div className="text-3xl font-black text-white mb-1">{result.city}</div>
        <div className="text-white/50 mb-4">{result.personality}</div>
        <div className="inline-flex items-center gap-2 bg-cyan-500/15 border border-cyan-500/25 rounded-full px-4 py-1.5 mb-5">
          <Star className="w-3.5 h-3.5 text-cyan-400" />
          <span className="text-cyan-400 font-black">{result.matchPercent}% Match</span>
        </div>
        <p className="text-white/60 text-sm leading-relaxed mb-4">{result.why}</p>
        {result.topTraits && (
          <div className="flex gap-2 flex-wrap justify-center mb-4">
            {result.topTraits.map((t: string) => (
              <span key={t} className="px-3 py-1 bg-cyan-500/12 border border-cyan-500/20 text-cyan-400 text-xs rounded-full">{t}</span>
            ))}
          </div>
        )}
        {result.funFact && (
          <div className="bg-white/4 rounded-xl p-3 text-xs text-white/50 text-left">{result.funFact}</div>
        )}
      </div>
      <button onClick={reset} className="w-full py-3 bg-white/4 hover:bg-white/8 border border-white/8 rounded-xl text-white text-sm font-medium transition-all">
        Take Quiz Again
      </button>
    </motion.div>
  );

  const q = QUIZ_QUESTIONS[step];
  return (
    <div className="max-w-lg space-y-5">
      <div>
        <div className="flex justify-between text-xs text-white/30 mb-2">
          <span>Question {step + 1} / {QUIZ_QUESTIONS.length}</span>
          <span>{Math.round((step / QUIZ_QUESTIONS.length) * 100)}%</span>
        </div>
        <div className="h-1.5 bg-white/8 rounded-full overflow-hidden">
          <motion.div className="h-full bg-yellow-400 rounded-full" animate={{ width: `${(step / QUIZ_QUESTIONS.length) * 100}%` }} transition={{ duration: 0.4 }} />
        </div>
      </div>
      <AnimatePresence mode="wait">
        <motion.div key={step} initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -16 }} transition={{ duration: 0.2 }}>
          <h2 className="text-xl font-bold text-white mb-4">{q.question}</h2>
          <div className="space-y-2">
            {q.options.map((opt, i) => (
              <motion.button key={i} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}
                onClick={() => answer(opt)}
                className="w-full text-left p-4 bg-[#0d1f33]/80 border border-white/8 hover:border-yellow-400/30 hover:bg-yellow-400/4 rounded-xl text-sm text-white/70 hover:text-white transition-all">
                {opt}
              </motion.button>
            ))}
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
