import { Router, type IRouter } from "express";
import { db, savedPlacesTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import {
  ListSavedPlacesResponse,
  SavePlaceBody,
  DeleteSavedPlaceParams,
} from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/saved-places", async (_req, res): Promise<void> => {
  const rows = await db.select().from(savedPlacesTable).orderBy(savedPlacesTable.createdAt);
  res.json(ListSavedPlacesResponse.parse(rows));
});

router.post("/saved-places", async (req, res): Promise<void> => {
  const parsed = SavePlaceBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [row] = await db
    .insert(savedPlacesTable)
    .values(parsed.data)
    .returning();

  res.status(201).json(row);
});

router.delete("/saved-places/:id", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(raw, 10);
  if (isNaN(id)) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }

  const [deleted] = await db.delete(savedPlacesTable).where(eq(savedPlacesTable.id, id)).returning();
  if (!deleted) {
    res.status(404).json({ error: "Not found" });
    return;
  }

  res.sendStatus(204);
});

export default router;
