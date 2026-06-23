import { Router, type IRouter } from "express";
import { db, savedInsightsTable } from "@workspace/db";
import { eq, desc } from "drizzle-orm";

const router: IRouter = Router();

router.get("/saved-insights", async (req, res): Promise<void> => {
  const sessionId = String(req.query.sessionId ?? "").trim();
  if (!sessionId) { res.status(400).json({ error: "sessionId is required" }); return; }
  const rows = await db
    .select().from(savedInsightsTable)
    .where(eq(savedInsightsTable.sessionId, sessionId))
    .orderBy(desc(savedInsightsTable.savedAt));
  res.json(rows);
});

router.post("/saved-insights", async (req, res): Promise<void> => {
  const { sessionId, location, score, summary, radarJson } = req.body as Record<string, unknown>;
  if (!sessionId || !location || !summary) {
    res.status(400).json({ error: "sessionId, location, summary are required" });
    return;
  }
  const [row] = await db.insert(savedInsightsTable).values({
    sessionId: String(sessionId),
    location: String(location),
    score: typeof score === "number" ? Math.min(100, Math.max(0, score)) : 0,
    summary: String(summary),
    radarJson: radarJson != null ? String(radarJson) : null,
  }).returning();
  res.status(201).json(row);
});

router.delete("/saved-insights/:id", async (req, res): Promise<void> => {
  const id = parseInt(String(req.params.id), 10);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }
  const [deleted] = await db.delete(savedInsightsTable).where(eq(savedInsightsTable.id, id)).returning();
  if (!deleted) { res.status(404).json({ error: "Not found" }); return; }
  res.sendStatus(204);
});

export default router;
