import React, { useState, useEffect } from "react";
import { PlaceSearch } from "@/components/PlaceSearch";
import { Globe } from "@/components/Globe";
import { useGetDashboardSummary } from "@workspace/api-client-react";
import { Activity, Globe2, Brain, MapPin, Navigation, Zap, Wind, TrendingUp, Clock } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useAppContext } from "@/lib/store";
import { Link } from "wouter";

const QUICK_LINKS = [
  { href: "/viral", label: "Vibe Card", emoji: "⚡", color: "from-primary/20 to-primary/5 border-primary/20 hover:border-primary/50" },
  { href: "/pulse", label: "Live Pulse", emoji: "🌍", color: "from-red-500/20 to-red-500/5 border-red-500/20 hover:border-red-500/50" },
  { href: "/planner", label: "Plan Trip", emoji: "✈️", color: "from-blue-500/20 to-blue-500/5 border-blue-500/20 hover:border-blue-500/50" },
  { href: "/reporter", label: "City Brief", emoji: "📰", color: "from-orange-500/20 to-orange-500/5 border-orange-500/20 hover:border-orange-500/50" },
  { href: "/explorer", label: "Badges", emoji: "🏆", color: "from-yellow-500/20 to-yellow-500/5 border-yellow-500/20 hover:border-yellow-500/50" },
  { href: "/capsule", label: "Time Capsule", emoji: "⏳", color: "from-purple-500/20 to-purple-500/5 border-purple-500/20 hover:border-purple-500/50" },
];

function AnimatedNumber({ value }: { value: number }) {
  const [display, setDisplay] = useState(0);
  useEffect(() => {
    const start = 0;
    const end = value;
    const duration = 1200;
    const steps = 40;
    let step = 0;
    const timer = setInterval(() => {
      step++;
      setDisplay(Math.floor(start + (end - start) * (step / steps)));
      if (step >= steps) clearInterval(timer);
    }, duration / steps);
    return () => clearInterval(timer);
  }, [value]);
  return <>{display.toLocaleString()}</>;
}

function PulseRing({ pulse }: { pulse: number }) {
  const color = pulse > 85 ? "#ff4444" : pulse > 70 ? "#ffaa00" : "#00ffcc";
  return (
    <div className="relative flex items-center justify-center w-20 h-20">
      <div className="absolute inset-0 rounded-full animate-ping opacity-10" style={{ backgroundColor: color, animationDuration: "2s" }} />
      <div className="absolute inset-1 rounded-full animate-ping opacity-15" style={{ backgroundColor: color, animationDuration: "2.5s", animationDelay: "0.5s" }} />
      <div className="absolute inset-3 rounded-full opacity-20" style={{ backgroundColor: color }} />
      <div className="relative flex flex-col items-center justify-center w-14 h-14 rounded-full border-2" style={{ borderColor: color, backgroundColor: color + "22" }}>
        <span className="font-black text-lg leading-none" style={{ color }}>{pulse}</span>
        <span className="text-white/40 text-xs">pulse</span>
      </div>
    </div>
  );
}

