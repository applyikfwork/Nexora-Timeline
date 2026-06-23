import { Router, type IRouter } from "express";
import { db, aiCacheTable } from "@workspace/db";
import { sql, count } from "drizzle-orm";
import { verifyToken } from "../lib/supabase";

const router: IRouter = Router();

const ADMIN_EMAILS = ["xyzapplywork@gmail.com"];

async function requireAdmin(req: any, res: any, next: any) {
  const authHeader = req.headers.authorization as string | undefined;
  const token = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null;

  if (!token) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const user = await verifyToken(token);
  if (!user || !ADMIN_EMAILS.includes(user.email ?? "")) {
    return res.status(403).json({ error: "Forbidden" });
  }

  next();
}

router.get("/admin/stats", requireAdmin, async (_req, res): Promise<void> => {
  try {
    const [cacheCount] = await db.select({ count: count() }).from(aiCacheTable);
    res.json({
      totalRequests: 0,
      cacheHits: cacheCount?.count ?? 0,
      aiCalls: 0,
      searchLogs: 0,
    });
  } catch {
    res.json({ totalRequests: 0, cacheHits: 0, aiCalls: 0, searchLogs: 0 });
  }
});

router.get("/admin/cache", requireAdmin, async (_req, res): Promise<void> => {
  try {
    const entries = await db
      .select({
        id: aiCacheTable.id,
        request_type: aiCacheTable.requestType,
        cache_key: aiCacheTable.cacheKey,
        expires_at: aiCacheTable.expiresAt,
      })
      .from(aiCacheTable)
      .orderBy(sql`${aiCacheTable.expiresAt} desc`)
      .limit(100);
    res.json(entries);
  } catch {
    res.json([]);
  }
});

router.delete("/admin/cache", requireAdmin, async (_req, res): Promise<void> => {
  try {
    await db.delete(aiCacheTable);
    res.json({ success: true, message: "Cache cleared" });
  } catch {
    res.status(500).json({ error: "Failed to clear cache" });
  }
});

export default router;
