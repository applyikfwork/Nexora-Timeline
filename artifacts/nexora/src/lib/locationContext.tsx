/**
 * Nexora Global Location Intelligence System
 * Phase 1–5: Auto-detect → Universal Switcher → Explore Mode → Saved Locations → Travel Alerts
 *
 * Detection priority stack:
 *   1. localStorage (returning user — zero friction)
 *   2. Browser GPS → maps to nearest major city (city-level only, no neighborhood)
 *   3. IP Geolocation via ipapi.co (automatic, no permission, city-level)
 *   4. Default: "Delhi, India"
 *
 * Privacy: GPS is mapped to nearest major city only. IP gives city-level. No neighborhood data ever stored.
 */

import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode, useRef } from "react";
import { findNearestCity } from "@/hooks/useGeolocation";

// ── Storage keys ──────────────────────────────────────────────────────────────
const LS_ACTIVE   = "nexora_loc_v2_active";
const LS_HOME     = "nexora_loc_v2_home";
const LS_RECENT   = "nexora_loc_v2_recent";
const LS_SAVED    = "nexora_loc_v2_saved";
const LS_DETECTED = "nexora_loc_v2_detected"; // cached IP/GPS result

// ── Types ─────────────────────────────────────────────────────────────────────
export interface LocationData {
  city: string;
  state: string;
  country: string;
  displayName: string;   // "Delhi, India"
  source: "gps" | "ip" | "manual" | "saved" | "default";
}

export interface SavedLocation {
  id: string;
  label: string;        // "Home", "Office", "Parents' Place"
  city: string;
  state: string;
  country: string;
  addedAt: string;
}

export interface TravelAlert {
  detected: LocationData;   // where GPS/IP thinks the user is
  dismissed: boolean;
}

// ── Defaults ──────────────────────────────────────────────────────────────────
const DEFAULT_LOCATION: LocationData = {
  city: "Delhi",
  state: "Delhi",
  country: "India",
  displayName: "Delhi, India",
  source: "default",
};

// ── Helpers ───────────────────────────────────────────────────────────────────
function makeName(city: string, country: string) {
  if (!city && !country) return "Unknown";
  if (!city) return country;
  if (!country) return city;
  return `${city}, ${country}`;
}

function readLS<T>(key: string, fallback: T): T {
  try {
    const v = localStorage.getItem(key);
    return v ? (JSON.parse(v) as T) : fallback;
  } catch { return fallback; }
}

function writeLS(key: string, value: unknown) {
  try { localStorage.setItem(key, JSON.stringify(value)); } catch {}
}

// ── IP Geolocation (Phase 1 fallback) ────────────────────────────────────────
async function detectByIP(): Promise<LocationData | null> {
  try {
    const cached = readLS<{ loc: LocationData; ts: number } | null>(LS_DETECTED, null);
    // Cache for 4 hours
    if (cached && Date.now() - cached.ts < 4 * 60 * 60 * 1000) return cached.loc;

    const r = await fetch("https://ipapi.co/json/", {
      signal: AbortSignal.timeout(6000),
    });
    if (!r.ok) return null;
    const d = await r.json();
    if (d.error || d.reserved) return null;

    const city    = d.city    || d.region || "";
    const state   = d.region  || "";
    const country = d.country_name || d.country || "";
    if (!city && !country) return null;

    const loc: LocationData = {
      city, state, country,
      displayName: makeName(city, country),
      source: "ip",
    };
    writeLS(LS_DETECTED, { loc, ts: Date.now() });
    return loc;
  } catch { return null; }
}

// ── GPS Detection (Phase 5) ───────────────────────────────────────────────────
function detectByGPS(): Promise<LocationData | null> {
  return new Promise(resolve => {
    if (!navigator.geolocation) { resolve(null); return; }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const city = findNearestCity(pos.coords.latitude, pos.coords.longitude);
        const loc: LocationData = {
          city: city.name,
          state: city.country === "India" ? city.name : "",
          country: city.country,
          displayName: makeName(city.name, city.country),
          source: "gps",
        };
        resolve(loc);
      },
      () => resolve(null),
      { timeout: 8000, maximumAge: 300000 }
    );
  });
}

// ── Context ───────────────────────────────────────────────────────────────────
interface LocationContextType {
  // Current state
  location: LocationData;
  homeLocation: LocationData | null;
  isExploring: boolean;
  recentLocations: LocationData[];
  savedLocations: SavedLocation[];
  detectionStatus: "detecting" | "ready";
  travelAlert: TravelAlert | null;

  // Actions
  setLocation: (data: Pick<LocationData, "city" | "country"> & Partial<LocationData>) => void;
  saveAsHome: () => void;
  returnHome: () => void;
  clearHome: () => void;
  addSavedLocation: (label: string) => void;
  removeSavedLocation: (id: string) => void;
  loadSavedLocation: (sl: SavedLocation) => void;
  dismissTravelAlert: () => void;
  acceptTravelLocation: () => void;
  retryDetection: () => void;
}

const LocationCtx = createContext<LocationContextType | undefined>(undefined);

// ── Provider ──────────────────────────────────────────────────────────────────
interface LocationProviderProps {
  children: ReactNode;
  /** Called whenever the active location changes — bridge to AppProvider.setActivePlaceName */
  onLocationChange?: (loc: LocationData) => void;
}

