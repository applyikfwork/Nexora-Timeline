import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Share2, Swords, HelpCircle, Feather, Trophy, Loader2, Copy, Check, Zap, Star, RefreshCw } from "lucide-react";
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
  { id: "seoul-kr", name: "Seoul" },
  { id: "berlin-de", name: "Berlin" },
  { id: "sydney-au", name: "Sydney" },
  { id: "bangalore-in", name: "Bangalore" },
];

const QUIZ_QUESTIONS = [
  { id: 1, question: "What time do you naturally wake up?", options: ["Before 6am — I'm a morning person", "7-9am — Normal human hours", "10am+ — Night owl life", "It varies wildly"] },
  { id: 2, question: "Your ideal Friday night?", options: ["Rooftop bar with great views", "Cozy ramen spot + walk home", "Underground club till 4am", "Home, movie, takeout"] },
  { id: 3, question: "How do you handle chaos?", options: ["Thrive in it — energy fuel", "Tolerate it if needed", "Prefer structure and calm", "Depends on my mood"] },
  { id: 4, question: "What's your relationship with food?", options: ["I eat to explore — adventure first", "Comfort food is my love language", "I care about precision + quality", "Food is fuel, function over form"] },
  { id: 5, question: "Your ideal commute?", options: ["Packed metro — I like the pulse", "Walking 30 mins — clear my head", "Cycle through greenery", "Work from home always"] },
  { id: 6, question: "What drives you most?", options: ["Ambition — I want to build things", "Art & culture — beauty matters", "Connection — community first", "Freedom — no rules, no boxes"] },
  { id: 7, question: "Your relationship with rules?", options: ["Rules create order — I respect them", "I bend rules when needed", "Rules are suggestions", "I make my own"] },
  { id: 8, question: "Ideal holiday?", options: ["Urban exploration — new cities", "Nature & disconnection", "Beach + zero itinerary", "Cultural immersion — museums, history"] },
  { id: 9, question: "How do you spend money?", options: ["Experiences > things always", "Mix of both, thoughtfully", "Quality items that last", "Save aggressively, spend rarely"] },
  { id: 10, question: "Your city spirit animal?", options: ["The tiger — fast, powerful, hungry", "The owl — wise, observant, nocturnal", "The dolphin — social, curious, joyful", "The lone wolf — independent, intense"] },
];

type Tab = "vibe" | "battle" | "quiz" | "poetry" | "leaderboard";

