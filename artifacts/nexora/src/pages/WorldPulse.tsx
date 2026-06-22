import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Globe2, Loader2, Zap, TrendingUp, TrendingDown, Minus, RefreshCw } from "lucide-react";
import { useAppContext } from "@/lib/store";

interface PulseCity {
  id: string;
  name: string;
  lat: number;
  lng: number;
  pulse: number;
  trend: string;
  status: string;
}

function PulseOrb({ pulse, size = 48, animate = true }: { pulse: number; size?: number; animate?: boolean }) {
  const color = pulse > 85 ? "#ff4444" : pulse > 70 ? "#ffaa00" : pulse > 50 ? "#00ffcc" : "#4488ff";
  return (
    <div className="relative inline-flex items-center justify-center flex-shrink-0" style={{ width: size, height: size }}>
      {animate && <>
        <div className="absolute inset-0 rounded-full opacity-15" style={{ backgroundColor: color, animation: "ping 2s cubic-bezier(0,0,0.2,1) infinite" }} />
        <div className="absolute inset-1 rounded-full opacity-20" style={{ backgroundColor: color, animation: "ping 2.5s cubic-bezier(0,0,0.2,1) infinite", animationDelay: "0.5s" }} />
      </>}
      <div className="relative flex flex-col items-center justify-center rounded-full border-2"
        style={{ width: size * 0.7, height: size * 0.7, borderColor: color, backgroundColor: color + "22" }}>
        <span className="font-black leading-none" style={{ fontSize: size * 0.2, color }}>{pulse}</span>
      </div>
    </div>
  );
}

function LiveGlobe({ cities }: { cities: PulseCity[] }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef<number>(0);
  const rotRef = useRef(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const W = canvas.width;
    const H = canvas.height;
    const cx = W / 2;
    const cy = H / 2;
    const R = Math.min(W, H) / 2 - 24;

    function project(lat: number, lng: number, rot: number) {
      const phi = ((90 - lat) * Math.PI) / 180;
      const theta = ((lng + rot) * Math.PI) / 180;
      const x = R * Math.sin(phi) * Math.cos(theta);
      const y = R * Math.cos(phi);
      const z = R * Math.sin(phi) * Math.sin(theta);
      return { x: cx + x, y: cy - y, z, visible: z > -R * 0.1 };
    }

    function draw() {
      ctx.clearRect(0, 0, W, H);
      rotRef.current = (rotRef.current + 0.15) % 360;
      const rot = rotRef.current;

      const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, R);
      grad.addColorStop(0, "rgba(0,40,50,0.9)");
      grad.addColorStop(1, "rgba(0,20,30,0.95)");
      ctx.beginPath();
      ctx.arc(cx, cy, R, 0, Math.PI * 2);
      ctx.fillStyle = grad;
      ctx.fill();

      const glowGrad = ctx.createRadialGradient(cx - R * 0.3, cy - R * 0.3, 0, cx, cy, R);
      glowGrad.addColorStop(0, "rgba(0,255,204,0.04)");
      glowGrad.addColorStop(1, "rgba(0,255,204,0)");
      ctx.beginPath();
      ctx.arc(cx, cy, R, 0, Math.PI * 2);
      ctx.fillStyle = glowGrad;
      ctx.fill();

      ctx.strokeStyle = "rgba(0,255,204,0.12)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(cx, cy, R, 0, Math.PI * 2);
      ctx.stroke();

      for (let lat = -60; lat <= 60; lat += 30) {
        ctx.beginPath();
        let first = true;
        for (let lng = -180; lng <= 180; lng += 4) {
          const p = project(lat, lng, rot);
          if (!p.visible) { first = true; continue; }
          if (first) { ctx.moveTo(p.x, p.y); first = false; }
          else ctx.lineTo(p.x, p.y);
        }
        ctx.strokeStyle = "rgba(0,255,204,0.06)";
        ctx.lineWidth = 0.5;
        ctx.stroke();
      }

      for (let lng = -180; lng <= 180; lng += 30) {
        ctx.beginPath();
        let first = true;
        for (let lat = -90; lat <= 90; lat += 4) {
          const p = project(lat, lng, rot);
          if (!p.visible) { first = true; continue; }
          if (first) { ctx.moveTo(p.x, p.y); first = false; }
          else ctx.lineTo(p.x, p.y);
        }
        ctx.strokeStyle = "rgba(0,255,204,0.04)";
        ctx.lineWidth = 0.5;
        ctx.stroke();
      }

      const t = Date.now() / 1000;

      const sorted = [...cities].sort((a, b) => {
        const pa = project(a.lat, a.lng, rot);
        const pb = project(b.lat, b.lng, rot);
        return pa.z - pb.z;
      });

      sorted.forEach(city => {
        const p = project(city.lat, city.lng, rot);
        if (!p.visible) return;

        const color = city.pulse > 85 ? "#ff4444" : city.pulse > 70 ? "#ffaa00" : city.pulse > 50 ? "#00ffcc" : "#4488ff";
        const depth = Math.max(0.3, (p.z + R) / (2 * R));
        const r = (3 + (city.pulse / 100) * 5) * depth;
        const pingAmt = (Math.sin(t * 2.5 + city.lat * 0.3) * 0.5 + 0.5);
        const pingR = r + pingAmt * 10 * depth;

        ctx.beginPath();
        ctx.arc(p.x, p.y, pingR, 0, Math.PI * 2);
        ctx.fillStyle = color + Math.floor(pingAmt * 30).toString(16).padStart(2, "0");
        ctx.fill();

        ctx.beginPath();
        ctx.arc(p.x, p.y, r, 0, Math.PI * 2);
        ctx.fillStyle = color + "cc";
        ctx.fill();
        ctx.strokeStyle = color;
        ctx.lineWidth = 1.5 * depth;
        ctx.stroke();

        if (depth > 0.5) {
          ctx.fillStyle = `rgba(255,255,255,${0.5 * depth})`;
          ctx.font = `bold ${Math.floor(9 * depth)}px sans-serif`;
          ctx.textAlign = "center";
          ctx.fillText(city.name, p.x, p.y - r - 4);
        }
      });

      animRef.current = requestAnimationFrame(draw);
    }

    draw();
    return () => cancelAnimationFrame(animRef.current);
  }, [cities]);

  return <canvas ref={canvasRef} width={460} height={460} className="w-full max-w-sm mx-auto" />;
}

