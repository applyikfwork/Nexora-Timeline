import React, { useState, useEffect } from "react";
import { useAppContext } from "@/lib/store";
import { useReadTimelineReplay, useLoadAiStory } from "@workspace/api-client-react";
import { Loader2, Play, Pause, Clock, Calendar } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from "recharts";
import { Slider } from "@/components/ui/slider";

export default function TimeMachine() {
  const { selectedPlace } = useAppContext();
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentHourIndex, setCurrentHourIndex] = useState(0);
  const [mode, setMode] = useState("today");

  const { data: replayData, isLoading: loadingReplay } = useReadTimelineReplay(
    selectedPlace?.id || "", 
    { date: mode }, 
    { query: { enabled: !!selectedPlace?.id, queryKey: ["replay", selectedPlace?.id, mode] } }
  );

  const { data: aiStory, isLoading: loadingStory } = useLoadAiStory(
    selectedPlace?.id || "",
    { timeOfDay: "afternoon" },
    { query: { enabled: !!selectedPlace?.id, queryKey: ["aiStory", selectedPlace?.id, "afternoon"] } }
  );

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isPlaying && replayData && replayData.length > 0) {
      interval = setInterval(() => {
        setCurrentHourIndex((prev) => (prev + 1) % replayData.length);
      }, 2000);
    }
    return () => clearInterval(interval);
  }, [isPlaying, replayData]);

  if (!selectedPlace) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center h-full text-center p-8">
        <Clock className="w-16 h-16 text-primary/30 mb-4 animate-pulse" />
        <h2 className="text-2xl font-semibold text-white mb-2">No Location Selected</h2>
        <p className="text-white/50">Select a place first to use the Time Machine.</p>
      </div>
    );
  }

  const currentSlice = replayData?.[currentHourIndex];

  return (
    <div className="p-6 md:p-12 max-w-7xl mx-auto space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white flex items-center gap-3">
            <Clock className="w-8 h-8 text-primary" /> Time Machine: {selectedPlace.name}
          </h1>
          <p className="text-white/60 mt-2">Replay the pulse of the city through time.</p>
        </div>
        <div className="flex bg-card border border-white/10 rounded-lg p-1">
          {["yesterday", "today", "festival"].map((m) => (
            <button
              key={m}
              onClick={() => setMode(m)}
              className={`px-4 py-2 rounded-md text-sm font-medium capitalize transition-colors ${
                mode === m ? "bg-primary text-primary-foreground" : "text-white/70 hover:text-white hover:bg-white/5"
              }`}
            >
              {m}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-card border border-white/10 rounded-xl p-6 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent pointer-events-none" />
            
            {loadingReplay ? (
              <div className="h-64 flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
            ) : replayData ? (
              <div className="space-y-8">
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={replayData}>
                      <defs>
                        <linearGradient id="colorActivity" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" vertical={false} />
                      <XAxis dataKey="label" stroke="rgba(255,255,255,0.5)" tick={{fill: 'rgba(255,255,255,0.5)'}} />
                      <YAxis stroke="rgba(255,255,255,0.5)" tick={{fill: 'rgba(255,255,255,0.5)'}} />
                      <Tooltip 
                        contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'rgba(255,255,255,0.1)' }}
                        itemStyle={{ color: 'white' }}
                      />
                      <Area type="monotone" dataKey="activity" stroke="hsl(var(--primary))" fillOpacity={1} fill="url(#colorActivity)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>

                <div className="flex items-center gap-6 bg-background/50 p-4 rounded-lg border border-white/5">
                  <button 
                    onClick={() => setIsPlaying(!isPlaying)}
                    className="w-12 h-12 rounded-full bg-primary flex items-center justify-center text-primary-foreground hover:scale-105 transition-transform shrink-0"
                  >
                    {isPlaying ? <Pause className="w-5 h-5 fill-current" /> : <Play className="w-5 h-5 fill-current ml-1" />}
                  </button>
                  <div className="flex-1 space-y-2">
                    <div className="flex justify-between text-sm font-medium">
                      <span className="text-white/50">6:00 AM</span>
                      <span className="text-primary">{currentSlice?.label || "12:00 PM"}</span>
                      <span className="text-white/50">11:00 PM</span>
                    </div>
                    <Slider 
                      value={[currentHourIndex]} 
                      max={(replayData.length || 1) - 1} 
                      step={1}
                      onValueChange={(v) => {
                        setCurrentHourIndex(v[0]);
                        setIsPlaying(false);
                      }}
                      className="[&>span:first-child]:bg-white/20 [&_[role=slider]]:bg-primary [&_[role=slider]]:border-primary"
                    />
                  </div>
                </div>
              </div>
            ) : null}
          </div>

          {currentSlice && (
            <div className="grid grid-cols-3 gap-4">
              {['traffic', 'crowd', 'noise'].map((metric) => (
                <div key={metric} className="bg-card border border-white/10 rounded-xl p-4 flex flex-col gap-2">
                  <div className="text-sm text-white/50 uppercase tracking-wider">{metric}</div>
                  <div className="text-2xl font-bold text-white capitalize">{currentSlice[metric as keyof typeof currentSlice] || 0}%</div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-card border border-white/10 rounded-xl p-6 flex flex-col gap-4">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-2 h-2 rounded-full bg-secondary animate-pulse" />
            <h3 className="text-lg font-semibold text-white">AI Narrative</h3>
          </div>
          
          {loadingStory ? (
            <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-secondary" /></div>
          ) : aiStory ? (
            <div className="space-y-4">
              <p className="text-white/80 leading-relaxed text-sm">{aiStory.story}</p>
              {aiStory.highlights && (
                <div className="space-y-2 mt-4">
                  <h4 className="text-xs text-white/50 uppercase tracking-wider">Highlights</h4>
                  <ul className="space-y-2">
                    {aiStory.highlights.map((hl, i) => (
                      <li key={i} className="text-sm text-secondary bg-secondary/10 px-3 py-2 rounded border border-secondary/20">
                        {hl}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          ) : (
             <div className="text-white/50 text-sm">No narrative available for this mode.</div>
          )}

          {currentSlice?.description && (
            <AnimatePresence mode="wait">
              <motion.div
                key={currentSlice.label}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="mt-auto pt-4 border-t border-white/10 text-sm text-primary italic"
              >
                "{currentSlice.description}"
              </motion.div>
            </AnimatePresence>
          )}
        </div>
      </div>
    </div>
  );
}
