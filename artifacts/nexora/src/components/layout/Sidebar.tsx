import React from "react";
import { Link, useLocation } from "wouter";
import { 
  Globe, 
  Map as MapIcon, 
  Clock, 
  ThermometerSun, 
  BrainCircuit, 
  MessageSquare, 
  Bookmark, 
  BarChart3 
} from "lucide-react";

export function Sidebar() {
  const [location] = useLocation();

  const links = [
    { href: "/", label: "Home", icon: Globe },
    { href: "/map", label: "Explore Map", icon: MapIcon },
    { href: "/time-machine", label: "Time Machine", icon: Clock },
    { href: "/heatmaps", label: "Heatmaps", icon: ThermometerSun },
    { href: "/insights", label: "Insights", icon: BrainCircuit },
    { href: "/chat", label: "AI Assistant", icon: MessageSquare },
    { href: "/saved", label: "Saved Places", icon: Bookmark },
    { href: "/analytics", label: "Analytics", icon: BarChart3 },
  ];

  return (
    <aside className="w-64 bg-card border-r border-border min-h-screen p-4 flex flex-col gap-2">
      <div className="flex items-center gap-3 px-2 py-4 mb-4">
        <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center border border-primary">
          <Globe className="w-5 h-5 text-primary" />
        </div>
        <h1 className="text-xl font-bold tracking-wider text-primary">NEXORA</h1>
      </div>
      
      <nav className="flex flex-col gap-1">
        {links.map((link) => {
          const Icon = link.icon;
          const isActive = location === link.href;
          return (
            <Link 
              key={link.href} 
              href={link.href}
              className={`flex items-center gap-3 px-3 py-2 rounded-md transition-colors ${
                isActive 
                  ? "bg-primary/10 text-primary border border-primary/20 shadow-[0_0_15px_rgba(0,255,255,0.1)]" 
                  : "text-muted-foreground hover:text-foreground hover:bg-muted"
              }`}
            >
              <Icon className="w-5 h-5" />
              <span className="font-medium text-sm">{link.label}</span>
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
