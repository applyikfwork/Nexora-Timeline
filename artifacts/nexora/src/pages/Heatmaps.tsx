import React, { useEffect, useRef, useState } from "react";
import { ThermometerSun } from "lucide-react";
import { motion } from "framer-motion";

export default function Heatmaps() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [activeTab, setActiveTab] = useState("morning");
  
  const tabs = ["morning", "afternoon", "evening", "night"];

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let width = canvas.width = canvas.clientWidth;
    let height = canvas.height = canvas.clientHeight;
    
    let animationId: number;
    let time = 0;

    const draw = () => {
      time += 0.01;
      
      // Clear with dark background
      ctx.fillStyle = "#0a0a14";
      ctx.fillRect(0, 0, width, height);

      // Draw grid lines
      ctx.strokeStyle = "rgba(255, 255, 255, 0.05)";
      ctx.lineWidth = 1;
      for (let i = 0; i < width; i += 40) {
        ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i, height); ctx.stroke();
      }
      for (let i = 0; i < height; i += 40) {
        ctx.beginPath(); ctx.moveTo(0, i); ctx.lineTo(width, i); ctx.stroke();
      }

      // Draw animated heat blobs
      const drawBlob = (x: number, y: number, r: number, rColor: number, gColor: number, bColor: number) => {
        const grad = ctx.createRadialGradient(x, y, 0, x, y, r);
        grad.addColorStop(0, `rgba(${rColor}, ${gColor}, ${bColor}, 0.8)`);
        grad.addColorStop(0.5, `rgba(${rColor}, ${gColor}, ${bColor}, 0.3)`);
        grad.addColorStop(1, `rgba(${rColor}, ${gColor}, ${bColor}, 0)`);
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(x, y, r, 0, Math.PI * 2);
        ctx.fill();
      };

      ctx.globalCompositeOperation = "screen";

      // Colors based on time of day
      const getColors = () => {
        switch(activeTab) {
          case "morning": return [[0, 255, 255], [0, 150, 255], [255, 200, 0]]; // Teals & Yellow
          case "afternoon": return [[255, 100, 0], [255, 50, 0], [255, 200, 0]]; // Oranges
          case "evening": return [[200, 0, 255], [100, 0, 255], [255, 0, 100]]; // Purples & Pinks
          case "night": return [[0, 50, 255], [0, 20, 150], [50, 0, 100]]; // Deep Blues
          default: return [[0, 255, 255], [0, 255, 255], [0, 255, 255]];
        }
      };

      const colors = getColors();

      drawBlob(
        width/2 + Math.sin(time) * 150, 
        height/2 + Math.cos(time * 0.8) * 100, 
        200, colors[0][0], colors[0][1], colors[0][2]
      );
      
      drawBlob(
        width/3 + Math.cos(time * 1.2) * 120, 
        height/3 + Math.sin(time * 1.5) * 150, 
        250, colors[1][0], colors[1][1], colors[1][2]
      );

      drawBlob(
        width*0.7 + Math.sin(time * 0.9) * 100, 
        height*0.7 + Math.cos(time * 1.1) * 120, 
        180, colors[2][0], colors[2][1], colors[2][2]
      );

      ctx.globalCompositeOperation = "source-over";
      animationId = requestAnimationFrame(draw);
    };

    draw();

    const handleResize = () => {
      width = canvas.width = canvas.clientWidth;
      height = canvas.height = canvas.clientHeight;
    };
    window.addEventListener("resize", handleResize);

    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener("resize", handleResize);
    };
  }, [activeTab]);

  return (
    <div className="flex flex-col h-full w-full">
      <div className="p-6 md:p-8 shrink-0 flex items-center justify-between border-b border-white/10 bg-background/50 z-10">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-orange-500/20 to-red-500/20 flex items-center justify-center border border-orange-500/30">
            <ThermometerSun className="w-6 h-6 text-orange-500" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-white">Heatmaps</h1>
            <p className="text-white/60 text-sm">Real-time density and flow visualizations</p>
          </div>
        </div>
        
        <div className="flex bg-card border border-white/10 rounded-lg p-1">
          {tabs.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-6 py-2 rounded-md text-sm font-medium capitalize transition-all ${
                activeTab === tab 
                  ? "bg-white/10 text-white shadow-sm" 
                  : "text-white/50 hover:text-white hover:bg-white/5"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 relative overflow-hidden bg-background">
        <canvas 
          ref={canvasRef} 
          className="absolute inset-0 w-full h-full"
        />
        
        {/* UI Overlay */}
        <div className="absolute top-8 left-8 p-6 bg-card/60 backdrop-blur-xl border border-white/10 rounded-2xl w-80">
          <h3 className="text-lg font-bold text-white mb-4">Legend</h3>
          <div className="space-y-4">
            <div>
              <div className="text-xs text-white/50 uppercase tracking-wider mb-2">Intensity</div>
              <div className="h-3 w-full rounded-full bg-gradient-to-r from-transparent via-current to-white opacity-80" 
                style={{ 
                  color: activeTab === 'morning' ? '#00ffff' : 
                         activeTab === 'afternoon' ? '#ff6400' : 
                         activeTab === 'evening' ? '#c800ff' : '#0032ff' 
                }} 
              />
              <div className="flex justify-between text-xs text-white/40 mt-1">
                <span>Low</span>
                <span>High</span>
              </div>
            </div>
            
            <div className="pt-4 border-t border-white/10 space-y-3">
              <label className="flex items-center gap-3 text-sm text-white/80 cursor-pointer">
                <input type="checkbox" defaultChecked className="rounded border-white/20 bg-white/5 text-primary" />
                Crowd Density
              </label>
              <label className="flex items-center gap-3 text-sm text-white/80 cursor-pointer">
                <input type="checkbox" defaultChecked className="rounded border-white/20 bg-white/5 text-primary" />
                Traffic Flow
              </label>
              <label className="flex items-center gap-3 text-sm text-white/80 cursor-pointer">
                <input type="checkbox" className="rounded border-white/20 bg-white/5 text-primary" />
                Noise Levels
              </label>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