export default function ViralHub() {
  const [activeTab, setActiveTab] = useState<Tab>("vibe");

  const tabs: { id: Tab; label: string; icon: React.ElementType; color: string }[] = [
    { id: "vibe", label: "Vibe Card", icon: Zap, color: "text-primary" },
    { id: "battle", label: "City Battle", icon: Swords, color: "text-red-400" },
    { id: "quiz", label: "City Quiz", icon: HelpCircle, color: "text-yellow-400" },
    { id: "poetry", label: "AI Poetry", icon: Feather, color: "text-purple-400" },
    { id: "leaderboard", label: "Leaderboard", icon: Trophy, color: "text-yellow-400" },
  ];

  return (
    <div className="p-6 md:p-10 max-w-6xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center border border-primary/30">
          <Share2 className="w-6 h-6 text-primary" />
        </div>
        <div>
          <h1 className="text-3xl font-bold text-white">Viral Hub</h1>
          <p className="text-white/60 text-sm">Shareable city content, battles, quizzes & more</p>
        </div>
      </div>

      <div className="flex gap-2 flex-wrap">
        {tabs.map(tab => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all ${isActive ? "bg-primary text-black shadow-[0_0_15px_rgba(0,255,204,0.3)]" : "bg-card border border-white/10 text-white/60 hover:text-white hover:border-white/30"}`}>
              <Icon className="w-4 h-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      <AnimatePresence mode="wait">
        <motion.div key={activeTab}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.18 }}>
          {activeTab === "vibe" && <VibeCardTab />}
          {activeTab === "battle" && <CityBattleTab />}
          {activeTab === "quiz" && <CityQuizTab />}
          {activeTab === "poetry" && <PoetryTab />}
          {activeTab === "leaderboard" && <LeaderboardTab />}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

function VibeCardTab() {
  const { geoCity } = useAppContext();
  const [placeId, setPlaceId] = useState(geoCity?.id || "delhi-in");
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [scoreDisplay, setScoreDisplay] = useState(0);

  React.useEffect(() => {
    if (geoCity?.id) setPlaceId(geoCity.id);
  }, [geoCity?.id]);

  async function generate() {
    setLoading(true);
    setData(null);
    setScoreDisplay(0);
    try {
      const res = await fetch(`/api/viral/vibe-card?placeId=${placeId}`);
      const d = await res.json();
      setData(d);
      let i = 0;
      const target = d.vibeScore;
      const timer = setInterval(() => {
        i++;
        setScoreDisplay(Math.floor((i / 40) * target));
        if (i >= 40) { setScoreDisplay(target); clearInterval(timer); }
      }, 30);
    } finally {
      setLoading(false);
    }
  }

  async function copyCard() {
    if (!data) return;
    const text = `🌆 ${data.placeName} Vibe Card\n⚡ Vibe Score: ${data.vibeScore}/100\n✨ Personality: ${data.personality}\n💬 "${data.quote}"\n\nGenerated by Nexora`;
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  const scoreColor = (s: number) => s >= 85 ? "text-green-400" : s >= 70 ? "text-yellow-400" : "text-red-400";

  return (
    <div className="space-y-6">
      <div className="flex gap-3 items-end flex-wrap">
        <div className="flex-1 min-w-48">
          <label className="text-xs text-white/40 uppercase tracking-wider mb-1.5 block">Select City</label>
          <select value={placeId} onChange={e => setPlaceId(e.target.value)}
            className="w-full bg-card border border-white/10 text-white rounded-xl px-3 py-2.5 text-sm focus:border-primary/50 focus:outline-none transition-colors">
            {PLACES.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
        </div>
        <button onClick={generate} disabled={loading}
          className="flex items-center gap-2 px-6 py-2.5 bg-primary text-black rounded-xl font-bold text-sm hover:bg-primary/90 disabled:opacity-50 transition-all shadow-[0_0_20px_rgba(0,255,204,0.2)] hover:shadow-[0_0_30px_rgba(0,255,204,0.4)]">
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />}
          Generate Vibe Card
        </button>
      </div>

      <AnimatePresence mode="wait">
        {loading && (
          <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="text-center py-16 border border-dashed border-primary/20 rounded-2xl bg-primary/5">
            <div className="relative inline-block mb-4">
              <div className="w-16 h-16 rounded-full border-2 border-primary/30 border-t-primary animate-spin" />
              <Zap className="absolute inset-0 m-auto w-6 h-6 text-primary" />
            </div>
            <p className="text-white/50 text-sm">Generating vibe card...</p>
          </motion.div>
        )}

        {data && !loading && (
          <motion.div key="card" initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} transition={{ type: "spring", stiffness: 200, damping: 25 }}
            className="relative overflow-hidden rounded-2xl border border-primary/30 bg-gradient-to-br from-primary/10 via-card to-secondary/10 p-8 shadow-[0_0_40px_rgba(0,255,204,0.08)]">
            <div className="absolute top-0 right-0 w-80 h-80 bg-primary/5 rounded-full -translate-y-1/2 translate-x-1/2 pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-40 h-40 bg-secondary/5 rounded-full translate-y-1/2 -translate-x-1/2 pointer-events-none" />
            <div className="relative z-10 space-y-6">
              <div className="flex justify-between items-start">
                <div>
                  <div className="text-xs text-primary/60 uppercase tracking-widest mb-1 font-bold">Nexora Vibe Card</div>
                  <h2 className="text-4xl font-black text-white">{data.placeName}</h2>
                  <div className="text-lg text-white/50 mt-1 font-light">{data.personality}</div>
                </div>
                <div className="text-right">
                  <motion.div
                    key={scoreDisplay}
                    className={`text-7xl font-black tabular-nums ${scoreColor(scoreDisplay)}`}
                    style={{ textShadow: `0 0 30px currentColor` }}>
                    {scoreDisplay}
                  </motion.div>
                  <div className="text-xs text-white/40 uppercase tracking-wider">Vibe Score</div>
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                  { label: "Energy", value: data.energy },
                  { label: "Culture", value: data.culture },
                  { label: "Chaos", value: data.chaos },
                  { label: "Soul", value: data.soul },
                ].map((stat, i) => (
                  <motion.div key={stat.label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 + i * 0.07 }}
                    className="bg-black/20 rounded-xl p-4 text-center border border-white/5">
                    <div className={`text-3xl font-bold ${scoreColor(stat.value)}`}>{stat.value}</div>
                    <div className="text-xs text-white/40 uppercase tracking-wider mt-1">{stat.label}</div>
                    <div className="mt-2 h-1.5 bg-white/10 rounded-full overflow-hidden">
                      <motion.div initial={{ width: 0 }} animate={{ width: `${stat.value}%` }} transition={{ delay: 0.3 + i * 0.07, duration: 0.8 }}
                        className="h-full bg-primary rounded-full" />
                    </div>
                  </motion.div>
                ))}
              </div>

              <div className="border-t border-white/10 pt-5">
                <p className="text-lg text-white/75 italic leading-relaxed">"{data.quote}"</p>
              </div>

              <div className="flex gap-3">
                <button onClick={copyCard}
                  className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 rounded-xl text-sm text-white transition-all">
                  {copied ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
                  {copied ? "Copied!" : "Copy Card"}
                </button>
                <button onClick={generate}
                  className="flex items-center gap-2 px-4 py-2 bg-primary/15 hover:bg-primary/25 border border-primary/30 rounded-xl text-sm text-primary transition-all">
                  <RefreshCw className="w-4 h-4" /> Regenerate
                </button>
              </div>
            </div>
          </motion.div>
        )}

        {!data && !loading && (
          <motion.div key="empty" className="text-center py-20 text-white/25 border border-dashed border-white/10 rounded-2xl">
            <Zap className="w-14 h-14 mx-auto mb-3 opacity-20" />
            <p>Select a city and generate its Vibe Card</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function CityBattleTab() {
  const [cityA, setCityA] = useState("tokyo-jp");
  const [cityB, setCityB] = useState("new-york-us");
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [phase, setPhase] = useState<"idle" | "loading" | "building" | "reveal">("idle");

  async function battle() {
    if (cityA === cityB) return;
    setPhase("loading");
    setData(null);
    try {
      const res = await fetch("/api/viral/city-battle", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ placeA: cityA, placeB: cityB }),
      });
      const d = await res.json();
      setData(d);
      setPhase("building");
      setTimeout(() => setPhase("reveal"), 1800);
    } catch {
      setPhase("idle");
    }
  }

  const statLabels: Record<string, string> = {
    energy: "⚡ Energy", culture: "🎭 Culture", nightlife: "🌙 Nightlife",
    food: "🍜 Food", safety: "🛡️ Safety", innovation: "🚀 Innovation"
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
        <div>
          <label className="text-xs text-white/40 uppercase tracking-wider mb-1.5 block">City A</label>
          <select value={cityA} onChange={e => setCityA(e.target.value)}
            className="w-full bg-card border border-white/10 text-white rounded-xl px-3 py-2.5 text-sm focus:border-primary/50 focus:outline-none">
            {PLACES.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
        </div>
        <div className="text-center space-y-2">
          <div className="text-3xl font-black text-white/15">VS</div>
          <button onClick={battle} disabled={phase === "loading" || phase === "building" || cityA === cityB}
            className="flex items-center gap-2 px-6 py-2.5 bg-red-500 text-white rounded-xl font-bold text-sm hover:bg-red-500/90 disabled:opacity-40 transition-all mx-auto shadow-[0_0_20px_rgba(239,68,68,0.3)] hover:shadow-[0_0_30px_rgba(239,68,68,0.5)]">
            {(phase === "loading" || phase === "building") ? <Loader2 className="w-4 h-4 animate-spin" /> : <Swords className="w-4 h-4" />}
            Battle!
          </button>
        </div>
        <div>
          <label className="text-xs text-white/40 uppercase tracking-wider mb-1.5 block">City B</label>
          <select value={cityB} onChange={e => setCityB(e.target.value)}
            className="w-full bg-card border border-white/10 text-white rounded-xl px-3 py-2.5 text-sm focus:border-primary/50 focus:outline-none">
            {PLACES.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {(phase === "loading") && (
          <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="text-center py-16 border border-dashed border-red-500/20 rounded-2xl bg-red-500/5">
            <Swords className="w-12 h-12 mx-auto mb-3 text-red-400/40 animate-pulse" />
            <p className="text-white/40 text-sm">AI is judging the battle...</p>
          </motion.div>
        )}

        {data && (phase === "building" || phase === "reveal") && (
          <motion.div key="battle" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              {[data.cityA, data.cityB].map((city: any, i: number) => {
                const isWinner = city.name === data.winner && phase === "reveal";
                return (
                  <motion.div key={i} initial={{ x: i === 0 ? -40 : 40, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ delay: 0.1 }}
                    className={`rounded-xl p-5 border transition-all ${isWinner ? "border-yellow-400/50 bg-yellow-400/5 shadow-[0_0_30px_rgba(234,179,8,0.1)]" : "border-white/10 bg-card"}`}>
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="text-xl font-bold text-white">{city.name}</h3>
                      <AnimatePresence>{isWinner && <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", stiffness: 300 }} className="text-2xl">🏆</motion.span>}</AnimatePresence>
                    </div>
                    <div className="space-y-3">
                      {Object.entries(city.stats || {}).map(([key, val]: [string, any], si: number) => (
                        <div key={key}>
                          <div className="flex justify-between text-xs text-white/40 mb-1">
                            <span>{statLabels[key] || key}</span>
                            <span className="font-bold text-white">{val}</span>
                          </div>
                          <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                            <motion.div initial={{ width: 0 }} animate={{ width: `${val}%` }} transition={{ delay: 0.3 + si * 0.1, duration: 0.7, ease: "easeOut" }}
                              className={`h-full rounded-full ${i === 0 ? "bg-primary" : "bg-red-400"}`} />
                          </div>
                        </div>
                      ))}
                    </div>
                  </motion.div>
                );
              })}
            </div>

            <AnimatePresence>
              {phase === "reveal" && (
                <motion.div initial={{ opacity: 0, y: 20, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} transition={{ type: "spring", stiffness: 200, damping: 20 }}
                  className="bg-gradient-to-r from-yellow-400/10 via-card to-yellow-400/10 border border-yellow-400/30 rounded-2xl p-6 text-center shadow-[0_0_40px_rgba(234,179,8,0.1)]">
                  <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.2, type: "spring", stiffness: 300 }} className="text-5xl mb-3">🏆</motion.div>
                  <h3 className="text-3xl font-black text-yellow-400 mb-2">{data.winner} Wins!</h3>
                  <p className="text-sm text-white/60 italic mb-1">"{data.tagline}"</p>
                  <p className="text-sm text-white/50 max-w-md mx-auto">{data.verdict}</p>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}

        {phase === "idle" && (
          <motion.div key="empty" className="text-center py-16 text-white/25 border border-dashed border-white/10 rounded-2xl">
            <Swords className="w-12 h-12 mx-auto mb-3 opacity-20" />
            <p>Choose two cities and start the battle</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function CityQuizTab() {
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<string[]>([]);
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  function answer(opt: string) {
    const newAnswers = [...answers, opt];
    setAnswers(newAnswers);
    if (step < QUIZ_QUESTIONS.length - 1) setStep(step + 1);
    else submitQuiz(newAnswers);
  }

  async function submitQuiz(ans: string[]) {
    setLoading(true);
    try {
      const res = await fetch("/api/viral/quiz-result", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ answers: ans }),
      });
      setResult(await res.json());
    } finally {
      setLoading(false);
    }
  }

  function reset() { setStep(0); setAnswers([]); setResult(null); }

  if (loading) return (
    <div className="text-center py-24">
      <div className="relative inline-block mb-4">
        <div className="w-16 h-16 rounded-full border-2 border-yellow-400/30 border-t-yellow-400 animate-spin" />
        <HelpCircle className="absolute inset-0 m-auto w-6 h-6 text-yellow-400" />
      </div>
      <p className="text-white/50">AI is analyzing your personality...</p>
    </div>
  );

  if (result) return (
    <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="space-y-6">
      <div className="bg-gradient-to-br from-primary/15 via-card to-secondary/10 border border-primary/30 rounded-2xl p-8 text-center shadow-[0_0_50px_rgba(0,255,204,0.06)]">
        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", stiffness: 200 }} className="text-6xl mb-4">🌆</motion.div>
        <p className="text-primary uppercase tracking-widest text-xs mb-2 font-bold">You are...</p>
        <h2 className="text-4xl font-black text-white mb-2">{result.city}</h2>
        <div className="text-lg text-white/50 mb-4 font-light">{result.personality}</div>
        <div className="inline-flex items-center gap-2 bg-primary/15 border border-primary/30 rounded-full px-5 py-2 mb-6">
          <Star className="w-4 h-4 text-primary" />
          <span className="text-primary font-black text-lg">{result.matchPercent}% Match</span>
        </div>
        <p className="text-white/65 leading-relaxed mb-5 max-w-md mx-auto">{result.why}</p>
        <div className="bg-white/5 rounded-xl p-4 text-left mb-4">
          <p className="text-xs text-white/35 uppercase tracking-wider mb-2">Your Top Traits</p>
          <div className="flex gap-2 flex-wrap">
            {(result.topTraits || []).map((t: string) => (
              <span key={t} className="px-3 py-1 bg-primary/15 border border-primary/20 text-primary text-xs rounded-full">{t}</span>
            ))}
          </div>
        </div>
        <div className="bg-secondary/5 border border-secondary/15 rounded-xl p-4 text-left">
          <p className="text-xs text-secondary/50 uppercase tracking-wider mb-1">Fun Fact</p>
          <p className="text-sm text-white/65">{result.funFact}</p>
        </div>
      </div>
      <button onClick={reset} className="w-full py-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-white font-medium transition-all">
        Take Quiz Again
      </button>
    </motion.div>
  );

  const q = QUIZ_QUESTIONS[step];
  const progress = (step / QUIZ_QUESTIONS.length) * 100;

  return (
    <div className="space-y-6">
      <div>
        <div className="flex justify-between text-xs text-white/35 mb-2">
          <span>Question {step + 1} of {QUIZ_QUESTIONS.length}</span>
          <span>{Math.round(progress)}%</span>
        </div>
        <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
          <motion.div className="h-full bg-primary rounded-full" animate={{ width: `${progress}%` }} transition={{ duration: 0.4, ease: "easeOut" }} />
        </div>
      </div>

      <AnimatePresence mode="wait">
        <motion.div key={step} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.2 }} className="space-y-4">
          <h2 className="text-xl md:text-2xl font-bold text-white">{q.question}</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {q.options.map((opt, i) => (
              <motion.button key={i} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}
                onClick={() => answer(opt)}
                className="text-left p-4 bg-card border border-white/10 hover:border-primary/40 hover:bg-primary/5 rounded-xl text-sm text-white/75 hover:text-white transition-all">
                <span className="text-primary/50 font-bold mr-2">{String.fromCharCode(65 + i)}.</span>{opt}
              </motion.button>
            ))}
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

function PoetryTab() {
  const { geoCity } = useAppContext();
  const [placeId, setPlaceId] = useState(geoCity?.id || "tokyo-jp");
  const [form, setForm] = useState("haiku");
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  React.useEffect(() => { if (geoCity?.id) setPlaceId(geoCity.id); }, [geoCity?.id]);

  async function generate() {
    setLoading(true);
    setData(null);
    try {
      const res = await fetch(`/api/viral/poetry?placeId=${placeId}&form=${form}`);
      setData(await res.json());
    } finally { setLoading(false); }
  }

  async function copy() {
    if (!data) return;
    await navigator.clipboard.writeText(`${data.poem}\n\n— AI poem about ${data.placeName}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="space-y-6">
      <div className="flex gap-3 flex-wrap items-end">
        <div className="flex-1 min-w-40">
          <label className="text-xs text-white/40 uppercase tracking-wider mb-1.5 block">City</label>
          <select value={placeId} onChange={e => setPlaceId(e.target.value)}
            className="w-full bg-card border border-white/10 text-white rounded-xl px-3 py-2.5 text-sm focus:border-purple-400/50 focus:outline-none">
            {PLACES.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
        </div>
        <div>
          <label className="text-xs text-white/40 uppercase tracking-wider mb-1.5 block">Form</label>
          <select value={form} onChange={e => setForm(e.target.value)}
            className="bg-card border border-white/10 text-white rounded-xl px-3 py-2.5 text-sm focus:border-purple-400/50 focus:outline-none">
            <option value="haiku">Haiku (5-7-5)</option>
            <option value="quatrain">Quatrain</option>
          </select>
        </div>
        <button onClick={generate} disabled={loading}
          className="flex items-center gap-2 px-6 py-2.5 bg-purple-500 text-white rounded-xl font-bold text-sm hover:bg-purple-500/90 disabled:opacity-50 transition-all shadow-[0_0_20px_rgba(168,85,247,0.3)]">
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Feather className="w-4 h-4" />}
          Write Poem
        </button>
      </div>

      <AnimatePresence mode="wait">
        {loading && (
          <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="text-center py-16 border border-dashed border-purple-500/20 rounded-2xl bg-purple-500/5">
            <Feather className="w-10 h-10 mx-auto mb-3 text-purple-400/40 animate-pulse" />
            <p className="text-white/40 text-sm">Composing poem...</p>
          </motion.div>
        )}

        {data && !loading && (
          <motion.div key="poem" initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ type: "spring", stiffness: 200, damping: 25 }}>
            <div className="relative bg-gradient-to-br from-purple-500/10 via-card to-primary/5 border border-purple-500/20 rounded-2xl p-10 text-center shadow-[0_0_40px_rgba(168,85,247,0.06)]">
              <div className="absolute top-4 left-6 text-purple-400/15 text-7xl font-serif leading-none select-none">"</div>
              <div className="absolute bottom-4 right-6 text-purple-400/15 text-7xl font-serif leading-none select-none rotate-180">"</div>
              <div className="relative z-10">
                <motion.p className="text-2xl md:text-3xl text-white font-light leading-loose whitespace-pre-line" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}>
                  {data.poem}
                </motion.p>
                <div className="mt-6 text-white/30 text-sm">— AI poem about {data.placeName} · {data.mood}</div>
              </div>
            </div>
            <div className="flex gap-3 mt-4">
              <button onClick={copy} className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 rounded-xl text-sm text-white transition-all">
                {copied ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
                {copied ? "Copied!" : "Copy Poem"}
              </button>
              <button onClick={generate} className="flex items-center gap-2 px-4 py-2 bg-purple-500/15 hover:bg-purple-500/25 border border-purple-500/30 rounded-xl text-sm text-purple-400 transition-all">
                <RefreshCw className="w-4 h-4" /> New Poem
              </button>
            </div>
          </motion.div>
        )}

        {!data && !loading && (
          <motion.div key="empty" className="text-center py-20 text-white/25 border border-dashed border-white/10 rounded-2xl">
            <Feather className="w-12 h-12 mx-auto mb-3 opacity-20" />
            <p>Generate an AI poem about any city</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function LeaderboardTab() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  React.useEffect(() => {
    fetch("/api/viral/leaderboard").then(r => r.json()).then(setData).finally(() => setLoading(false));
  }, []);

  const trendIcon = (t: string) => t === "up" ? "⬆️" : t === "down" ? "⬇️" : "➡️";

  return (
    <div className="space-y-4">
      {loading ? (
        <div className="text-center py-20"><Loader2 className="w-8 h-8 animate-spin text-primary mx-auto" /></div>
      ) : data ? (
        <>
          <div className="flex justify-between items-center">
            <p className="text-white/40 text-sm">Weekly global explorer rankings</p>
            <span className="text-xs text-primary/60">{data.period}</span>
          </div>
          <div className="space-y-2">
            {data.cities.map((city: any, i: number) => (
              <motion.div key={city.placeId} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.04 }}
                className={`flex items-center gap-4 p-4 rounded-xl border transition-all hover:border-primary/20 ${i < 3 ? "bg-primary/5 border-primary/15" : "bg-card border-white/5"}`}>
                <div className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-black ${i === 0 ? "bg-yellow-500/20 text-yellow-400" : i === 1 ? "bg-gray-400/20 text-gray-300" : i === 2 ? "bg-orange-500/20 text-orange-400" : "bg-white/5 text-white/30"}`}>
                  {i < 3 ? ["🥇", "🥈", "🥉"][i] : city.rank}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-white">{city.name}</span>
                    <span className="text-white/30 text-xs">{city.country}</span>
                    {city.badge && <span className="text-sm">{city.badge}</span>}
                  </div>
                  <div className="text-xs text-white/30">{city.explores.toLocaleString()} explores</div>
                </div>
                <div className="text-right">
                  <div className="text-primary font-black">{city.vibeScore}</div>
                  <div className="text-xs">{trendIcon(city.trend)}</div>
                </div>
                <div className="w-20">
                  <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                    <div className="h-full bg-primary rounded-full" style={{ width: `${city.vibeScore}%` }} />
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </>
      ) : null}
    </div>
  );
}
