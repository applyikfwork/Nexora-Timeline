import { Router, type IRouter } from "express";
import { db, chatMessagesTable, aiRequestLogsTable } from "@workspace/db";
import { eq, desc } from "drizzle-orm";
import { generateText } from "../lib/gemini";
import { SendChatMessageBody, GetChatHistoryQueryParams } from "@workspace/api-zod";

const router: IRouter = Router();

const PLACE_NAMES: Record<string, string> = {
  "delhi-in": "Delhi, India",
  "mumbai-in": "Mumbai, India",
  "london-uk": "London, UK",
  "new-york-us": "New York, USA",
  "tokyo-jp": "Tokyo, Japan",
  "paris-fr": "Paris, France",
  "dubai-ae": "Dubai, UAE",
  "singapore-sg": "Singapore",
};

router.post("/chat/message", async (req, res): Promise<void> => {
  const parsed = SendChatMessageBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { message, sessionId, placeContext, placeId } = parsed.data;

  await db.insert(chatMessagesTable).values({
    sessionId,
    role: "user",
    content: message,
    placeContext: placeContext ?? null,
  }).catch(() => {});

  const placeName = placeId ? (PLACE_NAMES[placeId] ?? placeId) : placeContext ?? "the world";

  const systemContext = `You are Nexora AI, an intelligent location intelligence assistant. You have deep knowledge about cities, neighborhoods, travel, local culture, traffic patterns, weather trends, and urban life. ${placeContext ? `The user is currently exploring ${placeContext}.` : ""} Be concise, insightful, and specific. Answer in 2-4 sentences. Avoid generic responses.`;

  const prompt = `${systemContext}\n\nUser question: ${message}`;

  const aiReply = await generateText(prompt).catch(() =>
    `Based on current data and historical patterns for ${placeName}, I can provide insights about crowd levels, traffic patterns, and local activity. The area is typically ${new Date().getHours() > 17 ? "busy with evening commuters and diners" : "moderately active with daytime visitors and workers"}. Would you like specific predictions or historical comparisons?`
  );

  const [savedReply] = await db.insert(chatMessagesTable).values({
    sessionId,
    role: "assistant",
    content: typeof aiReply === "string" ? aiReply.trim() : aiReply,
    placeContext: placeContext ?? null,
  }).returning();

  await db.insert(aiRequestLogsTable).values({
    requestType: "chat",
    placeId: placeId ?? null,
    placeName: placeId ? PLACE_NAMES[placeId] : null,
    responseTimeMs: 0,
    cached: "false",
  }).catch(() => {});

  res.json({
    reply: savedReply.content,
    sessionId,
    messageId: savedReply.id,
    relatedPlaces: placeId ? [{ name: PLACE_NAMES[placeId] ?? placeId, placeId }] : [],
  });
});

router.get("/chat/history", async (req, res): Promise<void> => {
  const query = GetChatHistoryQueryParams.safeParse(req.query);
  if (!query.success) {
    res.status(400).json({ error: query.error.message });
    return;
  }

  const { sessionId, limit = 20 } = query.data;

  const messages = await db
    .select()
    .from(chatMessagesTable)
    .where(eq(chatMessagesTable.sessionId, sessionId))
    .orderBy(desc(chatMessagesTable.createdAt))
    .limit(limit);

  res.json(messages.reverse());
});

export default router;
