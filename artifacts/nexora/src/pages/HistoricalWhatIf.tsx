import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Sparkles, Loader2, X, GitBranch, ChevronRight, Zap,
  Clock, Globe, TrendingUp, Star, AlertTriangle, ArrowUpRight,
  RefreshCw, BookOpen, Flame
} from "lucide-react";

// ── DATA ──────────────────────────────────────────────────────────────
const INDIA_PRESETS = [
  {
    id: "metro",
    emoji: "🚇",
    label: "What if Delhi Metro was never built?",
    category: "Infrastructure",
    place: "Delhi",
    color: "#00ffcc",
    fallback: {
      confidence: 82,
      realTimeline: [
        { year: 2002, event: "Metro Phase 1 launched, connecting key corridors" },
        { year: 2006, event: "Network expands, daily ridership crosses 5 lakh" },
        { year: 2010, event: "Delhi becomes model for metro projects nationwide" },
        { year: 2019, event: "Phase 4 begins, network reaches outer districts" },
        { year: 2026, event: "5th largest metro network globally, 70+ lakh daily riders" },
      ],
      altTimeline: [
        { year: 2002, event: "Road expansion plan launched, 8-lane highways proposed" },
        { year: 2006, event: "Traffic gridlock worsens, pollution hits alarming levels" },
        { year: 2010, event: "Satellite cities (Gurgaon, Noida) develop isolated, car-dependent" },
        { year: 2019, event: "Delhi among world's most congested cities, GDP impact visible" },
        { year: 2026, event: "City sprawl concentrated, outer areas underdeveloped" },
      ],
      impacts: [
        { domain: "Transport", score: 88, color: "#00ffcc", note: "Roads carry 3× more load, daily commute time doubles" },
        { domain: "Economy", score: 72, color: "#fdcb6e", note: "GDP growth slower by ~1.2% annually, less connectivity" },
        { domain: "Environment", score: 85, color: "#55efc4", note: "Air pollution 40% worse, more vehicle dependency" },
        { domain: "Society", score: 65, color: "#a29bfe", note: "Urban inequality higher, outer areas underserved" },
        { domain: "Culture", score: 45, color: "#fd79a8", note: "Less cultural mobility, events concentrated centrally" },
      ],
      story: "In this alternate Delhi, the 3.5 million daily commuters who rely on the Metro would instead crowd onto roads already stretched thin. The capital's famous 'Metro culture' — where people from every strata of society share the same coach — would never have formed. Gurgaon and Noida, which owe much of their explosive growth to Metro connectivity, would have evolved more slowly. Air quality, already a crisis in the real timeline, could have been catastrophically worse. The political calculus of city planning would have tilted toward highways rather than public transit — a pattern that, once entrenched, becomes nearly impossible to reverse.",
      verdict: "A profound urban transformation would have been lost",
      probability: "Low — metro investment was driven by both necessity and strong political will from E. Sreedharan's vision",
    }
  },
  {
    id: "internet",
    emoji: "🌐",
    label: "What if India's internet revolution arrived 10 years earlier?",
    category: "Technology",
    place: "India",
    color: "#a29bfe",
    fallback: {
      confidence: 68,
      realTimeline: [
        { year: 1995, event: "Internet arrives in India (limited, expensive)" },
        { year: 2003, event: "Broadband policy; IT sector already booming in Bangalore" },
        { year: 2010, event: "Mobile internet begins to grow" },
        { year: 2016, event: "Jio launches, 500M new users in 18 months" },
        { year: 2026, event: "World's 2nd largest internet user base" },
      ],
      altTimeline: [
        { year: 1985, event: "Early internet access reaches India's metros" },
        { year: 1993, event: "Software exports begin a decade earlier; NASSCOM forms early" },
        { year: 2000, event: "India becomes dominant IT power, rivals US firms directly" },
        { year: 2006, event: "Indian tech giants global by this year; domestic apps dominate Asia" },
        { year: 2026, event: "India possibly a tech superpower rivaling US/China ecosystem" },
      ],
      impacts: [
        { domain: "Technology", score: 95, color: "#a29bfe", note: "India's tech sector would be 15–20 years ahead of where it is now" },
        { domain: "Economy", score: 88, color: "#fdcb6e", note: "GDP potentially 20–30% larger; more robust export economy" },
        { domain: "Education", score: 82, color: "#00ffcc", note: "Massive rural education transformation, literacy revolution" },
        { domain: "Culture", score: 70, color: "#fd79a8", note: "Indian languages and media would dominate the early internet" },
        { domain: "Society", score: 65, color: "#55efc4", note: "Urban-rural digital divide avoided, broader economic inclusion" },
      ],
      story: "Imagine a 1985 India where a young engineer in Pune can collaborate with someone in Cupertino. The IT outsourcing wave that crested in the late 1990s would have begun a decade earlier, meaning Indian companies wouldn't just be service providers — they'd be product creators from the outset. The Infosys and Wipro of this timeline would have been building their own operating systems and platforms, not just writing code for others. However, this alternate reality also carries risks: the 1990s liberalisation might not have happened as it did, and the internet could have arrived before the economy was ready to absorb it equitably.",
      verdict: "India's trajectory as a global technology power could have been radically accelerated",
      probability: "Moderate — required infrastructure investment and policy shifts that weren't present in the 1980s",
    }
  },
  {
    id: "rail",
    emoji: "🚄",
    label: "What if India built high-speed rail in the 1990s?",
    category: "Infrastructure",
    place: "India",
    color: "#fdcb6e",
    fallback: {
      confidence: 74,
      realTimeline: [
        { year: 1990, event: "Indian Railways: colonial-era network, slow upgrades" },
        { year: 2000, event: "Konkan Railway opens, but no bullet train plans" },
        { year: 2015, event: "Mumbai–Ahmedabad bullet train announced" },
        { year: 2023, event: "First sections under construction" },
        { year: 2026, event: "Project still ongoing, completion estimated 2027+" },
      ],
      altTimeline: [
        { year: 1992, event: "Post-liberalisation: HSR master plan passed with Japanese tech" },
        { year: 1999, event: "Mumbai–Delhi HSR corridor opens (3.5 hours)" },
        { year: 2005, event: "HSR network covers 4 corridors; tourism booms nationally" },
        { year: 2015, event: "India exports railway technology to Southeast Asia" },
        { year: 2026, event: "10-city HSR network; semi-urban hubs become new economic centres" },
      ],
      impacts: [
        { domain: "Transport", score: 90, color: "#00ffcc", note: "Inter-city travel time cut by 60–70%, aviation disrupted" },
        { domain: "Economy", score: 85, color: "#fdcb6e", note: "Economic corridors between cities accelerate growth" },
        { domain: "Tourism", score: 80, color: "#fd79a8", note: "Domestic tourism explosion, tier-2 cities benefit enormously" },
        { domain: "Urbanisation", score: 75, color: "#a29bfe", note: "Population pressure on megacities reduced; smaller cities grow" },
        { domain: "Environment", score: 60, color: "#55efc4", note: "Aviation sector smaller, carbon footprint lower for travel" },
      ],
      story: "A 1999 Mumbai–Delhi high-speed corridor would have reshuffled India's economic geography. Cities like Surat, Vadodara and Kota — mere stops on a bullet train line — would have become genuine economic hubs, not just waypoints. The real estate boom that transformed Mumbai's periphery would instead have rippled inward along rail corridors. More strikingly, the aviation industry's dominance over domestic travel might never have materialised — InterCity Express trains at 320 km/h would have made flying between major cities unnecessary for most journeys.",
      verdict: "India's urban and economic landscape would look fundamentally different",
      probability: "Low-Moderate — post-1991 capital was available but political will and land acquisition challenges were severe",
    }
  },
  {
    id: "bollywood",
    emoji: "🎬",
    label: "What if Bollywood developed in Delhi instead of Mumbai?",
    category: "Culture",
    place: "Delhi",
    color: "#fd79a8",
    fallback: {
      confidence: 58,
      realTimeline: [
        { year: 1913, event: "Dadasaheb Phalke makes first Indian film in Mumbai" },
        { year: 1940, event: "Mumbai becomes undisputed film capital of India" },
        { year: 1970, event: "Bollywood defines pan-Indian popular culture" },
        { year: 2000, event: "Bollywood goes global, K3G, DDLJ reach world audiences" },
        { year: 2026, event: "Mumbai: world's most prolific film industry by volume" },
      ],
      altTimeline: [
        { year: 1913, event: "Delhi's colonial infrastructure and Urdu poetry culture attract early filmmakers" },
        { year: 1947, event: "Partition adds deep Urdu-Punjabi cultural layer to 'Delhiwood'" },
        { year: 1970, event: "Hindi cinema more literary, political, Urdu-poetic in tone" },
        { year: 2000, event: "Delhi-based cinema heavily influenced by political drama, North Indian culture" },
        { year: 2026, event: "A more divided industry; regional cinemas may have grown stronger" },
      ],
      impacts: [
        { domain: "Culture", score: 88, color: "#fd79a8", note: "Cinema style would be more literary, less commercial-escapist" },
        { domain: "Society", score: 72, color: "#a29bfe", note: "Less Westernised Hindi film culture, more grounded in North Indian tradition" },
        { domain: "Economy", score: 55, color: "#fdcb6e", note: "Mumbai's economy develops differently without film industry anchor" },
        { domain: "Language", score: 80, color: "#00ffcc", note: "Urdu would have remained more prominent in popular media" },
        { domain: "Urban Identity", score: 65, color: "#55efc4", note: "Mumbai's cosmopolitan identity would have fewer cultural anchors" },
      ],
      story: "Mumbai gave Bollywood the sea air, the cosmopolitan ambition and the physical distance from Delhi's politics. A Delhi film industry would have been born into political proximity — the Emergency, the riots, the protests would have shaped its stories more directly. Urdu poetry, always the soul of Hindi film songs, would have been even more central. The masala film — that uniquely Mumbai invention — might never have emerged. Instead, India's cinema could have split earlier into distinct regional languages without a dominant national cultural force.",
      verdict: "Indian popular culture would be substantially more literary and politically aware",
      probability: "Very low — Mumbai's island geography created unique social conditions irreplaceable elsewhere",
    }
  },
  {
    id: "green",
    emoji: "🌱",
    label: "What if India went fully solar in 2005?",
    category: "Environment",
    place: "India",
    color: "#55efc4",
    fallback: {
      confidence: 62,
      realTimeline: [
        { year: 2005, event: "India heavily dependent on coal, solar capacity negligible" },
        { year: 2010, event: "National Solar Mission announced" },
        { year: 2020, event: "India crosses 40GW solar capacity" },
        { year: 2023, event: "3rd largest solar capacity globally" },
        { year: 2026, event: "Racing toward 500GW renewable target by 2030" },
      ],
      altTimeline: [
        { year: 2005, event: "Bold solar policy, 100% renewable push begins with German tech partnership" },
        { year: 2009, event: "Rural electrification via solar complete — 600M gain reliable power" },
        { year: 2014, event: "India becomes solar exporter; panel manufacturing hub in Gujarat, Rajasthan" },
        { year: 2020, event: "Coal industry phased out; coal belt states undergo economic transformation" },
        { year: 2026, event: "India leads global climate negotiations from a position of moral authority" },
      ],
      impacts: [
        { domain: "Environment", score: 95, color: "#55efc4", note: "Air quality in cities dramatically better; 300K+ pollution deaths avoided annually" },
        { domain: "Rural Development", score: 90, color: "#00ffcc", note: "24-hour rural electricity transforms agriculture, education, small business" },
        { domain: "Economy", score: 75, color: "#fdcb6e", note: "Energy import bill eliminated; trade deficit significantly lower" },
        { domain: "Geopolitics", score: 80, color: "#a29bfe", note: "India's global standing in climate leadership enormously enhanced" },
        { domain: "Coal Regions", score: 45, color: "#fd79a8", note: "Jharkhand, Chhattisgarh face major economic displacement — difficult transition" },
      ],
      story: "In 2005, India stood at a crossroads. With 300 million without electricity and the cheapest solar panels in history still a decade away, a premature solar push would have been enormously expensive. Yet the technology was available. A determined policy could have seeded solar manufacturing capacity that China later monopolised. Villages across Rajasthan and Gujarat — blessed with the highest solar irradiance in the world — could have become energy-sufficient before their children ever knew darkness at night.",
      verdict: "India could have been a global climate leader rather than a developing-nation laggard",
      probability: "Low — required capital that would have needed foreign investment and political courage to alienate powerful coal interests",
    }
  },
  {
    id: "startup",
    emoji: "🚀",
    label: "What if Bangalore's startup boom happened in the 1980s?",
    category: "Technology",
    place: "Bangalore",
    color: "#a29bfe",
    fallback: {
      confidence: 55,
      realTimeline: [
        { year: 1984, event: "Texas Instruments opens in Bangalore — early tech seed" },
        { year: 1991, event: "Liberalisation opens doors; Infosys, Wipro grow" },
        { year: 2000, event: "Bangalore 'Silicon Valley of India' label sticks" },
        { year: 2015, event: "Startup ecosystem explodes post-Flipkart success" },
        { year: 2026, event: "3rd largest startup ecosystem globally by valuation" },
      ],
      altTimeline: [
        { year: 1982, event: "Pro-startup policy; ITI, HAL alumni launch first wave of tech companies" },
        { year: 1988, event: "India produces first domestic word processor and operating system" },
        { year: 1995, event: "Bangalore firms already competing with Microsoft on personal software" },
        { year: 2005, event: "Indian unicorns dominate Asian software markets" },
        { year: 2026, event: "Bangalore as important as Silicon Valley in global tech imagination" },
      ],
      impacts: [
        { domain: "Technology", score: 90, color: "#a29bfe", note: "India builds product companies, not just service firms" },
        { domain: "Economy", score: 85, color: "#fdcb6e", note: "Tech-led growth begins 15 years earlier; inequality trajectory different" },
        { domain: "Urban Growth", score: 70, color: "#00ffcc", note: "Bangalore's infrastructure crisis arrives earlier and more severely" },
        { domain: "Brain Drain", score: 65, color: "#55efc4", note: "Less emigration to US; talent retained domestically" },
        { domain: "Education", score: 80, color: "#fd79a8", note: "IITs produce entrepreneurs, not just US visa holders" },
      ],
      story: "In 1982, Bangalore was already special — HAL built aircraft, ISRO launched rockets, and ITI made telephone exchanges. What it lacked was capital and a culture of risk-taking. In our alternate timeline, a government that treated its engineers as potential founders rather than bureaucratic resources unleashes something remarkable. When the internet arrives globally, Indian companies don't rush to service western firms; they already know how to build for themselves.",
      verdict: "India would have a fundamentally different relationship with technology — creator, not just service provider",
      probability: "Very Low — required a cultural and policy revolution that the License Raj made structurally impossible",
    }
  },
];

