import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Clock, Sparkles, Search, Loader2, ChevronLeft, ChevronRight,
  ArrowUpRight, BookOpen, Map, Star, X, Flame, Zap,
  Calendar, Camera, ScrollText, Landmark, Music2, Trophy
} from "lucide-react";

// ── HISTORICAL DATA ──────────────────────────────────────────────────
const PLACES = [
  { id: "delhi-in", name: "Delhi", country: "India", flag: "🇮🇳", age: "3200+ years", emoji: "🏛" },
  { id: "mumbai-in", name: "Mumbai", country: "India", flag: "🇮🇳", age: "800+ years", emoji: "🌊" },
  { id: "varanasi-in", name: "Varanasi", country: "India", flag: "🇮🇳", age: "5000+ years", emoji: "🕯" },
  { id: "jaipur-in", name: "Jaipur", country: "India", flag: "🇮🇳", age: "300+ years", emoji: "🏰" },
  { id: "bangalore-in", name: "Bangalore", country: "India", flag: "🇮🇳", age: "500+ years", emoji: "💻" },
  { id: "kolkata-in", name: "Kolkata", country: "India", flag: "🇮🇳", age: "400+ years", emoji: "🎭" },
  { id: "agra-in", name: "Agra", country: "India", flag: "🇮🇳", age: "2000+ years", emoji: "🕌" },
  { id: "tokyo-jp", name: "Tokyo", country: "Japan", flag: "🇯🇵", age: "400+ years", emoji: "⛩" },
  { id: "london-uk", name: "London", country: "UK", flag: "🇬🇧", age: "2000+ years", emoji: "🏰" },
  { id: "new-york-us", name: "New York", country: "USA", flag: "🇺🇸", age: "400+ years", emoji: "🗽" },
  { id: "paris-fr", name: "Paris", country: "France", flag: "🇫🇷", age: "2000+ years", emoji: "🗼" },
  { id: "dubai-ae", name: "Dubai", country: "UAE", flag: "🇦🇪", age: "200+ years", emoji: "🌆" },
];

