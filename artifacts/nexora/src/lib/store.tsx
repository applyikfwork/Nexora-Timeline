import React, { createContext, useContext, useState, ReactNode } from "react";
import { Place } from "@workspace/api-client-react";

interface AppContextType {
  selectedPlace: Place | null;
  setSelectedPlace: (place: Place | null) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: ReactNode }) {
  const [selectedPlace, setSelectedPlace] = useState<Place | null>(null);

  return (
    <AppContext.Provider value={{ selectedPlace, setSelectedPlace }}>
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
