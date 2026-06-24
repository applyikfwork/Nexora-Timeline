/**
 * Universal Location Switcher — Phase 2 + 3 + 4 + 5
 * Single persistent pill in the app header. Handles:
 *   - Home mode: "📍 Delhi, India"
 *   - Explore mode: "🔭 Mumbai" + "← Home" button
 *   - Dropdown: detected, recents, saved, manual entry
 *   - Save as Home / Remove Home
 *   - Travel alert banner (Phase 5)
 */

import React, { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  MapPin, ChevronDown, Home, Telescope, Navigation, Clock,
  Star, Plus, X, Check, Loader2, Search, Trash2, Edit3,
  AlertCircle, ArrowLeft, Wifi, Globe2,
} from "lucide-react";
import { useLocation, LocationData, SavedLocation } from "@/lib/locationContext";

const INDIA_STATES = [
  "Andhra Pradesh","Assam","Bihar","Chhattisgarh","Delhi","Goa","Gujarat",
  "Haryana","Himachal Pradesh","Jharkhand","Karnataka","Kerala","Madhya Pradesh",
  "Maharashtra","Manipur","Meghalaya","Mizoram","Nagaland","Odisha","Punjab",
  "Rajasthan","Sikkim","Tamil Nadu","Telangana","Tripura","Uttar Pradesh",
  "Uttarakhand","West Bengal",
];

const SOURCE_META: Record<string, { icon: string; label: string; color: string }> = {
  gps:     { icon: "📡", label: "GPS",     color: "#34d399" },
  ip:      { icon: "🌐", label: "Network", color: "#60a5fa" },
  manual:  { icon: "✏️",  label: "Manual",  color: "#a78bfa" },
  saved:   { icon: "⭐",  label: "Saved",   color: "#fbbf24" },
  default: { icon: "📍",  label: "Default", color: "#a78bfa" },
};

// ── Travel Alert Toast ────────────────────────────────────────────────────────
export function TravelAlertToast() {
  const { travelAlert, dismissTravelAlert, acceptTravelLocation } = useLocation();
  if (!travelAlert || travelAlert.dismissed) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        className="mx-4 my-2 rounded-2xl border border-amber-500/25 bg-amber-500/8 p-3 flex items-center gap-3"
      >
        <div className="w-8 h-8 rounded-xl bg-amber-500/15 border border-amber-500/25 flex items-center justify-center flex-shrink-0">
          <span className="text-sm">✈️</span>
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-bold text-amber-400">Travelling?</p>
          <p className="text-xs text-white/50 truncate">
            We detected you might be in <span className="text-white/80 font-medium">{travelAlert.detected.displayName}</span>
          </p>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <button
            onClick={acceptTravelLocation}
            className="px-3 py-1.5 rounded-lg bg-amber-500/20 border border-amber-500/30 text-amber-400 text-xs font-bold hover:bg-amber-500/30 transition-colors"
          >
            Switch
          </button>
          <button
            onClick={dismissTravelAlert}
            className="text-white/25 hover:text-white/60 transition-colors p-1"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}

// ── Dropdown Panel ────────────────────────────────────────────────────────────
interface DropdownProps { onClose: () => void }