export default function WorldPulse() {
  const { geoCity } = useAppContext();
  const [data, setData] = useState<{ cities: PulseCity[]; surging: number; updatedAt: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<PulseCity | null>(null);

  async function load() {
    setLoading(true);
    try {
      const res = await fetch("/api/forecast/pulse");
      const d = await res.json();
      setData(d);
      if (geoCity && !selected) {
        const found = d.cities?.find((c: PulseCity) => c.id === geoCity.id);
        if (found) setSelected(found);
      }
    } finally { setLoading(false); }
  }

  useEffect(() => { load(); const t = setInterval(load, 30000); return () => clearInterval(t); }, []);

  const trendIcon = (t: string) => t === "up" ? <TrendingUp className="w-3 h-3 text-green-400" /> : t === "down" ? <TrendingDown className="w-3 h-3 text-red-400" /> : <Minus className="w-3 h-3 text-white/30" />;
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
          {data && <span className="text-xs text-white/25">{new Date(data.updatedAt).toLocaleTimeString()}</span>}
          <button onClick={load} disabled={loading}
            className="flex items-center gap-2 px-3 py-2 bg-card border border-white/10 rounded-lg text-sm text-white/60 hover:text-white hover:border-primary/30 transition-all disabled:opacity-50">
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          </button>
        </div>
      </div>

      {data && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: "Cities Monitored", value: data.cities.length, color: "text-primary" },
            { label: "Surging Now", value: data.surging, color: "text-red-400", borderColor: "border-red-500/15" },
            { label: "Avg Global Pulse", value: Math.round(data.cities.reduce((s, c) => s + c.pulse, 0) / data.cities.length), color: "text-yellow-400" },
            { label: "Trending Up", value: data.cities.filter(c => c.trend === "up").length, color: "text-green-400" },
          ].map(({ label, value, color, borderColor }) => (
            <div key={label} className={`bg-card border ${borderColor || "border-white/10"} rounded-xl p-4 text-center`}>
              <div className={`text-3xl font-black ${color}`}>{value}</div>
              <div className="text-xs text-white/35 uppercase tracking-wider mt-1">{label}</div>
            </div>
          ))}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-card border border-white/10 rounded-2xl p-6 flex flex-col items-center justify-center min-h-96">
          {loading && !data ? <Loader2 className="w-12 h-12 animate-spin text-primary" /> : data ? <LiveGlobe cities={data.cities} /> : null}
          <p className="text-xs text-white/20 mt-2">Drag view · Auto-rotates · Live data</p>
        </div>

        <div className="bg-card border border-white/10 rounded-2xl p-6">
          <h3 className="text-sm font-bold text-white/50 uppercase tracking-wider mb-4 flex items-center gap-2">
            <Zap className="w-4 h-4 text-primary" /> City Rankings by Pulse
          </h3>
          <div className="space-y-1.5 max-h-96 overflow-y-auto pr-1">
            {(data?.cities || []).sort((a, b) => b.pulse - a.pulse).map((city) => (
              <button key={city.id} onClick={() => setSelected(selected?.id === city.id ? null : city)}
                className={`w-full flex items-center gap-3 p-2.5 rounded-xl transition-all text-left ${selected?.id === city.id ? "bg-primary/10 border border-primary/25" : "bg-white/3 hover:bg-white/8 border border-transparent"}`}>
                <PulseOrb pulse={city.pulse} size={36} animate={selected?.id === city.id} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="font-bold text-white text-sm">{city.name}</span>
                    {trendIcon(city.trend)}
                  </div>
                  <div className="text-xs text-white/30 truncate">{city.status}</div>
                </div>
                <div className={`text-base font-black ${pulseColor(city.pulse)}`}>{city.pulse}</div>
              </button>
            ))}
          </div>
        </div>
      </div>

      <AnimatePresence>
        {selected && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
            className="bg-gradient-to-r from-primary/8 via-card to-secondary/8 border border-primary/15 rounded-2xl p-6">
            <div className="flex items-center gap-5">
              <PulseOrb pulse={selected.pulse} size={72} />
              <div>
                <h3 className="text-2xl font-black text-white">{selected.name}</h3>
                <p className="text-white/50 text-sm mt-0.5">{selected.status}</p>
                <div className="flex items-center gap-4 mt-2">
                  <div className="flex items-center gap-1.5">
                    {trendIcon(selected.trend)}
                    <span className="text-xs text-white/40 capitalize">{selected.trend}</span>
                  </div>
                  <div className="text-xs text-white/25">
                    {selected.lat.toFixed(2)}°, {selected.lng.toFixed(2)}°
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
