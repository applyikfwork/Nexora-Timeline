import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Award, Globe2, Moon, Map, Search, Star, Trophy, Loader2, Zap } from "lucide-react";

interface Badge {
  id: string;
  icon: string;
  name: string;
  description: string;
  earned: boolean;
  progress?: number;
  max?: number;
  category: "explorer" | "time" | "social" | "discovery";
}

const ALL_BADGES: Badge[] = [
  { id: "first-search", icon: "🔍", name: "First Steps", description: "Search for your first city", earned: true, category: "explorer" },
  { id: "explorer-5", icon: "🌍", name: "City Explorer", description: "Explore 5 different cities", earned: true, progress: 5, max: 5, category: "explorer" },
  { id: "explorer-10", icon: "🌐", name: "World Wanderer", description: "Explore 10 different cities", earned: false, progress: 5, max: 10, category: "explorer" },
  { id: "night-owl", icon: "🦉", name: "Night Owl", description: "Search between midnight and 3am", earned: false, progress: 0, max: 3, category: "time" },
  { id: "early-bird", icon: "🐦", name: "Early Bird", description: "Explore 3 cities before 7am", earned: false, progress: 1, max: 3, category: "time" },
  { id: "discoverer", icon: "🏆", name: "First Discoverer", description: "Be first to explore Tbilisi", earned: false, category: "discovery" },
  { id: "battle-winner", icon: "⚔️", name: "Battle Royale", description: "Win 5 City Battles", earned: false, progress: 2, max: 5, category: "social" },
  { id: "poet", icon: "✍️", name: "City Poet", description: "Generate 3 AI poems", earned: true, progress: 3, max: 3, category: "social" },
  { id: "capsule-writer", icon: "⏳", name: "Time Keeper", description: "Leave a Time Capsule message", earned: true, category: "social" },
  { id: "portfolio", icon: "📊", name: "Urban Analyst", description: "Track 5 cities in your portfolio", earned: false, progress: 3, max: 5, category: "explorer" },
  { id: "quiz-master", icon: "🧠", name: "Quiz Master", description: "Complete the city quiz", earned: true, category: "social" },
  { id: "compatibility", icon: "❤️", name: "City Match", description: "Calculate compatibility for 3 cities", earned: false, progress: 1, max: 3, category: "explorer" },
  { id: "reporter", icon: "📰", name: "Briefed", description: "Read 10 AI city reports", earned: false, progress: 4, max: 10, category: "discovery" },
  { id: "pulse-watcher", icon: "🌍", name: "Pulse Watcher", description: "Check World Pulse 5 times", earned: false, progress: 2, max: 5, category: "discovery" },
  { id: "neighborhood-dna", icon: "🏘️", name: "Block Explorer", description: "Explore 5 neighborhoods", earned: false, progress: 1, max: 5, category: "explorer" },
  { id: "legend", icon: "🌟", name: "Nexora Legend", description: "Earn 10 badges", earned: false, progress: 4, max: 10, category: "discovery" },
];

const CATEGORY_COLORS: Record<string, string> = {
  explorer: "text-primary border-primary/30 bg-primary/10",
  time: "text-purple-400 border-purple-400/30 bg-purple-400/10",
  social: "text-pink-400 border-pink-400/30 bg-pink-400/10",
  discovery: "text-yellow-400 border-yellow-400/30 bg-yellow-400/10",
};

