import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MapPin, X, RefreshCw, Navigation } from "lucide-react";
import { useAppContext } from "@/lib/store";

export function GeoLocationBanner() {
  const { geoCity, geoStatus, retryGeo } = useAppContext();
  const [dismissed, setDismissed] = useState(false);

  if (dismissed) return null;

  if (geoStatus === "loading") {
    return (
      <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }}
        className="bg-primary/5 border-b border-primary/10 px-4 py-2 flex items-center gap-3">
        <RefreshCw className="w-3.5 h-3.5 text-primary animate-spin flex-shrink-0" />
        <p className="text-xs text-white/50">Detecting your location...</p>
      </motion.div>
    );
  }

  if (geoStatus === "granted" && geoCity) {
    return (
      <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }}
        className="bg-primary/5 border-b border-primary/10 px-4 py-1.5 flex items-center gap-3">
        <div className="flex items-center gap-1.5 flex-1">
          <Navigation className="w-3 h-3 text-primary flex-shrink-0" />
          <span className="text-xs text-white/60">
            Showing content for your location: <span className="text-primary font-bold">{geoCity.name}, {geoCity.country}</span>
          </span>
        </div>
        <button onClick={() => setDismissed(true)} className="text-white/20 hover:text-white/60 transition-colors flex-shrink-0">
          <X className="w-3.5 h-3.5" />
        </button>
      </motion.div>
    );
  }

  if (geoStatus === "denied") {
    return (
      <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }}
        className="bg-yellow-500/5 border-b border-yellow-500/10 px-4 py-1.5 flex items-center gap-3">
        <MapPin className="w-3 h-3 text-yellow-500/60 flex-shrink-0" />
        <span className="text-xs text-white/40 flex-1">Location access denied — using default city</span>
        <button onClick={retryGeo} className="text-xs text-primary/70 hover:text-primary transition-colors">Enable</button>
        <button onClick={() => setDismissed(true)} className="text-white/20 hover:text-white/60 transition-colors">
          <X className="w-3.5 h-3.5" />
        </button>
      </motion.div>
    );
  }

  return null;
}
