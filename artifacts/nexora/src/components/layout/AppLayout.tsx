import React, { ReactNode } from "react";
import { Sidebar } from "./Sidebar";
import { LiveTicker } from "@/components/LiveTicker";
import { GeoLocationBanner } from "@/components/GeoLocationBanner";

export function Layout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen bg-background text-foreground dark selection:bg-primary/30">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <GeoLocationBanner />
        <LiveTicker />
        <main className="flex-1 overflow-auto relative">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/5 via-background to-background -z-10 pointer-events-none" />
          {children}
        </main>
      </div>
    </div>
  );
}
