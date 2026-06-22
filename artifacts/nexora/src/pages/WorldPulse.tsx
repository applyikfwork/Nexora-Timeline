import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Globe2, Loader2, Zap, TrendingUp, TrendingDown, Minus, RefreshCw } from "lucide-react";

interface PulseCity {
  id: string;
  name: string;
  lat: number;
  lng: number;
  pulse: number;
  trend: string;
  status: string;
}

function PulseOrb({ pulse, size = 48 }: { pulse: number; size?: number }) {
  const color = pulse > 85 ? "#ff4444" : pulse > 70 ? "#ffaa00" : pulse > 50 ? "#00ffcc" : "#4488ff";
  const s = size;
  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: s, height: s }}>
      <div className="absolute inset-0 rounded-full animate-ping opacity-20" style={{ backgroundColor: color }} />
      <div className="absolute inset-1 rounded-full opacity-40 animate-pulse" style={{ backgroundColor: color }} />
      <div className="relative w-3/4 h-3/4 rounded-full flex items-center justify-center" style={{ backgroundColor: color + "33", border: `1.5px solid ${color}` }}>
        <span className="text-white font-black text-xs">{pulse}</span>
      </div>
    </div>
  );
}

function SimpleGlobe({ cities }: { cities: PulseCity[] }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef<number>(0);
  const rotationRef = useRef(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const W = canvas.width;
    const H = canvas.height;
    const cx = W / 2;
    const cy = H / 2;
    const R = Math.min(W, H) / 2 - 20;

    function project(lat: number, lng: number, rot: number) {
      const phi = (90 - lat) * Math.PI / 180;
      const theta = (lng + rot) * Math.PI / 180;
      const x = R * Math.sin(phi) * Math.cos(theta);
      const y = R * Math.cos(phi);
      const z = R * Math.sin(phi) * Math.sin(theta);
      return { x: cx + x, y: cy - y, visible: z > 0 };
    }

    function draw() {
      ctx.clearRect(0, 0, W, H);
      rotationRef.current = (rotationRef.current + 0.2) % 360;
      const rot = rotationRef.current;

      ctx.beginPath();
      ctx.arc(cx, cy, R, 0, Math.PI * 2);
      ctx.fillStyle = "rgba(0,30,40,0.8)";
      ctx.fill();
      ctx.strokeStyle = "rgba(0,255,204,0.15)";
      ctx.lineWidth = 1;
      ctx.stroke();

      for (let lat = -60; lat <= 60; lat += 30) {
        ctx.beginPath();
        for (let lng = -180; lng <= 180; lng += 5) {
          const p = project(lat, lng, rot);
          if (!p.visible) continue;
          if (lng === -180) ctx.moveTo(p.x, p.y);
          else ctx.lineTo(p.x, p.y);
        }
        ctx.strokeStyle = "rgba(0,255,204,0.08)";
        ctx.lineWidth = 0.5;
        ctx.stroke();
      }

      for (let lng = -180; lng <= 180; lng += 30) {
        ctx.beginPath();
        for (let lat = -90; lat <= 90; lat += 5) {
          const p = project(lat, lng, rot);
          if (!p.visible) continue;
          if (lat === -90) ctx.moveTo(p.x, p.y);
          else ctx.lineTo(p.x, p.y);
        }
        ctx.strokeStyle = "rgba(0,255,204,0.05)";
        ctx.lineWidth = 0.5;
        ctx.stroke();
      }

      cities.forEach(city => {
        const p = project(city.lat, city.lng, rot);
        if (!p.visible) return;

        const color = city.pulse > 85 ? "#ff4444" : city.pulse > 70 ? "#ffaa00" : city.pulse > 50 ? "#00ffcc" : "#4488ff";
        const r = 4 + (city.pulse / 100) * 6;

        const t = Date.now() / 1000;
        const pingR = r + (Math.sin(t * 2 + city.lat) * 0.5 + 0.5) * 8;
        ctx.beginPath();
        ctx.arc(p.x, p.y, pingR, 0, Math.PI * 2);
        ctx.fillStyle = color + "20";
        ctx.fill();

        ctx.beginPath();
        ctx.arc(p.x, p.y, r, 0, Math.PI * 2);
        ctx.fillStyle = color + "80";
        ctx.fill();
        ctx.strokeStyle = color;
        ctx.lineWidth = 1.5;
        ctx.stroke();

        ctx.fillStyle = "white";
        ctx.font = "9px sans-serif";
        ctx.textAlign = "center";
        ctx.fillText(city.name, p.x, p.y - r - 4);
      });

      animRef.current = requestAnimationFrame(draw);
    }

    draw();
    return () => cancelAnimationFrame(animRef.current);
  }, [cities]);

  return <canvas ref={canvasRef} width={500} height={500} className="w-full max-w-md mx-auto" />;
}

