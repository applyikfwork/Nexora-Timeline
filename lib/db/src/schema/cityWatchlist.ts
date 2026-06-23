import { pgTable, text, serial, timestamp, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const cityWatchlistTable = pgTable("city_watchlist", {
  id: serial("id").primaryKey(),
  sessionId: text("session_id").notNull(),
  clerkUserId: text("clerk_user_id"),
  cityName: text("city_name").notNull(),
  countryCode: text("country_code").notNull().default("IN"),
  currentScore: integer("current_score").default(0),
  alertThreshold: integer("alert_threshold").default(80),
  alertType: text("alert_type").notNull().default("score_change"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertCityWatchlistSchema = createInsertSchema(cityWatchlistTable).omit({ id: true, createdAt: true });
export type InsertCityWatchlist = z.infer<typeof insertCityWatchlistSchema>;
export type CityWatchlist = typeof cityWatchlistTable.$inferSelect;
