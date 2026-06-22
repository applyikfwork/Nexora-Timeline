import React from "react";
import { useGetAnalyticsStats, useGetPopularCities } from "@workspace/api-client-react";
import { BarChart3, Users, Cpu, Database, Activity, Loader2, ArrowUpRight } from "lucide-react";
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";

export default function Analytics() {
  const { data: stats, isLoading: loadingStats } = useGetAnalyticsStats();
  const { data: cities, isLoading: loadingCities } = useGetPopularCities({ limit: 10 });

  // Mock data for the chart since the API just returns flat stats
  const chartData = [
    { name: 'Mon', requests: 4000 },
    { name: 'Tue', requests: 5200 },
    { name: 'Wed', requests: 4800 },
    { name: 'Thu', requests: 7000 },
    { name: 'Fri', requests: 6500 },
    { name: 'Sat', requests: 8500 },
    { name: 'Sun', requests: 10000 },
  ];

  return (
    <div className="p-6 md:p-12 max-w-7xl mx-auto space-y-8">
      <div className="flex items-center gap-4 border-b border-white/10 pb-6">
        <div className="w-12 h-12 rounded-xl bg-blue-500/20 flex items-center justify-center border border-blue-500/30">
          <BarChart3 className="w-6 h-6 text-blue-500" />
        </div>
        <div>
          <h1 className="text-3xl font-bold text-white">System Analytics</h1>
          <p className="text-white/60 text-sm">Platform usage and global exploration metrics</p>
        </div>
      </div>

      {loadingStats ? (
        <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-blue-500" /></div>
      ) : stats ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard icon={Users} title="Total Users" value={stats.totalUsers.toLocaleString()} trend="+12%" />
          <StatCard icon={Cpu} title="AI Requests" value={stats.totalAiRequests.toLocaleString()} trend="+45%" color="text-primary" />
          <StatCard icon={Activity} title="API Calls" value={stats.totalApiCalls.toLocaleString()} trend="+23%" color="text-secondary" />
          <StatCard icon={Database} title="Storage Used" value={stats.totalStorageUsed} />
        </div>
      ) : null}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-card border border-white/10 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-white mb-6">Request Volume (7 Days)</h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="colorRequests" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                <XAxis dataKey="name" stroke="rgba(255,255,255,0.5)" tick={{ fill: 'rgba(255,255,255,0.5)', fontSize: 12 }} />
                <YAxis stroke="rgba(255,255,255,0.5)" tick={{ fill: 'rgba(255,255,255,0.5)', fontSize: 12 }} />
                <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'rgba(255,255,255,0.1)' }} />
                <Area type="monotone" dataKey="requests" stroke="#3b82f6" fillOpacity={1} fill="url(#colorRequests)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-card border border-white/10 rounded-xl p-6 flex flex-col">
          <h3 className="text-lg font-semibold text-white mb-6">Trending Cities</h3>
          {loadingCities ? (
            <div className="flex-1 flex items-center justify-center"><Loader2 className="w-6 h-6 animate-spin text-white/30" /></div>
          ) : cities ? (
            <div className="space-y-4 flex-1 overflow-y-auto pr-2">
              {cities.map((city, idx) => (
                <div key={idx} className="flex items-center justify-between p-3 rounded-lg bg-background/50 hover:bg-white/5 transition-colors border border-transparent hover:border-white/10">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-sm font-bold text-white/70">
                      {idx + 1}
                    </div>
                    <div>
                      <div className="font-semibold text-white">{city.name}</div>
                      <div className="text-xs text-white/50">{city.country}</div>
                    </div>
                  </div>
                  <div className="flex flex-col items-end">
                    <div className="text-sm font-mono text-white/80">{city.searchCount.toLocaleString()}</div>
                    {city.trending && <ArrowUpRight className="w-4 h-4 text-green-400" />}
                  </div>
                </div>
              ))}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}

function StatCard({ icon: Icon, title, value, trend, color = "text-blue-500" }: any) {
  return (
    <div className="bg-card border border-white/10 rounded-xl p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-medium text-white/60">{title}</h3>
        <Icon className={`w-5 h-5 ${color}`} />
      </div>
      <div className="text-3xl font-bold text-white mb-1">{value}</div>
      {trend && <div className="text-xs text-green-400">{trend} from last week</div>}
    </div>
  );
}
