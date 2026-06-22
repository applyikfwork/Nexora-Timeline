import { GoogleGenerativeAI } from "@google/generative-ai";
import { logger } from "./logger";

const apiKey = process.env.GEMINI_API_KEY;

if (!apiKey) {
  logger.warn("GEMINI_API_KEY not set — AI features will use fallback data");
}

const genAI = apiKey ? new GoogleGenerativeAI(apiKey) : null;

export async function generateText(prompt: string): Promise<string> {
  if (!genAI) {
    return "AI service unavailable. Please set GEMINI_API_KEY.";
  }
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
    const result = await model.generateContent(prompt);
    return result.response.text();
  } catch (err) {
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
    logger.warn({ err }, "Gemini JSON parse failed, using fallback");
    return fallback;
  }
}
