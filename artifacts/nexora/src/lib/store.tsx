import React, { createContext, useContext, useState, useCallback, useMemo, ReactNode } from "react";
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
    return localStorage.getItem(PLACE_KEY) ?? "";
  });

  const sessionId = useMemo(() => initSessionId(), []);

  const setActivePlaceName = useCallback((name: string) => {
    setActivePlaceNameRaw(name);
    localStorage.setItem(PLACE_KEY, name);
  }, []);

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
