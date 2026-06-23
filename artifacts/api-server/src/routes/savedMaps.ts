import { Router, type IRouter } from "express";
import { db, savedMapsTable } from "@workspace/db";
import { eq, desc } from "drizzle-orm";

const router: IRouter = Router();

router.get("/saved-maps", async (req, res): Promise<void> => {
  const sessionId = String(req.query.sessionId ?? "").trim();
  if (!sessionId) { res.status(400).json({ error: "sessionId is required" }); return; }
  const rows = await db
    .select().from(savedMapsTable)
    .where(eq(savedMapsTable.sessionId, sessionId))
    .orderBy(desc(savedMapsTable.savedAt));
  res.json(rows);
});

router.post("/saved-maps", async (req, res): Promise<void> => {
  const { sessionId, location, layersJson, timeOfDay } = req.body as Record<string, unknown>;
  if (!sessionId || !location) {
    res.status(400).json({ error: "sessionId and location are required" });
    return;
  }
  const [row] = await db.insert(savedMapsTable).values({
    sessionId: String(sessionId),
    location: String(location),
    layersJson: layersJson != null ? String(layersJson) : "[]",
    timeOfDay: timeOfDay != null ? String(timeOfDay) : "Evening",
  }).returning();
  res.status(201).json(row);
});

router.delete("/saved-maps/:id", async (req, res): Promise<void> => {
  const id = parseInt(String(req.params.id), 10);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }
  const [deleted] = await db.delete(savedMapsTable).where(eq(savedMapsTable.id, id)).returning();
  if (!deleted) { res.status(404).json({ error: "Not found" }); return; }
  res.sendStatus(204);
});

export default router;
