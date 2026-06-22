import React, { useState, useEffect, useRef } from "react";
import { Search, MapPin, Loader2 } from "lucide-react";
import { useSearchPlaces, Place } from "@workspace/api-client-react";
import { useAppContext } from "@/lib/store";
import { Input } from "@/components/ui/input";
import { useLocation } from "wouter";

export function PlaceSearch() {
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const { setSelectedPlace } = useAppContext();
  const [, setLocation] = useLocation();
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQuery(query), 300);
    return () => clearTimeout(timer);
  }, [query]);

  const { data: places, isLoading } = useSearchPlaces(
    { q: debouncedQuery, limit: 5 },
    { query: { enabled: debouncedQuery.length > 1, queryKey: ["searchPlaces", debouncedQuery] } }
  );

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelect = (place: Place) => {
    setSelectedPlace(place);
    setIsOpen(false);
    setQuery(place.name);
    setLocation("/map");
  };

  return (
    <div className="relative w-full max-w-2xl mx-auto" ref={wrapperRef}>
      <div className="relative group">
        <div className="absolute -inset-0.5 bg-gradient-to-r from-primary to-secondary rounded-lg blur opacity-30 group-hover:opacity-50 transition duration-500"></div>
        <div className="relative flex items-center bg-background/80 backdrop-blur-xl border border-white/10 rounded-lg px-4 py-3">
          <Search className="w-5 h-5 text-primary mr-3" />
          <Input 
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setIsOpen(true);
            }}
            onFocus={() => setIsOpen(true)}
            placeholder="Search any place in the world..."
            className="flex-1 bg-transparent border-none text-lg text-white placeholder:text-white/40 focus-visible:ring-0 focus-visible:ring-offset-0 px-0 h-auto"
          />
          {isLoading && <Loader2 className="w-5 h-5 text-primary animate-spin" />}
        </div>
      </div>

      {isOpen && debouncedQuery.length > 1 && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-card/95 backdrop-blur-xl border border-white/10 rounded-lg shadow-2xl overflow-hidden z-50">
          {places && places.length > 0 ? (
            <ul className="divide-y divide-white/5">
              {places.map((place) => (
                <li key={place.id}>
                  <button
                    className="w-full text-left px-4 py-3 hover:bg-white/5 flex items-center gap-3 transition-colors"
                    onClick={() => handleSelect(place)}
                  >
                    <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                      <MapPin className="w-4 h-4 text-primary" />
                    </div>
                    <div>
                      <div className="text-white font-medium">{place.name}</div>
                      <div className="text-sm text-white/50">{place.state ? `${place.state}, ` : ""}{place.country}</div>
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          ) : !isLoading ? (
            <div className="px-4 py-6 text-center text-white/50">
              No places found matching "{debouncedQuery}"
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
}
