import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Bell, Plus, Trash2, Loader2, CheckCircle, AlertCircle } from "lucide-react";

const PLACES = [
  { id: "delhi-in", name: "Delhi" },
  { id: "mumbai-in", name: "Mumbai" },
  { id: "london-uk", name: "London" },
  { id: "new-york-us", name: "New York" },
  { id: "tokyo-jp", name: "Tokyo" },
  { id: "paris-fr", name: "Paris" },
  { id: "dubai-ae", name: "Dubai" },
  { id: "singapore-sg", name: "Singapore" },
  { id: "seoul-kr", name: "Seoul" },
  { id: "berlin-de", name: "Berlin" },
];

const METRICS = ["Crowd Level", "Traffic Level", "Vibe Score", "Noise Level", "Safety Score"];

interface Alert {
  id: string;
  placeId: string;
  placeName: string;
  metric: string;
  condition: "below" | "above";
  threshold: number;
  active: boolean;
  createdAt: string;
}

const SAMPLE_ALERTS: Alert[] = [
  { id: "demo1", placeId: "tokyo-jp", placeName: "Tokyo", metric: "Crowd Level", condition: "below", threshold: 40, active: true, createdAt: new Date(Date.now() - 86400000).toISOString() },
  { id: "demo2", placeId: "paris-fr", placeName: "Paris", metric: "Vibe Score", condition: "above", threshold: 85, active: true, createdAt: new Date(Date.now() - 3600000).toISOString() },
];