const TIMELINE_DATA: Record<string, {
  eras: { year: number; label: string; title: string; summary: string; mood: string; color: string; events: string[]; population?: string }[]
  heritage: { category: string; emoji: string; description: string }[]
  whatif: { scenario: string; answer: string }
}> = {
  "delhi-in": {
    eras: [
      { year: 300, label: "Ancient", title: "Kingdom of Indraprastha", summary: "The mythological city of the Pandavas. Ancient settlements along the Yamuna river form the earliest traces of Delhi's civilization.", mood: "Mythic", color: "#f59e0b", events: ["Indraprastha kingdom", "Yamuna settlements", "Ancient trade routes", "Epic era connections"], population: "~50,000" },
      { year: 1200, label: "Medieval", title: "Delhi Sultanate Era", summary: "Qutub Minar rises. The Delhi Sultanate transforms the city into a major Islamic power center in South Asia.", mood: "Imperial", color: "#a78bfa", events: ["Qutub Minar built", "Slave Dynasty rules", "Persian culture arrives", "Massive infrastructure"], population: "~200,000" },
      { year: 1650, label: "Mughal", title: "Mughal Splendor", summary: "Shah Jahan builds Red Fort and Shahjahanabad. Delhi becomes the crown jewel of the Mughal Empire, a city of unimaginable wealth.", mood: "Magnificent", color: "#ec4899", events: ["Red Fort constructed", "Shahjahanabad founded", "Jama Masjid built", "Trade at peak"], population: "~500,000" },
      { year: 1857, label: "Colonial", title: "Sepoy Mutiny", summary: "The Great Revolt of 1857 reshapes the city. British power consolidates and Delhi transforms under colonial administration.", mood: "Turbulent", color: "#ef4444", events: ["First War of Independence", "British take control", "City redesigned", "Cultural shifts"], population: "~150,000" },
      { year: 1947, label: "Independence", title: "India Reborn", summary: "August 15, 1947 — Delhi becomes the capital of independent India. Partition reshapes the city as millions arrive and depart.", mood: "Historic", color: "#f97316", events: ["Independence declared", "Partition migration", "New Parliament", "Nehru's speech"], population: "~900,000" },
      { year: 1991, label: "Liberalization", title: "Economic Awakening", summary: "India opens its economy. Delhi transforms rapidly — malls, multinationals, and a booming middle class reshape the capital.", mood: "Optimistic", color: "#22c55e", events: ["Economic reforms", "IT industry grows", "Malls emerge", "Middle class rises"], population: "~8,000,000" },
      { year: 2006, label: "Metro Era", title: "Underground Revolution", summary: "Delhi Metro changes everything. Millions move faster, cleaner, cheaper. The city becomes a model for urban transport in Asia.", mood: "Progressive", color: "#06b6d4", events: ["Metro Phase 1", "CWG preparation", "IT hub status", "Urban growth"], population: "~16,000,000" },
      { year: 2026, label: "Present", title: "Digital Capital", summary: "Delhi is India's digital and political nerve center. 33 million people, AI infrastructure, smart city initiatives, and a pulse that never sleeps.", mood: "Electric", color: "#00ffcc", events: ["33M population", "Smart city network", "AI integration", "Global events hub"], population: "~33,000,000" },
    ],
    heritage: [
      { category: "Architecture", emoji: "🏛", description: "Red Fort, Qutub Minar, Humayun's Tomb — 800 years of imperial grandeur" },
      { category: "Culture", emoji: "🎭", description: "Kathak dance, Mughal cuisine, Chandni Chowk bazaars, Sufi music" },
      { category: "Spirituality", emoji: "🛕", description: "Akshardham, Jama Masjid, Gurudwara Bangla Sahib — faith of all kinds" },
      { category: "Street Life", emoji: "🍛", description: "Paranthe Wali Gali, kebabs, chaat — street food spanning 400 years" },
    ],
    whatif: { scenario: "What if the Delhi Metro was never built?", answer: "Without the Metro, Delhi's 3.5 million daily commuters would have added enormous strain to roads. Traffic congestion would have worsened by an estimated 40%, air pollution would have increased significantly, and the economic productivity loss could have been ₹15,000 crore annually. Satellite cities like Gurgaon and Noida may never have developed as rapidly." }
  },
  "mumbai-in": {
    eras: [
      { year: 1000, label: "Ancient", title: "Heptanesia Islands", summary: "Seven islands inhabited by Koli fishing communities. The sea defines everything — these islands are home to fishermen who would eventually see their world transform completely.", mood: "Peaceful", color: "#f59e0b", events: ["Koli settlements", "Fishing culture", "Island life", "Trade with Arabia"], population: "~20,000" },
      { year: 1500, label: "Portuguese", title: "Portuguese Conquest", summary: "Portugal claims Bom Bahia — 'Good Bay.' The islands transform under colonial rule with forts and churches reshaping the coastline.", mood: "Colonial", color: "#a78bfa", events: ["Portuguese arrive", "Bom Bahia named", "Castella de Aguada built", "Spice trade begins"], population: "~10,000" },
      { year: 1668, label: "British", title: "East India Company", summary: "The islands pass to Britain. The East India Company transforms this into a major trading port, reclaiming land and connecting islands.", mood: "Commercial", color: "#ec4899", events: ["British takeover", "Land reclamation begins", "Cotton trade grows", "Victoria Terminus planned"], population: "~60,000" },
      { year: 1853, label: "Railway", title: "First Train in Asia", summary: "First railway in Asia connects Bombay to Thane. This single event changes the city's destiny — workers flow in, factories rise, Bombay booms.", mood: "Revolutionary", color: "#f97316", events: ["First Asian railway", "Industrial boom", "Mill workers arrive", "City expands north"], population: "~800,000" },
      { year: 1947, label: "Independence", title: "Bombay Presidency", summary: "Independence transforms Bombay into India's commercial capital. The textile mills, Bollywood, and financial institutions make it India's economic heart.", mood: "Triumphant", color: "#22c55e", events: ["Financial hub status", "Bollywood rising", "Textile industry peak", "State formation"], population: "~3,000,000" },
      { year: 1995, label: "Renamed", title: "Mumbai is Born", summary: "Bombay officially becomes Mumbai, honoring the goddess Mumbadevi. The city's identity deepens as it becomes South Asia's financial capital.", mood: "Identity", color: "#06b6d4", events: ["Name changes to Mumbai", "Stock exchange modernizes", "IT services grow", "Bollywood globalizes"], population: "~12,000,000" },
      { year: 2026, label: "Present", title: "Dream City", summary: "Mumbai — 21 million people sharing maximum 603 sq km. Financial capital, Bollywood, startup hub, and the city that never sleeps.", mood: "Relentless", color: "#00ffcc", events: ["21M+ population", "Coastal road opens", "Metro expansion", "Dharavi redevelopment"], population: "~21,000,000" },
    ],
    heritage: [
      { category: "Cinema", emoji: "🎬", description: "Bollywood — the world's largest film industry, born in Mumbai's studios" },
      { category: "Finance", emoji: "💼", description: "Dalal Street, RBI, BSE — India's economic pulse beats here" },
      { category: "Architecture", emoji: "🏛", description: "Gateway of India, CST, Art Deco buildings — Victorian meets Art Deco" },
      { category: "Spirit", emoji: "💪", description: "Dabbawalas, local trains, monsoon survival — Mumbai's unstoppable spirit" },
    ],
    whatif: { scenario: "What if Bollywood developed in Delhi instead?", answer: "Mumbai's geography — islands, sea breeze, colonial infrastructure, and cosmopolitan culture — created the perfect conditions for cinema. In Delhi, the cold winters, political atmosphere, and landlocked geography would have shaped a very different film industry. Hindi cinema might have been more politically charged, Urdu-influenced, and less glamorous." }
  },
  "varanasi-in": {
    eras: [
      { year: -3000, label: "Ancient", title: "Oldest Living City", summary: "Varanasi is among the oldest continuously inhabited cities on Earth. The Ganges has flowed past these ghats for over 5,000 years of unbroken civilization.", mood: "Eternal", color: "#f59e0b", events: ["Vedic civilization", "Sacred Ganges worship", "First ghats built", "Kashi kingdom"], population: "~30,000" },
      { year: -500, label: "Buddhist Era", title: "Sarnath's Light", summary: "Buddha delivered his first sermon at nearby Sarnath. Varanasi becomes a center of learning, philosophy, and spiritual inquiry across Asia.", mood: "Enlightened", color: "#a78bfa", events: ["Buddha's first sermon", "Sarnath monastery", "Sanskrit university", "Global pilgrims arrive"], population: "~100,000" },
      { year: 1200, label: "Medieval", title: "Islamic Influence", summary: "The city faces invasions yet survives. Temples are destroyed and rebuilt. The resilience of Kashi becomes legendary — faith endures everything.", mood: "Resilient", color: "#ec4899", events: ["Temples destroyed", "Culture survives", "Weaving tradition grows", "Silk trade expands"], population: "~150,000" },
      { year: 1750, label: "Maratha", title: "Temple Renaissance", summary: "Marathas rebuild the great temples. Kashi Vishwanath is restored. The city of Shiva reclaims its spiritual glory in a golden age of temple construction.", mood: "Revival", color: "#f97316", events: ["Kashi Vishwanath rebuilt", "Ramnagar fort built", "Classical music peak", "Silk industry boom"], population: "~200,000" },
      { year: 1947, label: "Modern India", title: "University City", summary: "Banaras Hindu University, one of Asia's largest, shapes modern Varanasi. Ancient traditions and modern education coexist in unique harmony.", mood: "Balanced", color: "#22c55e", events: ["BHU established", "Independence celebrated", "Silk exports grow", "Tourism rises"], population: "~500,000" },
      { year: 2026, label: "Present", title: "Sacred Smart City", summary: "Varanasi gets a smart city makeover while preserving its 5,000-year soul. The ghats glow at night, fiber optic cables run under ancient stones.", mood: "Timeless", color: "#00ffcc", events: ["Smart Ganga Ghat", "Tourism peaks", "UNESCO recognition", "PM's constituency"], population: "~1,500,000" },
    ],
    heritage: [
      { category: "Spirituality", emoji: "🕯", description: "Ganga Aarti, Manikarnika Ghat — the eternal cycle of life and death" },
      { category: "Music", emoji: "🎵", description: "Ravi Shankar, Bismillah Khan — classical Indian music born in these alleys" },
      { category: "Silk", emoji: "🧵", description: "Banarasi silk sarees — 14th century craft still woven by hand today" },
      { category: "Philosophy", emoji: "📿", description: "Adi Shankaracharya walked these ghats — India's philosophical heart" },
    ],
    whatif: { scenario: "What if Varanasi had modernized like Mumbai?", answer: "Varanasi's spiritual identity is inseparable from its ancient urban form. Modernization on Mumbai's scale would have destroyed the ghats, narrow lanes, and temple clusters that attract millions of pilgrims. The city would have gained economic growth but lost the intangible soul that makes it one of humanity's most profound living heritage sites." }
  },
  "default": {
    eras: [
      { year: 1000, label: "Ancient", title: "Early Settlements", summary: "The first communities establish themselves here, creating the foundations of what will become a great city.", mood: "Origins", color: "#f59e0b", events: ["First settlements", "Trade routes form", "Culture begins", "Communities grow"] },
      { year: 1500, label: "Medieval", title: "City Takes Shape", summary: "The city grows in power and influence. Architecture, culture, and commerce define a new era of urban life.", mood: "Growing", color: "#a78bfa", events: ["Architecture rises", "Trade expands", "Culture flourishes", "Power consolidates"] },
      { year: 1850, label: "Modern Era", title: "Industrial Growth", summary: "The industrial age transforms the city. Railways, factories, and new ideas reshape everything.", mood: "Transforming", color: "#ec4899", events: ["Industry arrives", "Population grows", "New infrastructure", "Social change"] },
      { year: 1950, label: "Post-War", title: "Rebuilding & Hope", summary: "A new chapter begins. The city rebuilds, modernizes, and looks to the future with optimism and energy.", mood: "Hopeful", color: "#22c55e", events: ["Reconstruction", "Economic growth", "Cultural revival", "Modern institutions"] },
      { year: 2026, label: "Present", title: "Digital Age", summary: "A fully connected city navigating technology, culture, and the challenges of the 21st century.", mood: "Connected", color: "#00ffcc", events: ["Digital infrastructure", "Global connectivity", "Smart systems", "Cultural fusion"] },
    ],
    heritage: [
      { category: "History", emoji: "🏛", description: "Centuries of civilization visible in every street" },
      { category: "Culture", emoji: "🎭", description: "Traditions passed down through generations" },
      { category: "Architecture", emoji: "🏙", description: "Buildings that tell the story of time" },
      { category: "People", emoji: "👥", description: "Communities that shaped the world" },
    ],
    whatif: { scenario: "What if history had taken a different turn here?", answer: "Every city is a product of countless decisions, accidents, and moments of human courage or folly. Had even one key event unfolded differently, the urban landscape, culture, and identity we see today would be fundamentally altered. History is always contingent — and that contingency is what makes it fascinating." }
  }
};

