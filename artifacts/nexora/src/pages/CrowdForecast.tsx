import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { CalendarDays, Loader2, ChevronLeft, ChevronRight, Info } from "lucide-react";

const PLACES = [
  { id: "delhi-in", name: "Delhi" },
  { id: "mumbai-in", name: "Mumbai" },
  { id: "london-uk", name: "London" },
  { id: "new-york-us", name: "New York" },
  { id: "tokyo-jp", name: "Tokyo" },
  { id: "paris-fr", name: "Paris" },
  { id: "dubai-ae", name: "Dubai" },
  { id: "singapore-sg", name: "Singapore" },
];

const LEVEL_STYLES: Record<string, { bg: string; text: string; label: string }> = {
  "very-high": { bg: "bg-red-500", text: "text-red-400", label: "Very High" },
  "high": { bg: "bg-orange-500", text: "text-orange-400", label: "High" },
  "moderate": { bg: "bg-yellow-500", text: "text-yellow-400", label: "Moderate" },
  "low": { bg: "bg-green-500", text: "text-green-400", label: "Low" },
};

const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTH_NAMES = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

interface DayData {
  day: number;
  crowdScore: number;
  level: string;
  eventName: string | null;
  isWeekend: boolean;
  tip: string | null;
}

export default function CrowdForecast() {
  const now = new Date();
  const [placeId, setPlaceId] = useState("tokyo-jp");
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());
  const [data, setData] = useState<{ days: DayData[]; month: string; year: number; placeName: string } | null>(null);
  const [loading, setLoading] = useState(false);
  const [selectedDay, setSelectedDay] = useState<DayData | null>(null);

  async function load() {
    setLoading(true);
    try {
      const res = await fetch(`/api/forecast/calendar?placeId=${placeId}&month=${month}&year=${year}`);
      setData(await res.json());
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, [placeId, month, year]);

  function prevMonth() {
    if (month === 1) { setMonth(12); setYear(y => y - 1); }
    else setMonth(m => m - 1);
  }

  function nextMonth() {
    if (month === 12) { setMonth(1); setYear(y => y + 1); }
    else setMonth(m => m + 1);
  }

  const firstDayOfMonth = data ? new Date(year, month - 1, 1).getDay() : 0;
  const today = now.getDate();
  const isCurrentMonth = now.getMonth() + 1 === month && now.getFullYear() === year;

  return (
    <div className="p-6 md:p-10 max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 rounded-xl bg-blue-500/20 flex items-center justify-center border border-blue-500/30">
          <CalendarDays className="w-6 h-6 text-blue-400" />
        </div>
        <div>
          <h1 className="text-3xl font-bold text-white">Crowd Forecast</h1>
          <p className="text-white/60 text-sm">Monthly predicted crowd levels — plan around events & peaks</p>
        </div>
      </div>

      <div className="flex items-center gap-3 flex-wrap">
        <select value={placeId} onChange={e => setPlaceId(e.target.value)} className="bg-card border border-white/10 text-white rounded-lg px-3 py-2 text-sm">
          {PLACES.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
        </select>
        <div className="flex items-center gap-2 ml-auto">
          <button onClick={prevMonth} className="p-2 rounded-lg bg-card border border-white/10 text-white/70 hover:text-white hover:border-primary/30 transition-all">
            <ChevronLeft className="w-4 h-4" />
          </button>
          <div className="px-4 py-2 bg-card border border-white/10 rounded-lg text-white font-medium text-sm min-w-32 text-center">
            {MONTH_NAMES[month - 1]} {year}
          </div>
          <button onClick={nextMonth} className="p-2 rounded-lg bg-card border border-white/10 text-white/70 hover:text-white hover:border-primary/30 transition-all">
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="flex gap-3 flex-wrap text-xs">
        {Object.entries(LEVEL_STYLES).map(([key, val]) => (
          <div key={key} className="flex items-center gap-1.5">
            <div className={`w-3 h-3 rounded-sm ${val.bg}`} />
            <span className="text-white/50">{val.label}</span>
          </div>
        ))}
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-sm bg-primary/40 border border-primary/60" />
          <span className="text-white/50">Event Day</span>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-20"><Loader2 className="w-8 h-8 animate-spin text-primary mx-auto" /></div>
      ) : data ? (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-card border border-white/10 rounded-2xl p-6">
          <div className="grid grid-cols-7 gap-1 mb-2">
            {DAY_NAMES.map(d => (
              <div key={d} className="text-center text-xs text-white/30 font-medium py-1">{d}</div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-1">
            {Array.from({ length: firstDayOfMonth }, (_, i) => <div key={`empty-${i}`} />)}
            {data.days.map(day => {
              const style = LEVEL_STYLES[day.level] || LEVEL_STYLES.low;
              const isToday = isCurrentMonth && day.day === today;
              const isSelected = selectedDay?.day === day.day;
              return (
                <button key={day.day} onClick={() => setSelectedDay(isSelected ? null : day)}
                  className={`relative aspect-square rounded-lg flex flex-col items-center justify-center text-xs transition-all hover:scale-105 ${day.eventName ? "ring-1 ring-primary/50" : ""} ${isSelected ? "ring-2 ring-white" : ""}`}
                  style={{ background: isToday ? "rgba(0,255,204,0.2)" : `${day.level === "very-high" ? "rgba(239,68,68,0.2)" : day.level === "high" ? "rgba(249,115,22,0.15)" : day.level === "moderate" ? "rgba(234,179,8,0.15)" : "rgba(34,197,94,0.1)"}` }}>
                  <span className={`font-bold ${isToday ? "text-primary" : "text-white"}`}>{day.day}</span>
                  <span className={`text-xs ${style.text}`}>{day.crowdScore}</span>
                  {day.eventName && <div className="absolute bottom-0.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-primary" />}
                </button>
              );
            })}
          </div>

          {selectedDay && (
            <motion.div initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }}
              className="mt-4 bg-background/50 rounded-xl p-4 border border-white/10">
              <div className="flex items-start gap-3">
                <Info className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                <div>
                  <div className="font-bold text-white mb-1">
                    {MONTH_NAMES[month - 1]} {selectedDay.day}, {year}
                    {selectedDay.eventName && <span className="ml-2 text-primary text-sm">• {selectedDay.eventName}</span>}
                  </div>
                  <div className="flex items-center gap-3 text-sm">
                    <span className={`font-bold ${(LEVEL_STYLES[selectedDay.level] || LEVEL_STYLES.low).text}`}>
                      Crowd: {selectedDay.crowdScore}/100 ({(LEVEL_STYLES[selectedDay.level] || LEVEL_STYLES.low).label})
                    </span>
                    {selectedDay.isWeekend && <span className="text-white/40">Weekend</span>}
                  </div>
                  {selectedDay.tip && <p className="text-xs text-white/50 mt-1">{selectedDay.tip}</p>}
                </div>
              </div>
            </motion.div>
          )}
        </motion.div>
      ) : null}

      {data && (
        <div className="bg-card border border-white/10 rounded-xl p-4">
          <h3 className="text-sm font-bold text-white/60 uppercase tracking-wider mb-3">Monthly Summary</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-center">
            {Object.entries(LEVEL_STYLES).map(([key, val]) => {
              const count = data.days.filter(d => d.level === key).length;
              return (
                <div key={key} className="bg-background/50 rounded-lg p-3">
                  <div className={`text-2xl font-black ${val.text}`}>{count}</div>
                  <div className="text-xs text-white/40">{val.label} days</div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
