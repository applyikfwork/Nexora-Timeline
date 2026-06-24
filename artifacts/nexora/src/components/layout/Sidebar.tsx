import React, { useState, useRef, useEffect } from "react";
import { Link, useLocation } from "wouter";
import {
  Globe, Map as MapIcon, Clock, ThermometerSun, BrainCircuit,
  MessageSquare, Bookmark, BarChart3, Share2, Plane, Hourglass,
  Radio, BookOpen, MapPin, Bell as BellIcon, CalendarDays,
  Newspaper, Award, Heart, ChevronLeft, ChevronRight, Zap,
  TrendingUp, Search, X, IndianRupee, ArrowLeftRight, Trophy,
  Building2, Shield, LogIn, LogOut, User, AlertTriangle,
} from "lucide-react";
import { useAppContext } from "@/lib/store";
import { useSearchPlaces } from "@workspace/api-client-react";
import { useAuth } from "@/lib/auth";

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
    label: "🇮🇳 India First",
    links: [
      { href: "/india", label: "India Intelligence", icon: IndianRupee },
      { href: "/leaderboard", label: "City Leaderboard", icon: Trophy },
      { href: "/compare", label: "City vs City", icon: ArrowLeftRight },
      { href: "/business", label: "Business Intel", icon: Building2 },
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
    label: "🚨 Alert Network",
    links: [
      { href: "/alert-network", label: "Alert Network", icon: AlertTriangle },
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

const ADMIN_EMAIL = "xyzapplywork@gmail.com";

function SidebarSearch() {
  const { activePlaceName, setActivePlaceName } = useAppContext();
  const [query, setQuery] = useState(activePlaceName);
  const [open, setOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  const { data: results = [] } = useSearchPlaces(
    { q: query, limit: 5 },
    { query: { enabled: query.length > 1, queryKey: ["sidebarSearch", query] } }
  );

  useEffect(() => { setQuery(activePlaceName); }, [activePlaceName]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const select = (name: string) => {
    setQuery(name);
    setActivePlaceName(name);
    setOpen(false);
  };

  return (
    <div ref={wrapperRef} className="px-2 pb-2 relative">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/30 pointer-events-none" />
        <input value={query}
          onChange={e => { setQuery(e.target.value); setOpen(true); }}
          onFocus={() => setOpen(true)}
          placeholder="Search any place…"
          className="w-full bg-white/5 border border-white/10 rounded-lg pl-8 pr-7 py-2 text-xs text-white placeholder:text-white/25 focus:outline-none focus:border-violet-500/50 transition-colors"
        />
        {query && (
          <button onClick={() => { setQuery(""); setActivePlaceName(""); }}
            className="absolute right-2 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/70">
            <X className="w-3 h-3" />
          </button>
        )}
      </div>
      {open && query.length > 1 && results.length > 0 && (
        <div className="absolute top-full left-2 right-2 mt-1 z-50 bg-[#0d0010] border border-white/10 rounded-xl overflow-hidden shadow-2xl">
          {results.slice(0, 5).map(r => (
            <button key={r.id} onClick={() => select(r.name)}
              className="w-full flex items-center gap-2 px-3 py-2.5 hover:bg-white/5 transition-colors text-left">
              <MapPin className="w-3 h-3 text-violet-400 flex-shrink-0" />
              <span className="text-xs text-white/80 truncate">{r.name}</span>
              <span className="text-xs text-white/25 ml-auto flex-shrink-0">{r.country}</span>
            </button>
          ))}
          <button onClick={() => select(query)}
            className="w-full flex items-center gap-2 px-3 py-2.5 text-violet-400 border-t border-white/5 hover:bg-violet-500/10 transition-colors text-xs">
            <Search className="w-3 h-3" /> Use "{query}"
          </button>
        </div>
      )}
      {activePlaceName && (
        <div className="mt-1.5 flex items-center gap-1.5 px-1">
          <MapPin className="w-3 h-3 text-violet-400 flex-shrink-0" />
          <span className="text-xs text-violet-400 truncate font-medium">{activePlaceName}</span>
        </div>
      )}
    </div>
  );
}

function UserSection() {
  const { user, isLoaded, signOut } = useAuth();
  const basePath = import.meta.env.BASE_URL.replace(/\/$/, "");
  const isAdmin = isLoaded && user?.email === ADMIN_EMAIL;

  if (!isLoaded) return null;

  return (
    <div className="px-2 py-2 border-t border-white/5 space-y-1">
      {user ? (
        <>
          {isAdmin && (
            <Link href="/admin"
              className="flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-sm text-amber-400 hover:bg-amber-500/10 border border-transparent hover:border-amber-500/20 transition-all">
              <Shield className="w-4 h-4" />
              <span className="font-medium">Admin Panel</span>
            </Link>
          )}
          <div className="flex items-center gap-2.5 px-2.5 py-2">
            <div className="w-6 h-6 rounded-full bg-violet-500/30 flex items-center justify-center flex-shrink-0">
              <User className="w-3 h-3 text-violet-400" />
            </div>
            <span className="text-xs text-white/50 truncate">{user.email}</span>
          </div>
          <button onClick={() => signOut()}
            className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-sm text-white/40 hover:text-white hover:bg-white/5 transition-all">
            <LogOut className="w-4 h-4" />
            <span>Sign Out</span>
          </button>
        </>
      ) : (
        <Link href="/sign-in"
          className="flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-sm text-violet-400 hover:bg-violet-500/10 border border-transparent hover:border-violet-500/20 transition-all">
          <LogIn className="w-4 h-4" />
          <span className="font-medium">Sign In / Sign Up</span>
        </Link>
      )}
    </div>
  );
}

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
        {collapsed && <img src="/favicon.ico" alt="Nexora" className="w-7 h-7 rounded-lg object-cover" />}
        <button onClick={() => setCollapsed(c => !c)}
          className={`p-1 rounded-md text-white/30 hover:text-white/70 hover:bg-white/5 transition-all ${collapsed ? "absolute -right-3 top-5 bg-card border border-white/10 rounded-full w-6 h-6 flex items-center justify-center z-10" : ""}`}>
          {collapsed ? <ChevronRight className="w-3 h-3" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      </div>

      {!collapsed && <SidebarSearch />}

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
                <Link key={link.href} href={link.href} title={collapsed ? link.label : undefined}
                  className={`flex items-center ${collapsed ? "justify-center" : "gap-2.5"} px-2.5 py-2 rounded-lg transition-all text-sm mb-0.5 ${
                    isActive
                      ? "bg-primary/10 text-primary border border-primary/20"
                      : "text-white/50 hover:text-white hover:bg-white/5 border border-transparent"
                  }`}>
                  <Icon className={`${collapsed ? "w-5 h-5" : "w-4 h-4"} flex-shrink-0`} />
                  {!collapsed && <span className="font-medium truncate">{link.label}</span>}
                </Link>
              );
            })}
          </div>
        ))}
      </nav>

      {!collapsed && <UserSection />}

      {!collapsed && (
        <div className="p-3 border-t border-white/5">
          <div className="text-xs text-white/20 text-center">Nexora Intelligence v2.1</div>
        </div>
      )}
    </aside>
  );
}