export default function SmartAlerts() {
  const [alerts, setAlerts] = useState<Alert[]>(SAMPLE_ALERTS);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ placeId: "tokyo-jp", metric: "Crowd Level", condition: "below" as "below" | "above", threshold: 40 });
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/forecast/alerts")
      .then(r => r.json())
      .then(d => { if (Array.isArray(d) && d.length > 0) setAlerts([...SAMPLE_ALERTS, ...d]); })
      .catch(() => {});
  }, []);

  async function create(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    try {
      const place = PLACES.find(p => p.id === form.placeId);
      const res = await fetch("/api/forecast/alerts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, placeName: place?.name }),
      });
      const newAlert = await res.json();
      setAlerts(prev => [...prev, newAlert]);
      setShowForm(false);
      showToast("Alert created successfully!");
    } finally {
      setSubmitting(false);
    }
  }

  async function remove(id: string) {
    if (id.startsWith("demo")) {
      setAlerts(prev => prev.filter(a => a.id !== id));
      return;
    }
    await fetch(`/api/forecast/alerts/${id}`, { method: "DELETE" }).catch(() => {});
    setAlerts(prev => prev.filter(a => a.id !== id));
    showToast("Alert removed");
  }

  function showToast(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  }

  const conditionLabel = (a: Alert) => `${a.metric} ${a.condition} ${a.threshold}%`;

  return (
    <div className="p-6 md:p-10 max-w-3xl mx-auto space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-yellow-500/20 flex items-center justify-center border border-yellow-500/30">
            <Bell className="w-6 h-6 text-yellow-400" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-white">Smart Alerts</h1>
            <p className="text-white/60 text-sm">Get notified when cities hit your thresholds</p>
          </div>
        </div>
        <button onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-black rounded-lg font-bold text-sm hover:bg-primary/90 transition-all">
          <Plus className="w-4 h-4" /> New Alert
        </button>
      </div>

      <AnimatePresence>
        {showForm && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
            <form onSubmit={create} className="bg-card border border-primary/30 rounded-2xl p-6 space-y-4">
              <h3 className="font-bold text-white flex items-center gap-2"><Plus className="w-4 h-4 text-primary" /> Create Alert</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-white/50 uppercase tracking-wider mb-1.5 block">City</label>
                  <select value={form.placeId} onChange={e => setForm(f => ({ ...f, placeId: e.target.value }))}
                    className="w-full bg-background border border-white/10 text-white rounded-lg px-3 py-2.5 text-sm">
                    {PLACES.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs text-white/50 uppercase tracking-wider mb-1.5 block">Metric</label>
                  <select value={form.metric} onChange={e => setForm(f => ({ ...f, metric: e.target.value }))}
                    className="w-full bg-background border border-white/10 text-white rounded-lg px-3 py-2.5 text-sm">
                    {METRICS.map(m => <option key={m}>{m}</option>)}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-white/50 uppercase tracking-wider mb-1.5 block">Condition</label>
                  <select value={form.condition} onChange={e => setForm(f => ({ ...f, condition: e.target.value as "below" | "above" }))}
                    className="w-full bg-background border border-white/10 text-white rounded-lg px-3 py-2.5 text-sm">
                    <option value="below">Falls Below</option>
                    <option value="above">Rises Above</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs text-white/50 uppercase tracking-wider mb-1.5 block">Threshold: {form.threshold}%</label>
                  <input type="range" min={0} max={100} value={form.threshold} onChange={e => setForm(f => ({ ...f, threshold: +e.target.value }))}
                    className="w-full accent-primary mt-2" />
                </div>
              </div>
              <div className="bg-primary/10 rounded-lg p-3 text-sm text-primary/80">
                📢 Alert when <strong>{form.metric}</strong> in <strong>{PLACES.find(p => p.id === form.placeId)?.name}</strong> {form.condition === "below" ? "drops below" : "rises above"} <strong>{form.threshold}%</strong>
              </div>
              <div className="flex gap-3">
                <button type="submit" disabled={submitting}
                  className="flex items-center gap-2 px-5 py-2.5 bg-primary text-black rounded-xl font-bold text-sm hover:bg-primary/90 disabled:opacity-50">
                  {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Bell className="w-4 h-4" />}
                  Create Alert
                </button>
                <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2.5 bg-white/10 rounded-xl text-white text-sm hover:bg-white/20">Cancel</button>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-white/60 uppercase tracking-wider">Active Alerts ({alerts.length})</h3>
        </div>

        {alerts.length === 0 && (
          <div className="text-center py-16 text-white/30 border border-dashed border-white/10 rounded-2xl">
            <Bell className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p>No alerts yet. Create one to get notified about city changes.</p>
          </div>
        )}

        {alerts.map((alert, i) => (
          <motion.div key={alert.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }}
            className="flex items-center gap-4 p-4 bg-card border border-white/10 rounded-xl hover:border-yellow-500/20 transition-all">
            <div className="w-10 h-10 rounded-full bg-yellow-500/10 border border-yellow-500/20 flex items-center justify-center flex-shrink-0">
              <Bell className="w-5 h-5 text-yellow-400" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-bold text-white text-sm">{alert.placeName}</div>
              <div className="text-xs text-white/50">
                Notify when <span className="text-yellow-400">{conditionLabel(alert)}</span>
              </div>
              <div className="text-xs text-white/30 mt-0.5">Created {new Date(alert.createdAt).toLocaleDateString()}</div>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                <span className="text-xs text-green-400">Active</span>
              </div>
              <button onClick={() => remove(alert.id)}
                className="p-1.5 rounded-lg hover:bg-red-500/20 text-white/30 hover:text-red-400 transition-all">
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="bg-card border border-white/10 rounded-xl p-5">
        <h3 className="font-bold text-white mb-3 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-primary" /> Recent Triggers
        </h3>
        <div className="space-y-2">
          {[
            { city: "Tokyo", trigger: "Crowd Level dropped to 28% (was set at 40%)", time: "2h ago", type: "below" },
            { city: "Paris", trigger: "Vibe Score reached 91% (threshold: 85%)", time: "5h ago", type: "above" },
            { city: "Dubai", trigger: "Traffic Level hit 82% (was set at 70%)", time: "Yesterday", type: "above" },
          ].map((t, i) => (
            <div key={i} className="flex items-start gap-3 p-3 bg-background/50 rounded-lg">
              <CheckCircle className="w-4 h-4 text-green-400 mt-0.5 flex-shrink-0" />
              <div>
                <div className="text-sm text-white font-medium">{t.city}</div>
                <div className="text-xs text-white/50">{t.trigger}</div>
              </div>
              <div className="ml-auto text-xs text-white/30 flex-shrink-0">{t.time}</div>
            </div>
          ))}
        </div>
      </div>

      <AnimatePresence>
        {toast && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }}
            className="fixed bottom-6 right-6 bg-primary text-black font-bold px-4 py-3 rounded-xl shadow-lg">
            ✅ {toast}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
