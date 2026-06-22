import React, { useEffect, useRef } from "react";

const CITY_DOTS = [
  { lat: 35.6762, lng: 139.6503, name: "Tokyo", pulse: 94 },
  { lat: 28.6139, lng: 77.209, name: "Delhi", pulse: 87 },
  { lat: 25.2048, lng: 55.2708, name: "Dubai", pulse: 91 },
  { lat: 51.5074, lng: -0.1278, name: "London", pulse: 76 },
  { lat: 40.7128, lng: -74.006, name: "New York", pulse: 88 },
  { lat: 48.8566, lng: 2.3522, name: "Paris", pulse: 72 },
  { lat: 1.3521, lng: 103.8198, name: "Singapore", pulse: 69 },
  { lat: 19.076, lng: 72.8777, name: "Mumbai", pulse: 85 },
  { lat: -33.8688, lng: 151.2093, name: "Sydney", pulse: 61 },
  { lat: 37.5665, lng: 126.978, name: "Seoul", pulse: 83 },
  { lat: 30.0444, lng: 31.2357, name: "Cairo", pulse: 77 },
  { lat: -23.5505, lng: -46.6333, name: "São Paulo", pulse: 89 },
  { lat: 55.7558, lng: 37.6173, name: "Moscow", pulse: 64 },
  { lat: 52.52, lng: 13.405, name: "Berlin", pulse: 71 },
  { lat: 34.6937, lng: 135.5023, name: "Osaka", pulse: 80 },
];

function latLngToXYZ(lat: number, lng: number, r: number, rotY: number) {
  const phi = ((90 - lat) * Math.PI) / 180;
  const theta = ((lng + rotY) * Math.PI) / 180;
  const x = r * Math.sin(phi) * Math.cos(theta);
  const y = r * Math.cos(phi);
  const z = r * Math.sin(phi) * Math.sin(theta);
  return { x, y, z };
}

