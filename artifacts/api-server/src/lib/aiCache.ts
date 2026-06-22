import { db, aiCacheTable } from "@workspace/db";
import { eq, gt } from "drizzle-orm";
import { logger } from "./logger";

export async function getCached<T>(cacheKey: string): Promise<T | null> {
  try {
    const [row] = await db
      .select()
      .from(aiCacheTable)
      .where(eq(aiCacheTable.cacheKey, cacheKey));
    if (!row) return null;
    if (row.expiresAt < new Date()) return null;
    return JSON.parse(row.responseJson) as T;
  } catch (err) {
    logger.warn({ err, cacheKey }, "Cache read error");
    return null;
  }
}

export async function setCached(
  cacheKey: string,
  requestType: string,
  placeId: string | null,
  data: unknown,
  ttlMinutes: number = 60
): Promise<void> {
  try {
    const expiresAt = new Date(Date.now() + ttlMinutes * 60 * 1000);
    await db
      .insert(aiCacheTable)
      .values({
        cacheKey,
        requestType,
        placeId,
        responseJson: JSON.stringify(data),
        expiresAt,
      })
      .onConflictDoUpdate({
        target: aiCacheTable.cacheKey,
        set: {
          responseJson: JSON.stringify(data),
          expiresAt,
        },
      });
  } catch (err) {
    logger.warn({ err, cacheKey }, "Cache write error");
  }
}
