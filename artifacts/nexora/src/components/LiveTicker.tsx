import React, { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { Radio } from "lucide-react";

const TICKER_ITEMS = [
  { city: "Tokyo", pulse: 94, note: "Surging — Concert Night" },
  { city: "Dubai", pulse: 91, note: "Weekend peak detected" },
  { city: "São Paulo", pulse: 89, note: "Evening surge active" },
  { city: "Mumbai", pulse: 86, note: "Evening peak building" },
  { city: "Seoul", pulse: 83, note: "Night scene lighting up" },
  { city: "New York", pulse: 88, note: "Rush hour rising" },
  { city: "Cairo", pulse: 85, note: "Market day busy" },
  { city: "Paris", pulse: 82, note: "Tourist season elevated" },
  { city: "Berlin", pulse: 77, note: "Normal — Afternoon calm" },
  { city: "Singapore", pulse: 70, note: "Quiet — Late night" },
  { city: "Sydney", pulse: 71, note: "Easing — Morning" },
];

export function LiveTicker() {
  const [items, setItems] = useState(TICKER_ITEMS);

  useEffect(() => {
    const interval = setInterval(() => {
      setItems(prev => prev.map(item => ({
        ...item,
        pulse: Math.max(20, Math.min(100, item.pulse + Math.floor(Math.random() * 6 - 3))),
      })));
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const pulseColor = (p: number) =>
    p > 85 ? "text-red-400" : p > 70 ? "text-yellow-400" : p > 50 ? "text-primary" : "text-blue-400";

  const doubled = [...items, ...items];

  return (
    <div className="bg-card/80 border-b border-white/5 backdrop-blur-md overflow-hidden h-8 flex items-center">
      <div className="flex-shrink-0 flex items-center gap-1.5 px-3 border-r border-white/10 h-full bg-primary/10">
        <div className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
        <Radio className="w-3 h-3 text-primary" />
        <span className="text-xs font-bold text-primary uppercase tracking-widest whitespace-nowrap">Live</span>
      </div>
      <div className="flex-1 overflow-hidden relative">
        <motion.div
          className="flex items-center gap-0 whitespace-nowrap"
          animate={{ x: ["0%", "-50%"] }}
          transition={{ duration: 40, repeat: Infinity, ease: "linear" }}
        >
          {doubled.map((item, i) => (
            <span key={i} className="inline-flex items-center gap-1.5 px-4 text-xs">
              <span className="text-white/50 font-medium">{item.city}</span>
              <span className={`font-black ${pulseColor(item.pulse)}`}>{item.pulse}</span>
              <span className="text-white/25">·</span>
              <span className="text-white/35">{item.note}</span>
              <span className="text-white/10 mx-2">|</span>
            </span>
          ))}
        </motion.div>
      </div>
    </div>
  );
}