function YourCityCard() {
  const { geoCity, geoStatus } = useAppContext();
  const [cityData, setCityData] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const cityId = geoCity?.id || "delhi-in";
  const cityName = geoCity?.name || "Delhi";

  useEffect(() => {
    if (geoStatus === "loading") return;
    setLoading(true);
    fetch(`/api/forecast/pulse`)
      .then(r => r.json())
      .then(d => {
        const city = d.cities?.find((c: any) => c.id === cityId) || d.cities?.[0];
        setCityData(city);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [cityId, geoStatus]);

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
      className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary/10 via-card to-secondary/5 border border-primary/20 p-6">
      <div className="absolute top-0 right-0 w-48 h-48 bg-primary/5 rounded-full -translate-y-1/2 translate-x-1/2 pointer-events-none" />
      <div className="relative z-10">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-2">
            <Navigation className="w-4 h-4 text-primary" />
            <span className="text-xs text-primary uppercase tracking-widest font-bold">
              {geoStatus === "granted" ? "Your City" : "Featured City"}
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
            <span className="text-xs text-white/40">Live</span>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-black text-white mb-1">{cityData?.name || cityName}</h2>
            <p className="text-white/50 text-sm">{cityData?.status || "Monitoring active"}</p>
          </div>
          {cityData ? <PulseRing pulse={cityData.pulse} /> : (
            <div className="w-20 h-20 rounded-full border-2 border-white/10 flex items-center justify-center animate-pulse bg-white/5">
              <Zap className="w-6 h-6 text-white/20" />
            </div>
          )}
        </div>

        <div className="mt-4 grid grid-cols-3 gap-3">
          {[
            { label: "Trend", value: cityData?.trend || "—", icon: TrendingUp },
            { label: "Status", value: cityData?.pulse > 80 ? "Surging" : cityData?.pulse > 60 ? "Active" : "Calm", icon: Activity },
            { label: "Updated", value: "Live", icon: Clock },
          ].map(({ label, value, icon: Icon }) => (
            <div key={label} className="bg-black/20 rounded-xl p-3 text-center">
              <Icon className="w-3.5 h-3.5 text-primary/60 mx-auto mb-1" />
              <div className="text-xs font-bold text-white capitalize">{value}</div>
              <div className="text-xs text-white/30">{label}</div>
            </div>
          ))}
        </div>

        <div className="mt-4 flex gap-2">
          <Link href="/reporter" className="flex-1 text-center py-2 bg-primary/20 hover:bg-primary/30 border border-primary/30 rounded-xl text-xs text-primary font-bold transition-all">
            📰 Get Brief
          </Link>
          <Link href="/forecast" className="flex-1 text-center py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-xs text-white/60 hover:text-white font-medium transition-all">
            📅 Forecast
          </Link>
        </div>
      </div>
    </motion.div>
  );
}

export default function Home() {
  const { data: summary, isLoading } = useGetDashboardSummary();

  return (
    <div className="min-h-screen w-full flex flex-col p-6 md:p-10 relative overflow-hidden">
      <div className="flex-1 flex flex-col items-center justify-center text-center z-10 space-y-10 mb-10">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7 }} className="space-y-5 max-w-3xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-medium uppercase tracking-wider mb-2">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-primary" />
            </span>
            18 AI Features Active
          </div>
          <h1 className="text-5xl md:text-7xl font-bold text-white tracking-tight leading-tight">
            Unlock the <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-secondary">Soul</span> of Any City.
          </h1>
          <p className="text-lg md:text-xl text-white/50 font-light max-w-2xl mx-auto leading-relaxed">
            Real-time pulse data, AI intelligence, historical context — all fused into one living city platform.
          </p>
        </motion.div>

        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.6, delay: 0.15 }}
          className="w-full max-w-2xl relative z-20">
          <PlaceSearch />
        </motion.div>

        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 1, delay: 0.35 }}
          className="w-full relative -mt-6 -mb-16 pointer-events-none">
          <Globe />
        </motion.div>
      </div>

      <div className="relative z-10 max-w-6xl mx-auto w-full space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <YourCityCard />

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
            className="bg-card border border-white/10 rounded-2xl p-6">
            <h3 className="text-sm font-bold text-white/50 uppercase tracking-wider mb-4">Quick Access</h3>
            <div className="grid grid-cols-3 gap-2">
              {QUICK_LINKS.map((link, i) => (
                <motion.div key={link.href} initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.5 + i * 0.06 }}>
                  <Link href={link.href}
                    className={`flex flex-col items-center gap-1.5 p-3 rounded-xl bg-gradient-to-br border text-center transition-all hover:scale-105 ${link.color}`}>
                    <span className="text-2xl">{link.emoji}</span>
                    <span className="text-xs font-medium text-white/70">{link.label}</span>
                  </Link>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { icon: Activity, label: "Total Searches", value: summary?.totalSearches || 0, delay: 0.6, color: "text-primary" },
            { icon: Brain, label: "AI Insights", value: summary?.aiInsightsGenerated || 0, delay: 0.7, color: "text-secondary" },
            { icon: Globe2, label: "Active Places", value: summary?.activePlaces || 0, delay: 0.8, color: "text-blue-400" },
            { icon: MapPin, label: "Top City", value: summary?.topCity || "—", delay: 0.9, color: "text-yellow-400", isText: true },
          ].map(({ icon: Icon, label, value, delay, color, isText }) => (
            <motion.div key={label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay }}
              className="bg-card/60 backdrop-blur-md border border-white/5 p-5 rounded-2xl flex flex-col items-center justify-center text-center group hover:bg-card hover:border-primary/20 transition-all duration-300 cursor-default">
              <div className={`w-10 h-10 rounded-full bg-white/5 flex items-center justify-center mb-3 group-hover:scale-110 transition-all duration-300 ${color}`}>
                <Icon className="w-5 h-5" />
              </div>
              <div className={`text-2xl font-black mb-1 ${isLoading ? "text-white/20" : "text-white"}`}>
                {isLoading ? "…" : isText ? String(value) : <AnimatedNumber value={Number(value)} />}
              </div>
              <div className="text-xs text-white/40 uppercase tracking-wider">{label}</div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}