export default function WorldPulse() {
  const [data, setData] = useState<{ cities: PulseCity[]; surging: number; updatedAt: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<PulseCity | null>(null);

  async function load() {
    setLoading(true);
    try {
      const res = await fetch("/api/forecast/pulse");
      setData(await res.json());
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    const interval = setInterval(load, 30000);
    return () => clearInterval(interval);
  }, []);

  const trendIcon = (t: string) => t === "up" ? <TrendingUp className="w-3 h-3 text-green-400" /> : t === "down" ? <TrendingDown className="w-3 h-3 text-red-400" /> : <Minus className="w-3 h-3 text-white/40" />;
  const pulseColor = (p: number) => p > 85 ? "text-red-400" : p > 70 ? "text-yellow-400" : p > 50 ? "text-primary" : "text-blue-400";

  return (
    <div className="p-6 md:p-10 max-w-7xl mx-auto space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center border border-primary/30">
            <Globe2 className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-white">Live World Pulse</h1>
            <p className="text-white/60 text-sm">Real-time heartbeat of cities across Earth</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {data && <span className="text-xs text-white/30">Updated {new Date(data.updatedAt).toLocaleTimeString()}</span>}
          <button onClick={load} disabled={loading} className="flex items-center gap-2 px-3 py-2 bg-card border border-white/10 rounded-lg text-sm text-white/70 hover:text-white hover:border-primary/30 transition-all disabled:opacity-50">
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} /> Refresh
          </button>
        </div>
      </div>

      {data && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-card border border-white/10 rounded-xl p-4 text-center">
            <div className="text-3xl font-black text-primary">{data.cities.length}</div>
            <div className="text-xs text-white/40 uppercase tracking-wider mt-1">Cities Monitored</div>
          </div>
          <div className="bg-card border border-red-500/20 rounded-xl p-4 text-center">
            <div className="text-3xl font-black text-red-400">{data.surging}</div>
            <div className="text-xs text-white/40 uppercase tracking-wider mt-1">Surging Now</div>
          </div>
          <div className="bg-card border border-white/10 rounded-xl p-4 text-center">
            <div className="text-3xl font-black text-yellow-400">
              {Math.round(data.cities.reduce((s, c) => s + c.pulse, 0) / data.cities.length)}
            </div>
            <div className="text-xs text-white/40 uppercase tracking-wider mt-1">Avg Global Pulse</div>
          </div>
          <div className="bg-card border border-white/10 rounded-xl p-4 text-center">
            <div className="text-3xl font-black text-green-400">
              {data.cities.filter(c => c.trend === "up").length}
            </div>
            <div className="text-xs text-white/40 uppercase tracking-wider mt-1">Trending Up</div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-card border border-white/10 rounded-2xl p-6 flex items-center justify-center">
          {loading && !data ? (
            <Loader2 className="w-12 h-12 animate-spin text-primary" />
          ) : data ? (
            <SimpleGlobe cities={data.cities} />
          ) : null}
        </div>

        <div className="bg-card border border-white/10 rounded-2xl p-6">
          <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
            <Zap className="w-5 h-5 text-primary" /> City Rankings by Pulse
          </h3>
          <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
            {(data?.cities || []).sort((a, b) => b.pulse - a.pulse).map((city, i) => (
              <button key={city.id} onClick={() => setSelected(selected?.id === city.id ? null : city)}
                className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all text-left ${selected?.id === city.id ? "bg-primary/10 border border-primary/30" : "bg-white/5 hover:bg-white/10 border border-transparent"}`}>
                <PulseOrb pulse={city.pulse} size={36} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-white text-sm">{city.name}</span>
                    {trendIcon(city.trend)}
                  </div>
                  <div className="text-xs text-white/40 truncate">{city.status}</div>
                </div>
                <div className={`text-lg font-black ${pulseColor(city.pulse)}`}>{city.pulse}</div>
              </button>
            ))}
          </div>
        </div>
      </div>

      <AnimatePresence>
        {selected && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
            className="bg-gradient-to-r from-primary/10 via-card to-secondary/10 border border-primary/20 rounded-2xl p-6">
            <div className="flex items-center gap-4">
              <PulseOrb pulse={selected.pulse} size={64} />
              <div>
                <h3 className="text-2xl font-black text-white">{selected.name}</h3>
                <p className="text-white/60 text-sm">{selected.status}</p>
                <div className="flex items-center gap-3 mt-2">
                  <div className="flex items-center gap-1">
                    {trendIcon(selected.trend)}
                    <span className="text-xs text-white/50 capitalize">{selected.trend}</span>
                  </div>
                  <div className="text-xs text-white/30">
                    📍 {selected.lat.toFixed(2)}, {selected.lng.toFixed(2)}
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