const TRENDING_CAPSULES = [
  { title: "Delhi: 1000 Years", place: "Delhi 🇮🇳", views: "2.4M", emoji: "🏛", hot: true },
  { title: "Varanasi Eternal", place: "Varanasi 🇮🇳", views: "1.8M", emoji: "🕯", hot: true },
  { title: "Mumbai's Rise", place: "Mumbai 🇮🇳", views: "1.5M", emoji: "🌊" },
  { title: "Tokyo Transforms", place: "Tokyo 🇯🇵", views: "1.2M", emoji: "⛩" },
  { title: "Ancient India", place: "India 🇮🇳", views: "980K", emoji: "🗺", hot: true },
  { title: "Jaipur Pink City", place: "Jaipur 🇮🇳", views: "760K", emoji: "🏰" },
];

const INDIA_FESTIVALS_HISTORY = [
  {
    name: "Diwali", emoji: "✨",
    timeline: [
      { period: "Ancient", year: "~3000 years ago", note: "Celebrated the return of Ram to Ayodhya. Oil lamps lit in every home, streets illuminated by fire." },
      { period: "Mughal Era", year: "1600s", note: "Emperor Akbar celebrated Diwali with grand diyas and released prisoners. The festival bridged Hindu-Muslim culture." },
      { period: "Colonial", year: "1900s", note: "Despite British rule, Diwali remained the brightest celebration of the year. Sweets and community became central." },
      { period: "Modern", year: "2000s", note: "Global Diwali! Indians across 40+ countries celebrate. Firecrackers evolve into light shows, online shopping surges." },
      { period: "Now", year: "2026", note: "2.8 billion social media posts in 48 hours. Online shopping peaks at ₹1.5 lakh crore. Yet the diyas still burn." },
    ]
  },
  {
    name: "Holi", emoji: "🌈",
    timeline: [
      { period: "Ancient", year: "~5000 years ago", note: "Celebration of Holika's defeat. Natural colours from flowers like tesu and gulal were used." },
      { period: "Medieval", year: "1500s", note: "Radha-Krishna's holi at Barsana and Vrindavan became legendary. Poets wrote about its colours." },
      { period: "Modern", year: "1990s", note: "Holi goes national — from a regional Braj festival to all of India celebrating." },
      { period: "Now", year: "2026", note: "400M+ Indians play Holi. Natural colour revival. International tourists flood Mathura and Vrindavan." },
    ]
  },
];

function FloatingClocks() {
  const clocks = Array.from({ length: 8 }, (_, i) => ({
    x: 10 + Math.random() * 80, y: 10 + Math.random() * 80,
    size: 16 + Math.random() * 24, delay: i * 0.4, duration: 3 + Math.random() * 2
  }));
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-20">
      {clocks.map((c, i) => (
        <motion.div key={i}
          style={{ position: "absolute", left: `${c.x}%`, top: `${c.y}%`, fontSize: c.size }}
          animate={{ y: [-8, 8, -8], opacity: [0.3, 0.7, 0.3], rotate: [0, 360] }}
          transition={{ duration: c.duration, repeat: Infinity, delay: c.delay, ease: "easeInOut" }}>
          ⏳
        </motion.div>
      ))}
    </div>
  );
}

