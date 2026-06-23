import React, { useState } from "react";
import { Link, useLocation } from "wouter";
import {
  Globe,
  Map as MapIcon,
  Clock,
  ThermometerSun,
  BrainCircuit,
  MessageSquare,
  Bookmark,
  BarChart3,
  Share2,
  Plane,
  Hourglass,
  Radio,
  BookOpen,
  MapPin,
  Bell as BellIcon,
  CalendarDays,
  Newspaper,
  Award,
  Heart,
  ChevronLeft,
  ChevronRight,
  Zap,
  TrendingUp,
} from "lucide-react";

const SECTIONS = [
  {
    label: "Core",
    links: [
      { href: "/", label: "Home", icon: Globe },
      { href: "/map", label: "Explore Map", icon: MapIcon },
      { href: "/chat", label: "AI Assistant", icon: MessageSquare },
      { href: "/saved", label: "Saved Places", icon: Bookmark },
    ],
  },
  {
    label: "🔥 Viral",
    links: [
      { href: "/viral", label: "Viral Hub", icon: Share2 },
      { href: "/pulse", label: "Live World Pulse", icon: Radio },
      { href: "/capsule", label: "Time Capsule", icon: Hourglass },
    ],
  },
  {
    label: "🧠 AI Power",
    links: [
      { href: "/planner", label: "Travel Planner", icon: Plane },
      { href: "/history", label: "Historical What-If", icon: BookOpen },
      { href: "/neighborhoods", label: "Neighborhood DNA", icon: MapPin },
      { href: "/events", label: "Event Radar", icon: BellIcon },
      { href: "/compatibility", label: "City Compatibility", icon: Heart },
      { href: "/reporter", label: "City Reporter", icon: Newspaper },
    ],
  },
  {
    label: "📊 Power Tools",
    links: [
      { href: "/portfolio", label: "City Portfolio", icon: TrendingUp },
      { href: "/alerts", label: "Smart Alerts", icon: Zap },
      { href: "/forecast", label: "Crowd Forecast", icon: CalendarDays },
      { href: "/time-machine", label: "Time Machine", icon: Clock },
      { href: "/heatmaps", label: "Heatmaps", icon: ThermometerSun },
      { href: "/insights", label: "AI Insights", icon: BrainCircuit },
    ],
  },
  {
    label: "🌐 Community",
    links: [
      { href: "/explorer", label: "Explorer Hub", icon: Award },
      { href: "/analytics", label: "Analytics", icon: BarChart3 },
    ],
  },
];

export function Sidebar() {
  const [location] = useLocation();
  const [collapsed, setCollapsed] = useState(false);

  return (
    <aside className={`${collapsed ? "w-16" : "w-64"} bg-card border-r border-border min-h-screen flex flex-col transition-all duration-300 relative flex-shrink-0`}>
      <div className={`flex items-center ${collapsed ? "justify-center" : "justify-between"} px-3 py-4 border-b border-white/5`}>
        {!collapsed && (
          <div className="flex items-center gap-2.5">
            <img src="/favicon.ico" alt="Nexora" className="w-7 h-7 rounded-lg object-cover" />
            <h1 className="text-lg font-black tracking-widest text-primary">NEXORA</h1>
          </div>
        )}
        {collapsed && (
          <img src="/favicon.ico" alt="Nexora" className="w-7 h-7 rounded-lg object-cover" />
        )}
        <button
          onClick={() => setCollapsed(c => !c)}
          className={`p-1 rounded-md text-white/30 hover:text-white/70 hover:bg-white/5 transition-all ${collapsed ? "absolute -right-3 top-5 bg-card border border-white/10 rounded-full w-6 h-6 flex items-center justify-center z-10" : ""}`}
        >
          {collapsed ? <ChevronRight className="w-3 h-3" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      </div>

      <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-1">
        {SECTIONS.map((section) => (
          <div key={section.label} className="mb-1">
            {!collapsed && (
              <div className="px-2 py-1.5 text-xs font-bold text-white/25 uppercase tracking-widest">
                {section.label}
              </div>
            )}
            {collapsed && <div className="h-px bg-white/5 my-2 mx-1" />}
            {section.links.map((link) => {
              const Icon = link.icon;
              const isActive = location === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  title={collapsed ? link.label : undefined}
                  className={`flex items-center ${collapsed ? "justify-center" : "gap-2.5"} px-2.5 py-2 rounded-lg transition-all text-sm mb-0.5 ${
                    isActive
                      ? "bg-primary/10 text-primary border border-primary/20"
                      : "text-white/50 hover:text-white hover:bg-white/5 border border-transparent"
                  }`}
                >
                  <Icon className={`${collapsed ? "w-5 h-5" : "w-4 h-4"} flex-shrink-0`} />
                  {!collapsed && <span className="font-medium truncate">{link.label}</span>}
                </Link>
              );
            })}
          </div>
        ))}
      </nav>

      {!collapsed && (
        <div className="p-3 border-t border-white/5">
          <div className="text-xs text-white/20 text-center">Nexora Intelligence v2.0</div>
        </div>
      )}
    </aside>
  );
}