function LocationDropdown({ onClose }: DropdownProps) {
  const {
    location, homeLocation, recentLocations, savedLocations,
    detectionStatus, isExploring,
    setLocation, saveAsHome, clearHome, returnHome,
    addSavedLocation, removeSavedLocation, loadSavedLocation, retryDetection,
  } = useLocation();

  const [tab, setTab]         = useState<"main" | "manual" | "save-label">("main");
  const [manualCity, setManualCity]     = useState("");
  const [manualState, setManualState]   = useState("");
  const [manualCountry, setManualCountry] = useState("India");
  const [saveLabel, setSaveLabel]       = useState("");
  const [justSaved, setJustSaved]       = useState(false);

  function applyManual() {
    if (!manualCity.trim()) return;
    setLocation({
      city: manualCity.trim(),
      state: manualState.trim(),
      country: manualCountry.trim() || "India",
      source: "manual",
    });
    onClose();
  }

  function handleSaveLabel() {
    if (!saveLabel.trim()) return;
    addSavedLocation(saveLabel.trim());
    setSaveLabel("");
    setJustSaved(true);
    setTimeout(() => { setJustSaved(false); setTab("main"); }, 1500);
  }

  const srcMeta = SOURCE_META[location.source] ?? SOURCE_META.default;

  return (
    <motion.div
      initial={{ opacity: 0, y: -8, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -8, scale: 0.97 }}
      transition={{ duration: 0.15 }}
      className="absolute top-full left-0 mt-2 w-80 rounded-2xl border border-white/10 bg-[#0d0018] shadow-2xl shadow-black/60 overflow-hidden z-[200]"
      onClick={e => e.stopPropagation()}
    >
      {/* ── Header ─────────────────────────────────────────────── */}
      <div className="px-4 pt-4 pb-3 border-b border-white/5">
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center gap-2">
            <span className="text-sm">{srcMeta.icon}</span>
            <span className="text-xs font-bold text-white/70">Current Location</span>
          </div>
          <span className="text-xs px-2 py-0.5 rounded-md font-medium" style={{ color: srcMeta.color, background: `${srcMeta.color}18`, border: `1px solid ${srcMeta.color}30` }}>
            {srcMeta.label}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <p className="text-base font-black text-white leading-tight flex-1 truncate">{location.displayName || "No location set"}</p>
          {detectionStatus === "detecting" && <Loader2 className="w-4 h-4 text-violet-400 animate-spin flex-shrink-0" />}
        </div>
        {location.state && location.state !== location.city && (
          <p className="text-xs text-white/35 mt-0.5">{location.state}</p>
        )}
      </div>

      {/* ── Main tab ───────────────────────────────────────────── */}
      <AnimatePresence mode="wait">
        {tab === "main" && (
          <motion.div key="main" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            {/* Explore mode banner */}
            {isExploring && homeLocation && (
              <div className="mx-3 mt-3 rounded-xl bg-violet-500/10 border border-violet-500/20 p-2.5 flex items-center gap-2.5">
                <Telescope className="w-4 h-4 text-violet-400 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold text-violet-300">Explore Mode Active</p>
                  <p className="text-xs text-white/40 truncate">Home: {homeLocation.displayName}</p>
                </div>
                <button onClick={() => { returnHome(); onClose(); }}
                  className="flex items-center gap-1 px-2 py-1 rounded-lg bg-violet-500/20 text-violet-300 text-xs font-bold hover:bg-violet-500/30 transition-colors flex-shrink-0">
                  <ArrowLeft className="w-3 h-3" /> Home
                </button>
              </div>
            )}

            <div className="p-3 space-y-1">
              {/* Home Location */}
              {homeLocation ? (
                <div className="group flex items-center gap-2.5 p-2.5 rounded-xl hover:bg-white/4 transition-colors">
                  <div className="w-7 h-7 rounded-lg bg-amber-500/15 border border-amber-500/20 flex items-center justify-center flex-shrink-0">
                    <Home className="w-3.5 h-3.5 text-amber-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <button className="text-xs font-semibold text-white/80 hover:text-white transition-colors truncate block w-full text-left"
                      onClick={() => { returnHome(); onClose(); }}>
                      {homeLocation.displayName}
                    </button>
                    <p className="text-xs text-amber-400/60">My Home</p>
                  </div>
                  <button onClick={clearHome} className="opacity-0 group-hover:opacity-100 text-white/20 hover:text-red-400 transition-all p-0.5">
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ) : (
                <button onClick={() => { saveAsHome(); setJustSaved(true); setTimeout(() => setJustSaved(false), 1800); }}
                  className="w-full flex items-center gap-2.5 p-2.5 rounded-xl border border-dashed border-amber-500/25 hover:border-amber-500/50 hover:bg-amber-500/5 transition-all text-left">
                  <div className="w-7 h-7 rounded-lg bg-amber-500/10 flex items-center justify-center flex-shrink-0">
                    {justSaved ? <Check className="w-3.5 h-3.5 text-amber-400" /> : <Plus className="w-3.5 h-3.5 text-amber-400/50" />}
                  </div>
                  <span className="text-xs text-amber-400/60 font-medium">{justSaved ? "Saved as home!" : `Save ${location.city || "current"} as Home`}</span>
                </button>
              )}

              {/* Recent Locations */}
              {recentLocations.length > 0 && (
                <>
                  <p className="text-xs text-white/25 font-bold uppercase tracking-wider pt-2 pb-1 px-0.5">Recent</p>
                  {recentLocations.slice(0, 4).map((r, i) => (
                    <button key={i} onClick={() => { setLocation(r); onClose(); }}
                      className="w-full flex items-center gap-2.5 p-2.5 rounded-xl hover:bg-white/5 transition-colors text-left group">
                      <Clock className="w-3.5 h-3.5 text-white/20 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium text-white/70 truncate">{r.displayName}</p>
                      </div>
                      <span className="text-xs text-white/20 flex-shrink-0 group-hover:text-white/40 transition-colors">
                        {r.source === "gps" ? "📡" : r.source === "ip" ? "🌐" : "✏️"}
                      </span>
                    </button>
                  ))}
                </>
              )}

              {/* Saved Locations */}
              {savedLocations.length > 0 && (
                <>
                  <p className="text-xs text-white/25 font-bold uppercase tracking-wider pt-2 pb-1 px-0.5">Saved</p>
                  {savedLocations.map(sl => (
                    <div key={sl.id} className="group flex items-center gap-2.5 p-2.5 rounded-xl hover:bg-white/5 transition-colors">
                      <Star className="w-3.5 h-3.5 text-violet-400 flex-shrink-0" />
                      <button className="flex-1 min-w-0 text-left"
                        onClick={() => { loadSavedLocation(sl); onClose(); }}>
                        <p className="text-xs font-semibold text-white/70">{sl.label}</p>
                        <p className="text-xs text-white/30 truncate">{sl.city}, {sl.country}</p>
                      </button>
                      <button onClick={() => removeSavedLocation(sl.id)}
                        className="opacity-0 group-hover:opacity-100 text-white/20 hover:text-red-400 transition-all p-0.5">
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </>
              )}

              {/* Actions */}
              <div className="pt-2 border-t border-white/5 space-y-1">
                <button onClick={() => setTab("save-label")}
                  className="w-full flex items-center gap-2.5 p-2.5 rounded-xl hover:bg-white/5 transition-colors text-left">
                  <Star className="w-3.5 h-3.5 text-violet-400/60 flex-shrink-0" />
                  <span className="text-xs text-white/50 hover:text-white/70">Save {location.city || "current"} with a label…</span>
                </button>

                <button onClick={() => { retryDetection(); }}
                  className="w-full flex items-center gap-2.5 p-2.5 rounded-xl hover:bg-white/5 transition-colors text-left">
                  {detectionStatus === "detecting"
                    ? <Loader2 className="w-3.5 h-3.5 text-violet-400 animate-spin flex-shrink-0" />
                    : <Navigation className="w-3.5 h-3.5 text-violet-400/60 flex-shrink-0" />}
                  <span className="text-xs text-white/50 hover:text-white/70">Re-detect my location</span>
                </button>

                <button onClick={() => setTab("manual")}
                  className="w-full flex items-center gap-2.5 p-2.5 rounded-xl hover:bg-violet-500/10 transition-colors text-left border border-violet-500/15 hover:border-violet-500/30">
                  <Search className="w-3.5 h-3.5 text-violet-400 flex-shrink-0" />
                  <span className="text-xs text-violet-400 font-medium">Explore another place…</span>
                </button>
              </div>
            </div>
          </motion.div>
        )}

        {/* ── Manual entry tab ───────────────────────────────── */}
        {tab === "manual" && (
          <motion.div key="manual" initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 10 }}>
            <div className="p-3 space-y-3">
              <div className="flex items-center gap-2 mb-1">
                <button onClick={() => setTab("main")} className="text-white/30 hover:text-white transition-colors">
                  <ArrowLeft className="w-4 h-4" />
                </button>
                <p className="text-xs font-bold text-white/70">Enter any location</p>
              </div>
              <input
                value={manualCity}
                onChange={e => setManualCity(e.target.value)}
                onKeyDown={e => e.key === "Enter" && applyManual()}
                placeholder="City (e.g. Mumbai, London, Tokyo)"
                autoFocus
                className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-violet-500/50 transition-colors"
              />
              <input
                value={manualState}
                onChange={e => setManualState(e.target.value)}
                placeholder="State / Region (optional)"
                className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-violet-500/50 transition-colors"
              />
              <input
                value={manualCountry}
                onChange={e => setManualCountry(e.target.value)}
                placeholder="Country"
                className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-violet-500/50 transition-colors"
              />
              <button onClick={applyManual} disabled={!manualCity.trim()}
                className="w-full py-2.5 rounded-xl bg-violet-700 hover:bg-violet-600 text-white text-sm font-bold transition-colors disabled:opacity-40 flex items-center justify-center gap-2">
                <Telescope className="w-4 h-4" /> Explore {manualCity || "this place"}
              </button>
            </div>
          </motion.div>
        )}

        {/* ── Save-with-label tab ────────────────────────────── */}
        {tab === "save-label" && (
          <motion.div key="save-label" initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 10 }}>
            <div className="p-3 space-y-3">
              <div className="flex items-center gap-2 mb-1">
                <button onClick={() => setTab("main")} className="text-white/30 hover:text-white transition-colors">
                  <ArrowLeft className="w-4 h-4" />
                </button>
                <p className="text-xs font-bold text-white/70">Save "{location.city}" as…</p>
              </div>
              {["Home", "Office", "Parents' Place", "College", "Other"].map(preset => (
                <button key={preset} onClick={() => { addSavedLocation(preset); setJustSaved(true); setTab("main"); setTimeout(() => setJustSaved(false), 1800); }}
                  className="w-full flex items-center gap-2 px-3 py-2 rounded-xl hover:bg-violet-500/10 border border-white/5 hover:border-violet-500/20 transition-all text-left">
                  <Star className="w-3.5 h-3.5 text-violet-400/50" />
                  <span className="text-xs text-white/60 hover:text-white/80">{preset}</span>
                </button>
              ))}
              <div className="flex gap-2">
                <input value={saveLabel} onChange={e => setSaveLabel(e.target.value)} onKeyDown={e => e.key === "Enter" && handleSaveLabel()}
                  placeholder="Custom label…"
                  className="flex-1 bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-violet-500/50 transition-colors" />
                <button onClick={handleSaveLabel} disabled={!saveLabel.trim()}
                  className="px-3 py-2.5 rounded-xl bg-violet-700 hover:bg-violet-600 text-white transition-colors disabled:opacity-40">
                  {justSaved ? <Check className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ── Main Pill Component ───────────────────────────────────────────────────────
export function LocationSwitcher() {
  const { location, homeLocation, isExploring, detectionStatus, returnHome } = useLocation();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    if (open) document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  const displayCity = location.city || "Set Location";
  const isDetecting = detectionStatus === "detecting";

  return (
    <div ref={ref} className="relative">
      {/* ── Pill ─────────────────────────────────────────────── */}
      <button
        onClick={() => setOpen(o => !o)}
        className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border transition-all text-xs font-medium ${
          isExploring
            ? "bg-violet-500/12 border-violet-500/30 text-violet-300 hover:bg-violet-500/18"
            : "bg-white/4 border-white/10 text-white/70 hover:bg-white/7 hover:border-white/15"
        }`}
      >
        {isDetecting ? (
          <Loader2 className="w-3.5 h-3.5 text-violet-400 animate-spin" />
        ) : isExploring ? (
          <Telescope className="w-3.5 h-3.5 text-violet-400" />
        ) : (
          <div className="relative">
            <MapPin className="w-3.5 h-3.5 text-violet-400" />
            <div className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 rounded-full bg-green-400 border border-[#0d0018]" />
          </div>
        )}
        <span className="max-w-[130px] truncate">
          {isExploring ? `Exploring ${displayCity}` : displayCity}
        </span>
        {location.country && !isExploring && (
          <span className="text-white/30 hidden sm:inline truncate max-w-[60px]">{location.country}</span>
        )}
        <ChevronDown className={`w-3.5 h-3.5 text-white/30 flex-shrink-0 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {/* ── Explore mode: return home button ─────────────────── */}
      {isExploring && homeLocation && !open && (
        <button
          onClick={() => returnHome()}
          className="absolute -right-0 top-full mt-1 flex items-center gap-1 px-2 py-1 rounded-lg bg-amber-500/15 border border-amber-500/25 text-amber-400 text-xs font-bold hover:bg-amber-500/25 transition-colors whitespace-nowrap z-10"
        >
          <ArrowLeft className="w-3 h-3" /> {homeLocation.city}
        </button>
      )}

      {/* ── Dropdown ─────────────────────────────────────────── */}
      <AnimatePresence>
        {open && <LocationDropdown onClose={() => setOpen(false)} />}
      </AnimatePresence>
    </div>
  );
}
