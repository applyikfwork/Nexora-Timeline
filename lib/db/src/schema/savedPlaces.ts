import { pgTable, text, serial, timestamp, doublePrecision } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const savedPlacesTable = pgTable("saved_places", {
  id: serial("id").primaryKey(),
  placeId: text("place_id").notNull(),
  placeName: text("place_name").notNull(),
  country: text("country").notNull().default(""),
  lat: doublePrecision("lat").notNull(),
  lng: doublePrecision("lng").notNull(),
  notes: text("notes"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertSavedPlaceSchema = createInsertSchema(savedPlacesTable).omit({ id: true, createdAt: true });
export type InsertSavedPlace = z.infer<typeof insertSavedPlaceSchema>;
export type SavedPlace = typeof savedPlacesTable.$inferSelect;
