import React, { useEffect, useRef, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import {
  useGetPlaceLiveData,
  useReadPlaceTimeline,
  useGetPlacePersonality,
  useGetPredictions,
  useComparePlaces,
  useSavePlace,
  useListSavedPlaces,
  useSendChatMessage,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import {
  Search, Layers, X, ChevronDown, Zap, Cloud, Car, Users,
  Smile, Shield, Sparkles, Heart, Star, Clock, Globe,
  MapPin, TrendingUp, Flame, Music, Coffee, Camera,
  TreePine, Briefcase, Bookmark, BookmarkCheck, ChevronRight,
  BarChart2, Loader2, Wind, ArrowRight, Plus, Minus,
  Navigation, Eye, History, Cpu, Activity
} from "lucide-react";

const WORLD_CITIES = [
  { id: "delhi-in", name: "Delhi", country: "India", lat: 28.6139, lng: 77.209, emoji: "🔥", activity: 89 },
  { id: "mumbai-in", name: "Mumbai", country: "India", lat: 19.076, lng: 72.8777, emoji: "⚡", activity: 82 },
  { id: "bangalore-in", name: "Bangalore", country: "India", lat: 12.9716, lng: 77.5946, emoji: "💻", activity: 76 },
  { id: "london-uk", name: "London", country: "UK", lat: 51.5074, lng: -0.1278, emoji: "🌧", activity: 65 },
  { id: "new-york-us", name: "New York", country: "USA", lat: 40.7128, lng: -74.006, emoji: "🔥", activity: 91 },
  { id: "tokyo-jp", name: "Tokyo", country: "Japan", lat: 35.6762, lng: 139.6503, emoji: "🔥", activity: 94 },
  { id: "paris-fr", name: "Paris", country: "France", lat: 48.8566, lng: 2.3522, emoji: "🌹", activity: 71 },
  { id: "dubai-ae", name: "Dubai", country: "UAE", lat: 25.2048, lng: 55.2708, emoji: "⚡", activity: 78 },
  { id: "singapore-sg", name: "Singapore", country: "Singapore", lat: 1.3521, lng: 103.8198, emoji: "🌿", activity: 83 },
  { id: "sydney-au", name: "Sydney", country: "Australia", lat: -33.8688, lng: 151.2093, emoji: "☀️", activity: 69 },
  { id: "cairo-eg", name: "Cairo", country: "Egypt", lat: 30.0444, lng: 31.2357, emoji: "🏛", activity: 74 },
  { id: "seoul-kr", name: "Seoul", country: "South Korea", lat: 37.5665, lng: 126.978, emoji: "🔥", activity: 88 },
  { id: "berlin-de", name: "Berlin", country: "Germany", lat: 52.52, lng: 13.405, emoji: "🎵", activity: 62 },
  { id: "toronto-ca", name: "Toronto", country: "Canada", lat: 43.6532, lng: -79.3832, emoji: "🍁", activity: 67 },
  { id: "sao-paulo-br", name: "São Paulo", country: "Brazil", lat: -23.5505, lng: -46.6333, emoji: "🎉", activity: 80 },
];

const NEARBY_EVENTS = [
  { icon: "🎵", title: "Live Jazz Night", distance: "0.8 km", type: "Music", hot: true },
  { icon: "🍜", title: "Street Food Festival", distance: "1.4 km", type: "Food" },
  { icon: "🎨", title: "Art Exhibition", distance: "2.1 km", type: "Culture" },
  { icon: "🏃", title: "Morning Run Club", distance: "0.3 km", type: "Sports" },
  { icon: "🎭", title: "Theater Show", distance: "3.2 km", type: "Entertainment" },
  { icon: "📸", title: "Photography Walk", distance: "1.9 km", type: "Social" },
];

const MOOD_OPTIONS = [
  { emoji: "😊", label: "Relax", query: "quiet peaceful places to relax" },
  { emoji: "🔥", label: "Energy", query: "vibrant energetic places with nightlife" },
  { emoji: "🍽", label: "Food", query: "best food spots and restaurants" },
  { emoji: "📸", label: "Photos", query: "most photogenic scenic spots" },
  { emoji: "🌿", label: "Nature", query: "parks nature green spaces" },
  { emoji: "💼", label: "Work", query: "quiet cafes coworking spaces for work" },
];

const LAYERS = [
  { id: "pulse", label: "Live Pulse", color: "#00ffff", icon: Activity },
  { id: "crowd", label: "Crowd Heat", color: "#ff6b6b", icon: Users },
  { id: "traffic", label: "Traffic", color: "#ffd700", icon: Car },
  { id: "weather", label: "Weather", color: "#74b9ff", icon: Cloud },
  { id: "events", label: "Events", color: "#a29bfe", icon: Star },
  { id: "historical", label: "Historical", color: "#fdcb6e", icon: History },
  { id: "prediction", label: "Future Prediction", color: "#fd79a8", icon: Cpu },
];

function getActivityColor(activity: number) {
  if (activity >= 85) return "#ff4757";
  if (activity >= 70) return "#ffa502";
  if (activity >= 50) return "#00ffcc";
  return "#74b9ff";
}

function getActivityLabel(activity: number) {
  if (activity >= 85) return "Very Active";
  if (activity >= 70) return "Active";
  if (activity >= 50) return "Moderate";
  return "Quiet";
}

function injectMapStyles() {
  const id = "nexora-map-styles";
  if (document.getElementById(id)) return;
  const style = document.createElement("style");
  style.id = id;
  style.textContent = `
    .nexora-pulse-ring {
      border-radius: 50%;
      position: relative;
    }
    .nexora-pulse-ring::before {
      content: '';
      position: absolute;
      top: 50%; left: 50%;
      transform: translate(-50%, -50%);
      border-radius: 50%;
      animation: nexoraPulse 2.5s ease-out infinite;
    }
    .nexora-pulse-ring::after {
      content: '';
      position: absolute;
      top: 50%; left: 50%;
      transform: translate(-50%, -50%);
      border-radius: 50%;
      animation: nexoraPulse 2.5s ease-out 1.2s infinite;
    }
    @keyframes nexoraPulse {
      0% { width: 6px; height: 6px; opacity: 0.8; border: 2px solid currentColor; }
      100% { width: 40px; height: 40px; opacity: 0; border: 1px solid currentColor; }
    }
    .nexora-marker-dot {
      width: 10px; height: 10px;
      border-radius: 50%;
      border: 2px solid white;
      position: absolute;
      top: 50%; left: 50%;
      transform: translate(-50%, -50%);
    }
    .leaflet-container { background: #07111f !important; }
    .time-slider-thumb::-webkit-slider-thumb {
      -webkit-appearance: none;
      width: 18px; height: 18px;
      border-radius: 50%;
      background: #00ffcc;
      cursor: pointer;
      box-shadow: 0 0 10px #00ffcc80;
    }
    .time-slider-thumb::-moz-range-thumb {
      width: 18px; height: 18px;
      border-radius: 50%;
      background: #00ffcc;
      cursor: pointer;
      border: none;
      box-shadow: 0 0 10px #00ffcc80;
    }
  `;
  document.head.appendChild(style);
}

function createCityIcon(city: typeof WORLD_CITIES[0], selected: boolean) {
  const color = getActivityColor(city.activity);
  const size = selected ? 16 : 10;
  return L.divIcon({
    html: `
      <div style="position:relative;width:${size}px;height:${size}px;">
        <div class="nexora-pulse-ring" style="color:${color};width:${size}px;height:${size}px;"></div>
        <div class="nexora-marker-dot" style="background:${color};width:${size}px;height:${size}px;top:0;left:0;transform:none;"></div>
      </div>
    `,
    className: "",
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
  });
}

export default function MapDashboard() {
  const mapRef = useRef<HTMLDivElement>(null);
  const leafletMapRef = useRef<L.Map | null>(null);
  const markersRef = useRef<Map<string, L.Marker>>(new Map());
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const [selectedCity, setSelectedCity] = useState<typeof WORLD_CITIES[0] | null>(null);
  const [showPanel, setShowPanel] = useState(false);
  const [showLayers, setShowLayers] = useState(false);
  const [showAIExplore, setShowAIExplore] = useState(false);
  const [showCompare, setShowCompare] = useState(false);
  const [activeLayers, setActiveLayers] = useState<Set<string>>(new Set(["pulse"]));
  const [timeValue, setTimeValue] = useState(18);
  const [heatmapMode, setHeatmapMode] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchFocused, setSearchFocused] = useState(false);
  const [aiSearchResult, setAiSearchResult] = useState<string | null>(null);
  const [aiSearching, setAiSearching] = useState(false);
  const [compareCity, setCompareCity] = useState<typeof WORLD_CITIES[0] | null>(null);
  const [viewMode, setViewMode] = useState<"live" | "historical" | "future">("live");
  const heatCirclesRef = useRef<L.CircleMarker[]>([]);

  const placeId = selectedCity?.id || "";

  const { data: liveData, isLoading: loadingLive } = useGetPlaceLiveData(placeId, {
    query: { enabled: !!placeId }
  });
  const { data: personality, isLoading: loadingPersonality } = useGetPlacePersonality(placeId, {
    query: { enabled: !!placeId }
  });
  const { data: predictions } = useGetPredictions(placeId, {
    query: { enabled: !!placeId && viewMode === "future" }
  });
  const { data: comparison } = useComparePlaces(
    { city1: selectedCity?.id || "", city2: compareCity?.id || "" },
    { query: { enabled: !!(selectedCity && compareCity && showCompare) } }
  );
  const { data: savedPlaces } = useListSavedPlaces();
  const saveMutation = useSavePlace();
  const chatMutation = useSendChatMessage();

  const isSaved = savedPlaces?.some(p => p.placeId === selectedCity?.id);

  useEffect(() => {
    injectMapStyles();
    if (!mapRef.current || leafletMapRef.current) return;

    const map = L.map(mapRef.current, {
      zoomControl: false,
      attributionControl: false,
      minZoom: 2,
      maxZoom: 18,
    }).setView([20, 10], 2.5);

    L.tileLayer("https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png", {
      subdomains: "abcd",
      maxZoom: 20,
    }).addTo(map);

    L.control.zoom({ position: "bottomleft" }).addTo(map);

    WORLD_CITIES.forEach(city => {
      const marker = L.marker([city.lat, city.lng], {
        icon: createCityIcon(city, false),
      }).addTo(map);

      marker.on("click", () => {
        setSelectedCity(city);
        setShowPanel(true);
        setShowCompare(false);
        map.flyTo([city.lat, city.lng], 11, { duration: 1.5 });
      });

      markersRef.current.set(city.id, marker);
    });

    leafletMapRef.current = map;

    return () => {
      map.remove();
      leafletMapRef.current = null;
    };
  }, []);

  useEffect(() => {
    const map = leafletMapRef.current;
    if (!map) return;

    heatCirclesRef.current.forEach(c => c.remove());
    heatCirclesRef.current = [];

    if (heatmapMode) {
      WORLD_CITIES.forEach(city => {
        const color = getActivityColor(city.activity);
        const circle = L.circleMarker([city.lat, city.lng], {
          radius: 30 + city.activity / 4,
          fillColor: color,
          color: "transparent",
          fillOpacity: 0.18,
        }).addTo(map);
        heatCirclesRef.current.push(circle);
      });
    }
  }, [heatmapMode]);

  useEffect(() => {
    markersRef.current.forEach((marker, id) => {
      const city = WORLD_CITIES.find(c => c.id === id);
      if (city) {
        marker.setIcon(createCityIcon(city, selectedCity?.id === id));
      }
    });
  }, [selectedCity]);

  const handleSave = useCallback(async () => {
    if (!selectedCity || isSaved || saveMutation.isPending) return;
    try {
      await saveMutation.mutateAsync({
        data: {
          placeId: selectedCity.id,
          placeName: selectedCity.name,
          country: selectedCity.country,
          lat: selectedCity.lat,
          lng: selectedCity.lng,
        },
      });
      queryClient.invalidateQueries({ queryKey: ["/api/places/saved"] });
      toast({ title: `${selectedCity.name} saved!` });
    } catch {
      toast({ title: "Error saving place", variant: "destructive" });
    }
  }, [selectedCity, isSaved, saveMutation, queryClient, toast]);

  const handleAISearch = useCallback(async (query: string) => {
    if (!query.trim()) return;
    setAiSearching(true);
    setAiSearchResult(null);
    try {
      const result = await chatMutation.mutateAsync({
        data: {
          message: `Explore Map Query: ${query}. Give a short 2-sentence intelligent answer about places or cities related to this query. Focus on specific city recommendations.`,
          sessionId: "explore-map",
        },
      });
      setAiSearchResult((result as any)?.message || "No results found.");
    } catch {
      setAiSearchResult("AI is momentarily unavailable. Try again.");
    } finally {
      setAiSearching(false);
    }
  }, [chatMutation]);

  const handleMoodExplore = useCallback((mood: typeof MOOD_OPTIONS[0]) => {
    setShowAIExplore(false);
    handleAISearch(mood.query);
    setSearchQuery(mood.query);
  }, [handleAISearch]);

  const timeLabel = (v: number) => {
    if (v === 0) return "12 AM";
    if (v < 12) return `${v} AM`;
    if (v === 12) return "12 PM";
    return `${v - 12} PM`;
  };

  const filteredCities = WORLD_CITIES.filter(c =>
    c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.country.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="relative w-full h-full overflow-hidden" style={{ background: "#07111f" }}>
      <div ref={mapRef} className="absolute inset-0 z-0" />

      {/* ── FLOATING SEARCH BAR ── */}
      <div className="absolute top-4 left-1/2 -translate-x-1/2 z-30 w-full max-w-xl px-4">
        <motion.div
          animate={{ boxShadow: searchFocused ? "0 0 0 2px #00ffcc60, 0 8px 32px #00000080" : "0 4px 24px #00000060" }}
          className="relative"
        >
          <div className="flex items-center gap-3 bg-[#0d1f33]/90 backdrop-blur-xl border border-white/10 rounded-2xl px-4 py-3">
            <Search className="w-4 h-4 text-cyan-400 flex-shrink-0" />
            <input
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              onFocus={() => setSearchFocused(true)}
              onBlur={() => setTimeout(() => setSearchFocused(false), 150)}
              onKeyDown={e => { if (e.key === "Enter") handleAISearch(searchQuery); }}
              placeholder="Ask Nexora anything about a place..."
              className="flex-1 bg-transparent text-white placeholder-white/30 text-sm outline-none"
            />
            {aiSearching && <Loader2 className="w-4 h-4 text-cyan-400 animate-spin" />}
            {searchQuery && !aiSearching && (
              <button
                onMouseDown={() => handleAISearch(searchQuery)}
                className="text-xs px-2 py-1 rounded-lg bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 hover:bg-cyan-500/30 transition-all"
              >
                Ask AI
              </button>
            )}
          </div>

          <AnimatePresence>
            {searchFocused && searchQuery && (
              <motion.div
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                className="absolute top-full mt-2 left-0 right-0 bg-[#0d1f33]/95 backdrop-blur-xl border border-white/10 rounded-xl overflow-hidden"
              >
                {filteredCities.slice(0, 5).map(city => (
                  <button
                    key={city.id}
                    onMouseDown={() => {
                      setSelectedCity(city);
                      setShowPanel(true);
                      setSearchQuery("");
                      leafletMapRef.current?.flyTo([city.lat, city.lng], 11, { duration: 1.5 });
                    }}
                    className="w-full flex items-center gap-3 px-4 py-3 hover:bg-white/5 transition-all text-left"
                  >
                    <span>{city.emoji}</span>
                    <div className="flex-1">
                      <div className="text-sm font-medium text-white">{city.name}</div>
                      <div className="text-xs text-white/40">{city.country}</div>
                    </div>
                    <div className="text-xs font-bold" style={{ color: getActivityColor(city.activity) }}>
                      {city.activity}%
                    </div>
                  </button>
                ))}
                {filteredCities.length === 0 && (
                  <div className="px-4 py-3 text-sm text-white/40">Press Enter to ask Nexora AI →</div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        <AnimatePresence>
          {aiSearchResult && (
            <motion.div
              initial={{ opacity: 0, y: -8, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -8, scale: 0.97 }}
              className="mt-2 bg-[#0d1f33]/95 backdrop-blur-xl border border-cyan-500/20 rounded-2xl p-4"
            >
              <div className="flex items-start gap-3">
                <Sparkles className="w-4 h-4 text-cyan-400 mt-0.5 flex-shrink-0" />
                <div>
                  <div className="text-xs text-cyan-400 font-semibold mb-1">Nexora AI</div>
                  <div className="text-sm text-white/80 leading-relaxed">{aiSearchResult}</div>
                </div>
                <button onClick={() => setAiSearchResult(null)} className="text-white/30 hover:text-white/60 ml-auto flex-shrink-0">
                  <X className="w-4 h-4" />
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ── VIEW MODE TOGGLE ── */}
      <div className="absolute top-4 left-4 z-30">
        <div className="flex flex-col gap-2 bg-[#0d1f33]/90 backdrop-blur-xl border border-white/10 rounded-2xl p-1.5">
          {(["live", "historical", "future"] as const).map(mode => (
            <button
              key={mode}
              onClick={() => setViewMode(mode)}
              className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold transition-all ${viewMode === mode ? "bg-cyan-500/20 text-cyan-400 border border-cyan-500/30" : "text-white/40 hover:text-white/70 hover:bg-white/5"}`}
            >
              {mode === "live" && <Activity className="w-3 h-3" />}
              {mode === "historical" && <History className="w-3 h-3" />}
              {mode === "future" && <Cpu className="w-3 h-3" />}
              <span className="capitalize">{mode}</span>
            </button>
          ))}
        </div>
      </div>

      {/* ── LAYERS BUTTON ── */}
      <div className="absolute top-4 right-4 z-30 flex flex-col gap-2">
        <button
          onClick={() => setShowLayers(v => !v)}
          className="flex items-center gap-2 px-4 py-2.5 bg-[#0d1f33]/90 backdrop-blur-xl border border-white/10 rounded-xl text-sm font-semibold text-white/70 hover:text-white hover:border-cyan-500/40 transition-all"
        >
          <Layers className="w-4 h-4" />
          Layers
        </button>

        <AnimatePresence>
          {showLayers && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: -8 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -8 }}
              className="bg-[#0d1f33]/95 backdrop-blur-xl border border-white/10 rounded-2xl p-4 w-52"
            >
              <div className="text-xs font-bold text-white/40 uppercase tracking-widest mb-3">Map Layers</div>
              <div className="space-y-1">
                {LAYERS.map(layer => {
                  const Icon = layer.icon;
                  const active = activeLayers.has(layer.id);
                  return (
                    <button
                      key={layer.id}
                      onClick={() => {
                        setActiveLayers(prev => {
                          const next = new Set(prev);
                          if (next.has(layer.id)) next.delete(layer.id);
                          else next.add(layer.id);
                          if (layer.id === "crowd") setHeatmapMode(!active);
                          return next;
                        });
                      }}
                      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all ${active ? "bg-white/8 text-white" : "text-white/40 hover:bg-white/5 hover:text-white/70"}`}
                    >
                      <div className={`w-2 h-2 rounded-full flex-shrink-0 ${active ? "shadow-[0_0_6px_currentColor]" : ""}`}
                        style={{ background: active ? layer.color : "#ffffff20", color: layer.color }} />
                      <Icon className="w-3.5 h-3.5" style={{ color: active ? layer.color : undefined }} />
                      <span className="font-medium">{layer.label}</span>
                    </button>
                  );
                })}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ── LOCATION INTELLIGENCE PANEL ── */}
      <AnimatePresence>
        {showPanel && selectedCity && (
          <motion.div
            initial={{ x: "100%", opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: "100%", opacity: 0 }}
            transition={{ type: "spring", damping: 28, stiffness: 280 }}
            className="absolute right-0 top-0 bottom-0 w-[360px] z-20 flex flex-col"
            style={{ background: "linear-gradient(180deg, #0b1929 0%, #07111f 100%)", borderLeft: "1px solid rgba(255,255,255,0.07)" }}
          >
            <div className="flex items-center justify-between p-5 border-b border-white/5">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full flex items-center justify-center text-lg"
                  style={{ background: `${getActivityColor(selectedCity.activity)}20`, border: `1px solid ${getActivityColor(selectedCity.activity)}40` }}>
                  {selectedCity.emoji}
                </div>
                <div>
                  <div className="text-lg font-bold text-white leading-tight">{selectedCity.name}</div>
                  <div className="text-xs text-white/40 flex items-center gap-1">
                    <MapPin className="w-3 h-3" />{selectedCity.country}
                  </div>
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={handleSave}
                  disabled={isSaved || saveMutation.isPending}
                  className={`p-2 rounded-lg border transition-all ${isSaved ? "bg-cyan-500/20 border-cyan-500/40 text-cyan-400" : "border-white/10 text-white/40 hover:text-white hover:border-white/30"}`}
                >
                  {isSaved ? <BookmarkCheck className="w-4 h-4" /> : <Bookmark className="w-4 h-4" />}
                </button>
                <button onClick={() => setShowPanel(false)} className="p-2 rounded-lg border border-white/10 text-white/40 hover:text-white hover:border-white/30 transition-all">
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto">
              {/* Activity Score */}
              <div className="p-5 border-b border-white/5">
                <div className="text-xs font-bold text-white/30 uppercase tracking-widest mb-3 flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-red-400 animate-pulse" />
                  Live Activity
                </div>
                <div className="mb-2 flex items-end justify-between">
                  <div className="text-4xl font-black text-white">{selectedCity.activity}<span className="text-lg text-white/40">%</span></div>
                  <div className="text-sm font-semibold px-2 py-1 rounded-lg" style={{ color: getActivityColor(selectedCity.activity), background: `${getActivityColor(selectedCity.activity)}15` }}>
                    {getActivityLabel(selectedCity.activity)}
                  </div>
                </div>
                <div className="h-2 rounded-full bg-white/5 overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${selectedCity.activity}%` }}
                    transition={{ duration: 1, ease: "easeOut" }}
                    className="h-full rounded-full"
                    style={{ background: `linear-gradient(90deg, ${getActivityColor(selectedCity.activity)}99, ${getActivityColor(selectedCity.activity)})` }}
                  />
                </div>
              </div>

              {/* AI Summary */}
              <div className="p-5 border-b border-white/5">
                <div className="text-xs font-bold text-white/30 uppercase tracking-widest mb-3 flex items-center gap-2">
                  <Sparkles className="w-3 h-3 text-cyan-400" />
                  AI Summary
                </div>
                {loadingPersonality ? (
                  <div className="space-y-2">
                    {[70, 90, 60].map((w, i) => (
                      <div key={i} className="h-3 rounded bg-white/5 animate-pulse" style={{ width: `${w}%` }} />
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-white/65 leading-relaxed italic">
                    "{(personality as any)?.summary || `${selectedCity.name} is currently ${getActivityLabel(selectedCity.activity).toLowerCase()} with dynamic urban energy across the city. A ${selectedCity.emoji} kind of place right now.`}"
                  </p>
                )}
              </div>

              {/* Live Signals */}
              <div className="p-5 border-b border-white/5">
                <div className="text-xs font-bold text-white/30 uppercase tracking-widest mb-3">Current Signals</div>
                {loadingLive ? (
                  <div className="grid grid-cols-2 gap-2">
                    {[...Array(4)].map((_, i) => (
                      <div key={i} className="h-16 rounded-xl bg-white/5 animate-pulse" />
                    ))}
                  </div>
                ) : liveData ? (
                  <div className="grid grid-cols-2 gap-2">
                    <SignalCard icon={Car} label="Traffic" value={(liveData as any).traffic?.level || "N/A"} color="#ffd700" />
                    <SignalCard icon={Users} label="Crowd" value={(liveData as any).crowd?.level || "N/A"} color="#00ffcc" />
                    <SignalCard icon={Cloud} label="Weather" value={`${(liveData as any).weather?.temperature || "--"}°C`} color="#74b9ff" />
                    <SignalCard icon={Star} label="Events" value="3 Nearby" color="#a29bfe" />
                    <SignalCard icon={Shield} label="Safety" value={`${(liveData as any).safety?.score || "--"}/100`} color="#55efc4" />
                    <SignalCard icon={Smile} label="Mood" value={(liveData as any).mood?.sentiment || "N/A"} color="#fd79a8" />
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-2">
                    <SignalCard icon={Car} label="Traffic" value="High" color="#ffd700" />
                    <SignalCard icon={Users} label="Crowd" value="Busy" color="#00ffcc" />
                    <SignalCard icon={Cloud} label="Weather" value="Pleasant" color="#74b9ff" />
                    <SignalCard icon={Star} label="Events" value="3 Nearby" color="#a29bfe" />
                  </div>
                )}
              </div>

              {/* Future Prediction (when future mode) */}
              {viewMode === "future" && (
                <div className="p-5 border-b border-white/5">
                  <div className="text-xs font-bold text-white/30 uppercase tracking-widest mb-3 flex items-center gap-2">
                    <Cpu className="w-3 h-3 text-pink-400" />
                    AI Prediction — Next 2 Hours
                  </div>
                  {predictions ? (
                    <div className="space-y-2">
                      {(predictions as any)?.predictions?.slice(0, 4).map((p: any, i: number) => (
                        <div key={i} className="flex items-center justify-between text-sm">
                          <span className="text-white/50 capitalize">{p.metric}</span>
                          <span className={`font-semibold ${p.direction === "up" ? "text-red-400" : "text-green-400"}`}>
                            {p.direction === "up" ? "↑" : "↓"} {p.value}
                          </span>
                        </div>
                      )) || (
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between"><span className="text-white/50">Crowd</span><span className="text-red-400">↑ +15%</span></div>
                          <div className="flex justify-between"><span className="text-white/50">Traffic</span><span className="text-red-400">↑ Heavy</span></div>
                          <div className="flex justify-between"><span className="text-white/50">Rain</span><span className="text-green-400">↓ Clear</span></div>
                          <div className="flex justify-between mt-1 pt-2 border-t border-white/5">
                            <span className="text-white/30 text-xs">Confidence</span>
                            <span className="text-pink-400 text-xs font-bold">89%</span>
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between"><span className="text-white/50">Crowd</span><span className="text-red-400">↑ +15%</span></div>
                      <div className="flex justify-between"><span className="text-white/50">Traffic</span><span className="text-red-400">↑ Heavy</span></div>
                      <div className="flex justify-between"><span className="text-white/50">Rain</span><span className="text-green-400">↓ Clear</span></div>
                      <div className="flex justify-between mt-1 pt-2 border-t border-white/5">
                        <span className="text-white/30 text-xs">AI Confidence</span>
                        <span className="text-pink-400 text-xs font-bold">89%</span>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* AI Score Card */}
              <div className="p-5 border-b border-white/5">
                <div className="text-xs font-bold text-white/30 uppercase tracking-widest mb-3">AI Place Score</div>
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-full border-2 border-cyan-500/40 flex flex-col items-center justify-center"
                    style={{ background: "linear-gradient(135deg, #00ffcc15, #00b5ad10)" }}>
                    <div className="text-xl font-black text-cyan-400">
                      {Math.round(selectedCity.activity * 0.9 + 8)}
                    </div>
                    <div className="text-xs text-white/30">/100</div>
                  </div>
                  <div className="flex-1 space-y-1.5">
                    {[["Vibe", 88], ["Safety", 74], ["Access", 91]].map(([label, val]) => (
                      <div key={label} className="flex items-center gap-2">
                        <div className="text-xs text-white/40 w-14">{label}</div>
                        <div className="flex-1 h-1 rounded-full bg-white/5">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${val}%` }}
                            transition={{ duration: 0.8, delay: 0.2 }}
                            className="h-full rounded-full bg-gradient-to-r from-cyan-500 to-blue-500"
                          />
                        </div>
                        <div className="text-xs text-white/50 w-6 text-right">{val}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Compare Mode */}
              <div className="p-5">
                <button
                  onClick={() => setShowCompare(v => !v)}
                  className="w-full flex items-center justify-between text-sm font-semibold text-white/50 hover:text-white transition-all"
                >
                  <div className="flex items-center gap-2">
                    <BarChart2 className="w-4 h-4" />
                    Compare with another city
                  </div>
                  <ChevronDown className={`w-4 h-4 transition-transform ${showCompare ? "rotate-180" : ""}`} />
                </button>

                <AnimatePresence>
                  {showCompare && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden"
                    >
                      <div className="mt-3 grid grid-cols-2 gap-2">
                        {WORLD_CITIES.filter(c => c.id !== selectedCity.id).slice(0, 6).map(city => (
                          <button
                            key={city.id}
                            onClick={() => setCompareCity(city)}
                            className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs transition-all border ${compareCity?.id === city.id ? "border-cyan-500/40 bg-cyan-500/10 text-cyan-400" : "border-white/10 text-white/50 hover:border-white/20 hover:text-white"}`}
                          >
                            <span>{city.emoji}</span>
                            <span className="truncate">{city.name}</span>
                          </button>
                        ))}
                      </div>

                      {compareCity && comparison && (
                        <motion.div
                          initial={{ opacity: 0, y: 8 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="mt-3 p-3 bg-white/5 rounded-xl border border-white/5 text-sm"
                        >
                          <div className="font-bold text-white mb-2 text-center">
                            {selectedCity.name} vs {compareCity.name}
                          </div>
                          <div className="text-xs text-white/50 leading-relaxed">
                            {(comparison as any)?.comparison || `${selectedCity.name} (${selectedCity.activity}% active) vs ${compareCity.name} (${compareCity.activity}% active). ${selectedCity.activity > compareCity.activity ? selectedCity.name : compareCity.name} has higher energy right now.`}
                          </div>
                        </motion.div>
                      )}
                      {compareCity && !comparison && (
                        <div className="mt-3 p-3 bg-white/5 rounded-xl border border-white/5 text-xs text-white/50 text-center">
                          <div className="font-semibold text-white mb-1">{selectedCity.name} vs {compareCity.name}</div>
                          <div className="flex justify-between mt-2">
                            <div className="text-center">
                              <div className="text-lg font-bold" style={{ color: getActivityColor(selectedCity.activity) }}>{selectedCity.activity}%</div>
                              <div className="text-white/40">{selectedCity.name}</div>
                            </div>
                            <div className="text-white/20 self-center">vs</div>
                            <div className="text-center">
                              <div className="text-lg font-bold" style={{ color: getActivityColor(compareCity.activity) }}>{compareCity.activity}%</div>
                              <div className="text-white/40">{compareCity.name}</div>
                            </div>
                          </div>
                        </div>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── AI EXPLORE BUTTON ── */}
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.97 }}
        onClick={() => setShowAIExplore(true)}
        className="absolute left-1/2 -translate-x-1/2 bottom-36 z-30 flex items-center gap-2.5 px-6 py-3 rounded-2xl font-bold text-sm text-[#07111f]"
        style={{ background: "linear-gradient(135deg, #00ffcc, #0099ff)", boxShadow: "0 0 30px #00ffcc50, 0 4px 20px #00000050" }}
      >
        <Sparkles className="w-4 h-4" />
        Explore with AI
      </motion.button>

      {/* ── AI EXPLORE MODAL ── */}
      <AnimatePresence>
        {showAIExplore && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-50 flex items-center justify-center"
            style={{ background: "rgba(7,17,31,0.85)", backdropFilter: "blur(8px)" }}
            onClick={() => setShowAIExplore(false)}
          >
            <motion.div
              initial={{ scale: 0.92, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.92, y: 20 }}
              onClick={e => e.stopPropagation()}
              className="bg-[#0d1f33] border border-white/10 rounded-3xl p-8 max-w-md w-full mx-4"
              style={{ boxShadow: "0 0 60px #00ffcc15, 0 20px 60px #00000080" }}
            >
              <div className="text-center mb-6">
                <div className="w-12 h-12 rounded-2xl mx-auto mb-3 flex items-center justify-center"
                  style={{ background: "linear-gradient(135deg, #00ffcc20, #0099ff20)", border: "1px solid #00ffcc30" }}>
                  <Sparkles className="w-6 h-6 text-cyan-400" />
                </div>
                <div className="text-xl font-bold text-white mb-1">Explore with AI</div>
                <div className="text-sm text-white/40">Find places matching your mood</div>
              </div>

              <div className="grid grid-cols-3 gap-3 mb-6">
                {MOOD_OPTIONS.map(mood => (
                  <button
                    key={mood.label}
                    onClick={() => handleMoodExplore(mood)}
                    className="flex flex-col items-center gap-2 p-4 rounded-2xl border border-white/10 hover:border-cyan-500/40 hover:bg-cyan-500/5 transition-all group"
                  >
                    <span className="text-2xl group-hover:scale-110 transition-transform">{mood.emoji}</span>
                    <span className="text-xs font-semibold text-white/60 group-hover:text-white transition-colors">{mood.label}</span>
                  </button>
                ))}
              </div>

              <div className="flex gap-2">
                <input
                  autoFocus
                  placeholder="Or describe what you're looking for..."
                  className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-white/30 outline-none focus:border-cyan-500/40"
                  onKeyDown={e => {
                    if (e.key === "Enter" && (e.target as HTMLInputElement).value) {
                      handleMoodExplore({ emoji: "🔍", label: "Custom", query: (e.target as HTMLInputElement).value });
                    }
                  }}
                />
                <button
                  onClick={() => setShowAIExplore(false)}
                  className="p-3 rounded-xl border border-white/10 text-white/40 hover:text-white hover:border-white/30 transition-all"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── TIME SLIDER ── */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-30 w-full max-w-2xl px-4"
        style={{ paddingRight: showPanel ? "calc(360px + 1rem)" : undefined }}>
        <div className="bg-[#0d1f33]/90 backdrop-blur-xl border border-white/10 rounded-2xl px-6 py-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2 text-xs font-bold text-white/40 uppercase tracking-widest">
              <Clock className="w-3 h-3" />
              Time Explorer
            </div>
            <div className="text-sm font-bold text-cyan-400">{timeLabel(timeValue)}</div>
          </div>
          <div className="relative">
            <input
              type="range"
              min={0}
              max={23}
              value={timeValue}
              onChange={e => setTimeValue(Number(e.target.value))}
              className="time-slider-thumb w-full h-1.5 rounded-full outline-none appearance-none cursor-pointer"
              style={{
                background: `linear-gradient(to right, #00ffcc ${(timeValue / 23) * 100}%, rgba(255,255,255,0.1) ${(timeValue / 23) * 100}%)`
              }}
            />
            <div className="flex justify-between mt-2 text-xs text-white/20">
              <span>12 AM</span>
              <span>6 AM</span>
              <span>12 PM</span>
              <span>6 PM</span>
              <span className="text-cyan-400 font-semibold">NOW</span>
            </div>
          </div>
          <div className="mt-3 text-xs text-white/30 text-center">
            {timeValue < 7 ? "🌙 City is sleeping" :
             timeValue < 10 ? "☕ Morning rush starting" :
             timeValue < 14 ? "🌞 Peak midday activity" :
             timeValue < 18 ? "🏃 Afternoon momentum" :
             timeValue < 22 ? "🔥 Evening energy — restaurants busy" :
             "🌃 Night crowd building"}
          </div>
        </div>
      </div>

      {/* ── NEARBY EVENTS CARDS ── */}
      <div className="absolute bottom-28 left-4 z-30" style={{ right: showPanel ? "376px" : "1rem" }}>
        <div className="flex items-center gap-2 mb-2 px-1">
          <Flame className="w-3.5 h-3.5 text-orange-400" />
          <span className="text-xs font-bold text-white/40 uppercase tracking-widest">Trending Nearby</span>
        </div>
        <div className="flex gap-3 overflow-x-auto pb-1" style={{ scrollbarWidth: "none" }}>
          {NEARBY_EVENTS.map((ev, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.07 }}
              className="flex-shrink-0 bg-[#0d1f33]/90 backdrop-blur-xl border border-white/10 rounded-2xl px-4 py-3 min-w-[160px] hover:border-white/20 transition-all cursor-pointer group"
            >
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xl">{ev.icon}</span>
                {ev.hot && (
                  <span className="text-xs px-1.5 py-0.5 rounded-full bg-orange-500/20 text-orange-400 font-bold">HOT</span>
                )}
              </div>
              <div className="text-sm font-semibold text-white leading-tight">{ev.title}</div>
              <div className="text-xs text-white/30 mt-1 flex items-center gap-1">
                <Navigation className="w-2.5 h-2.5" />
                {ev.distance}
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* ── MINI WORLD PULSE ── */}
      <div className="absolute bottom-4 right-4 z-30" style={{ right: showPanel ? "376px" : "1rem" }}>
        <div className="bg-[#0d1f33]/90 backdrop-blur-xl border border-white/10 rounded-2xl p-4 w-52">
          <div className="flex items-center gap-2 mb-3">
            <Globe className="w-3.5 h-3.5 text-cyan-400" />
            <span className="text-xs font-bold text-white/40 uppercase tracking-widest">World Pulse</span>
          </div>
          <div className="space-y-2">
            {WORLD_CITIES.sort((a, b) => b.activity - a.activity).slice(0, 5).map(city => (
              <button
                key={city.id}
                onClick={() => {
                  setSelectedCity(city);
                  setShowPanel(true);
                  leafletMapRef.current?.flyTo([city.lat, city.lng], 11, { duration: 1.5 });
                }}
                className="w-full flex items-center gap-2 hover:bg-white/5 rounded-lg px-1 py-0.5 transition-all group"
              >
                <span className="text-sm">{city.emoji}</span>
                <span className="text-xs text-white/60 flex-1 text-left group-hover:text-white transition-colors">{city.name}</span>
                <div className="flex items-center gap-1">
                  <div className="w-12 h-1 rounded-full bg-white/5 overflow-hidden">
                    <div className="h-full rounded-full" style={{ width: `${city.activity}%`, background: getActivityColor(city.activity) }} />
                  </div>
                  <span className="text-xs font-bold w-6 text-right" style={{ color: getActivityColor(city.activity) }}>
                    {city.activity}
                  </span>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── HEATMAP TOGGLE ── */}
      <div className="absolute bottom-28 right-4 z-30" style={{ right: showPanel ? "376px" : "1rem" }}>
        <button
          onClick={() => setHeatmapMode(v => !v)}
          className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold border transition-all ${heatmapMode ? "bg-red-500/20 border-red-500/40 text-red-400" : "bg-[#0d1f33]/90 border-white/10 text-white/40 hover:text-white hover:border-white/20"} backdrop-blur-xl`}
        >
          <Flame className="w-3.5 h-3.5" />
          {heatmapMode ? "Heatmap ON" : "Heatmap"}
        </button>
      </div>

      {/* ── NO CITY SELECTED HINT ── */}
      <AnimatePresence>
        {!showPanel && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ delay: 0.5 }}
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-10 pointer-events-none text-center"
          >
            <div className="bg-[#0d1f33]/70 backdrop-blur-xl border border-white/5 rounded-3xl px-8 py-6">
              <div className="text-4xl mb-3">🌍</div>
              <div className="text-lg font-bold text-white/60">A Living Earth Interface</div>
              <div className="text-sm text-white/30 mt-1">Click any city to explore its pulse</div>
              <div className="flex gap-2 justify-center mt-4">
                {WORLD_CITIES.slice(0, 4).map(c => (
                  <div key={c.id} className="text-xs px-2 py-1 rounded-full bg-white/5 text-white/30">{c.emoji} {c.name}</div>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function SignalCard({ icon: Icon, label, value, color }: { icon: React.ElementType; label: string; value: string; color: string }) {
  return (
    <div className="bg-white/4 border border-white/5 rounded-xl p-3 hover:bg-white/6 transition-all">
      <div className="flex items-center gap-1.5 mb-2">
        <Icon className="w-3 h-3" style={{ color }} />
        <span className="text-xs text-white/30 uppercase tracking-wider font-semibold">{label}</span>
      </div>
      <div className="text-sm font-bold text-white capitalize leading-tight">{value}</div>
    </div>
  );
}
