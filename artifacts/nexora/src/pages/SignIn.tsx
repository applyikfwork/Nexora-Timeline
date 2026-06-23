import React, { useState } from "react";
import { supabase } from "@/lib/supabase";
import { useLocation } from "wouter";
import { Mail, Loader2, AlertCircle, CheckCircle } from "lucide-react";

const basePath = import.meta.env.BASE_URL.replace(/\/$/, "");

function parseSupabaseError(err: { message?: string; code?: string }): string {
  const raw = (err.message ?? "").trim();
  if (!raw || raw === "{}" || raw === "{}") return "__unconfirmed__";
  const lower = raw.toLowerCase();
  if (lower.includes("not confirmed") || lower.includes("email_not_confirmed") || lower.includes("confirmation")) return "__unconfirmed__";
  if (lower.includes("invalid login") || lower.includes("invalid_credentials") || lower.includes("invalid email or password")) return "Incorrect email or password. Please try again.";
  if (lower.includes("too many")) return "Too many attempts. Please wait a few minutes and try again.";
  if (lower.includes("user not found")) return "No account found with this email. Please sign up first.";
  return raw || "Sign in failed. Please try again.";
}

export default function SignInPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [needsConfirmation, setNeedsConfirmation] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [resendSent, setResendSent] = useState(false);
  const [, setLocation] = useLocation();

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setNeedsConfirmation(false);
    setResendSent(false);

    const { error: err } = await supabase.auth.signInWithPassword({ email, password });

    if (err) {
      const parsed = parseSupabaseError(err);
      if (parsed === "__unconfirmed__") {
        setNeedsConfirmation(true);
      } else {
        setError(parsed);
      }
    } else {
      setLocation("/");
    }
    setLoading(false);
  };

  const handleResendConfirmation = async () => {
    setResendLoading(true);
    await supabase.auth.resend({ type: "signup", email });
    setResendSent(true);
    setResendLoading(false);
  };

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

        <div className="bg-[#0d0010] border border-white/10 rounded-2xl p-8 shadow-2xl">
          <h2 className="text-xl font-bold text-white mb-1">Welcome back</h2>
          <p className="text-white/40 text-sm mb-6">Sign in to your intelligence dashboard</p>

          <form onSubmit={handleSignIn} className="space-y-4">
            <div>
              <label className="block text-sm text-white/70 mb-1.5">Email</label>
              <input
                type="email"
                value={email}
                onChange={e => { setEmail(e.target.value); setNeedsConfirmation(false); setResendSent(false); }}
                required
                className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-white placeholder:text-white/25 focus:outline-none focus:border-violet-500/60 transition-colors text-sm"
                placeholder="you@example.com"
              />
            </div>
            <div>
              <label className="block text-sm text-white/70 mb-1.5">Password</label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-white placeholder:text-white/25 focus:outline-none focus:border-violet-500/60 transition-colors text-sm"
                placeholder="••••••••"
              />
            </div>

            {error && (
              <div className="flex items-start gap-2 text-red-400 text-sm bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2.5">
                <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            {needsConfirmation && (
              <div className="bg-amber-500/10 border border-amber-500/25 rounded-lg px-4 py-3.5 space-y-3">
                <div className="flex items-start gap-2">
                  <Mail className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-amber-300 text-sm font-semibold">Email not confirmed</p>
                    <p className="text-amber-400/70 text-xs mt-0.5">
                      Check your inbox for a confirmation link from Nexora. Click it before signing in.
                    </p>
                  </div>
                </div>
                {resendSent ? (
                  <div className="flex items-center gap-1.5 text-green-400 text-xs">
                    <CheckCircle className="w-3.5 h-3.5" />
                    Confirmation email sent to <span className="font-semibold">{email}</span>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={handleResendConfirmation}
                    disabled={resendLoading}
                    className="flex items-center gap-1.5 text-xs text-amber-300 underline underline-offset-2 hover:text-amber-200 disabled:opacity-50"
                  >
                    {resendLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : null}
                    Resend confirmation email
                  </button>
                )}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-violet-600 hover:bg-violet-500 disabled:opacity-50 text-white font-semibold py-2.5 rounded-lg transition-colors text-sm flex items-center justify-center gap-2"
            >
              {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Signing in…</> : "Sign In"}
            </button>
          </form>

          <div className="mt-5 text-center text-sm text-white/40">
            Don't have an account?{" "}
            <a href={`${basePath}/sign-up`} className="text-violet-400 hover:text-violet-300 font-medium">
              Sign Up
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
