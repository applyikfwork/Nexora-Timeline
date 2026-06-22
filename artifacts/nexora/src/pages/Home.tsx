import React from "react";
import { PlaceSearch } from "@/components/PlaceSearch";
import { Globe } from "@/components/Globe";
import { useGetDashboardSummary } from "@workspace/api-client-react";
import { Activity, Globe2, Brain, MapPin } from "lucide-react";
import { motion } from "framer-motion";

export default function Home() {
  const { data: summary, isLoading } = useGetDashboardSummary();

  return (
    <div className="min-h-screen w-full flex flex-col p-6 md:p-12 relative overflow-hidden">
      {/* Hero Section */}
      <div className="flex-1 flex flex-col items-center justify-center text-center z-10 space-y-12 mb-16">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="space-y-6 max-w-3xl"
        >
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-sm font-medium uppercase tracking-wider mb-4">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
            </span>
            System Online
          </div>
          <h1 className="text-5xl md:text-7xl font-bold text-white tracking-tight leading-tight">
            Unlock the <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-secondary">Soul</span> of Any City.
          </h1>
          <p className="text-lg md:text-xl text-white/60 font-light max-w-2xl mx-auto">
            Nexora fuses real-time data, historical context, and AI reasoning into a living timeline of the planet.
          </p>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="w-full relative z-20"
        >
          <PlaceSearch />
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1, delay: 0.4 }}
          className="w-full relative -mt-10 -mb-20 pointer-events-none"
        >
          <Globe />
        </motion.div>
      </div>

      {/* Stats Section */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 relative z-10 max-w-6xl mx-auto w-full">
        <StatCard 
          icon={Activity} 
          label="Total Searches" 
          value={isLoading ? "..." : summary?.totalSearches.toLocaleString() || "0"} 
          delay={0.6} 
        />
        <StatCard 
          icon={Brain} 
          label="AI Insights" 
          value={isLoading ? "..." : summary?.aiInsightsGenerated.toLocaleString() || "0"} 
          delay={0.7} 
        />
        <StatCard 
          icon={Globe2} 
          label="Active Places" 
          value={isLoading ? "..." : summary?.activePlaces.toLocaleString() || "0"} 
          delay={0.8} 
        />
        <StatCard 
          icon={MapPin} 
          label="Top City" 
          value={isLoading ? "..." : summary?.topCity || "Unknown"} 
          delay={0.9} 
        />
      </div>
    </div>
  );
}

function StatCard({ icon: Icon, label, value, delay }: { icon: any, label: string, value: string | number, delay: number }) {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay }}
      className="bg-card/50 backdrop-blur-md border border-white/5 p-6 rounded-2xl flex flex-col items-center justify-center text-center group hover:bg-card/80 hover:border-primary/30 transition-all duration-300"
    >
      <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-4 group-hover:scale-110 group-hover:bg-primary/20 transition-all duration-300">
        <Icon className="w-6 h-6 text-primary" />
      </div>
      <div className="text-3xl font-bold text-white mb-1">{value}</div>
      <div className="text-sm text-white/50 uppercase tracking-wider">{label}</div>
    </motion.div>
  );
}
