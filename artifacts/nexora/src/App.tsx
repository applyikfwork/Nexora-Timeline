import React, { useEffect, useRef } from "react";
import { Switch, Route, Router as WouterRouter, useLocation, Redirect } from "wouter";
import { QueryClient, QueryClientProvider, useQueryClient } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AppProvider } from "@/lib/store";
import { Layout } from "@/components/layout/AppLayout";
import { ClerkProvider, SignIn as ClerkSignIn, SignUp as ClerkSignUp, Show, useClerk } from "@clerk/react";
import { publishableKeyFromHost } from "@clerk/react/internal";
import { shadcn } from "@clerk/themes";

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
import IndiaIntelligence from "@/pages/IndiaIntelligence";
import CityComparison from "@/pages/CityComparison";
import Leaderboard from "@/pages/Leaderboard";
import BusinessIntelligence from "@/pages/BusinessIntelligence";
import AdminPanel from "@/pages/AdminPanel";
import NotFound from "@/pages/not-found";

const basePath = import.meta.env.BASE_URL.replace(/\/$/, "");
const queryClient = new QueryClient();

// REQUIRED — copy verbatim per Clerk skill
const clerkPubKey = publishableKeyFromHost(
  window.location.hostname,
  import.meta.env.VITE_CLERK_PUBLISHABLE_KEY,
);
const clerkProxyUrl = import.meta.env.VITE_CLERK_PROXY_URL;

function stripBase(path: string): string {
  return basePath && path.startsWith(basePath) ? path.slice(basePath.length) || "/" : path;
}

const clerkAppearance = {
  theme: shadcn,
  cssLayerName: "clerk",
  options: {
    logoPlacement: "inside" as const,
    logoLinkUrl: basePath || "/",
    logoImageUrl: `${window.location.origin}${basePath}/logo.svg`,
  },
  variables: {
    colorPrimary: "#8b5cf6",
    colorForeground: "#ffffff",
    colorMutedForeground: "rgba(255,255,255,0.5)",
    colorDanger: "#ef4444",
    colorBackground: "#0d0010",
    colorInput: "rgba(255,255,255,0.05)",
    colorInputForeground: "#ffffff",
    colorNeutral: "rgba(255,255,255,0.15)",
    fontFamily: "'Inter', sans-serif",
    borderRadius: "0.75rem",
  },
  elements: {
    rootBox: "w-full flex justify-center",
    cardBox: "bg-[#0d0010] border border-white/10 rounded-2xl w-[440px] max-w-full overflow-hidden shadow-2xl",
    card: "!shadow-none !border-0 !bg-transparent !rounded-none",
    footer: "!shadow-none !border-0 !bg-transparent !rounded-none",
    headerTitle: "text-white font-black",
    headerSubtitle: "text-white/50",
    socialButtonsBlockButtonText: "text-white",
    formFieldLabel: "text-white/70",
    footerActionLink: "text-violet-400 hover:text-violet-300",
    footerActionText: "text-white/40",
    dividerText: "text-white/30",
    identityPreviewEditButton: "text-violet-400",
    formFieldSuccessText: "text-green-400",
    alertText: "text-white",
    logoBox: "flex justify-center",
    logoImage: "h-10",
    socialButtonsBlockButton: "border border-white/10 bg-white/5 hover:bg-white/10",
    formButtonPrimary: "bg-violet-600 hover:bg-violet-500 text-white",
    formFieldInput: "bg-white/5 border border-white/10 text-white",
    footerAction: "border-t border-white/10",
    dividerLine: "bg-white/10",
    alert: "bg-red-500/10 border border-red-500/20",
    otpCodeFieldInput: "bg-white/5 border border-white/10 text-white",
    formFieldRow: "",
    main: "",
  },
};

function SignInPage() {
  return (
    <div className="min-h-screen bg-[radial-gradient(ellipse_at_top,_#1a0030_0%,_#000_60%)] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center">
              <span className="text-white font-black text-lg">N</span>
            </div>
            <span className="text-2xl font-black tracking-widest text-white">NEXORA</span>
          </div>
          <p className="text-white/40 text-sm">Location Intelligence Platform</p>
        </div>
        <ClerkSignIn routing="path" path={`${basePath}/sign-in`} signUpUrl={`${basePath}/sign-up`} />
      </div>
    </div>
  );
}

function SignUpPage() {
  return (
    <div className="min-h-screen bg-[radial-gradient(ellipse_at_top,_#1a0030_0%,_#000_60%)] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center">
              <span className="text-white font-black text-lg">N</span>
            </div>
            <span className="text-2xl font-black tracking-widest text-white">NEXORA</span>
          </div>
          <p className="text-white/40 text-sm">Join India's #1 location intelligence platform</p>
        </div>
        <ClerkSignUp routing="path" path={`${basePath}/sign-up`} signInUrl={`${basePath}/sign-in`} />
      </div>
    </div>
  );
}

function ClerkQueryClientCacheInvalidator() {
  const { addListener } = useClerk();
  const qc = useQueryClient();
  const prevRef = useRef<string | null | undefined>(undefined);
  useEffect(() => {
    const unsub = addListener(({ user }) => {
      const id = user?.id ?? null;
      if (prevRef.current !== undefined && prevRef.current !== id) qc.clear();
      prevRef.current = id;
    });
    return unsub;
  }, [addListener, qc]);
  return null;
}

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
        {/* New features */}
        <Route path="/india" component={IndiaIntelligence} />
        <Route path="/compare" component={CityComparison} />
        <Route path="/leaderboard" component={Leaderboard} />
        <Route path="/business" component={BusinessIntelligence} />
        <Route path="/admin" component={AdminPanel} />
        <Route component={NotFound} />
      </Switch>
    </Layout>
  );
}

function ClerkProviderWithRoutes() {
  const [, setLocation] = useLocation();
  return (
    <ClerkProvider
      publishableKey={clerkPubKey}
      proxyUrl={clerkProxyUrl}
      appearance={clerkAppearance}
      signInUrl={`${basePath}/sign-in`}
      signUpUrl={`${basePath}/sign-up`}
      localization={{
        signIn: { start: { title: "Welcome back to Nexora", subtitle: "Sign in to your intelligence dashboard" } },
        signUp: { start: { title: "Join Nexora Intelligence", subtitle: "India's most powerful location platform" } },
      }}
      routerPush={(to) => setLocation(stripBase(to))}
      routerReplace={(to) => setLocation(stripBase(to), { replace: true })}
    >
      <QueryClientProvider client={queryClient}>
        <ClerkQueryClientCacheInvalidator />
        <AppProvider>
          <TooltipProvider>
            <Switch>
              <Route path="/sign-in/*?" component={SignInPage} />
              <Route path="/sign-up/*?" component={SignUpPage} />
              <Route component={Router} />
            </Switch>
            <Toaster />
          </TooltipProvider>
        </AppProvider>
      </QueryClientProvider>
    </ClerkProvider>
  );
}

function App() {
  return (
    <WouterRouter base={basePath}>
      <ClerkProviderWithRoutes />
    </WouterRouter>
  );
}

export default App;
