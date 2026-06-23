import React, { useState } from "react";
import { supabase } from "@/lib/supabase";
import { useLocation } from "wouter";
import { Mail, Loader2, AlertCircle, CheckCircle, RefreshCw } from "lucide-react";

const basePath = import.meta.env.BASE_URL.replace(/\/$/, "");

function readError(err: unknown): string {
  if (!err) return "";
  if (typeof err === "string") return err;
  if (typeof err !== "object") return String(err);
  const e = err as Record<string, unknown>;
  const msg = (e.message ?? e.msg ?? e.error_description ?? e.error ?? "") as string;
  const clean = String(msg ?? "").trim();
  // Supabase sometimes returns the raw JSON body string as the message — catch that
  if (!clean || clean === "{}" || clean.startsWith("{")) return "";
  return clean;
}

function isUnconfirmedError(err: unknown): boolean {
  if (!err || typeof err !== "object") return false;
  const e = err as Record<string, unknown>;
  const msg = String(e.message ?? "").toLowerCase();
  const code = String(e.code ?? e.status ?? "").toLowerCase();
  const empty = !msg || msg === "{}" || msg.startsWith("{");
  return (
    empty ||
    msg.includes("not confirmed") ||
    msg.includes("email_not_confirmed") ||
    msg.includes("confirmation") ||
    code === "email_not_confirmed" ||
    (e as { status?: number }).status === 422
  );
}

export default function SignInPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [loading, setLoading] = useState(false);
  const [needsConfirmation, setNeedsConfirmation] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [resendSent, setResendSent] = useState(false);
  const [, setLocation] = useLocation();

  const reset = () => { setNeedsConfirmation(false); setResendSent(false); setErrorMsg(""); };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    reset();

    try {
      const { error: err } = await supabase.auth.signInWithPassword({ email, password });

      if (err) {
        // Log the raw error so you can inspect it in the browser console (F12 → Console)
        console.error("[Nexora] auth error:", err, "| message:", err.message, "| code:", (err as Record<string, unknown>).code, "| status:", err.status);

        if (isUnconfirmedError(err)) {
          setNeedsConfirmation(true);
        } else {
          const m = readError(err);
          if (!m || m === "{}") {
            // Still empty — show a helpful generic message + offer resend as safety net
            setNeedsConfirmation(true);
          } else if (m.toLowerCase().includes("invalid") || m.toLowerCase().includes("credentials") || m.toLowerCase().includes("password")) {
            setErrorMsg("Incorrect email or password — please try again.");
          } else if (m.toLowerCase().includes("rate") || m.toLowerCase().includes("too many")) {
            setErrorMsg("Too many attempts. Please wait a few minutes and try again.");
          } else if (m.toLowerCase().includes("user not found") || m.toLowerCase().includes("no user")) {
            setErrorMsg("No account found with this email. Please sign up first.");
          } else {
            setErrorMsg(m);
            setNeedsConfirmation(true); // always surface the resend option as a fallback
          }
        }
      } else {
        setLocation("/");
      }
    } catch (ex) {
      console.error("[Nexora] auth exception:", ex);
      setErrorMsg("Network error — please check your connection and try again.");
    }

    setLoading(false);
  };

  const handleResend = async () => {
    if (!email) return;
    setResendLoading(true);
    try {
      await supabase.auth.resend({ type: "signup", email });
      setResendSent(true);
    } catch {
      // ignore
    }
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
                onChange={e => { setEmail(e.target.value); reset(); }}
                required
                className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-white placeholder:text-white/25 focus:outline-none focus:border-violet-500/60 transition-colors text-sm"
                placeholder="you@example.com"
                autoComplete="email"
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
                autoComplete="current-password"
              />
            </div>

            {/* Generic error */}
            {errorMsg && !needsConfirmation && (
              <div className="flex items-start gap-2 text-red-400 text-sm bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2.5">
                <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* Email-not-confirmed banner */}
            {needsConfirmation && (
              <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl px-4 py-4 space-y-3">
                <div className="flex items-start gap-2.5">
                  <Mail className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-amber-300 text-sm font-semibold leading-snug">Email not confirmed yet</p>
                    <p className="text-amber-400/70 text-xs mt-1 leading-relaxed">
                      You need to confirm your email before signing in. Check your inbox (and spam) for a link from Nexora / Resend.
                    </p>
                  </div>
                </div>

                {resendSent ? (
                  <div className="flex items-center gap-1.5 text-green-400 text-xs font-medium pl-0.5">
                    <CheckCircle className="w-3.5 h-3.5" />
                    Confirmation email sent to <span className="font-bold">{email}</span>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={handleResend}
                    disabled={resendLoading || !email}
                    className="flex items-center gap-1.5 text-xs text-amber-300 hover:text-amber-200 underline underline-offset-2 disabled:opacity-50 pl-0.5"
                  >
                    {resendLoading
                      ? <Loader2 className="w-3 h-3 animate-spin" />
                      : <RefreshCw className="w-3 h-3" />}
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
              {loading
                ? <><Loader2 className="w-4 h-4 animate-spin" /> Signing in…</>
                : "Sign In"}
            </button>
          </form>

          <div className="mt-5 text-center text-sm text-white/40">
            Don't have an account?{" "}
            <a href={`${basePath}/sign-up`} className="text-violet-400 hover:text-violet-300 font-medium">
              Sign Up
            </a>
          </div>
        </div>

        {/* Debug hint */}
        <p className="text-center text-white/20 text-xs mt-4">
          If login still fails, open browser console (F12) and look for <span className="font-mono">[Nexora] auth error</span> to see the exact Supabase response.
        </p>
      </div>
    </div>
  );
}
