const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");
const SESSION_KEY = "nexora_session_id";

export function getSessionId(): string {
  const stored = localStorage.getItem(SESSION_KEY);
  if (stored) return stored;
  const id = `sess-${Math.random().toString(36).slice(2)}-${Date.now()}`;
  localStorage.setItem(SESSION_KEY, id);
  return id;
}

export type AIResult =
  | { ok: true; text: string }
  | { ok: false; rateLimit: true; retryAfter: number }
  | { ok: false; rateLimit: false; error: string };

export async function callAI(message: string, placeContext?: string): Promise<AIResult> {
  try {
    const r = await fetch(`${BASE}/api/chat/message`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        message,
        sessionId: getSessionId(),
        placeContext: placeContext ?? "location analysis",
      }),
    });

    if (r.status === 429) {
      const data = await r.json().catch(() => ({})) as { retryAfter?: number };
      return { ok: false, rateLimit: true, retryAfter: data.retryAfter ?? 60 };
    }

    if (!r.ok) return { ok: false, rateLimit: false, error: "Request failed" };

    const data = await r.json() as { reply?: string };
    return { ok: true, text: data.reply ?? "" };
  } catch {
    return { ok: false, rateLimit: false, error: "Network error" };
  }
}

export async function askAI(message: string, placeContext?: string): Promise<string> {
  const result = await callAI(message, placeContext);
  if (!result.ok) {
    if (result.rateLimit) {
      return `⚠️ AI quota reached — please wait ${result.retryAfter}s and try again.`;
    }
    return "AI is unavailable right now — please try again in a moment.";
  }
  return result.text;
}

export async function askJSON<T>(message: string, fallback: T, placeContext?: string): Promise<T> {
  const text = await askAI(
    `${message}\n\nRespond ONLY with valid JSON, no markdown or code blocks.`,
    placeContext
  );
  if (text.startsWith("⚠️") || text.startsWith("AI is unavailable")) return fallback;
  try {
    return JSON.parse(text.replace(/```json?/g, "").replace(/```/g, "").trim()) as T;
  } catch {
    return fallback;
  }
}

export async function savedInsightsApi(sessionId: string) {
  return {
    list: async () => {
      const r = await fetch(`${BASE}/api/saved-insights?sessionId=${encodeURIComponent(sessionId)}`);
      return r.ok ? (await r.json() as unknown[]) : [];
    },
    save: async (data: object) => {
      const r = await fetch(`${BASE}/api/saved-insights`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...data, sessionId }),
      });
      return r.ok ? await r.json() as object : null;
    },
    remove: async (id: number) => {
      await fetch(`${BASE}/api/saved-insights/${id}`, { method: "DELETE" });
    },
  };
}

export async function savedMapsApi(sessionId: string) {
  return {
    list: async () => {
      const r = await fetch(`${BASE}/api/saved-maps?sessionId=${encodeURIComponent(sessionId)}`);
      return r.ok ? (await r.json() as unknown[]) : [];
    },
    save: async (data: object) => {
      const r = await fetch(`${BASE}/api/saved-maps`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...data, sessionId }),
      });
      return r.ok ? await r.json() as object : null;
    },
    remove: async (id: number) => {
      await fetch(`${BASE}/api/saved-maps/${id}`, { method: "DELETE" });
    },
  };
}

export async function savedJourneysApi(sessionId: string) {
  return {
    list: async () => {
      const r = await fetch(`${BASE}/api/saved-journeys?sessionId=${encodeURIComponent(sessionId)}`);
      return r.ok ? (await r.json() as unknown[]) : [];
    },
    save: async (data: object) => {
      const r = await fetch(`${BASE}/api/saved-journeys`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...data, sessionId }),
      });
      return r.ok ? await r.json() as object : null;
    },
    remove: async (id: number) => {
      await fetch(`${BASE}/api/saved-journeys/${id}`, { method: "DELETE" });
    },
  };
}
