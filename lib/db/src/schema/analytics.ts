import { pgTable, text, serial, timestamp, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const searchLogsTable = pgTable("search_logs", {
  id: serial("id").primaryKey(),
  query: text("query").notNull(),
  resultCount: integer("result_count").notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const aiRequestLogsTable = pgTable("ai_request_logs", {
  id: serial("id").primaryKey(),
  requestType: text("request_type").notNull(),
  placeId: text("place_id"),
  placeName: text("place_name"),
  responseTimeMs: integer("response_time_ms"),
  cached: text("cached").notNull().default("false"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertSearchLogSchema = createInsertSchema(searchLogsTable).omit({ id: true, createdAt: true });
export type InsertSearchLog = z.infer<typeof insertSearchLogSchema>;
export type SearchLog = typeof searchLogsTable.$inferSelect;

export const insertAiRequestLogSchema = createInsertSchema(aiRequestLogsTable).omit({ id: true, createdAt: true });
export type InsertAiRequestLog = z.infer<typeof insertAiRequestLogSchema>;
export type AiRequestLog = typeof aiRequestLogsTable.$inferSelect;