function TimelineBar({ eras, activeIdx, onSelect }: {
  eras: typeof TIMELINE_DATA["delhi-in"]["eras"];
  activeIdx: number;
  onSelect: (i: number) => void;
}) {
  return (
    <div className="relative">
      <div className="absolute left-6 top-0 bottom-0 w-px bg-gradient-to-b from-yellow-500/50 via-purple-500/50 to-cyan-500/50" />
      <div className="space-y-0">
        {eras.map((era, i) => (
          <motion.div key={era.year}
            initial={{ opacity: 0, x: -12 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.06 }}>
            <button onClick={() => onSelect(i)}
              className={`relative w-full text-left pl-14 pr-4 py-3 transition-all group ${activeIdx === i ? "opacity-100" : "opacity-50 hover:opacity-75"}`}>
              <div className={`absolute left-3.5 w-5 h-5 rounded-full border-2 transition-all flex items-center justify-center
                ${activeIdx === i ? "scale-125 shadow-lg" : "scale-100"}`}
                style={{
                  borderColor: era.color,
                  background: activeIdx === i ? era.color + "30" : "transparent",
                  boxShadow: activeIdx === i ? `0 0 12px ${era.color}60` : "none"
                }}>
                {activeIdx === i && <motion.div
                  animate={{ scale: [1, 1.5, 1], opacity: [1, 0, 1] }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                  className="w-2 h-2 rounded-full"
                  style={{ background: era.color }}
                />}
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-black" style={{ color: era.color }}>
                  {era.year < 0 ? `${Math.abs(era.year)} BCE` : era.year < 100 ? `${era.year} CE` : era.year}
                </span>
                <span className="text-xs text-white/40">{era.label}</span>
              </div>
              <div className={`text-sm font-semibold mt-0.5 transition-colors ${activeIdx === i ? "text-white" : "text-white/50 group-hover:text-white/70"}`}>
                {era.title}
              </div>
            </button>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

function EraCard({ era }: { era: typeof TIMELINE_DATA["delhi-in"]["eras"][0] }) {
  return (
    <motion.div
      key={era.year}
      initial={{ opacity: 0, y: 20, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ type: "spring", stiffness: 200, damping: 24 }}
      className="relative overflow-hidden rounded-3xl p-7 border"
      style={{
        background: `linear-gradient(135deg, ${era.color}08 0%, #0d1f33 60%, ${era.color}04 100%)`,
        borderColor: `${era.color}25`,
        boxShadow: `0 0 60px ${era.color}08`
      }}
    >
      <div className="absolute top-0 right-0 w-64 h-64 rounded-full -translate-y-1/2 translate-x-1/2 pointer-events-none"
        style={{ background: `radial-gradient(circle, ${era.color}08, transparent)` }} />

      <div className="relative">
        <div className="flex items-start justify-between mb-4 flex-wrap gap-3">
          <div>
            <div className="text-xs font-bold uppercase tracking-widest mb-1" style={{ color: era.color }}>{era.label} Era</div>
            <div className="text-3xl font-black text-white">{era.title}</div>
            <div className="text-lg font-bold mt-1 text-white/50">
              {era.year < 0 ? `${Math.abs(era.year)} BCE` : era.year < 100 ? `${era.year} CE` : era.year} AD
            </div>
          </div>
          <div className="text-right">
            <div className="text-xs text-white/30 mb-1">Mood</div>
            <div className="text-lg font-bold px-3 py-1 rounded-full" style={{ background: era.color + "20", color: era.color }}>
              {era.mood}
            </div>
            {era.population && (
              <div className="text-xs text-white/30 mt-1">~{era.population}</div>
            )}
          </div>
        </div>

        <p className="text-base text-white/70 leading-relaxed mb-5">{era.summary}</p>

        <div className="flex flex-wrap gap-2 mb-5">
          {era.events.map(ev => (
            <span key={ev} className="text-xs px-3 py-1.5 rounded-full border font-medium"
              style={{ background: era.color + "12", borderColor: era.color + "30", color: era.color }}>
              {ev}
            </span>
          ))}
        </div>

        <div className="w-full h-1.5 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.06)" }}>
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: "85%" }}
            transition={{ duration: 1, ease: "easeOut" }}
            className="h-full rounded-full"
            style={{ background: `linear-gradient(90deg, ${era.color}60, ${era.color})` }}
          />
        </div>
        <div className="flex justify-between text-xs text-white/25 mt-1.5">
          <span>Historical Confidence</span>
          <span style={{ color: era.color }}>95%</span>
        </div>
      </div>
    </motion.div>
  );
}

export default function TimeCapsule() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedPlace, setSelectedPlace] = useState<typeof PLACES[0] | null>(null);
  const [placeData, setPlaceData] = useState<typeof TIMELINE_DATA["delhi-in"] | null>(null);
  const [activeEraIdx, setActiveEraIdx] = useState(0);
  const [section, setSection] = useState<"journey" | "heritage" | "festival" | "whatif" | "dayinpast">("journey");
  const [aiStory, setAiStory] = useState<string | null>(null);
  const [aiStoryLoading, setAiStoryLoading] = useState(false);
  const [showAIChat, setShowAIChat] = useState(false);
  const [aiChatQuery, setAiChatQuery] = useState("");
  const [aiChatAnswer, setAiChatAnswer] = useState<string | null>(null);
  const [aiChatLoading, setAiChatLoading] = useState(false);
  const [dayYear, setDayYear] = useState(1995);
  const [dayHour, setDayHour] = useState(19);
  const [dayScene, setDayScene] = useState<string | null>(null);
  const [dayLoading, setDayLoading] = useState(false);
  const [activeFestival, setActiveFestival] = useState(0);
  const [compareMode, setCompareMode] = useState(false);
  const searchRef = useRef<HTMLInputElement>(null);

  const filteredPlaces = PLACES.filter(p =>
    p.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  function selectPlace(place: typeof PLACES[0]) {
    setSelectedPlace(place);
    setSearchQuery(place.name);
    const data = TIMELINE_DATA[place.id] || TIMELINE_DATA.default;
    setPlaceData(data);
    setActiveEraIdx(data.eras.length - 1);
    setAiStory(null);
    setSection("journey");
  }

  async function generateAIStory() {
    if (!selectedPlace || !placeData) return;
    setAiStoryLoading(true);
    const era = placeData.eras[activeEraIdx];
    try {
      const res = await fetch("/api/chat/message", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: `Write a vivid, atmospheric 3-sentence historical narrative about ${selectedPlace.name} during the ${era.label} era (around ${era.year < 0 ? Math.abs(era.year) + " BCE" : era.year} AD). The mood is "${era.mood}". Make it feel like you're standing there. No bullet points, just flowing prose.`,
          sessionId: "time-capsule-story"
        })
      });
      const d = await res.json();
      setAiStory(d.message || null);
    } catch {
      setAiStory(`The streets of ${selectedPlace.name} in ${era.year} AD tell a story of ${era.mood.toLowerCase()} times. ${era.summary} The echoes of this era still shape every stone and story of the city today.`);
    } finally { setAiStoryLoading(false); }
  }

  async function generateDayScene() {
    if (!selectedPlace) return;
    setDayLoading(true); setDayScene(null);
    const hourLabel = dayHour === 0 ? "midnight" : dayHour < 12 ? `${dayHour} AM` : dayHour === 12 ? "noon" : `${dayHour - 12} PM`;
    try {
      const res = await fetch("/api/chat/message", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: `Describe a vivid scene in ${selectedPlace.name} at exactly ${hourLabel} in the year ${dayYear}. Describe what people are doing, the sounds, the smells, the atmosphere. 3-4 sentences maximum. Be specific and sensory.`,
          sessionId: "time-capsule-day"
        })
      });
      const d = await res.json();
      setDayScene(d.message || null);
    } catch {
      setDayScene(`At ${hourLabel} in ${dayYear}, ${selectedPlace.name} has a distinct rhythm — the streets, sounds, and stories of this moment in time are uniquely its own.`);
    } finally { setDayLoading(false); }
  }

  async function askHistoryAI() {
    if (!aiChatQuery.trim()) return;
    setAiChatLoading(true); setAiChatAnswer(null);
    try {
      const res = await fetch("/api/chat/message", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: `Historical intelligence query about ${selectedPlace?.name || "India"}: "${aiChatQuery}". Give a 2-sentence insightful historical answer with specific facts and years.`,
          sessionId: "history-ai-chat"
        })
      });
      const d = await res.json();
      setAiChatAnswer(d.message || "The history of this place holds many layers worth exploring.");
    } catch {
      setAiChatAnswer("History AI is momentarily unavailable, but the stories of this place span thousands of years.");
    } finally { setAiChatLoading(false); }
  }

  const currentEra = placeData?.eras[activeEraIdx];

  return (
    <div className="min-h-full" style={{ background: "linear-gradient(180deg, #060e1a 0%, #07111f 50%, #0a0f1e 100%)" }}>

      {/* ── HERO ── */}
      <div className="relative overflow-hidden border-b border-white/5 min-h-52">
        <FloatingClocks />
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute inset-0" style={{ background: "radial-gradient(ellipse at 50% 0%, #f59e0b08 0%, transparent 60%), radial-gradient(ellipse at 80% 100%, #a78bfa08 0%, transparent 50%)" }} />
          <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-yellow-500/20 to-transparent" />
        </div>
        <div className="relative px-6 md:px-10 py-8">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Clock className="w-4 h-4 text-yellow-400" />
                <span className="text-xs font-bold text-yellow-400 uppercase tracking-widest">Time Capsule</span>
              </div>
              <h1 className="text-3xl md:text-4xl font-black text-white leading-tight">
                ⏳ Explore The Memory<br />
                <span className="text-transparent bg-clip-text" style={{ backgroundImage: "linear-gradient(135deg, #f59e0b, #a78bfa)" }}>
                  Of Every Place
                </span>
              </h1>
              <p className="text-white/50 mt-2 text-sm max-w-lg leading-relaxed">
                Travel through history and discover how places changed over time — powered by AI intelligence.
              </p>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {[
                { label: "Places Remembered", value: "1M+", color: "#f59e0b", emoji: "🌍" },
                { label: "Historic Moments", value: "500K+", color: "#a78bfa", emoji: "📜" },
                { label: "AI Timelines", value: "12K+", color: "#00ffcc", emoji: "🤖" },
                { label: "AI Timeline", value: "ACTIVE", color: "#ec4899", emoji: "⚡" },
              ].map(s => (
                <div key={s.label} className="bg-[#0d1f33]/70 backdrop-blur border border-white/8 rounded-2xl p-3 text-center">
                  <div className="text-lg mb-1">{s.emoji}</div>
                  <div className="text-xl font-black" style={{ color: s.color }}>{s.value}</div>
                  <div className="text-xs text-white/30 mt-0.5">{s.label}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Search */}
          <div className="mt-6 max-w-xl">
            <div className="relative">
              <div className="flex items-center gap-3 bg-[#0d1f33]/90 border border-white/10 rounded-2xl px-4 py-3.5 focus-within:border-yellow-500/40 transition-all">
                <Search className="w-4 h-4 text-yellow-400 flex-shrink-0" />
                <input
                  ref={searchRef}
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  placeholder='Enter a place — "Delhi", "Varanasi", "Mumbai"...'
                  className="flex-1 bg-transparent text-white placeholder-white/25 text-sm outline-none"
                />
                {selectedPlace && (
                  <button onClick={() => { setSearchQuery(""); setSelectedPlace(null); setPlaceData(null); }}
                    className="text-white/30 hover:text-white/60">
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
              <AnimatePresence>
                {searchQuery && !selectedPlace && filteredPlaces.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, y: -6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -6 }}
                    className="absolute top-full mt-2 left-0 right-0 bg-[#0d1f33] border border-white/12 rounded-2xl overflow-hidden z-20 shadow-2xl">
                    {filteredPlaces.map(place => (
                      <button key={place.id} onClick={() => selectPlace(place)}
                        className="w-full flex items-center gap-3 px-4 py-3 hover:bg-white/5 transition-all text-left">
                        <span className="text-xl">{place.emoji}</span>
                        <div>
                          <div className="text-sm font-bold text-white">{place.name}</div>
                          <div className="text-xs text-white/35">{place.country} · {place.age} old</div>
                        </div>
                        <div className="ml-auto text-xs text-yellow-400">{place.flag}</div>
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
            {!selectedPlace && (
              <div className="flex gap-2 mt-3 flex-wrap">
                {PLACES.slice(0, 6).map(p => (
                  <button key={p.id} onClick={() => selectPlace(p)}
                    className="text-xs px-3 py-1.5 rounded-xl bg-white/4 border border-white/8 text-white/50 hover:text-white hover:border-white/20 transition-all">
                    {p.emoji} {p.name}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── NO PLACE SELECTED: TRENDING ── */}
      {!selectedPlace && (
        <div className="px-6 md:px-10 py-8 space-y-8">
          {/* Trending Capsules */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-1.5 h-5 rounded-full bg-yellow-400" />
              <h2 className="text-lg font-bold text-white">🔥 Trending Time Journeys</h2>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
              {TRENDING_CAPSULES.map((tc, i) => (
                <motion.div key={tc.title}
                  initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}
                  onClick={() => {
                    const match = PLACES.find(p => tc.place.includes(p.name));
                    if (match) selectPlace(match);
                  }}
                  className="bg-[#0d1f33]/80 border border-white/8 rounded-2xl p-4 hover:border-yellow-400/25 transition-all cursor-pointer group">
                  <div className="text-2xl mb-2">{tc.emoji}</div>
                  <div className="text-sm font-bold text-white group-hover:text-yellow-300 transition-colors leading-tight">{tc.title}</div>
                  <div className="text-xs text-white/35 mt-1">{tc.place}</div>
                  <div className="flex items-center justify-between mt-2">
                    <span className="text-xs text-white/25">{tc.views} views</span>
                    {tc.hot && <span className="text-xs text-red-400 font-bold">🔥</span>}
                  </div>
                </motion.div>
              ))}
            </div>
          </div>

          {/* India Heritage Quick Explore */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-1.5 h-5 rounded-full bg-orange-400" />
              <h2 className="text-lg font-bold text-white">🇮🇳 India Heritage Explorer</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                { icon: "🏛", label: "Heritage Sites", desc: "UNESCO treasures, ancient forts, temples spanning millennia", places: ["Agra", "Varanasi", "Khajuraho"] },
                { icon: "🎭", label: "Cultural History", desc: "Classical dance, music, art forms preserved for centuries", places: ["Varanasi", "Chennai", "Manipur"] },
                { icon: "🛕", label: "Spiritual Centers", desc: "Pilgrimage routes, sacred rivers, divine mountains", places: ["Varanasi", "Haridwar", "Tirupati"] },
                { icon: "🏙", label: "City Evolution", desc: "How India's megacities grew from villages to powerhouses", places: ["Delhi", "Mumbai", "Bangalore"] },
              ].map(cat => (
                <div key={cat.label} className="bg-[#0d1f33]/80 border border-white/8 rounded-2xl p-5 hover:border-orange-400/20 transition-all">
                  <div className="text-2xl mb-2">{cat.icon}</div>
                  <div className="font-bold text-white text-sm mb-1">{cat.label}</div>
                  <div className="text-xs text-white/40 mb-3 leading-relaxed">{cat.desc}</div>
                  <div className="flex gap-1.5 flex-wrap">
                    {cat.places.map(p => (
                      <button key={p} onClick={() => {
                        const match = PLACES.find(pl => pl.name === p);
                        if (match) selectPlace(match);
                      }} className="text-xs px-2.5 py-1 rounded-full bg-orange-400/10 border border-orange-400/20 text-orange-300 hover:bg-orange-400/20 transition-all">
                        {p}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── PLACE SELECTED: FULL TIME JOURNEY ── */}
      {selectedPlace && placeData && (
        <div className="px-6 md:px-10 py-6 space-y-6">

          {/* Place Header */}
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-3xl border border-yellow-500/20"
                style={{ background: "rgba(245,158,11,0.08)" }}>
                {selectedPlace.emoji}
              </div>
              <div>
                <div className="text-2xl font-black text-white flex items-center gap-2">
                  {selectedPlace.name} {selectedPlace.flag}
                </div>
                <div className="text-sm text-white/40">{selectedPlace.age} old · {selectedPlace.country}</div>
              </div>
            </div>

            {/* Section Tabs */}
            <div className="flex gap-2 flex-wrap">
              {[
                { id: "journey", label: "⏳ Time Journey" },
                { id: "heritage", label: "🏛 Heritage" },
                { id: "festival", label: "🎉 Festivals" },
                { id: "whatif", label: "🔮 What If?" },
                { id: "dayinpast", label: "📅 Day In Past" },
              ].map(tab => (
                <button key={tab.id} onClick={() => setSection(tab.id as any)}
                  className={`text-xs px-3.5 py-2 rounded-xl font-semibold border transition-all ${section === tab.id ? "bg-yellow-500/20 border-yellow-500/35 text-yellow-300" : "border-white/8 text-white/40 hover:text-white bg-transparent"}`}>
                  {tab.label}
                </button>
              ))}
            </div>
          </motion.div>

          <AnimatePresence mode="wait">

            {/* ── TIME JOURNEY ── */}
            {section === "journey" && (
              <motion.div key="journey" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                {/* Timeline Sidebar */}
                <div className="bg-[#0d1f33]/80 border border-white/8 rounded-2xl p-5">
                  <div className="text-xs font-bold text-white/30 uppercase tracking-widest mb-4 flex items-center gap-2">
                    <Clock className="w-3.5 h-3.5 text-yellow-400" /> Timeline
                  </div>
                  <TimelineBar eras={placeData.eras} activeIdx={activeEraIdx} onSelect={setActiveEraIdx} />
                  <div className="mt-5 flex gap-2">
                    <button onClick={() => setActiveEraIdx(Math.max(0, activeEraIdx - 1))}
                      disabled={activeEraIdx === 0}
                      className="flex-1 flex items-center justify-center gap-1 py-2.5 bg-white/5 hover:bg-white/10 border border-white/8 rounded-xl text-white/60 disabled:opacity-25 text-xs font-semibold transition-all">
                      <ChevronLeft className="w-3.5 h-3.5" /> Older
                    </button>
                    <button onClick={() => setActiveEraIdx(Math.min(placeData.eras.length - 1, activeEraIdx + 1))}
                      disabled={activeEraIdx === placeData.eras.length - 1}
                      className="flex-1 flex items-center justify-center gap-1 py-2.5 bg-white/5 hover:bg-white/10 border border-white/8 rounded-xl text-white/60 disabled:opacity-25 text-xs font-semibold transition-all">
                      Newer <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Era Card + AI Story */}
                <div className="lg:col-span-2 space-y-4">
                  {currentEra && (
                    <AnimatePresence mode="wait">
                      <EraCard key={currentEra.year} era={currentEra} />
                    </AnimatePresence>
                  )}

                  {/* AI Story */}
                  <div className="bg-[#0d1f33]/80 border border-purple-500/15 rounded-2xl p-5">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2 text-sm font-bold text-purple-400">
                        <Sparkles className="w-4 h-4" /> AI Story Mode
                      </div>
                      <button
                        onClick={generateAIStory}
                        disabled={aiStoryLoading}
                        className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold text-[#07111f] disabled:opacity-50 transition-all"
                        style={{ background: "linear-gradient(135deg, #a78bfa, #7c3aed)" }}>
                        {aiStoryLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
                        ✨ Tell The Story
                      </button>
                    </div>
                    <AnimatePresence mode="wait">
                      {aiStoryLoading && (
                        <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                          className="space-y-3 py-4">
                          {[85, 70, 90, 60].map((w, i) => (
                            <div key={i} className="h-3 rounded-full animate-pulse bg-purple-500/10" style={{ width: `${w}%` }} />
                          ))}
                        </motion.div>
                      )}
                      {aiStory && !aiStoryLoading && (
                        <motion.div key="story" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
                          className="text-sm text-white/75 leading-relaxed italic border-l-2 border-purple-500/40 pl-4">
                          "{aiStory}"
                        </motion.div>
                      )}
                      {!aiStory && !aiStoryLoading && (
                        <div className="text-sm text-white/25 py-2">Click "Tell The Story" to have AI narrate this era in vivid detail.</div>
                      )}
                    </AnimatePresence>
                  </div>

                  {/* Then vs Now (if not on latest era) */}
                  {activeEraIdx < placeData.eras.length - 1 && currentEra && (
                    <div className="bg-[#0d1f33]/80 border border-white/8 rounded-2xl p-5">
                      <div className="text-sm font-bold text-white/50 uppercase tracking-widest mb-4">Then vs Now</div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="bg-yellow-500/5 border border-yellow-500/20 rounded-2xl p-4">
                          <div className="text-xs text-yellow-400 font-bold uppercase mb-2">
                            {currentEra.year < 0 ? `${Math.abs(currentEra.year)} BCE` : currentEra.year} · Past
                          </div>
                          <div className="text-sm font-bold text-white mb-2">{currentEra.title}</div>
                          <div className="space-y-1">
                            {currentEra.events.slice(0, 3).map(e => (
                              <div key={e} className="text-xs text-white/50 flex items-center gap-1.5">
                                <div className="w-1 h-1 rounded-full bg-yellow-500/60" /> {e}
                              </div>
                            ))}
                          </div>
                        </div>
                        <div className="bg-cyan-500/5 border border-cyan-500/20 rounded-2xl p-4">
                          <div className="text-xs text-cyan-400 font-bold uppercase mb-2">2026 · Now</div>
                          <div className="text-sm font-bold text-white mb-2">{placeData.eras[placeData.eras.length - 1].title}</div>
                          <div className="space-y-1">
                            {placeData.eras[placeData.eras.length - 1].events.slice(0, 3).map(e => (
                              <div key={e} className="text-xs text-white/50 flex items-center gap-1.5">
                                <div className="w-1 h-1 rounded-full bg-cyan-500/60" /> {e}
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </motion.div>
            )}

            {/* ── HERITAGE ── */}
            {section === "heritage" && (
              <motion.div key="heritage" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {placeData.heritage.map((item, i) => (
                    <motion.div key={item.category}
                      initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}
                      className="bg-[#0d1f33]/80 border border-white/8 rounded-2xl p-6 hover:border-yellow-500/20 transition-all">
                      <div className="text-3xl mb-3">{item.emoji}</div>
                      <div className="text-base font-bold text-white mb-2">{item.category}</div>
                      <div className="text-sm text-white/55 leading-relaxed">{item.description}</div>
                    </motion.div>
                  ))}
                </div>

                {/* Memory Gallery */}
                <div>
                  <div className="text-sm font-bold text-white/30 uppercase tracking-widest mb-3">Memory Gallery</div>
                  <div className="flex gap-3 overflow-x-auto pb-2">
                    {["📸 Old Photos", "📜 Stories", "🏛 Landmarks", "🎬 Events", "🎵 Music", "🍛 Food History", "🗺 Old Maps", "📖 Literature"].map(item => (
                      <div key={item} className="flex-shrink-0 bg-[#0d1f33]/80 border border-white/8 rounded-2xl px-5 py-4 text-sm font-medium text-white/60 hover:text-white hover:border-white/20 transition-all cursor-pointer whitespace-nowrap">
                        {item}
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}

            {/* ── FESTIVALS ── */}
            {section === "festival" && (
              <motion.div key="festival" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="space-y-5">
                <div className="flex gap-3">
                  {INDIA_FESTIVALS_HISTORY.map((fest, i) => (
                    <button key={fest.name} onClick={() => setActiveFestival(i)}
                      className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold border transition-all ${activeFestival === i ? "bg-yellow-500/20 border-yellow-500/35 text-yellow-300" : "border-white/8 text-white/40 hover:text-white"}`}>
                      {fest.emoji} {fest.name}
                    </button>
                  ))}
                </div>

                <div className="bg-[#0d1f33]/80 border border-yellow-500/15 rounded-2xl p-6">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="text-3xl">{INDIA_FESTIVALS_HISTORY[activeFestival].emoji}</div>
                    <div>
                      <div className="text-xl font-black text-white">{INDIA_FESTIVALS_HISTORY[activeFestival].name} Through Time</div>
                      <div className="text-sm text-white/40">How the celebration evolved over centuries</div>
                    </div>
                  </div>

                  <div className="relative pl-8">
                    <div className="absolute left-3 top-0 bottom-0 w-px bg-gradient-to-b from-yellow-500/40 to-transparent" />
                    <div className="space-y-4">
                      {INDIA_FESTIVALS_HISTORY[activeFestival].timeline.map((t, i) => (
                        <motion.div key={t.period}
                          initial={{ opacity: 0, x: -8 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: i * 0.1 }}
                          className="relative">
                          <div className="absolute -left-5 top-1.5 w-3 h-3 rounded-full border-2 border-yellow-500/60 bg-yellow-500/20" />
                          <div className="bg-white/4 rounded-xl p-4 border border-white/5">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-xs font-black text-yellow-400">{t.period}</span>
                              <span className="text-xs text-white/30">·</span>
                              <span className="text-xs text-white/40">{t.year}</span>
                            </div>
                            <p className="text-sm text-white/65 leading-relaxed">{t.note}</p>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* ── WHAT IF ── */}
            {section === "whatif" && (
              <motion.div key="whatif" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="max-w-2xl space-y-5">
                <div className="bg-[#0d1f33]/80 border border-pink-500/15 rounded-2xl p-6"
                  style={{ boxShadow: "0 0 40px rgba(236,72,153,0.04)" }}>
                  <div className="flex items-center gap-2 mb-4">
                    <div className="text-2xl">🔮</div>
                    <div>
                      <div className="text-base font-bold text-white">Historical What-If</div>
                      <div className="text-xs text-white/40">AI reimagines history differently</div>
                    </div>
                  </div>
                  <div className="bg-pink-500/8 border border-pink-500/20 rounded-xl p-4 mb-4">
                    <div className="text-sm font-bold text-pink-300 mb-2">Scenario:</div>
                    <div className="text-base text-white">{placeData.whatif.scenario}</div>
                  </div>
                  <div className="bg-white/3 rounded-xl p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Sparkles className="w-4 h-4 text-cyan-400" />
                      <span className="text-xs font-bold text-cyan-400">AI Analysis</span>
                    </div>
                    <p className="text-sm text-white/70 leading-relaxed">{placeData.whatif.answer}</p>
                  </div>
                </div>

                <div className="bg-[#0d1f33]/80 border border-white/8 rounded-2xl p-5">
                  <div className="text-sm font-bold text-white/50 mb-3">More What-If Scenarios</div>
                  <div className="space-y-2">
                    {[
                      `What if ${selectedPlace.name} was never the capital?`,
                      `What if ${selectedPlace.name} had no river nearby?`,
                      `What if ${selectedPlace.name} remained under colonial rule?`,
                    ].map(scenario => (
                      <button key={scenario}
                        onClick={() => {
                          setAiChatQuery(scenario);
                          setShowAIChat(true);
                        }}
                        className="w-full text-left p-3 bg-white/3 hover:bg-white/6 border border-white/5 hover:border-pink-500/20 rounded-xl text-sm text-white/60 hover:text-white transition-all">
                        🔮 {scenario}
                      </button>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}

            {/* ── DAY IN PAST ── */}
            {section === "dayinpast" && (
              <motion.div key="dayinpast" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="max-w-2xl space-y-5">
                <div className="bg-[#0d1f33]/80 border border-cyan-500/15 rounded-2xl p-6">
                  <div className="flex items-center gap-2 mb-5">
                    <Calendar className="w-5 h-5 text-cyan-400" />
                    <div>
                      <div className="text-base font-bold text-white">A Day In The Past</div>
                      <div className="text-xs text-white/40">Choose a year and time — AI recreates the moment</div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 mb-5">
                    <div>
                      <label className="text-xs text-white/40 uppercase tracking-wider mb-2 block">Year</label>
                      <input type="number" min={100} max={2025} value={dayYear}
                        onChange={e => setDayYear(Number(e.target.value))}
                        className="w-full bg-[#07111f] border border-white/10 text-white rounded-xl px-3 py-2.5 text-sm focus:border-cyan-500/40 focus:outline-none" />
                      <input type="range" min={500} max={2025} value={dayYear}
                        onChange={e => setDayYear(Number(e.target.value))}
                        className="w-full mt-2"
                        style={{ accentColor: "#00ffcc" }}
                      />
                      <div className="flex justify-between text-xs text-white/20 mt-0.5">
                        <span>500 AD</span><span>2025</span>
                      </div>
                    </div>
                    <div>
                      <label className="text-xs text-white/40 uppercase tracking-wider mb-2 block">
                        Time of Day — {dayHour === 0 ? "12 AM" : dayHour < 12 ? `${dayHour} AM` : dayHour === 12 ? "12 PM" : `${dayHour - 12} PM`}
                      </label>
                      <input type="range" min={0} max={23} value={dayHour}
                        onChange={e => setDayHour(Number(e.target.value))}
                        className="w-full mt-7"
                        style={{ accentColor: "#a78bfa" }}
                      />
                      <div className="flex justify-between text-xs text-white/20 mt-0.5">
                        <span>🌙 12AM</span><span>☀️ 12PM</span><span>🌙 12AM</span>
                      </div>
                    </div>
                  </div>

                  <button onClick={generateDayScene} disabled={dayLoading}
                    className="w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl font-bold text-sm disabled:opacity-50 transition-all text-[#07111f]"
                    style={{ background: "linear-gradient(135deg, #00ffcc, #0099ff)", boxShadow: "0 0 20px #00ffcc25" }}>
                    {dayLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                    Transport Me There
                  </button>
                </div>

                <AnimatePresence mode="wait">
                  {dayLoading && (
                    <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                      className="text-center py-10 border border-dashed border-cyan-500/20 rounded-2xl bg-cyan-500/3">
                      <Clock className="w-10 h-10 mx-auto mb-3 text-cyan-400/40 animate-spin" style={{ animationDuration: "3s" }} />
                      <p className="text-white/40 text-sm">AI traveling through time...</p>
                    </motion.div>
                  )}
                  {dayScene && !dayLoading && (
                    <motion.div key="scene" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                      className="bg-[#0d1f33]/80 border border-cyan-500/20 rounded-2xl p-6"
                      style={{ boxShadow: "0 0 30px rgba(0,255,204,0.05)" }}>
                      <div className="flex items-center gap-2 mb-3">
                        <Sparkles className="w-4 h-4 text-cyan-400" />
                        <span className="text-xs font-bold text-cyan-400">AI Time Scene</span>
                        <span className="text-xs text-white/30 ml-2">
                          {selectedPlace.name} · {dayYear} · {dayHour === 0 ? "12 AM" : dayHour < 12 ? `${dayHour} AM` : dayHour === 12 ? "12 PM" : `${dayHour - 12} PM`}
                        </span>
                      </div>
                      <p className="text-base text-white/80 leading-relaxed italic">"{dayScene}"</p>
                      <button onClick={generateDayScene}
                        className="mt-3 text-xs text-cyan-400/60 hover:text-cyan-400 transition-colors flex items-center gap-1">
                        <Sparkles className="w-3 h-3" /> Regenerate scene
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}

      {/* ── FLOATING HISTORY AI ── */}
      <div className="fixed bottom-6 right-6 z-40">
        <AnimatePresence>
          {showAIChat && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 12 }}
              className="mb-3 bg-[#0d1f33] border border-white/15 rounded-2xl p-4 w-80"
              style={{ boxShadow: "0 20px 60px rgba(0,0,0,0.6), 0 0 40px rgba(167,139,250,0.06)" }}
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-purple-400" />
                  <span className="text-sm font-bold text-white">History AI</span>
                </div>
                <button onClick={() => { setShowAIChat(false); setAiChatAnswer(null); }} className="text-white/30 hover:text-white/70">
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="flex gap-2 mb-3">
                <input
                  value={aiChatQuery}
                  onChange={e => setAiChatQuery(e.target.value)}
                  onKeyDown={e => { if (e.key === "Enter") askHistoryAI(); }}
                  placeholder="Why did Mumbai grow so fast?"
                  className="flex-1 bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs text-white placeholder-white/25 outline-none focus:border-purple-500/40"
                  autoFocus
                />
                <button onClick={askHistoryAI} disabled={aiChatLoading || !aiChatQuery}
                  className="px-3 py-2 rounded-xl disabled:opacity-40 transition-all text-white"
                  style={{ background: "linear-gradient(135deg, #a78bfa, #7c3aed)" }}>
                  {aiChatLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <ArrowUpRight className="w-3.5 h-3.5" />}
                </button>
              </div>
              {["Why did Mumbai grow so fast?", "What happened in 1947?", "How old is Varanasi?"].map(q => (
                <button key={q} onClick={() => setAiChatQuery(q)} className="w-full text-left text-xs text-white/30 hover:text-white/55 py-1 transition-colors">
                  → {q}
                </button>
              ))}
              <AnimatePresence>
                {aiChatAnswer && (
                  <motion.div initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }}
                    className="mt-3 p-3 bg-purple-500/8 border border-purple-500/20 rounded-xl text-xs text-white/70 leading-relaxed">
                    {aiChatAnswer}
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          )}
        </AnimatePresence>

        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.97 }}
          onClick={() => setShowAIChat(v => !v)}
          className="flex items-center gap-2.5 px-5 py-3 rounded-2xl font-bold text-sm text-white shadow-2xl"
          style={{
            background: "linear-gradient(135deg, #a78bfa, #7c3aed)",
            boxShadow: "0 0 30px #a78bfa40, 0 8px 32px rgba(0,0,0,0.5)"
          }}>
          <Sparkles className="w-4 h-4" />
          ✨ Ask History AI
        </motion.button>
      </div>
    </div>
  );
}