export function HeroGlobe() {
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
    const R = Math.min(W, H) * 0.38;

    // Generate particle cloud
    const particles: { ox: number; oy: number; oz: number; size: number; alpha: number }[] = [];
    for (let i = 0; i < 600; i++) {
      const theta = Math.random() * 2 * Math.PI;
      const phi = Math.acos(Math.random() * 2 - 1);
      particles.push({
        ox: R * Math.sin(phi) * Math.cos(theta),
        oy: R * Math.cos(phi),
        oz: R * Math.sin(phi) * Math.sin(theta),
        size: Math.random() * 1.2 + 0.3,
        alpha: Math.random() * 0.5 + 0.2,
      });
    }

    function draw() {
      ctx.clearRect(0, 0, W, H);
      rotRef.current += 0.003;
      const rot = rotRef.current;
      const t = Date.now() / 1000;

      // Atmosphere glow
      const atm = ctx.createRadialGradient(cx, cy, R * 0.85, cx, cy, R * 1.3);
      atm.addColorStop(0, "rgba(0,200,180,0.06)");
      atm.addColorStop(0.5, "rgba(0,100,200,0.04)");
      atm.addColorStop(1, "rgba(0,0,50,0)");
      ctx.beginPath();
      ctx.arc(cx, cy, R * 1.3, 0, Math.PI * 2);
      ctx.fillStyle = atm;
      ctx.fill();

      // Globe base
      const globe = ctx.createRadialGradient(cx - R * 0.3, cy - R * 0.3, R * 0.1, cx, cy, R);
      globe.addColorStop(0, "rgba(0,40,80,0.95)");
      globe.addColorStop(0.6, "rgba(0,20,50,0.97)");
      globe.addColorStop(1, "rgba(0,10,30,0.99)");
      ctx.beginPath();
      ctx.arc(cx, cy, R, 0, Math.PI * 2);
      ctx.fillStyle = globe;
      ctx.fill();

      // Latitude lines
      for (let lat = -60; lat <= 60; lat += 30) {
        ctx.beginPath();
        let first = true;
        for (let lng2 = -180; lng2 <= 180; lng2 += 3) {
          const p = latLngToXYZ(lat, lng2, R, (rot * 180) / Math.PI);
          const depth = (p.z + R) / (2 * R);
          if (depth < 0.05) { first = true; continue; }
          const sx = cx + p.x;
          const sy = cy - p.y;
          if (first) { ctx.moveTo(sx, sy); first = false; }
          else ctx.lineTo(sx, sy);
        }
        ctx.strokeStyle = `rgba(0,255,200,${lat === 0 ? 0.12 : 0.05})`;
        ctx.lineWidth = lat === 0 ? 1 : 0.5;
        ctx.stroke();
      }

      // Longitude lines
      for (let lng2 = 0; lng2 < 180; lng2 += 30) {
        ctx.beginPath();
        let first = true;
        for (let lat2 = -85; lat2 <= 85; lat2 += 3) {
          const p = latLngToXYZ(lat2, lng2, R, (rot * 180) / Math.PI);
          const depth = (p.z + R) / (2 * R);
          if (depth < 0.05) { first = true; continue; }
          const sx = cx + p.x;
          const sy = cy - p.y;
          if (first) { ctx.moveTo(sx, sy); first = false; }
          else ctx.lineTo(sx, sy);
        }
        ctx.strokeStyle = "rgba(0,200,180,0.04)";
        ctx.lineWidth = 0.5;
        ctx.stroke();
      }

      // Particles
      particles.forEach(p => {
        const cosR = Math.cos(rot), sinR = Math.sin(rot);
        const rx = p.ox * cosR - p.oz * sinR;
        const rz = p.oz * cosR + p.ox * sinR;
        const depth = (rz + R) / (2 * R);
        if (depth < 0.05) return;
        const sx = cx + rx;
        const sy = cy - p.oy;
        ctx.beginPath();
        ctx.arc(sx, sy, p.size * depth, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(0,230,200,${p.alpha * depth})`;
        ctx.fill();
      });

      // Connection arcs between cities
      const visibleCities = CITY_DOTS.map(city => {
        const p = latLngToXYZ(city.lat, city.lng, R, (rot * 180) / Math.PI);
        const depth = (p.z + R) / (2 * R);
        return { ...city, sx: cx + p.x, sy: cy - p.y, depth, visible: depth > 0.15 };
      }).filter(c => c.visible);

      // Draw arcs between nearby cities
      for (let i = 0; i < visibleCities.length; i++) {
        for (let j = i + 1; j < visibleCities.length; j++) {
          const a = visibleCities[i], b = visibleCities[j];
          const dist = Math.sqrt((a.sx - b.sx) ** 2 + (a.sy - b.sy) ** 2);
          if (dist > R * 0.8) continue;
          const phase = Math.sin(t * 0.8 + i * 0.5 + j * 0.3);
          if (phase < 0.3) continue;
          const alpha = (phase - 0.3) / 0.7 * 0.15 * Math.min(a.depth, b.depth);
          ctx.beginPath();
          const mx = (a.sx + b.sx) / 2;
          const my = (a.sy + b.sy) / 2 - dist * 0.25;
          ctx.moveTo(a.sx, a.sy);
          ctx.quadraticCurveTo(mx, my, b.sx, b.sy);
          ctx.strokeStyle = `rgba(0,255,200,${alpha})`;
          ctx.lineWidth = 0.8;
          ctx.stroke();
        }
      }

      // City orbs
      visibleCities.forEach(city => {
        const color = city.pulse > 85 ? [255, 80, 80] : city.pulse > 70 ? [255, 180, 0] : [0, 255, 200];
        const [r2, g, b] = color;
        const ping = (Math.sin(t * 2 + city.lat) * 0.5 + 0.5);
        const orbR = (2 + city.pulse / 100 * 3) * city.depth;

        ctx.beginPath();
        ctx.arc(city.sx, city.sy, orbR + ping * 8 * city.depth, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${r2},${g},${b},${ping * 0.12 * city.depth})`;
        ctx.fill();

        ctx.beginPath();
        ctx.arc(city.sx, city.sy, orbR, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${r2},${g},${b},${0.9 * city.depth})`;
        ctx.fill();

        if (city.depth > 0.5) {
          ctx.fillStyle = `rgba(255,255,255,${0.6 * city.depth})`;
          ctx.font = `bold ${Math.max(8, Math.floor(9 * city.depth))}px Inter, sans-serif`;
          ctx.textAlign = "center";
          ctx.fillText(city.name, city.sx, city.sy - orbR - 5);
        }
      });

      // Specular highlight
      const spec = ctx.createRadialGradient(cx - R * 0.45, cy - R * 0.4, 0, cx - R * 0.45, cy - R * 0.4, R * 0.55);
      spec.addColorStop(0, "rgba(255,255,255,0.06)");
      spec.addColorStop(1, "rgba(255,255,255,0)");
      ctx.beginPath();
      ctx.arc(cx, cy, R, 0, Math.PI * 2);
      ctx.fillStyle = spec;
      ctx.fill();

      // Rim light
      ctx.beginPath();
      ctx.arc(cx, cy, R, 0, Math.PI * 2);
      ctx.strokeStyle = "rgba(0,255,200,0.15)";
      ctx.lineWidth = 2;
      ctx.stroke();

      animRef.current = requestAnimationFrame(draw);
    }

    draw();
    return () => cancelAnimationFrame(animRef.current);
  }, []);

  return (
    <div className="relative flex items-center justify-center">
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="w-[500px] h-[500px] rounded-full bg-primary/5 blur-[80px] animate-pulse" style={{ animationDuration: "4s" }} />
      </div>
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="w-[300px] h-[300px] rounded-full bg-blue-500/5 blur-[60px] animate-pulse" style={{ animationDuration: "6s", animationDelay: "2s" }} />
      </div>
      <canvas ref={canvasRef} width={560} height={560} className="relative z-10 w-full max-w-lg mx-auto" />
    </div>
  );
}