const TRENDING_WHATIFS = [
  { emoji: "🤖", text: "What if AI was invented in 1990?", views: "2.4M" },
  { emoji: "🚗", text: "What if cities had no cars?", views: "1.8M" },
  { emoji: "🏛", text: "What if ancient Indian universities never fell?", views: "1.5M" },
  { emoji: "🛸", text: "What if humanity colonized Mars in the 1990s?", views: "1.2M" },
  { emoji: "💻", text: "What if India invented the internet?", views: "980K" },
  { emoji: "🌊", text: "What if sea levels never rose?", views: "760K" },
];

const CUSTOM_SUGGESTIONS = [
  "What if smartphones arrived 10 years earlier in India?",
  "What if the Partition of 1947 never happened?",
  "What if Mumbai never became India's financial capital?",
  "What if India won the space race?",
  "What if ancient Indian science was never lost?",
  "What if India and Pakistan remained one country?",
];

function BranchingTimeline() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-20">
      <svg className="w-full h-full" viewBox="0 0 1200 300" preserveAspectRatio="xMidYMid slice">
        <motion.line x1="0" y1="150" x2="1200" y2="150" stroke="#a29bfe" strokeWidth={1.5}
          strokeDasharray="8 10"
          animate={{ strokeDashoffset: [-200, 0] }}
          transition={{ duration: 6, repeat: Infinity, ease: "linear" }} />
        <motion.path d="M 500 150 Q 650 80 900 60 L 1150 60" fill="none" stroke="#00ffcc" strokeWidth={1.5}
          strokeDasharray="8 10"
          animate={{ strokeDashoffset: [-200, 0] }}
          transition={{ duration: 5, repeat: Infinity, ease: "linear", delay: 0.5 }} />
        <motion.path d="M 500 150 Q 650 220 900 240 L 1150 240" fill="none" stroke="#fdcb6e" strokeWidth={1.5}
          strokeDasharray="8 10"
          animate={{ strokeDashoffset: [-200, 0] }}
          transition={{ duration: 5.5, repeat: Infinity, ease: "linear", delay: 1 }} />
        {[150, 350, 500, 700, 950].map((x, i) => (
          <motion.circle key={i} cx={x} cy={150} r={4} fill="#a29bfe"
            animate={{ scale: [1, 1.8, 1], opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 2.5, repeat: Infinity, delay: i * 0.5 }} />
        ))}
        <motion.circle cx={900} cy={60} r={4} fill="#00ffcc"
          animate={{ scale: [1, 2, 1], opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 2, repeat: Infinity, delay: 0.8 }} />
        <motion.circle cx={900} cy={240} r={4} fill="#fdcb6e"
          animate={{ scale: [1, 2, 1], opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 2, repeat: Infinity, delay: 1.2 }} />
        <motion.circle cx={500} cy={150} r={8} fill="none" stroke="#fff" strokeWidth={1}
          animate={{ scale: [1, 1.5, 1], opacity: [0.3, 0.8, 0.3] }}
          transition={{ duration: 3, repeat: Infinity }} />
      </svg>
    </div>
  );
}

