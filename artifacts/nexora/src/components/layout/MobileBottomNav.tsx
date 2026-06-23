import React from "react";
import { Link, useLocation } from "wouter";
import {
  Globe, Map as MapIcon, BrainCircuit, MessageSquare, MoreHorizontal,
  Home, IndianRupee, Trophy, ArrowLeftRight
} from "lucide-react";

const NAV_ITEMS = [
  { href: "/", label: "Home", icon: Home },
  { href: "/india", label: "India", icon: IndianRupee },
  { href: "/map", label: "Explore", icon: MapIcon },
  { href: "/insights", label: "Insights", icon: BrainCircuit },
  { href: "/chat", label: "AI Chat", icon: MessageSquare },
];

export function MobileBottomNav() {
  const [location] = useLocation();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-black/80 backdrop-blur-xl border-t border-white/10 md:hidden">
      <div className="flex items-center justify-around px-2 py-2 pb-safe">
        {NAV_ITEMS.map(item => {
          const Icon = item.icon;
          const isActive = location === item.href;
          return (
            <Link key={item.href} href={item.href}
              className={`flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-xl transition-all ${isActive ? "text-violet-400" : "text-white/40 hover:text-white/70"}`}>
              <Icon className={`w-5 h-5 ${isActive ? "text-violet-400" : ""}`} />
              <span className="text-[10px] font-medium">{item.label}</span>
              {isActive && <div className="w-1 h-1 bg-violet-400 rounded-full" />}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
