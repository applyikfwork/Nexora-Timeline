import { pgTable, text, serial, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const savedMapsTable = pgTable("saved_maps", {
  id: serial("id").primaryKey(),
  sessionId: text("session_id").notNull(),
  location: text("location").notNull(),
  layersJson: text("layers_json").notNull().default("[]"),
  timeOfDay: text("time_of_day").notNull().default("Evening"),
  savedAt: timestamp("saved_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertSavedMapSchema = createInsertSchema(savedMapsTable).omit({ id: true, savedAt: true });
export type InsertSavedMap = z.infer<typeof insertSavedMapSchema>;
export type SavedMap = typeof savedMapsTable.$inferSelect;