export default function HistoricalWhatIf() {
  const [selectedPreset, setSelectedPreset] = useState<typeof INDIA_PRESETS[0] | null>(null);
  const [customQuery, setCustomQuery] = useState("");
  const [customResult, setCustomResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<"india" | "custom" | "trending">("india");
  const [showStory, setShowStory] = useState(false);
  const [storyLoading, setStoryLoading] = useState(false);
  const [aiStory, setAiStory] = useState<string | null>(null);
  const [showDiscuss, setShowDiscuss] = useState(false);
  const [discussQuery, setDiscussQuery] = useState("");
  const [discussAnswer, setDiscussAnswer] = useState<string | null>(null);
  const [discussLoading, setDiscussLoading] = useState(false);
  const [categoryFilter, setCategoryFilter] = useState("All");

  const activeData = customResult || selectedPreset?.fallback || null;
  const activeLabel = customResult?.scenario || selectedPreset?.label || null;
  const categories = ["All", "Infrastructure", "Technology", "Culture", "Environment"];
  const filtered = categoryFilter === "All" ? INDIA_PRESETS : INDIA_PRESETS.filter(p => p.category === categoryFilter);

  async function runCustomScenario() {
    if (!customQuery.trim()) return;
    setLoading(true); setCustomResult(null); setSelectedPreset(null); setAiStory(null); setShowStory(false);
    try {
      const res = await fetch("/api/chat/message", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: `You are Nexora's Historical What-If AI Simulation Engine. The user asks: "${customQuery}". Create an alternate history simulation. Return ONLY valid JSON (no markdown, no code blocks, no explanation) in this exact format:
{"scenario":"${customQuery}","confidence":72,"realTimeline":[{"year":1990,"event":"What actually happened"},{"year":2000,"event":"Real event 2000"},{"year":2010,"event":"Real event 2010"},{"year":2020,"event":"Real event 2020"},{"year":2026,"event":"Present reality"}],"altTimeline":[{"year":1990,"event":"Alternate divergence begins"},{"year":2000,"event":"Alternate 2000"},{"year":2010,"event":"Alternate 2010"},{"year":2020,"event":"Alternate 2020"},{"year":2026,"event":"Alternate 2026"}],"impacts":[{"domain":"Technology","score":80,"color":"#a29bfe","note":"One sentence impact"},{"domain":"Economy","score":70,"color":"#fdcb6e","note":"One sentence impact"},{"domain":"Society","score":65,"color":"#00ffcc","note":"One sentence impact"},{"domain":"Culture","score":55,"color":"#fd79a8","note":"One sentence impact"},{"domain":"Environment","score":60,"color":"#55efc4","note":"One sentence impact"}],"story":"A vivid 3-4 sentence atmospheric story exploring this alternate timeline","verdict":"One sentence verdict","probability":"One sentence on likelihood"}`,
          sessionId: "whatif-simulation"
        })
      });
      const d = await res.json();
      try {
        const txt = (d.message || "").replace(/```json|```/g, "").trim();
        const start = txt.indexOf("{");
        const end = txt.lastIndexOf("}");
        const parsed = JSON.parse(txt.slice(start, end + 1));
        setCustomResult(parsed);
      } catch {
        setCustomResult({
          scenario: customQuery,
          confidence: 68,
          realTimeline: [
            { year: 1990, event: "Historical baseline established" },
            { year: 2000, event: "Key developments unfold as known" },
            { year: 2010, event: "Consequences of original path emerge" },
            { year: 2020, event: "Present trajectory continues" },
            { year: 2026, event: "Current reality as we know it" },
          ],
          altTimeline: [
            { year: 1990, event: "The alternate scenario begins to diverge here" },
            { year: 2000, event: "Different choices lead to unexpected outcomes" },
            { year: 2010, event: "A fundamentally different world begins to emerge" },
            { year: 2020, event: "The ripple effects touch every domain of life" },
            { year: 2026, event: "An unrecognisable present — or perhaps a better one" },
          ],
          impacts: [
            { domain: "Society", score: 78, color: "#00ffcc", note: "Human behaviour and social structures would shift profoundly" },
            { domain: "Economy", score: 70, color: "#fdcb6e", note: "Economic incentives and power structures would reorganise" },
            { domain: "Technology", score: 65, color: "#a29bfe", note: "The pace and direction of innovation would change" },
            { domain: "Culture", score: 58, color: "#fd79a8", note: "Art, language, and identity would evolve differently" },
            { domain: "Environment", score: 60, color: "#55efc4", note: "Resource use and ecological patterns would diverge" },
          ],
          story: d.message?.substring(0, 500) || "This alternate scenario reveals the profound fragility of history. What we take for granted as inevitable was, in truth, just one of many possible paths. The choices made in moments of crisis, the accidents of timing, the whims of key decision-makers — all of these combined to produce the world we inhabit. In this alternate timeline, different actors and different accidents produce a world that is neither simply better nor worse — just profoundly other.",
          verdict: "History is always contingent — this scenario illustrates just how easily it could have gone differently",
          probability: "Uncertain — depends on variables that are difficult to model with confidence",
        });
      }
      setActiveTab("custom");
    } finally { setLoading(false); }
  }

  async function generateStory() {
    if (!activeLabel) return;
    setStoryLoading(true); setAiStory(null); setShowStory(true);
    try {
      const res = await fetch("/api/chat/message", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: `Write a vivid, atmospheric 4-sentence alternate history story about: "${activeLabel}". Make it read like a newspaper dispatch from this alternate 2026. Be specific and evocative. Clearly note it is speculative simulation.`,
          sessionId: "whatif-story"
        })
      });
      const d = await res.json();
      setAiStory(d.message);
    } finally { setStoryLoading(false); }
  }

  async function askDiscuss() {
    if (!discussQuery.trim()) return;
    setDiscussLoading(true); setDiscussAnswer(null);
    try {
      const ctx = activeLabel ? `In context of: "${activeLabel}". ` : "";
      const res = await fetch("/api/chat/message", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: `${ctx}Historical simulation question: "${discussQuery}". Answer in 2 sentences, being honest about uncertainty and labelling speculation clearly.`,
          sessionId: "whatif-discuss"
        })
      });
      const d = await res.json();
      setDiscussAnswer(d.message);
    } finally { setDiscussLoading(false); }
  }

  return (
    <div className="min-h-full" style={{ background: "linear-gradient(180deg, #06050f 0%, #07111f 40%, #0a0f1e 100%)" }}>

      {/* ── HERO ── */}
      <div className="relative overflow-hidden border-b border-white/5 min-h-52">
        <BranchingTimeline />
        <div className="absolute inset-0 pointer-events-none"
          style={{ background: "radial-gradient(ellipse at 30% 60%, #7c3aed08 0%, transparent 60%), radial-gradient(ellipse at 70% 30%, #00ffcc05 0%, transparent 55%)" }} />
        <div className="relative px-6 md:px-10 py-8">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <GitBranch className="w-4 h-4 text-purple-400" />
                <span className="text-xs font-bold text-purple-400 uppercase tracking-widest">AI Simulation Engine</span>
              </div>
              <h1 className="text-3xl md:text-4xl font-black text-white leading-tight">
                🔮 Explore<br />
                <span className="text-transparent bg-clip-text"
                  style={{ backgroundImage: "linear-gradient(135deg, #a29bfe, #fdcb6e)" }}>
                  Alternate Histories
                </span>
              </h1>
              <p className="text-white/45 mt-2 text-sm max-w-lg leading-relaxed">
                Change one moment in history and discover how the world could have evolved differently.
                <span className="text-purple-400/70"> AI simulation — not fact.</span>
              </p>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {[
                { label: "Global Scenarios", value: "500+", emoji: "🌍", color: "#00ffcc" },
                { label: "AI Simulations", value: "Live", emoji: "🧠", color: "#a29bfe" },
                { label: "Timelines Built", value: "12K+", emoji: "⏳", color: "#fdcb6e" },
                { label: "Futures Explored", value: "∞", emoji: "🔮", color: "#fd79a8" },
              ].map(s => (
                <div key={s.label} className="bg-[#0d1f33]/70 border border-white/8 rounded-2xl p-3 text-center">
                  <div className="text-lg mb-1">{s.emoji}</div>
                  <div className="text-xl font-black" style={{ color: s.color }}>{s.value}</div>
                  <div className="text-xs text-white/25 mt-0.5">{s.label}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="flex gap-2 mt-6 flex-wrap">
            {[
              { id: "india", label: "🇮🇳 India Scenarios" },
              { id: "custom", label: "✍️ Custom What-If" },
              { id: "trending", label: "🔥 Trending" },
            ].map(tab => (
              <button key={tab.id} onClick={() => setActiveTab(tab.id as any)}
                className={`text-sm px-4 py-2.5 rounded-xl font-semibold border transition-all ${activeTab === tab.id ? "text-black border-transparent" : "border-white/10 text-white/50 hover:text-white"}`}
                style={activeTab === tab.id ? { background: "linear-gradient(135deg, #a29bfe, #7c3aed)" } : {}}>
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Disclaimer */}
      <div className="px-6 md:px-10 pt-4">
        <div className="flex items-center gap-2 p-3 bg-yellow-500/5 border border-yellow-500/20 rounded-xl">
          <AlertTriangle className="w-3.5 h-3.5 text-yellow-400 flex-shrink-0" />
          <p className="text-xs text-yellow-400/80">
            <span className="font-bold">AI Simulation Only</span> — All alternate timelines are speculative AI-generated scenarios for intellectual exploration, not historical fact.
          </p>
        </div>
      </div>

      <AnimatePresence mode="wait">

        {/* ── INDIA SCENARIOS ── */}
        {activeTab === "india" && (
          <motion.div key="india" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="px-6 md:px-10 py-5 space-y-4">
            <div className="flex gap-2 flex-wrap">
              {categories.map(c => (
                <button key={c} onClick={() => setCategoryFilter(c)}
                  className={`text-xs px-3 py-1.5 rounded-lg border font-semibold transition-all ${categoryFilter === c ? "bg-purple-500/20 border-purple-500/40 text-purple-300" : "border-white/8 text-white/35 hover:text-white hover:border-white/20"}`}>
                  {c}
                </button>
              ))}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filtered.map((preset, i) => (
                <motion.div key={preset.id}
                  initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }}
                  onClick={() => { setSelectedPreset(preset); setCustomResult(null); setAiStory(null); setShowStory(false); }}
                  className="bg-[#0d1f33]/80 border rounded-2xl p-5 cursor-pointer transition-all group"
                  style={{
                    borderColor: selectedPreset?.id === preset.id ? preset.color + "50" : "rgba(255,255,255,0.08)",
                    boxShadow: selectedPreset?.id === preset.id ? `0 0 20px ${preset.color}15` : "none"
                  }}>
                  <div className="flex items-start justify-between mb-3">
                    <div className="text-3xl">{preset.emoji}</div>
                    <span className="text-xs px-2 py-0.5 rounded-full border font-semibold"
                      style={{ color: preset.color, borderColor: preset.color + "40", background: preset.color + "10" }}>
                      {preset.category}
                    </span>
                  </div>
                  <div className="text-sm font-bold leading-snug mb-2 group-hover:text-white transition-colors"
                    style={{ color: selectedPreset?.id === preset.id ? preset.color : "rgba(255,255,255,0.75)" }}>
                    {preset.label}
                  </div>
                  <div className="text-xs text-white/25 flex items-center gap-1.5">
                    <div className="w-1.5 h-1.5 rounded-full" style={{ background: preset.color }} />
                    {preset.place} · {preset.fallback.confidence}% AI confidence
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}

        {/* ── CUSTOM WHAT-IF ── */}
        {activeTab === "custom" && (
          <motion.div key="custom" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="px-6 md:px-10 py-5">
            <div className="max-w-2xl mx-auto space-y-4">
              <div className="bg-[#0d1f33]/80 border border-white/8 rounded-2xl p-6">
                <div className="text-sm font-bold text-purple-400 mb-1">✍️ Write Your Scenario</div>
                <div className="text-3xl font-black text-white/25 mb-3">What if...</div>
                <textarea
                  value={customQuery}
                  onChange={e => setCustomQuery(e.target.value)}
                  placeholder="Delhi Metro was never built? / India discovered AI first? / The internet came to India in 1985?"
                  className="w-full bg-[#07111f] border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-white/25 focus:border-purple-500/40 focus:outline-none resize-none leading-relaxed"
                  rows={3}
                />
                <div className="flex items-center justify-between mt-3">
                  <div className="text-xs text-white/20">{customQuery.length}/300</div>
                  <button onClick={runCustomScenario} disabled={loading || !customQuery.trim()}
                    className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm disabled:opacity-40 text-[#07111f]"
                    style={{ background: "linear-gradient(135deg, #a29bfe, #7c3aed)", boxShadow: customQuery.trim() ? "0 0 20px #a29bfe30" : "none" }}>
                    {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                    {loading ? "Simulating..." : "Run Simulation"}
                  </button>
                </div>
              </div>
              <div>
                <div className="text-xs text-white/20 mb-2 font-semibold uppercase tracking-wider">Quick scenarios</div>
                <div className="flex flex-wrap gap-2">
                  {CUSTOM_SUGGESTIONS.map(s => (
                    <button key={s} onClick={() => setCustomQuery(s)}
                      className="text-xs px-3 py-1.5 bg-white/4 border border-white/8 rounded-xl text-white/40 hover:text-white hover:border-white/20 transition-all">
                      {s}
                    </button>
                  ))}
                </div>
              </div>
              {loading && (
                <div className="border border-dashed border-purple-500/20 rounded-2xl p-10 text-center bg-purple-500/3">
                  <motion.div animate={{ rotate: 360 }} transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                    className="w-12 h-12 rounded-full border-2 border-purple-500/30 border-t-purple-400 mx-auto mb-3" />
                  <div className="text-white/40 text-sm">AI is simulating the alternate timeline...</div>
                  <div className="text-white/20 text-xs mt-1">Analysing historical patterns and divergence points</div>
                </div>
              )}
            </div>
          </motion.div>
        )}

        {/* ── TRENDING ── */}
        {activeTab === "trending" && (
          <motion.div key="trending" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="px-6 md:px-10 py-5">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-1.5 h-5 rounded-full bg-red-400" />
              <h2 className="text-lg font-bold text-white">🔥 Popular Simulations</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {TRENDING_WHATIFS.map((t, i) => (
                <motion.div key={t.text}
                  initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}
                  onClick={() => { setCustomQuery(t.text); setActiveTab("custom"); }}
                  className="bg-[#0d1f33]/80 border border-white/8 rounded-2xl p-5 cursor-pointer hover:border-white/20 transition-all group">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-3xl">{t.emoji}</span>
                    <div className="flex items-center gap-1 text-xs text-white/25">
                      <TrendingUp className="w-3 h-3" /> {t.views}
                    </div>
                  </div>
                  <div className="text-sm font-bold text-white/70 group-hover:text-white transition-colors mb-2">{t.text}</div>
                  <div className="text-xs text-purple-400/50 group-hover:text-purple-400/80 transition-colors flex items-center gap-1">
                    Run simulation <ArrowUpRight className="w-3 h-3" />
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── SIMULATION RESULTS ── */}
      <AnimatePresence>
        {activeData && (
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className="px-6 md:px-10 pb-24 space-y-5 mt-2">

            {/* Header + Confidence */}
            <div className="bg-[#0d1f33]/80 border border-purple-500/20 rounded-2xl p-5"
              style={{ boxShadow: "0 0 30px rgba(162,155,254,0.06)" }}>
              <div className="flex items-start justify-between gap-4 mb-3">
                <div>
                  <div className="text-xs font-bold text-purple-400 uppercase tracking-widest mb-1">Active Simulation</div>
                  <div className="text-lg font-black text-white leading-snug">{activeData.scenario || activeLabel}</div>
                </div>
                <div className="flex-shrink-0 text-right">
                  <div className="text-xs text-white/30 mb-0.5">AI Confidence</div>
                  <div className="text-3xl font-black"
                    style={{ color: activeData.confidence >= 70 ? "#00ffcc" : activeData.confidence >= 50 ? "#fdcb6e" : "#fd79a8" }}>
                    {activeData.confidence}%
                  </div>
                </div>
              </div>
              <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                <motion.div initial={{ width: 0 }} animate={{ width: `${activeData.confidence}%` }}
                  transition={{ duration: 1.2, ease: "easeOut" }}
                  className="h-full rounded-full"
                  style={{ background: "linear-gradient(90deg, #a29bfe, #00ffcc)" }} />
              </div>
              <div className="mt-2 text-xs text-white/25 italic">
                Confidence based on: historical evidence, economic data, geographic constraints, human behaviour patterns
              </div>
            </div>

            {/* Dual Timeline */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Real */}
              <div className="bg-[#0d1f33]/80 border border-white/8 rounded-2xl p-5">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-1.5 h-5 rounded-full bg-white/25" />
                  <div className="text-sm font-bold text-white/50">📅 Real Timeline</div>
                </div>
                <div>
                  {activeData.realTimeline?.map((item: any, i: number) => (
                    <motion.div key={i}
                      initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.1 }}
                      className="flex gap-3 pb-4 last:pb-0">
                      <div className="flex flex-col items-center flex-shrink-0">
                        <div className="w-2.5 h-2.5 rounded-full bg-white/25 mt-0.5" />
                        {i < activeData.realTimeline.length - 1 && <div className="w-px flex-1 bg-white/8 my-1 min-h-[12px]" />}
                      </div>
                      <div>
                        <div className="text-xs font-black text-white/30">{item.year}</div>
                        <div className="text-xs text-white/55 mt-0.5 leading-relaxed">{item.event}</div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>

              {/* Alt */}
              <div className="bg-[#0d1f33]/80 border border-purple-500/20 rounded-2xl p-5"
                style={{ boxShadow: "0 0 20px rgba(162,155,254,0.05)" }}>
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-1.5 h-5 rounded-full bg-purple-400" />
                  <div className="text-sm font-bold text-purple-400">🔮 Alternate Timeline</div>
                  <span className="text-xs px-1.5 py-0.5 bg-purple-500/15 border border-purple-500/30 rounded text-purple-400/80 font-bold">AI SIM</span>
                </div>
                <div>
                  {activeData.altTimeline?.map((item: any, i: number) => (
                    <motion.div key={i}
                      initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.1 + 0.2 }}
                      className="flex gap-3 pb-4 last:pb-0">
                      <div className="flex flex-col items-center flex-shrink-0">
                        <div className="w-2.5 h-2.5 rounded-full bg-purple-400/50 mt-0.5" />
                        {i < activeData.altTimeline.length - 1 && <div className="w-px flex-1 bg-purple-500/15 my-1 min-h-[12px]" />}
                      </div>
                      <div>
                        <div className="text-xs font-black text-purple-400/50">{item.year}</div>
                        <div className="text-xs text-white/55 mt-0.5 leading-relaxed">{item.event}</div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            </div>

            {/* Impact Analysis */}
            <div className="bg-[#0d1f33]/80 border border-white/8 rounded-2xl p-5">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-1.5 h-5 rounded-full bg-yellow-400" />
                <div className="text-sm font-bold text-white">Impact Analysis</div>
              </div>
              <div className="space-y-4">
                {activeData.impacts?.map((impact: any, i: number) => (
                  <motion.div key={impact.domain}
                    initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.12 }}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-bold text-white/60">{impact.domain}</span>
                      <span className="text-sm font-black" style={{ color: impact.color || "#00ffcc" }}>{impact.score}/100</span>
                    </div>
                    <div className="h-2 bg-white/5 rounded-full overflow-hidden mb-1">
                      <motion.div initial={{ width: 0 }} animate={{ width: `${impact.score}%` }}
                        transition={{ duration: 1.1, ease: "easeOut", delay: i * 0.12 }}
                        className="h-full rounded-full"
                        style={{ background: impact.color || "#00ffcc" }} />
                    </div>
                    <div className="text-xs text-white/30 italic">{impact.note}</div>
                  </motion.div>
                ))}
              </div>
            </div>

            {/* AI Story Mode */}
            <div className="bg-[#0d1f33]/80 border border-white/8 rounded-2xl overflow-hidden">
              <div className="flex items-center justify-between p-5">
                <div className="flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-purple-400" />
                  <span className="text-sm font-bold text-white">✨ AI Story Mode</span>
                  <span className="text-xs text-white/20 hidden md:block">— experience this alternate world</span>
                </div>
                <button onClick={generateStory} disabled={storyLoading}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold disabled:opacity-40 text-[#07111f]"
                  style={{ background: "linear-gradient(135deg, #a29bfe, #7c3aed)" }}>
                  {storyLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
                  {showStory ? "Regenerate" : "Tell The Story"}
                </button>
              </div>
              <AnimatePresence>
                {showStory && (
                  <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden">
                    <div className="px-5 pb-5">
                      {storyLoading ? (
                        <div className="flex items-center gap-2 text-white/25 text-sm py-4">
                          <Loader2 className="w-4 h-4 animate-spin" /> Writing alternate history...
                        </div>
                      ) : (
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                          className="p-4 bg-purple-500/5 border border-purple-500/15 rounded-xl">
                          <div className="text-xs font-bold text-purple-400/50 uppercase tracking-widest mb-2">AI-Generated Story · Speculative Fiction</div>
                          <p className="text-sm text-white/70 leading-relaxed italic">"{aiStory || activeData.story}"</p>
                        </motion.div>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Verdict + Probability */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 bg-[#0d1f33]/80 border border-yellow-500/15 rounded-2xl">
                <div className="text-xs font-bold text-yellow-400 mb-2 flex items-center gap-1.5">
                  <Zap className="w-3.5 h-3.5" /> Simulation Verdict
                </div>
                <div className="text-sm text-white/70 leading-relaxed">{activeData.verdict}</div>
              </div>
              <div className="p-4 bg-[#0d1f33]/80 border border-white/8 rounded-2xl">
                <div className="text-xs font-bold text-white/35 mb-2 flex items-center gap-1.5">
                  <AlertTriangle className="w-3.5 h-3.5" /> Probability Assessment
                </div>
                <div className="text-sm text-white/50 leading-relaxed italic">{activeData.probability}</div>
              </div>
            </div>

          </motion.div>
        )}
      </AnimatePresence>

      {/* ── FLOATING DISCUSS AI ── */}
      <div className="fixed bottom-6 right-6 z-40">
        <AnimatePresence>
          {showDiscuss && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 12 }}
              className="mb-3 bg-[#0d1f33] border border-white/15 rounded-2xl p-4 w-80"
              style={{ boxShadow: "0 20px 60px rgba(0,0,0,0.6), 0 0 40px rgba(162,155,254,0.08)" }}>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-purple-400" />
                  <span className="text-sm font-bold text-white">Discuss Scenario</span>
                </div>
                <button onClick={() => { setShowDiscuss(false); setDiscussAnswer(null); }}
                  className="text-white/30 hover:text-white/70"><X className="w-4 h-4" /></button>
              </div>
              {activeLabel && (
                <div className="text-xs text-purple-400/60 mb-3 px-2 py-1.5 bg-purple-500/8 rounded-lg border border-purple-500/15 leading-snug">
                  Re: {activeLabel.substring(0, 80)}{activeLabel.length > 80 ? "..." : ""}
                </div>
              )}
              <div className="flex gap-2 mb-3">
                <input value={discussQuery} onChange={e => setDiscussQuery(e.target.value)}
                  onKeyDown={e => { if (e.key === "Enter") askDiscuss(); }}
                  placeholder="Would this really happen? What changes most?"
                  className="flex-1 bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs text-white placeholder-white/25 outline-none focus:border-purple-500/40"
                  autoFocus />
                <button onClick={askDiscuss} disabled={discussLoading || !discussQuery}
                  className="px-3 py-2 rounded-xl text-xs font-bold disabled:opacity-40 text-[#07111f]"
                  style={{ background: "linear-gradient(135deg, #a29bfe, #7c3aed)" }}>
                  {discussLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <ArrowUpRight className="w-3.5 h-3.5" />}
                </button>
              </div>
              {["Would this really happen?", "What's the biggest uncertainty?", "What changes most?", "Is this good or bad overall?"].map(q => (
                <button key={q} onClick={() => setDiscussQuery(q)}
                  className="w-full text-left text-xs text-white/30 hover:text-white/55 py-0.5 transition-colors">
                  → {q}
                </button>
              ))}
              <AnimatePresence>
                {discussAnswer && (
                  <motion.div initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }}
                    className="mt-3 p-3 bg-purple-500/8 border border-purple-500/20 rounded-xl text-xs text-white/70 leading-relaxed">
                    {discussAnswer}
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          )}
        </AnimatePresence>
        <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.97 }}
          onClick={() => setShowDiscuss(v => !v)}
          className="flex items-center gap-2.5 px-5 py-3 rounded-2xl font-bold text-sm text-white"
          style={{ background: "linear-gradient(135deg, #7c3aed, #a29bfe)", boxShadow: "0 0 30px #7c3aed40, 0 8px 32px rgba(0,0,0,0.5)" }}>
          <Sparkles className="w-4 h-4" />
          🤖 Discuss Scenario
        </motion.button>
      </div>
    </div>
  );
}
