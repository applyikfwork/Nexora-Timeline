import React, { createContext, useContext, useState, useCallback, useMemo, useEffect, ReactNode } from "react";
import { Place } from "@workspace/api-client-react";
import { useGeolocation, findNearestCity } from "@/hooks/useGeolocation";

const PLACE_KEY = "nexora_active_place";
const SESSION_KEY = "nexora_session_id";

function initSessionId(): string {
  const stored = localStorage.getItem(SESSION_KEY);
  if (stored) return stored;
  const id = `sess-${Math.random().toString(36).slice(2)}-${Date.now()}`;
  localStorage.setItem(SESSION_KEY, id);
  return id;
}

function readPlaceFromUrl(): string {
  try {
    const params = new URLSearchParams(window.location.search);
    return params.get("place") ?? "";
  } catch {
    return "";
  }
}

function writePlaceToUrl(name: string) {
  try {
    const url = new URL(window.location.href);
    if (name) {
      url.searchParams.set("place", name);
    } else {
      url.searchParams.delete("place");
    }
    window.history.replaceState(null, "", url.toString());
  } catch {
    // ignore
  }
}

interface AppContextType {
  selectedPlace: Place | null;
  setSelectedPlace: (place: Place | null) => void;
  geoCity: { id: string; name: string; country: string } | null;
  geoStatus: "idle" | "loading" | "granted" | "denied" | "unavailable";
  retryGeo: () => void;
  activePlaceName: string;
  setActivePlaceName: (name: string) => void;
  sessionId: string;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: ReactNode }) {
  const [selectedPlace, setSelectedPlace] = useState<Place | null>(null);
  const { state, retry } = useGeolocation();

  const [activePlaceName, setActivePlaceNameRaw] = useState<string>(() => {
    // URL param takes priority over localStorage (enables shared links)
    const fromUrl = readPlaceFromUrl();
    if (fromUrl) return fromUrl;
    return localStorage.getItem(PLACE_KEY) ?? "";
  });

  const sessionId = useMemo(() => initSessionId(), []);

  const setActivePlaceName = useCallback((name: string) => {
    setActivePlaceNameRaw(name);
    localStorage.setItem(PLACE_KEY, name);
    writePlaceToUrl(name);
  }, []);

  // Keep URL in sync when the place changes externally (e.g. back/forward)
  useEffect(() => {
    const onPopState = () => {
      const fromUrl = readPlaceFromUrl();
      if (fromUrl && fromUrl !== activePlaceName) {
        setActivePlaceNameRaw(fromUrl);
        localStorage.setItem(PLACE_KEY, fromUrl);
      }
    };
    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, [activePlaceName]);

  const geoCity = state.status === "granted" ? state.city : null;
  const geoStatus = state.status;

  return (
    <AppContext.Provider value={{
      selectedPlace,
      setSelectedPlace,
      geoCity,
      geoStatus,
      retryGeo: retry,
      activePlaceName,
      setActivePlaceName,
      sessionId,
    }}>
      {children}
    </AppContext.Provider>
  );
}

export function useAppContext() {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error("useAppContext must be used within an AppProvider");
  }
  return context;
}
