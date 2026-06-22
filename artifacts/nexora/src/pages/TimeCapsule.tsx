import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Clock, PenLine, Globe2, Loader2, ChevronDown } from "lucide-react";

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
  { id: "sydney-au", name: "Sydney" },
  { id: "bangalore-in", name: "Bangalore" },
];

interface Capsule {
  id: string;
  placeId: string;
  placeName: string;
  message: string;
  author: string;
  unlockYear: number;
  createdAt: string;
}

export default function TimeCapsule() {
  const [capsules, setCapsules] = useState<Capsule[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterPlace, setFilterPlace] = useState("");
  const [writing, setWriting] = useState(false);
  const [form, setForm] = useState({ placeId: "tokyo-jp", message: "", author: "" });
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  async function loadCapsules() {
    setLoading(true);
    try {
      const url = filterPlace ? `/api/capsule?placeId=${filterPlace}` : "/api/capsule";
      const res = await fetch(url);
      setCapsules(await res.json());
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { loadCapsules(); }, [filterPlace]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.message.trim()) return;
    setSubmitting(true);
    try {
      const place = PLACES.find(p => p.id === form.placeId);
      await fetch("/api/capsule", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, placeName: place?.name || form.placeId }),
      });
      setSubmitted(true);
      setWriting(false);
      setForm({ placeId: "tokyo-jp", message: "", author: "" });
      setTimeout(() => setSubmitted(false), 3000);
      await loadCapsules();
    } finally {
      setSubmitting(false);
    }
  }

  const daysTo2030 = Math.floor((new Date("2030-01-01").getTime() - Date.now()) / 86400000);

  return (
    <div className="p-6 md:p-10 max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center border border-primary/30">
          <Clock className="w-6 h-6 text-primary" />
        </div>
        <div>
          <h1 className="text-3xl font-bold text-white">Time Capsule</h1>
          <p className="text-white/60 text-sm">Leave messages for cities in 2030 — and read what others have written</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="md:col-span-2 bg-gradient-to-br from-primary/10 via-card to-secondary/5 border border-primary/20 rounded-2xl p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="text-4xl">⏳</div>
            <div>
              <div className="text-3xl font-black text-white">{daysTo2030.toLocaleString()}</div>
              <div className="text-white/50 text-sm">days until capsules unlock in 2030</div>
            </div>
          </div>
          <p className="text-white/60 text-sm leading-relaxed">
            Leave a message for a city you love — a wish, a memory, a question. Other explorers can read capsules left for places they're visiting. They all unlock on January 1, 2030.
          </p>
        </div>
        <div className="bg-card border border-white/10 rounded-2xl p-6 flex flex-col justify-between">
          <div>
            <div className="text-3xl font-black text-secondary">{capsules.length}</div>
            <div className="text-white/50 text-sm">capsules sealed</div>
          </div>
          <button onClick={() => setWriting(!writing)}
            className="flex items-center justify-center gap-2 py-2.5 bg-primary text-black rounded-xl font-bold text-sm hover:bg-primary/90 transition-all mt-4">
            <PenLine className="w-4 h-4" />
            Write a Capsule
          </button>
        </div>
      </div>

      <AnimatePresence>
        {writing && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
            <form onSubmit={submit} className="bg-card border border-primary/30 rounded-2xl p-6 space-y-4">
              <h3 className="text-lg font-bold text-white flex items-center gap-2"><PenLine className="w-5 h-5 text-primary" /> Write to a City in 2030</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-white/50 uppercase tracking-wider mb-1 block">City</label>
                  <select value={form.placeId} onChange={e => setForm(f => ({ ...f, placeId: e.target.value }))}
                    className="w-full bg-background border border-white/10 text-white rounded-lg px-3 py-2.5 text-sm">
                    {PLACES.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs text-white/50 uppercase tracking-wider mb-1 block">Your Name (optional)</label>
                  <input value={form.author} onChange={e => setForm(f => ({ ...f, author: e.target.value }))}
                    placeholder="Anonymous" className="w-full bg-background border border-white/10 text-white rounded-lg px-3 py-2.5 text-sm placeholder:text-white/30" />
                </div>
              </div>
              <div>
                <label className="text-xs text-white/50 uppercase tracking-wider mb-1 block">Your Message (max 500 chars)</label>
                <textarea value={form.message} onChange={e => setForm(f => ({ ...f, message: e.target.value.slice(0, 500) }))}
                  placeholder="Write something meaningful to this city's future..." rows={4}
                  className="w-full bg-background border border-white/10 text-white rounded-lg px-3 py-2.5 text-sm resize-none placeholder:text-white/30 focus:border-primary/50 focus:outline-none" />
                <div className="text-xs text-white/30 mt-1 text-right">{form.message.length}/500</div>
              </div>
              <div className="flex gap-3">
                <button type="submit" disabled={submitting || !form.message.trim()}
                  className="flex items-center gap-2 px-6 py-2.5 bg-primary text-black rounded-xl font-bold text-sm hover:bg-primary/90 disabled:opacity-50 transition-all">
                  {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Clock className="w-4 h-4" />}
                  Seal Capsule
                </button>
                <button type="button" onClick={() => setWriting(false)} className="px-4 py-2.5 bg-white/10 rounded-xl text-white text-sm hover:bg-white/20 transition-all">
                  Cancel
                </button>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      {submitted && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-green-500/10 border border-green-500/30 rounded-xl p-4 text-center text-green-400 font-medium">
          ✅ Your capsule has been sealed! It will unlock in 2030.
        </motion.div>
      )}

      <div className="flex gap-3 items-center">
        <Globe2 className="w-4 h-4 text-white/40" />
        <span className="text-sm text-white/40">Filter by city:</span>
        <select value={filterPlace} onChange={e => setFilterPlace(e.target.value)}
          className="bg-card border border-white/10 text-white rounded-lg px-3 py-1.5 text-sm">
          <option value="">All Cities</option>
          {PLACES.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
        </select>
      </div>

      {loading ? (
        <div className="text-center py-20"><Loader2 className="w-8 h-8 animate-spin text-primary mx-auto" /></div>
      ) : (
        <div className="space-y-4">
          {capsules.map((c, i) => (
            <motion.div key={c.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
              className="bg-card border border-white/10 hover:border-primary/20 rounded-xl p-5 transition-all">
              <div className="flex justify-between items-start mb-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                    <Clock className="w-4 h-4 text-primary" />
                  </div>
                  <div>
                    <span className="font-bold text-white text-sm">{c.placeName}</span>
                    <span className="text-white/40 text-xs ml-2">by {c.author}</span>
                  </div>
                </div>
                <div className="text-xs text-white/30">{new Date(c.createdAt).toLocaleDateString()}</div>
              </div>
              <p className="text-white/70 text-sm leading-relaxed italic">"{c.message}"</p>
              <div className="mt-3 flex items-center gap-2">
                <div className="text-xs text-primary/60 bg-primary/10 rounded-full px-3 py-0.5">🔒 Unlocks {c.unlockYear}</div>
              </div>
            </motion.div>
          ))}
          {capsules.length === 0 && (
            <div className="text-center py-16 text-white/30 border border-dashed border-white/10 rounded-2xl">
              <Clock className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p>No capsules yet for this city. Be the first to leave a message!</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