export function LocationProvider({ children, onLocationChange }: LocationProviderProps) {
  const onChangeRef = useRef(onLocationChange);
  useEffect(() => { onChangeRef.current = onLocationChange; }, [onLocationChange]);

  const [location, setLocationState] = useState<LocationData>(() =>
    readLS(LS_ACTIVE, DEFAULT_LOCATION)
  );
  const [homeLocation, setHomeLocation] = useState<LocationData | null>(() =>
    readLS(LS_HOME, null)
  );
  const [recentLocations, setRecentLocations] = useState<LocationData[]>(() =>
    readLS(LS_RECENT, [])
  );
  const [savedLocations, setSavedLocations] = useState<SavedLocation[]>(() =>
    readLS(LS_SAVED, [])
  );
  const [detectionStatus, setDetectionStatus] = useState<"detecting" | "ready">("detecting");
  const [travelAlert, setTravelAlert] = useState<TravelAlert | null>(null);

  const isExploring = Boolean(
    homeLocation &&
    location.city &&
    homeLocation.city &&
    location.city.toLowerCase() !== homeLocation.city.toLowerCase()
  );

  // ── Core set ──────────────────────────────────────────────────────────────
  const applyLocation = useCallback((loc: LocationData, addToRecents = true) => {
    setLocationState(loc);
    writeLS(LS_ACTIVE, loc);
    onChangeRef.current?.(loc);

    if (addToRecents && loc.city) {
      setRecentLocations(prev => {
        const filtered = prev.filter(r => r.city.toLowerCase() !== loc.city.toLowerCase());
        const next = [loc, ...filtered].slice(0, 6);
        writeLS(LS_RECENT, next);
        return next;
      });
    }
  }, []);

  // ── Phase 1 + 3 + 5: Auto-detection on mount ──────────────────────────────
  const runDetection = useCallback(async (force = false) => {
    setDetectionStatus("detecting");
    const stored = readLS<LocationData | null>(LS_ACTIVE, null);

    // Skip detection if user has manually set a location (and not forced)
    if (!force && stored && (stored.source === "manual" || stored.source === "saved")) {
      setDetectionStatus("ready");
      return;
    }

    // Try GPS first (Phase 5)
    const gpsLoc = await detectByGPS();
    // Then IP fallback (Phase 1)
    const ipLoc = !gpsLoc ? await detectByIP() : null;
    const detected = gpsLoc || ipLoc;

    setDetectionStatus("ready");

    if (!detected) return; // keep stored or default

    const home = readLS<LocationData | null>(LS_HOME, null);

    // Phase 5: Travel alert — if we detect a city different from saved home
    if (
      home &&
      home.city &&
      detected.city &&
      detected.city.toLowerCase() !== home.city.toLowerCase()
    ) {
      setTravelAlert({ detected, dismissed: false });
      // Don't auto-switch; let user decide
      return;
    }

    // No home set, or detected = home city: silently apply
    if (!stored || stored.source === "default" || stored.source === "ip" || stored.source === "gps" || force) {
      applyLocation(detected, false);
    }
  }, [applyLocation]);

  useEffect(() => { runDetection(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Public actions ────────────────────────────────────────────────────────
  const setLocation = useCallback((
    data: Pick<LocationData, "city" | "country"> & Partial<LocationData>
  ) => {
    const loc: LocationData = {
      city: data.city,
      state: data.state || "",
      country: data.country,
      displayName: data.displayName || makeName(data.city, data.country),
      source: data.source || "manual",
    };
    applyLocation(loc, true);
  }, [applyLocation]);

  const saveAsHome = useCallback(() => {
    writeLS(LS_HOME, location);
    setHomeLocation(location);
  }, [location]);

  const clearHome = useCallback(() => {
    localStorage.removeItem(LS_HOME);
    setHomeLocation(null);
  }, []);

  const returnHome = useCallback(() => {
    if (!homeLocation) return;
    applyLocation({ ...homeLocation, source: "saved" }, false);
  }, [homeLocation, applyLocation]);

  const addSavedLocation = useCallback((label: string) => {
    const entry: SavedLocation = {
      id: `sl-${Date.now()}`,
      label,
      city: location.city,
      state: location.state,
      country: location.country,
      addedAt: new Date().toISOString(),
    };
    setSavedLocations(prev => {
      const deduped = prev.filter(s => s.city.toLowerCase() !== location.city.toLowerCase());
      const next = [entry, ...deduped].slice(0, 10);
      writeLS(LS_SAVED, next);
      return next;
    });
  }, [location]);

  const removeSavedLocation = useCallback((id: string) => {
    setSavedLocations(prev => {
      const next = prev.filter(s => s.id !== id);
      writeLS(LS_SAVED, next);
      return next;
    });
  }, []);

  const loadSavedLocation = useCallback((sl: SavedLocation) => {
    applyLocation({
      city: sl.city,
      state: sl.state,
      country: sl.country,
      displayName: makeName(sl.city, sl.country),
      source: "saved",
    }, false);
  }, [applyLocation]);

  const dismissTravelAlert = useCallback(() => {
    setTravelAlert(prev => prev ? { ...prev, dismissed: true } : null);
  }, []);

  const acceptTravelLocation = useCallback(() => {
    if (!travelAlert) return;
    applyLocation(travelAlert.detected, true);
    setTravelAlert(null);
  }, [travelAlert, applyLocation]);

  const retryDetection = useCallback(() => runDetection(true), [runDetection]);

  return (
    <LocationCtx.Provider value={{
      location, homeLocation, isExploring,
      recentLocations, savedLocations,
      detectionStatus, travelAlert,
      setLocation, saveAsHome, clearHome, returnHome,
      addSavedLocation, removeSavedLocation, loadSavedLocation,
      dismissTravelAlert, acceptTravelLocation, retryDetection,
    }}>
      {children}
    </LocationCtx.Provider>
  );
}

// ── Hook ──────────────────────────────────────────────────────────────────────
export function useLocation() {
  const ctx = useContext(LocationCtx);
  if (!ctx) throw new Error("useLocation must be used inside <LocationProvider>");
  return ctx;
}

/** Convenience: get just the current location data */
export function useActiveLocation(): LocationData {
  return useLocation().location;
}
