import { pgTable, text, serial, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const aiCacheTable = pgTable("ai_cache", {
  id: serial("id").primaryKey(),
  cacheKey: text("cache_key").notNull().unique(),
  requestType: text("request_type").notNull(),
  placeId: text("place_id"),
  responseJson: text("response_json").notNull(),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertAiCacheSchema = createInsertSchema(aiCacheTable).omit({ id: true, createdAt: true });
export type InsertAiCache = z.infer<typeof insertAiCacheSchema>;
export type AiCache = typeof aiCacheTable.$inferSelect;
