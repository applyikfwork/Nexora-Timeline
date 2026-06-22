import React, { useEffect, useRef, useState } from "react";
import { useAppContext } from "@/lib/store";
import { useGetPlaceLiveData, useReadPlaceTimeline, useSavePlace, useListSavedPlaces } from "@workspace/api-client-react";
import { Loader2, Wind, Car, Users, VolumeX, Shield, Smile, Bookmark, BookmarkCheck } from "lucide-react";
import { motion } from "framer-motion";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";

export default function MapDashboard() {
  const { selectedPlace } = useAppContext();
  const mapRef = useRef<HTMLDivElement>(null);
  const leafletMapRef = useRef<L.Map | null>(null);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: liveData, isLoading: loadingLive } = useGetPlaceLiveData(selectedPlace?.id || "", {
    query: { enabled: !!selectedPlace?.id, queryKey: ["liveData", selectedPlace?.id] }
  });
  const { data: timeline, isLoading: loadingTimeline } = useReadPlaceTimeline(selectedPlace?.id || "", {}, {
    query: { enabled: !!selectedPlace?.id, queryKey: ["timeline", selectedPlace?.id] }
  });

  const { data: savedPlaces } = useListSavedPlaces();
  const saveMutation = useSavePlace();

  const isSaved = savedPlaces?.some(p => p.placeId === selectedPlace?.id);

  useEffect(() => {
    if (!mapRef.current) return;

    if (!leafletMapRef.current) {
      leafletMapRef.current = L.map(mapRef.current, {
        zoomControl: false,
        attributionControl: false,
      }).setView([20, 0], 2);

      L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
        subdomains: 'abcd',
        maxZoom: 20
      }).addTo(leafletMapRef.current);
    }

    if (selectedPlace && leafletMapRef.current) {
      leafletMapRef.current.setView([selectedPlace.lat, selectedPlace.lng], 13);
      L.circleMarker([selectedPlace.lat, selectedPlace.lng], {
        radius: 8,
        fillColor: "#00ffff",
        color: "#fff",
        weight: 1,
        opacity: 1,
        fillOpacity: 0.8
      }).addTo(leafletMapRef.current);
    }
  }, [selectedPlace]);

  const handleSave = async () => {
    if (!selectedPlace || isSaved || saveMutation.isPending) return;
    try {
      await saveMutation.mutateAsync({
        data: {
          placeId: selectedPlace.id,
          placeName: selectedPlace.name,
          country: selectedPlace.country,
          lat: selectedPlace.lat,
          lng: selectedPlace.lng
        }
      });
      queryClient.invalidateQueries({ queryKey: ["/api/places/saved"] });
      toast({
        title: "Place saved",
        description: `${selectedPlace.name} has been added to your saved places.`
      });
    } catch (e) {
      toast({
        title: "Error",
        description: "Failed to save place",
        variant: "destructive"
      });
    }
  };

  if (!selectedPlace) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center h-full text-center p-8">
        <GlobeIcon className="w-16 h-16 text-primary/30 mb-4 animate-pulse" />
        <h2 className="text-2xl font-semibold text-white mb-2">No Location Selected</h2>
        <p className="text-white/50">Search for a place in the sidebar or home page to begin exploration.</p>
      </div>
    );
  }

  return (
    <div className="flex h-[calc(100vh)] w-full overflow-hidden bg-background">
      <div className="flex-1 relative">
        <div ref={mapRef} className="absolute inset-0 z-0 bg-muted/20" />
        
        <div className="absolute top-0 left-0 right-0 p-6 z-10 bg-gradient-to-b from-background/80 to-transparent pointer-events-none flex justify-between items-start">
          <div>
            <h1 className="text-4xl font-bold text-white tracking-tight drop-shadow-lg">{selectedPlace.name}</h1>
            <p className="text-lg text-white/80">{selectedPlace.country}</p>
          </div>
          <button 
            onClick={handleSave}
            disabled={isSaved || saveMutation.isPending}
            className={`pointer-events-auto flex items-center gap-2 px-4 py-2 rounded-lg border backdrop-blur-md transition-all ${
              isSaved 
                ? 'bg-secondary/20 border-secondary/50 text-secondary' 
                : 'bg-card/50 border-white/10 text-white hover:bg-white/10'
            }`}
          >
            {isSaved ? <BookmarkCheck className="w-5 h-5" /> : <Bookmark className="w-5 h-5" />}
            <span className="font-medium">{isSaved ? 'Saved' : 'Save Place'}</span>
          </button>
        </div>

        <div className="absolute bottom-0 left-0 right-0 p-6 z-10 flex gap-4 overflow-x-auto pb-8 bg-gradient-to-t from-background via-background/80 to-transparent">
          {loadingLive ? (
            <div className="w-full flex justify-center"><Loader2 className="animate-spin text-primary w-8 h-8" /></div>
          ) : liveData ? (
            <>
              <ConditionCard icon={Wind} title="Weather" value={`${liveData.weather?.temperature}°C`} sub={liveData.weather?.condition} />
              <ConditionCard icon={Car} title="Traffic" value={liveData.traffic?.level || "N/A"} color="text-yellow-400" />
              <ConditionCard icon={Users} title="Crowd" value={liveData.crowd?.level || "N/A"} color="text-primary" />
              <ConditionCard icon={VolumeX} title="Noise" value={liveData.noise?.level || "N/A"} color="text-secondary" />
              <ConditionCard icon={Shield} title="Safety" value={`${liveData.safety?.score}/100`} sub={liveData.safety?.level} />
              <ConditionCard icon={Smile} title="Mood" value={`${liveData.mood?.score}/100`} sub={liveData.mood?.sentiment} color="text-green-400" />
            </>
          ) : null}
        </div>
      </div>

      <div className="w-96 bg-card border-l border-white/10 flex flex-col z-20">
        <div className="p-6 border-b border-white/10 bg-background/50">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-primary animate-pulse" /> Live Timeline
          </h2>
        </div>
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {loadingTimeline ? (
            <div className="flex justify-center py-10"><Loader2 className="animate-spin text-primary" /></div>
          ) : timeline ? (
            <div className="space-y-6">
              <div className="text-sm text-white/70 italic bg-white/5 p-4 rounded-lg border border-white/10">
                "{timeline.narrative}"
              </div>
              <div className="space-y-4">
                {timeline.entries.map((entry, idx) => (
                  <motion.div 
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.1 }}
                    key={idx} 
                    className="relative pl-6 border-l border-white/10 pb-4 last:pb-0"
                  >
                    <div className="absolute left-[-5px] top-1 w-2 h-2 rounded-full bg-primary shadow-[0_0_8px_var(--color-primary)]" />
                    <div className="text-xs text-primary font-mono mb-1">{entry.time}</div>
                    <div className="font-semibold text-white text-sm">{entry.title}</div>
                    <div className="text-xs text-white/60 mt-1">{entry.description}</div>
                  </motion.div>
                ))}
              </div>
            </div>
          ) : (
            <div className="text-white/50 text-center py-10">No timeline data available.</div>
          )}
        </div>
      </div>
    </div>
  );
}

function ConditionCard({ icon: Icon, title, value, sub, color = "text-white" }: any) {
  return (
    <div className="min-w-[140px] bg-card/80 backdrop-blur-md border border-white/10 rounded-xl p-4 flex flex-col gap-2">
      <div className="flex items-center gap-2 text-white/50 text-xs uppercase tracking-wider font-semibold">
        <Icon className="w-4 h-4" />
        {title}
      </div>
      <div>
        <div className={`text-xl font-bold ${color} capitalize`}>{value}</div>
        {sub && <div className="text-xs text-white/50 mt-1 capitalize">{sub}</div>}
      </div>
    </div>
  );
}

const GlobeIcon = (props: any) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinelinejoin="round" {...props}>
    <circle cx="12" cy="12" r="10"/>
    <path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20"/>
    <path d="M2 12h20"/>
  </svg>
);
