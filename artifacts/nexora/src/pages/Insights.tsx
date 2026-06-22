import React, { useState } from "react";
import { useAppContext } from "@/lib/store";
import { useGetPlacePersonality, useGetPredictions, useComparePlaces } from "@workspace/api-client-react";
import { Loader2, BrainCircuit, TrendingUp, Target, Scale } from "lucide-react";
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Legend, CartesianGrid } from "recharts";

export default function Insights() {
  const { selectedPlace } = useAppContext();

  const { data: personality, isLoading: loadingPersonality } = useGetPlacePersonality(
    selectedPlace?.id || "",
    { query: { enabled: !!selectedPlace?.id, queryKey: ["personality", selectedPlace?.id] } }
  );

  const { data: predictions, isLoading: loadingPredictions } = useGetPredictions(
    selectedPlace?.id || "",
    { query: { enabled: !!selectedPlace?.id, queryKey: ["predictions", selectedPlace?.id] } }
  );

  const { data: comparison, isLoading: loadingComparison } = useComparePlaces(
    { placeA: selectedPlace?.id || "", placeB: "new-york-us" },
    { query: { enabled: !!selectedPlace?.id, queryKey: ["compare", selectedPlace?.id, "new-york-us"] } }
  );

  if (!selectedPlace) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center h-full text-center p-8">
        <BrainCircuit className="w-16 h-16 text-primary/30 mb-4 animate-pulse" />
        <h2 className="text-2xl font-semibold text-white mb-2">No Location Selected</h2>
        <p className="text-white/50">Select a place to view AI-generated insights and predictions.</p>
      </div>
    );
  }

  const dnaData = personality ? Object.entries(personality.areaDna).map(([key, value]) => ({
    subject: key.charAt(0).toUpperCase() + key.slice(1),
    A: value,
    fullMark: 100,
  })) : [];

  const comparisonData = comparison ? Object.keys(comparison.placeA.metrics || {}).map((key) => ({
    name: key.charAt(0).toUpperCase() + key.slice(1),
    [comparison.placeA.name || 'Current']: comparison.placeA.metrics?.[key] || 0,
    [comparison.placeB?.name || 'Comparison']: comparison.placeB?.metrics?.[key] || 0,
  })) : [];

  return (
    <div className="p-6 md:p-12 max-w-7xl mx-auto space-y-8">
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center border border-primary/30">
          <BrainCircuit className="w-6 h-6 text-primary" />
        </div>
        <div>
          <h1 className="text-3xl font-bold text-white">AI Insights</h1>
          <p className="text-white/60 text-sm">Deep analysis and future predictions for {selectedPlace.name}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* DNA Chart */}
        <div className="bg-card border border-white/10 rounded-xl p-6 flex flex-col">
          <h3 className="text-lg font-semibold text-white mb-6 flex items-center gap-2">
            <Target className="w-5 h-5 text-primary" /> Area DNA
          </h3>
          {loadingPersonality ? (
            <div className="flex-1 flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
          ) : personality ? (
            <div className="flex-1 flex flex-col">
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart cx="50%" cy="50%" outerRadius="80%" data={dnaData}>
                    <PolarGrid stroke="rgba(255,255,255,0.1)" />
                    <PolarAngleAxis dataKey="subject" tick={{ fill: 'rgba(255,255,255,0.7)', fontSize: 12 }} />
                    <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                    <Radar name="DNA" dataKey="A" stroke="hsl(var(--primary))" fill="hsl(var(--primary))" fillOpacity={0.4} />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
              <div className="mt-4 p-4 bg-primary/10 rounded-lg border border-primary/20 text-sm text-primary/90 leading-relaxed">
                {personality.summary}
              </div>
            </div>
          ) : (
            <div className="text-white/50 text-center py-10">No DNA data available</div>
          )}
        </div>

        {/* Predictions */}
        <div className="bg-card border border-white/10 rounded-xl p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-white flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-secondary" /> Future Predictions
            </h3>
            {predictions && (
              <div className="flex items-center gap-2 text-xs">
                <span className="text-white/50">Confidence</span>
                <div className="w-24 h-2 bg-background rounded-full overflow-hidden">
                  <div className="h-full bg-secondary" style={{ width: `${predictions.confidence}%` }} />
                </div>
                <span className="text-secondary font-bold">{predictions.confidence}%</span>
              </div>
            )}
          </div>

          {loadingPredictions ? (
            <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-secondary" /></div>
          ) : predictions ? (
            <div className="space-y-4">
              {predictions.items.map((item, idx) => (
                <div key={idx} className="p-4 bg-background/50 rounded-lg border border-white/5">
                  <div className="flex justify-between items-start mb-2">
                    <div className="font-medium text-white">{item.metric}</div>
                    <div className={`text-xs px-2 py-1 rounded font-bold ${
                      item.trend === 'increasing' ? 'bg-green-500/20 text-green-400' :
                      item.trend === 'decreasing' ? 'bg-red-500/20 text-red-400' : 'bg-white/10 text-white/70'
                    }`}>
                      {item.trend} {item.changePercent ? `(${item.changePercent > 0 ? '+' : ''}${item.changePercent}%)` : ''}
                    </div>
                  </div>
                  <div className="flex items-center gap-4 text-sm mb-2">
                    <span className="text-white/50 line-through">{item.current}</span>
                    <span className="text-secondary font-semibold">→ {item.predicted}</span>
                  </div>
                  <p className="text-xs text-white/60">{item.description}</p>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-white/50 text-center py-10">No predictions available</div>
          )}
        </div>
        
        {/* Comparison */}
        <div className="lg:col-span-2 bg-card border border-white/10 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-white mb-6 flex items-center gap-2">
            <Scale className="w-5 h-5 text-accent" /> Urban Comparison
          </h3>
          
          {loadingComparison ? (
             <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-accent" /></div>
          ) : comparison ? (
             <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-center">
               <div className="lg:col-span-2 h-64">
                 <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={comparisonData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                      <XAxis dataKey="name" stroke="rgba(255,255,255,0.5)" tick={{ fill: 'rgba(255,255,255,0.5)', fontSize: 12 }} />
                      <YAxis stroke="rgba(255,255,255,0.5)" tick={{ fill: 'rgba(255,255,255,0.5)', fontSize: 12 }} />
                      <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'rgba(255,255,255,0.1)' }} />
                      <Legend />
                      <Bar dataKey={comparison.placeA.name || 'Current'} fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                      <Bar dataKey={comparison.placeB?.name || 'Comparison'} fill="hsl(var(--secondary))" radius={[4, 4, 0, 0]} />
                    </BarChart>
                 </ResponsiveContainer>
               </div>
               <div className="bg-accent/10 border border-accent/20 rounded-xl p-6 text-sm text-accent/90 leading-relaxed">
                 <h4 className="font-bold text-accent mb-2 text-base">Summary</h4>
                 {comparison.summary}
               </div>
             </div>
          ) : (
            <div className="text-white/50 text-center py-10">No comparison data available</div>
          )}
        </div>
      </div>
    </div>
  );
}
