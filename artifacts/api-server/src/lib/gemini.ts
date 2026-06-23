import { GoogleGenerativeAI } from "@google/generative-ai";
import { logger } from "./logger";

const apiKey = process.env.GEMINI_API_KEY;

if (!apiKey) {
  logger.warn("GEMINI_API_KEY not set — AI features will use fallback data");
}

const genAI = apiKey ? new GoogleGenerativeAI(apiKey) : null;

export class RateLimitError extends Error {
  readonly isRateLimit = true as const;
  readonly retryAfter: number;
  constructor(retryAfter = 60) {
    super("Gemini API rate limit exceeded");
    this.name = "RateLimitError";
    this.retryAfter = retryAfter;
  }
}

function extractRetryAfter(err: unknown): number {
  try {
    const e = err as { errorDetails?: { retryDelay?: string }[] };
    const delay = e?.errorDetails?.[0]?.retryDelay;
    if (delay) return Math.ceil(parseFloat(delay));
  } catch {}
  return 60;
}

function is429(err: unknown): boolean {
  const e = err as { status?: number; message?: string };
  return e?.status === 429 || String(e?.message ?? "").includes("429");
}

export async function generateText(prompt: string): Promise<string> {
  if (!genAI) {
    return "AI service unavailable. Please set GEMINI_API_KEY.";
  }
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
    const result = await model.generateContent(prompt);
    return result.response.text();
  } catch (err) {
    if (is429(err)) throw new RateLimitError(extractRetryAfter(err));
    logger.error({ err }, "Gemini API error");
    throw err;
  }
}

export async function generateJson<T>(prompt: string, fallback: T): Promise<T> {
  if (!genAI) return fallback;
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
    const result = await model.generateContent(
      `${prompt}\n\nRespond ONLY with valid JSON. No markdown, no code blocks, just raw JSON.`
    );
    const text = result.response.text().trim();
    const cleaned = text.replace(/^```json\s*/i, "").replace(/^```\s*/i, "").replace(/\s*```$/i, "").trim();
    return JSON.parse(cleaned) as T;
  } catch (err) {
    if (is429(err)) throw new RateLimitError(extractRetryAfter(err));
    logger.warn({ err }, "Gemini JSON parse failed, using fallback");
    return fallback;
  }
}
