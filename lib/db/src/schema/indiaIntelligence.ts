import { pgTable, text, serial, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const indiaIntelligenceTable = pgTable("india_intelligence", {
  id: serial("id").primaryKey(),
  cityName: text("city_name").notNull(),
  state: text("state").notNull(),
  category: text("category").notNull(),
  dataJson: text("data_json").notNull(),
  sourceLabel: text("source_label").notNull().default("AI Analysis"),
  validUntil: timestamp("valid_until", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertIndiaIntelligenceSchema = createInsertSchema(indiaIntelligenceTable).omit({ id: true, createdAt: true });
export type InsertIndiaIntelligence = z.infer<typeof insertIndiaIntelligenceSchema>;
export type IndiaIntelligence = typeof indiaIntelligenceTable.$inferSelect;

