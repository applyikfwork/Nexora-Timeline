import React, { ReactNode } from "react";
import { Sidebar } from "./Sidebar";
import { MobileBottomNav } from "./MobileBottomNav";
import { LiveTicker } from "@/components/LiveTicker";
import { LocationSwitcher, TravelAlertToast } from "@/components/LocationSwitcher";

export function Layout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen bg-background text-foreground dark selection:bg-primary/30">
      {/* Desktop sidebar */}
      <div className="hidden md:flex">
        <Sidebar />
      </div>

      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Universal location bar — persists across all pages */}
        <div className="flex-shrink-0 flex items-center justify-between gap-3 px-4 py-2 border-b border-white/5 bg-card/50 backdrop-blur-sm">
          <LiveTicker className="flex-1 min-w-0" />
          <div className="flex-shrink-0">
            <LocationSwitcher />
          </div>
        </div>

        {/* Phase 5: Travel alert toast — appears below the bar */}
        <TravelAlertToast />

        <main className="flex-1 overflow-auto relative pb-16 md:pb-0">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/5 via-background to-background -z-10 pointer-events-none" />
          {children}
        </main>
      </div>

      {/* Mobile bottom nav */}
      <MobileBottomNav />
    </div>
  );
}
