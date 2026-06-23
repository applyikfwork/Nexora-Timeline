import { pgTable, text, serial, timestamp, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const savedInsightsTable = pgTable("saved_insights", {
  id: serial("id").primaryKey(),
  sessionId: text("session_id").notNull(),
  location: text("location").notNull(),
  score: integer("score").notNull().default(0),
  summary: text("summary").notNull(),
  radarJson: text("radar_json"),
  savedAt: timestamp("saved_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertSavedInsightSchema = createInsertSchema(savedInsightsTable).omit({ id: true, savedAt: true });
export type InsertSavedInsight = z.infer<typeof insertSavedInsightSchema>;
export type SavedInsight = typeof savedInsightsTable.$inferSelect;