export default function ExplorerHub() {
  const [activeTab, setActiveTab] = useState<"badges" | "leaderboard">("badges");
  const [leaderboard, setLeaderboard] = useState<any>(null);
  const [leaderboardLoading, setLeaderboardLoading] = useState(false);

  useEffect(() => {
    if (activeTab === "leaderboard") {
      setLeaderboardLoading(true);
      fetch("/api/viral/leaderboard")
        .then(r => r.json())
        .then(setLeaderboard)
        .finally(() => setLeaderboardLoading(false));
    }
  }, [activeTab]);

  const earnedCount = ALL_BADGES.filter(b => b.earned).length;
  const totalBadges = ALL_BADGES.length;

  return (
    <div className="p-6 md:p-10 max-w-5xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 rounded-xl bg-yellow-500/20 flex items-center justify-center border border-yellow-500/30">
          <Award className="w-6 h-6 text-yellow-400" />
        </div>
        <div>
          <h1 className="text-3xl font-bold text-white">Explorer Hub</h1>
          <p className="text-white/60 text-sm">Badges, achievements & global city rankings</p>
        </div>
      </div>

      <div className="flex gap-2">
        {(["badges", "leaderboard"] as const).map(tab => (
          <button key={tab} onClick={() => setActiveTab(tab)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all capitalize ${activeTab === tab ? "bg-primary text-black" : "bg-card border border-white/10 text-white/70 hover:text-white"}`}>
            {tab === "badges" ? <Award className="w-4 h-4" /> : <Trophy className="w-4 h-4" />}
            {tab === "badges" ? "Badges & Achievements" : "City Leaderboard"}
          </button>
        ))}
      </div>

      {activeTab === "badges" && (
        <div className="space-y-6">
          <div className="bg-gradient-to-r from-yellow-500/10 via-card to-primary/5 border border-yellow-500/20 rounded-2xl p-6">
            <div className="flex items-center gap-6">
              <div className="relative">
                <svg viewBox="0 0 80 80" className="w-20 h-20">
                  <circle cx="40" cy="40" r="32" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="8" />
                  <circle cx="40" cy="40" r="32" fill="none" stroke="#eab308" strokeWidth="8"
                    strokeDasharray={`${(earnedCount / totalBadges) * 201} 201`}
                    strokeLinecap="round" transform="rotate(-90 40 40)" />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-xl font-black text-yellow-400">{earnedCount}</span>
                </div>
              </div>
              <div>
                <h3 className="text-2xl font-black text-white">Explorer Level</h3>
                <p className="text-white/60 text-sm">{earnedCount} of {totalBadges} badges earned</p>
                <div className="mt-2 flex items-center gap-2">
                  <div className="px-3 py-1 bg-yellow-500/20 border border-yellow-500/30 rounded-full text-xs text-yellow-400 font-bold">
                    {earnedCount < 3 ? "Novice" : earnedCount < 6 ? "Explorer" : earnedCount < 10 ? "Veteran" : "Legend"}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {(["explorer", "time", "social", "discovery"] as const).map(category => {
            const categoryBadges = ALL_BADGES.filter(b => b.category === category);
            const categoryLabel = { explorer: "🌍 Explorer", time: "⏰ Time", social: "💬 Social", discovery: "🔍 Discovery" }[category];
            return (
              <div key={category}>
                <h3 className="text-sm font-bold text-white/50 uppercase tracking-wider mb-3">{categoryLabel}</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {categoryBadges.map((badge, i) => (
                    <motion.div key={badge.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                      className={`p-4 rounded-xl border transition-all ${badge.earned ? CATEGORY_COLORS[badge.category] : "border-white/5 bg-white/3 opacity-50"}`}>
                      <div className="text-3xl mb-2">{badge.icon}</div>
                      <div className="font-bold text-white text-sm">{badge.name}</div>
                      <div className="text-xs text-white/50 mt-0.5 leading-relaxed">{badge.description}</div>
                      {badge.progress !== undefined && badge.max && (
                        <div className="mt-2">
                          <div className="flex justify-between text-xs text-white/30 mb-1">
                            <span>{badge.progress}/{badge.max}</span>
                          </div>
                          <div className="h-1 bg-white/10 rounded-full overflow-hidden">
                            <div className="h-full bg-current rounded-full" style={{ width: `${(badge.progress / badge.max) * 100}%` }} />
                          </div>
                        </div>
                      )}
                      {badge.earned && <div className="mt-2 text-xs font-bold">✅ Earned</div>}
                    </motion.div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {activeTab === "leaderboard" && (
        <div className="space-y-4">
          {leaderboardLoading ? (
            <div className="text-center py-20"><Loader2 className="w-8 h-8 animate-spin text-primary mx-auto" /></div>
          ) : leaderboard ? (
            <>
              <div className="flex justify-between items-center">
                <p className="text-white/50 text-sm">Weekly most-explored cities worldwide</p>
                <span className="text-xs text-primary/60">{leaderboard.period}</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                {leaderboard.cities.slice(0, 3).map((city: any, i: number) => {
                  const medals = ["🥇", "🥈", "🥉"];
                  const colors = ["border-yellow-500/40 bg-yellow-500/10", "border-gray-400/40 bg-gray-400/10", "border-orange-500/40 bg-orange-500/10"];
                  return (
                    <div key={city.placeId} className={`rounded-2xl border p-5 text-center ${colors[i]}`}>
                      <div className="text-4xl mb-2">{medals[i]}</div>
                      <div className="font-black text-white text-lg">{city.name}</div>
                      <div className="text-white/40 text-sm">{city.country}</div>
                      <div className="text-3xl font-black text-primary mt-2">{city.vibeScore}</div>
                      <div className="text-xs text-white/30 mt-1">{city.explores.toLocaleString()} explores</div>
                    </div>
                  );
                })}
              </div>

              <div className="space-y-2">
                {leaderboard.cities.slice(3).map((city: any, i: number) => (
                  <motion.div key={city.placeId} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.04 }}
                    className="flex items-center gap-4 p-4 bg-card border border-white/5 rounded-xl">
                    <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-sm font-black text-white/40">
                      {city.rank}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-white">{city.name}</span>
                        <span className="text-white/30 text-xs">{city.country}</span>
                      </div>
                      <div className="text-xs text-white/30">{city.explores.toLocaleString()} explores</div>
                    </div>
                    <div className="text-primary font-bold">{city.vibeScore}</div>
                    <div className="w-16">
                      <div className="h-1 bg-white/10 rounded-full overflow-hidden">
                        <div className="h-full bg-primary/60 rounded-full" style={{ width: `${city.vibeScore}%` }} />
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </>
          ) : null}
        </div>
      )}
    </div>
  );
}
