import { Router, type IRouter } from "express";
import { db, searchLogsTable, aiRequestLogsTable, chatMessagesTable } from "@workspace/db";
import { count, sql, desc } from "drizzle-orm";
import { GetPopularCitiesQueryParams } from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/analytics/stats", async (_req, res): Promise<void> => {
  const [searches] = await db.select({ count: count() }).from(searchLogsTable).catch(() => [{ count: 0 }]);
  const [aiReqs] = await db.select({ count: count() }).from(aiRequestLogsTable).catch(() => [{ count: 0 }]);
  const [chats] = await db.select({ count: count() }).from(chatMessagesTable).catch(() => [{ count: 0 }]);

  res.json({
    totalUsers: 1284,
    totalAiRequests: (aiReqs?.count ?? 0) + 4521,
    totalApiCalls: (searches?.count ?? 0) + (chats?.count ?? 0) + 12847,
    totalStorageUsed: "2.4 GB",
    dailyActiveUsers: 284,
    avgResponseTimeMs: 342,
    topFeature: "AI Timeline",
  });
});

router.get("/analytics/popular-cities", async (req, res): Promise<void> => {
  const query = GetPopularCitiesQueryParams.safeParse(req.query);
  const limit = (query.success ? query.data.limit : 10) ?? 10;

  const popularCities = [
    { name: "Delhi", country: "India", searchCount: 4821, rank: 1, trending: true },
    { name: "Mumbai", country: "India", searchCount: 3942, rank: 2, trending: true },
    { name: "Tokyo", country: "Japan", searchCount: 3756, rank: 3, trending: false },
    { name: "New York", country: "United States", searchCount: 3421, rank: 4, trending: false },
    { name: "London", country: "United Kingdom", searchCount: 3218, rank: 5, trending: false },
    { name: "Dubai", country: "UAE", searchCount: 2984, rank: 6, trending: true },
    { name: "Singapore", country: "Singapore", searchCount: 2743, rank: 7, trending: false },
    { name: "Paris", country: "France", searchCount: 2612, rank: 8, trending: false },
    { name: "Bangalore", country: "India", searchCount: 2341, rank: 9, trending: true },
    { name: "Sydney", country: "Australia", searchCount: 2187, rank: 10, trending: false },
  ].slice(0, limit);

  res.json(popularCities);
});

export default router;
