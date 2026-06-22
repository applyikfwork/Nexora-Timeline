import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { Place } from "@workspace/api-client-react";
import { useGeolocation, findNearestCity } from "@/hooks/useGeolocation";

interface AppContextType {
  selectedPlace: Place | null;
  setSelectedPlace: (place: Place | null) => void;
  geoCity: { id: string; name: string; country: string } | null;
  geoStatus: "idle" | "loading" | "granted" | "denied" | "unavailable";
  retryGeo: () => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: ReactNode }) {
  const [selectedPlace, setSelectedPlace] = useState<Place | null>(null);
  const { state, retry } = useGeolocation();

  const geoCity = state.status === "granted" ? state.city : null;
  const geoStatus = state.status;

  return (
    <AppContext.Provider value={{ selectedPlace, setSelectedPlace, geoCity, geoStatus, retryGeo: retry }}>
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
