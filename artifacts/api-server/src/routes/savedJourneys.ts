import { Router, type IRouter } from "express";
import { db, savedJourneysTable } from "@workspace/db";
import { eq, desc } from "drizzle-orm";

const router: IRouter = Router();

router.get("/saved-journeys", async (req, res): Promise<void> => {
  const sessionId = String(req.query.sessionId ?? "").trim();
  if (!sessionId) { res.status(400).json({ error: "sessionId is required" }); return; }
  const rows = await db
    .select().from(savedJourneysTable)
    .where(eq(savedJourneysTable.sessionId, sessionId))
    .orderBy(desc(savedJourneysTable.savedAt));
  res.json(rows);
});

router.post("/saved-journeys", async (req, res): Promise<void> => {
  const { sessionId, location, fromYear, toYear, view, notesJson } = req.body as Record<string, unknown>;
  if (!sessionId || !location || fromYear == null || toYear == null) {
    res.status(400).json({ error: "sessionId, location, fromYear, toYear are required" });
    return;
  }
  const [row] = await db.insert(savedJourneysTable).values({
    sessionId: String(sessionId),
    location: String(location),
    fromYear: Number(fromYear),
    toYear: Number(toYear),
    view: view != null ? String(view) : "past",
    notesJson: notesJson != null ? String(notesJson) : null,
  }).returning();
  res.status(201).json(row);
});

router.delete("/saved-journeys/:id", async (req, res): Promise<void> => {
  const id = parseInt(String(req.params.id), 10);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }
  const [deleted] = await db.delete(savedJourneysTable).where(eq(savedJourneysTable.id, id)).returning();
  if (!deleted) { res.status(404).json({ error: "Not found" }); return; }
  res.sendStatus(204);
});

export default router;
