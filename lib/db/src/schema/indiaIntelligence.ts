import { pgTable, text, serial, timestamp, integer } from "drizzle-orm/pg-core";
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

export const adminSettingsTable = pgTable("admin_settings", {
  id: serial("id").primaryKey(),
  key: text("key").notNull().unique(),
  value: text("value").notNull(),
  description: text("description"),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const featureFlagsTable = pgTable("feature_flags", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(),
  enabled: text("enabled").notNull().default("true"),
  description: text("description"),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});
