import React, { ReactNode } from "react";
import { Sidebar } from "./Sidebar";

export function Layout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen bg-background text-foreground dark selection:bg-primary/30">
      <Sidebar />
      <main className="flex-1 overflow-auto relative">
        {/* Subtle background glow effect */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/5 via-background to-background -z-10" />
        {children}
      </main>
    </div>
  );
}
