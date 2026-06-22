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

import ViralHub from "@/pages/ViralHub";
import TravelPlanner from "@/pages/TravelPlanner";
import TimeCapsule from "@/pages/TimeCapsule";
import WorldPulse from "@/pages/WorldPulse";
import HistoricalWhatIf from "@/pages/HistoricalWhatIf";
import NeighborhoodDNA from "@/pages/NeighborhoodDNA";
import EventRadar from "@/pages/EventRadar";
import CityCompatibility from "@/pages/CityCompatibility";
import CityPortfolio from "@/pages/CityPortfolio";
import SmartAlerts from "@/pages/SmartAlerts";
import CrowdForecast from "@/pages/CrowdForecast";
import CityReporter from "@/pages/CityReporter";
import ExplorerHub from "@/pages/ExplorerHub";

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
        <Route path="/viral" component={ViralHub} />
        <Route path="/planner" component={TravelPlanner} />
        <Route path="/capsule" component={TimeCapsule} />
        <Route path="/pulse" component={WorldPulse} />
        <Route path="/history" component={HistoricalWhatIf} />
        <Route path="/neighborhoods" component={NeighborhoodDNA} />
        <Route path="/events" component={EventRadar} />
        <Route path="/compatibility" component={CityCompatibility} />
        <Route path="/portfolio" component={CityPortfolio} />
        <Route path="/alerts" component={SmartAlerts} />
        <Route path="/forecast" component={CrowdForecast} />
        <Route path="/reporter" component={CityReporter} />
        <Route path="/explorer" component={ExplorerHub} />
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
