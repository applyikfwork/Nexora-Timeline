import { pgTable, text, serial, timestamp, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const savedJourneysTable = pgTable("saved_journeys", {
  id: serial("id").primaryKey(),
  sessionId: text("session_id").notNull(),
  location: text("location").notNull(),
  fromYear: integer("from_year").notNull(),
  toYear: integer("to_year").notNull(),
  view: text("view").notNull().default("past"),
  notesJson: text("notes_json"),
  savedAt: timestamp("saved_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertSavedJourneySchema = createInsertSchema(savedJourneysTable).omit({ id: true, savedAt: true });
export type InsertSavedJourney = z.infer<typeof insertSavedJourneySchema>;
export type SavedJourney = typeof savedJourneysTable.$inferSelect;
