import React from "react";
import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import { AppProvider } from "@/lib/store";
import { Layout } from "@/components/layout/AppLayout";

import Home from "@/pages/Home";
import MapDashboard from "@/pages/MapDashboard";
import TimeMachine from "@/pages/TimeMachine";
import Insights from "@/pages/Insights";
import Heatmaps from "@/pages/Heatmaps";
import SavedPlaces from "@/pages/SavedPlaces";
import Chat from "@/pages/Chat";
import Analytics from "@/pages/Analytics";

function Router() {
  return (
    <Layout>
      <Switch>
        <Route path="/" component={Home} />
        <Route path="/map" component={MapDashboard} />
        <Route path="/time-machine" component={TimeMachine} />
        <Route path="/insights" component={Insights} />
        <Route path="/heatmaps" component={Heatmaps} />
        <Route path="/saved" component={SavedPlaces} />
        <Route path="/chat" component={Chat} />
        <Route path="/analytics" component={Analytics} />
        <Route component={NotFound} />
      </Switch>
    </Layout>
  );
}

function App() {
  return (
    <QueryClientProvider client={new QueryClient()}>
      <AppProvider>
        <TooltipProvider>
          <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
            <Router />
          </WouterRouter>
          <Toaster />
        </TooltipProvider>
      </AppProvider>
    </QueryClientProvider>
  );
}

export default App;
